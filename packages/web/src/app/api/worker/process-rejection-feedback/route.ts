import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

/**
 * Background job: Process rejection feedback for pattern learning
 *
 * Triggered after a user reports an Apple rejection.
 * Updates pattern confidence scores based on what was predicted vs what Apple actually rejected.
 *
 * Called async from POST /api/submissions/[id]/report-rejection
 */
export async function POST(req: NextRequest) {
    // Verify secret with constant-time comparison to prevent timing attacks
    const secret = req.headers.get('x-worker-secret')
    const expectedSecret = process.env.WORKER_SECRET

    // Ensure both values are provided and non-empty
    if (!secret || !expectedSecret) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const isValid = timingSafeEqual(
            Buffer.from(secret),
            Buffer.from(expectedSecret)
        )
        if (!isValid) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
    } catch {
        // timingSafeEqual throws if lengths differ
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json() as {
            rejectionId: string
        }

        if (!body.rejectionId) {
            return NextResponse.json(
                { message: 'rejectionId is required' },
                { status: 400 }
            )
        }

        // Use service role key for internal operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        // Fetch rejection with related submission
        const { data: rejection, error: rejectionError } = await supabase
            .from('apple_rejections')
            .select(`
                id,
                submission_id,
                rejection_reason,
                guideline_violated,
                pattern_feedback_processed
            `)
            .eq('id', body.rejectionId)
            .single()

        if (rejectionError || !rejection) {
            console.error('Failed to fetch rejection:', rejectionError)
            return NextResponse.json(
                { message: 'Rejection not found' },
                { status: 404 }
            )
        }

        // Already processed?
        if (rejection.pattern_feedback_processed) {
            return NextResponse.json({ message: 'Already processed', rejectionId: body.rejectionId })
        }

        // Fetch the submission's report
        const { data: submission, error: subError } = await supabase
            .from('submissions')
            .select('id, report_id')
            .eq('id', rejection.submission_id)
            .single()

        if (subError || !submission) {
            console.error('Failed to fetch submission:', subError)
            return NextResponse.json(
                { message: 'Submission not found' },
                { status: 404 }
            )
        }

        // Validate report exists
        if (!submission.report_id) {
            console.warn(`Submission ${rejection.submission_id} has no report_id, skipping pattern feedback`)
            // Still mark as processed since there's nothing to learn from
            await supabase
                .from('apple_rejections')
                .update({ pattern_feedback_processed: true })
                .eq('id', rejection.id)
            return NextResponse.json({
                success: true,
                rejectionId: rejection.id,
                patternsUpdated: 0,
                note: 'No report to learn from',
            })
        }

        // Fetch report items (what Preflight predicted)
        const { data: reportItems, error: itemsError } = await supabase
            .from('report_items')
            .select('id, pattern_id, severity, category')
            .eq('report_id', submission.report_id)

        if (itemsError) {
            console.error('Failed to fetch report items:', itemsError)
            return NextResponse.json(
                { message: 'Failed to fetch report items' },
                { status: 500 }
            )
        }

        // Update patterns based on feedback
        // 1. Patterns that matched (have pattern_id) — these got it right, increase confidence
        // 2. Patterns that didn't match but should have (critical items without pattern_id) — decrease confidence
        // 3. Check if guideline matches a pattern

        const patternsToUpdate: Array<{ id: string; delta: number }> = []

        // If a specific guideline was violated, find and penalize matching patterns that scored low
        if (rejection.guideline_violated) {
            // Find patterns for this guideline
            const { data: matchingPatterns, error: patternError } = await supabase
                .from('rejection_patterns')
                .select('id, guideline, calibrated_confidence, base_confidence')
                .ilike('guideline', `${rejection.guideline_violated}%`)
                .eq('is_active', true)

            if (patternError) {
                console.error('Failed to fetch patterns by guideline:', patternError)
            } else if (matchingPatterns) {
                for (const pattern of matchingPatterns) {
                    // Check if this pattern was in the report
                    const wasDetected = reportItems?.some(item => item.pattern_id === pattern.id)

                    if (!wasDetected) {
                        // Pattern missed a real rejection — penalize confidence
                        // Decrease by 2-5% depending on base confidence
                        const penalty = Math.max(0.02, pattern.base_confidence * 0.05)
                        patternsToUpdate.push({
                            id: pattern.id,
                            delta: -penalty,
                        })
                    }
                }
            }
        }

        // Boost confidence for patterns that DID get detected
        if (reportItems) {
            const detectedPatternIds = reportItems
                .filter(item => item.pattern_id)
                .map(item => item.pattern_id!)

            if (detectedPatternIds.length > 0) {
                const { data: detectedPatterns, error: detectedError } = await supabase
                    .from('rejection_patterns')
                    .select('id, base_confidence')
                    .in('id', detectedPatternIds)

                if (!detectedError && detectedPatterns) {
                    for (const pattern of detectedPatterns) {
                        // Boost confidence since we detected something that actually got rejected
                        // Increase by 1-3% to be conservative
                        const boost = Math.min(0.03, pattern.base_confidence * 0.02)
                        patternsToUpdate.push({
                            id: pattern.id,
                            delta: boost,
                        })
                    }
                }
            }
        }

        // Apply updates in batch (prevent N+1 queries)
        // Fetch all patterns we need to update in one query
        const patternIdsToUpdate = patternsToUpdate.map(u => u.id)
        if (patternIdsToUpdate.length > 0) {
            const { data: patterns } = await supabase
                .from('rejection_patterns')
                .select('id, calibrated_confidence, base_confidence')
                .in('id', patternIdsToUpdate)

            if (patterns) {
                const patternMap = Object.fromEntries(patterns.map(p => [p.id, p]))
                
                // Update each pattern
                for (const update of patternsToUpdate) {
                    const pattern = patternMap[update.id]
                    if (pattern) {
                        const currentConfidence = pattern.calibrated_confidence ?? pattern.base_confidence ?? 0.5
                        const newConfidence = Math.max(0, Math.min(1, currentConfidence + update.delta))

                        await supabase
                            .from('rejection_patterns')
                            .update({
                                calibrated_confidence: newConfidence,
                            })
                            .eq('id', update.id)
                    }
                }
            }
        }

        // Mark as processed
        const { error: processError } = await supabase
            .from('apple_rejections')
            .update({ pattern_feedback_processed: true })
            .eq('id', body.rejectionId)

        if (processError) {
            console.error('Failed to mark as processed:', processError)
            return NextResponse.json(
                { message: 'Failed to mark as processed' },
                { status: 500 }
            )
        }

        console.log(`Processed rejection feedback for ${body.rejectionId}: Updated ${patternsToUpdate.length} patterns`)
        return NextResponse.json({
            success: true,
            rejectionId: body.rejectionId,
            patternsUpdated: patternsToUpdate.length,
        })
    } catch (err: any) {
        console.error('Process rejection feedback error:', err)
        return NextResponse.json(
            { message: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
