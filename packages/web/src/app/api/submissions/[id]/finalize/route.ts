import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'
import { revalidatePath } from 'next/cache'
import { CREDIT_COSTS } from '@preflight/shared/constants'

const BUCKET_MAP: Record<string, string> = {
    screenshot: 'screenshots',
    plist: 'plists',
    manifest: 'manifests',
    ipa: 'ipas',
}


export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params
    const supabase = await createClientFromRequest(req)

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify submission ownership AND draft status in one query
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single()

    if (subError || !submission) {
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'draft') {
        return NextResponse.json({ message: 'Submission has already been finalized' }, { status: 409 })
    }

    try {
        const { files } = await req.json() as {
            files: { type: string; index?: number }[]
        }

        if (!Array.isArray(files)) {
            return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
        }

        // Server-side path regeneration — never trust client-supplied paths
        const basePath = `${user.id}/${submissionId}`
        const screenshotPaths: string[] = []
        let plistPath: string | null = null
        let manifestPath: string | null = null
        let ipaPath: string | null = null

        for (const file of files) {
            if (!BUCKET_MAP[file.type]) {
                return NextResponse.json({ message: `Unknown file type: ${file.type}` }, { status: 400 })
            }

            switch (file.type) {
                case 'screenshot': {
                    const idx = Number(file.index)
                    if (!Number.isInteger(idx) || idx < 0 || idx > 9) {
                        return NextResponse.json({ message: 'Invalid screenshot index' }, { status: 400 })
                    }
                    // Use png as default — the upload-urls route controls the actual extension
                    screenshotPaths.push(`${basePath}/screenshot_${idx}.png`)
                    break
                }
                case 'plist':
                    plistPath = `${basePath}/Info.plist`
                    break
                case 'manifest':
                    manifestPath = `${basePath}/PrivacyInfo.xcprivacy`
                    break
                case 'ipa':
                    ipaPath = `${basePath}/app.ipa`
                    break
            }
        }

        screenshotPaths.sort()

        // Atomic credit deduction via RPC (prevents TOCTOU race condition)
        const creditCost = CREDIT_COSTS.full

        const { data: creditResult, error: creditError } = await supabase
            .rpc('deduct_credits', { p_user_id: user.id, p_cost: creditCost })

        if (creditError) {
            return NextResponse.json({ message: 'Failed to process credits' }, { status: 500 })
        }

        const row = creditResult?.[0]
        if (!row?.success) {
            return NextResponse.json({
                message: `Insufficient credits. You have ${row?.remaining ?? 0} credits but need ${creditCost} for a full review.`,
                credits: row?.remaining ?? 0,
                required: creditCost,
            }, { status: 402 })
        }

        // Update submission with server-generated file paths and set status
        const { error: updateError } = await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                plist_path: plistPath,
                manifest_path: manifestPath,
                ipa_path: ipaPath,
                credits_used: creditCost,
                status: 'analyzing',
            })
            .eq('id', submissionId)

        if (updateError) {
            await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: creditCost })
            return NextResponse.json({ message: 'Failed to update submission' }, { status: 500 })
        }

        // Create analysis job
        const { error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
            })

        if (jobError) {
            // Revert submission status and refund credits
            await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
            await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: creditCost })
            return NextResponse.json({ message: 'Failed to create analysis job' }, { status: 500 })
        }

        // Trigger worker — await to detect failures, but don't block the user on transient errors
        try {
            const workerRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, secret: process.env.WORKER_SECRET })
            })
            if (!workerRes.ok) {
                console.error(`Worker trigger returned ${workerRes.status} for submission ${submissionId}`)
            }
        } catch (err) {
            console.error('Worker trigger failed:', err)
        }

        revalidatePath('/dashboard')
        console.log(`Submission ${submissionId} finalized. Analysis started.`)
        return NextResponse.json({ submissionId })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal Server Error'
        console.error('Finalize error:', err)
        // Attempt rollback: revert status and refund credits
        try {
            await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
            await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: CREDIT_COSTS.full })
        } catch (rollbackErr) {
            console.error('Rollback failed:', rollbackErr)
        }
        return NextResponse.json({ message }, { status: 500 })
    }
}
