import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const CREDIT_COSTS = {
    full: 100,
    recheck: 25,
} as const

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Verify submission ownership
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single()

    if (subError || !submission) {
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    try {
        const { files } = await req.json() as {
            files: { type: string; bucket: string; path: string }[]
        }

        // Build file paths from uploaded files
        const screenshotPaths: string[] = []
        let plistPath: string | null = null
        let manifestPath: string | null = null
        let ipaPath: string | null = null

        for (const file of files) {
            switch (file.type) {
                case 'screenshot':
                    screenshotPaths.push(file.path)
                    break
                case 'plist':
                    plistPath = file.path
                    break
                case 'manifest':
                    manifestPath = file.path
                    break
                case 'ipa':
                    ipaPath = file.path
                    break
            }
        }

        // Sort screenshots by path to maintain correct order (screenshot_0, screenshot_1, etc.)
        screenshotPaths.sort()

        // Update submission with file paths and set status to analyzing
        await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                plist_path: plistPath,
                manifest_path: manifestPath,
                ipa_path: ipaPath,
                status: 'analyzing',
            })
            .eq('id', submissionId)

        // Credit check and deduction
        const creditCost = CREDIT_COSTS.full

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
            return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 500 })
        }

        const currentCredits = profile.credits || 0
        if (currentCredits < creditCost) {
            await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
            return NextResponse.json({
                message: `Insufficient credits. You have ${currentCredits} credits but need ${creditCost} for a full review.`,
                credits: currentCredits,
                required: creditCost,
            }, { status: 402 })
        }

        const { error: deductError } = await supabase
            .from('profiles')
            .update({ credits: currentCredits - creditCost })
            .eq('id', user.id)

        if (deductError) {
            await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
            return NextResponse.json({ message: 'Failed to deduct credits' }, { status: 500 })
        }

        // Create analysis job
        await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
            })

        // Fire-and-forget worker trigger
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId, secret: process.env.WORKER_SECRET })
        }).catch(err => console.error('Worker trigger failed:', err))

        revalidatePath('/dashboard')
        console.log(`Submission ${submissionId} finalized. Analysis started.`)
        return NextResponse.json({ submissionId })
    } catch (err: any) {
        console.error('Finalize error:', err)
        return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
