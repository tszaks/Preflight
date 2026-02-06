import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const { data: submission, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error('Error fetching submission:', error)
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    const { data: jobs } = await supabase
        .from('analysis_jobs')
        .select('status, error_message, created_at')
        .eq('submission_id', id)
        .order('created_at', { ascending: false })
        .limit(1)

    const latestJob = jobs?.[0]
    const analysis_jobs = latestJob
        ? [{
            error_message: latestJob.status === 'failed' ? latestJob.error_message : null,
        }]
        : []

    return NextResponse.json({ data: { ...submission, analysis_jobs } })
}
