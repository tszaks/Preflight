import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'

export async function GET(req: NextRequest) {
    const supabase = await createClientFromRequest(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

    if (error || !profile) {
        return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ credits: profile.credits })
}
