import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) {
        console.error('Error fetching submission:', error)
        return NextResponse.json({ message: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
}
