import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'

export async function GET(req: NextRequest) {
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, credits, created_at')
        .eq('id', user.id)
        .single()

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            ...profile,
        }
    })
}
