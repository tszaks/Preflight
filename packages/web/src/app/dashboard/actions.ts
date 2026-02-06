'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function archiveSubmission(submissionId: string) {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Unauthorized")
    }

    // 2. Perform archive (restricted to owner)
    const { error } = await supabase
        .from('submissions')
        .update({ is_rereviewing: true } as { is_rereviewing: boolean })
        .eq('id', submissionId)
        .eq('user_id', user.id)

    if (error) {
        console.error("Archive error:", error)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
}
