import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createHash } from 'crypto'
import { validateCredentials, listApps } from '@/lib/app-store-connect'
import { encryptPrivateKey } from '@/lib/asc-credential-store'

function getEncryptionKey(): string {
    const envKey = process.env.ASC_ENCRYPTION_KEY
    if (envKey && envKey.length === 64) return envKey

    return createHash('sha256')
        .update(process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .digest('hex')
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { keyId, issuerId, privateKey } = await request.json()

    if (!keyId || !issuerId || !privateKey) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        return NextResponse.json({ message: 'Invalid private key format' }, { status: 400 })
    }

    const validation = await validateCredentials({ keyId, issuerId, privateKey })
    if (!validation.valid) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })
    }

    const encryptionKey = getEncryptionKey()
    const { encrypted, iv } = encryptPrivateKey(privateKey, encryptionKey)

    const serviceSupabase = createServiceClient()
    const { error: dbError } = await serviceSupabase
        .from('asc_connections')
        .upsert({
            user_id: user.id,
            key_id: keyId,
            issuer_id: issuerId,
            encrypted_private_key: encrypted,
            encryption_iv: iv,
            selected_app_id: null,
            selected_app_name: null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

    if (dbError) {
        return NextResponse.json({ message: dbError.message }, { status: 500 })
    }

    const apps = await listApps({ keyId, issuerId, privateKey })

    return NextResponse.json({
        success: true,
        teamName: validation.teamName,
        apps: apps.map(a => ({ id: a.id, name: a.name, bundleId: a.bundleId }))
    })
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('asc_connections')
        .select('key_id, selected_app_id, selected_app_name, created_at')
        .eq('user_id', user.id)
        .single()

    if (error || !data) {
        return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
        connected: true,
        appId: data.selected_app_id,
        appName: data.selected_app_name,
        keyId: `...${data.key_id.slice(-4)}`,
        connectedAt: data.created_at
    })
}

export async function DELETE() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const serviceSupabase = createServiceClient()
    await serviceSupabase
        .from('asc_connections')
        .delete()
        .eq('user_id', user.id)

    return NextResponse.json({ success: true })
}
