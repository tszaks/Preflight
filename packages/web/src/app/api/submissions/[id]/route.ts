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

    const { data, error } = await supabase
        .from('submissions')
        .select('*, analysis_jobs(error_message)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error('Error fetching submission:', error)
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
}
