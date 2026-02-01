import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportClient from '@/components/report/ReportClient'

export default async function ReportPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login')
    }

    // 2. Fetch Submission
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (subError || !submission) {
        redirect('/dashboard')
    }

    // 3. If analyzing, we can either poll or show a different view
    // For now, we'll fetch the report and items if they exist
    const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('submission_id', id)
        .maybeSingle()

    const { data: items } = await supabase
        .from('report_items')
        .select('*')
        .eq('report_id', report?.id)

    return (
        <ReportClient
            initialSubmission={submission}
            initialReport={report || { score_overall: 0 }}
            initialItems={items || []}
        />
    )
}
