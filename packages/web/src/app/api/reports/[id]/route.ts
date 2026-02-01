import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Get report with items
    const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

    if (reportError || !report) {
        return NextResponse.json({ message: 'Report not found' }, { status: 404 })
    }

    // Verify ownership via submission
    const { data: submission } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('id', report.submission_id)
        .eq('user_id', user.id)
        .single()

    if (!submission) {
        return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    // Get report items
    const { data: items } = await supabase
        .from('report_items')
        .select('*')
        .eq('report_id', id)
        .order('severity', { ascending: true })

    return NextResponse.json({ report, items: items || [] })
}
