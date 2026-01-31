'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function stopReview(submissionId: string) {
    const supabase = createServiceClient()

    // Update both tables with service role (bypasses RLS)
    const [jobResult, subResult] = await Promise.all([
        supabase
            .from('analysis_jobs')
            .update({
                status: 'failed',
                error_message: 'Review cancelled by user.'
            })
            .eq('submission_id', submissionId),
        supabase
            .from('submissions')
            .update({ status: 'draft' })
            .eq('id', submissionId)
    ])

    if (jobResult.error) {
        console.error('[Stop Review] Job update error:', jobResult.error)
        return { success: false, error: jobResult.error.message }
    }

    if (subResult.error) {
        console.error('[Stop Review] Submission update error:', subResult.error)
        return { success: false, error: subResult.error.message }
    }

    console.log('[Stop Review] Successfully stopped submission:', submissionId)

    revalidatePath('/dashboard')
    revalidatePath(`/report/${submissionId}`)

    return { success: true }
}
