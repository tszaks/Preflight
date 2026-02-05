import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'

export async function GET(req: NextRequest) {
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
        .from('submissions')
        .select('id, app_name, status, review_type, created_at, updated_at, report_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
    const supabase = await createClientFromRequest(req)

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()

        const recordData: any = {
            user_id: user.id,
            app_name: body.app_name,
            promotional_text: body.promotional_text,
            description: body.description,
            keywords: body.keywords,
            category: body.category,
            privacy_url: body.privacy_policy_url || body.privacy_url || null,
            support_url: body.support_url,
            marketing_url: body.marketing_url,
            sign_in_required: body.sign_in_required,
            demo_username: body.demo_username,
            demo_password: body.demo_password,
            age_rating: body.age_rating || null,
            privacy_declarations: body.privacy_declarations || null,
            checklist: body.checklist || null,
            // project_path: body.project_path || null,
            // flow_position: body.flow_position || null,
            status: 'draft',
            review_type: 'full',
        }

        let submissionId: string
        const existingId = body.submission_id as string | null

        if (existingId) {
            const { error: updateError } = await supabase
                .from('submissions')
                .update(recordData)
                .eq('id', existingId)
                .eq('user_id', user.id)

            if (updateError) {
                return NextResponse.json({ message: updateError.message }, { status: 500 })
            }
            submissionId = existingId
        } else {
            const { data: submission, error: subError } = await supabase
                .from('submissions')
                .insert(recordData)
                .select('id')
                .single()

            if (subError || !submission) {
                return NextResponse.json({ message: subError?.message || 'Failed to create submission' }, { status: 500 })
            }
            submissionId = submission.id
        }

        return NextResponse.json({ submissionId, message: 'Draft saved successfully' })
    } catch (err: any) {
        console.error('Submission error:', err)
        return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
