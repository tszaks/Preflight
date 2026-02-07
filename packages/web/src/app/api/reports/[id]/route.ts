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

    const severityRank = (sev: string | null | undefined): number => {
        switch (sev) {
            case 'critical': return 0
            case 'warning': return 1
            case 'info': return 2
            case 'pass': return 3
            default: return 4
        }
    }

    const isManualReview = (title: string | null | undefined) =>
        (title || '').trimStart().toLowerCase().startsWith('manual review:')

    const isHistorical = (title: string | null | undefined) =>
        (title || '').trimStart().toLowerCase().startsWith('historical pattern:')

    const sortedItems = (items || []).slice().sort((a: any, b: any) => {
        const am = isManualReview(a?.title)
        const bm = isManualReview(b?.title)
        if (am !== bm) return am ? 1 : -1

        const ah = isHistorical(a?.title)
        const bh = isHistorical(b?.title)
        if (ah !== bh) return ah ? 1 : -1

        const r = severityRank(a?.severity) - severityRank(b?.severity)
        if (r !== 0) return r

        const ca = typeof a?.confidence === 'number' ? a.confidence : 0
        const cb = typeof b?.confidence === 'number' ? b.confidence : 0
        if (cb !== ca) return cb - ca

        const ta = String(a?.title || '').toLowerCase()
        const tb = String(b?.title || '').toLowerCase()
        return ta.localeCompare(tb)
    })

    return NextResponse.json({ report, items: sortedItems })
}
