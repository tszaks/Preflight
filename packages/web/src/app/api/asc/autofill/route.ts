import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
    getLatestVersion,
    getAppMetadata,
    getAppInfo,
    getAppDetails,
    getReviewDetail,
    type ASCCredentials,
} from '@/lib/app-store-connect'
import { decryptPrivateKey } from '@/lib/asc-credential-store'
import { getEncryptionKey } from '@/lib/asc-encryption'

export async function POST(request: Request) {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { appId } = await request.json()
    if (!appId) {
        return NextResponse.json({ message: 'Missing appId' }, { status: 400 })
    }

    const serviceSupabase = createServiceClient()
    const { data: conn } = await serviceSupabase
        .from('asc_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!conn) {
        return NextResponse.json({ message: 'No ASC connection found' }, { status: 404 })
    }

    const privateKey = decryptPrivateKey(
        conn.encrypted_private_key,
        conn.encryption_iv,
        getEncryptionKey()
    )

    const credentials: ASCCredentials = {
        keyId: conn.key_id,
        issuerId: conn.issuer_id,
        privateKey,
    }

    const [version, appInfo, appDetails] = await Promise.all([
        getLatestVersion(credentials, appId).catch(e => { console.error('getLatestVersion failed', e); return null }),
        getAppInfo(credentials, appId).catch(e => { console.error('getAppInfo failed', e); return null }),
        getAppDetails(credentials, appId).catch(e => { console.error('getAppDetails failed', e); return null }),
    ])

    console.log('ASC Autofill Debug:', {
        appId,
        hasVersion: !!version,
        hasAppInfo: !!appInfo,
        hasAppDetails: !!appDetails,
        detailsName: appDetails?.name,
        versionId: version?.id
    })

    let metadata = null
    let reviewDetail = null
    if (version) {
        [metadata, reviewDetail] = await Promise.all([
            getAppMetadata(credentials, version.id).catch(() => null),
            getReviewDetail(credentials, version.id).catch(() => null),
        ])
    }

    await serviceSupabase
        .from('asc_connections')
        .update({
            selected_app_id: appId,
            selected_app_name: metadata?.name || appDetails?.name || null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    const categoryMap: Record<string, string> = {
        'BUSINESS': 'Business',
        'DEVELOPER_TOOLS': 'Developer Tools',
        'EDUCATION': 'Education',
        'ENTERTAINMENT': 'Entertainment',
        'FINANCE': 'Finance',
        'FOOD_AND_DRINK': 'Food & Drink',
        'GAMES': 'Games',
        'GRAPHICS_AND_DESIGN': 'Graphics & Design',
        'HEALTH_AND_FITNESS': 'Health & Fitness',
        'LIFESTYLE': 'Lifestyle',
        'MEDICAL': 'Medical',
        'MUSIC': 'Music',
        'NAVIGATION': 'Navigation',
        'NEWS': 'News',
        'PHOTO_AND_VIDEO': 'Photo & Video',
        'PRODUCTIVITY': 'Productivity',
        'REFERENCE': 'Reference',
        'SHOPPING': 'Shopping',
        'SOCIAL_NETWORKING': 'Social Networking',
        'SPORTS': 'Sports',
        'TRAVEL': 'Travel',
        'UTILITIES': 'Utilities',
        'WEATHER': 'Weather',
    }

    return NextResponse.json({
        success: true,
        data: {
            app_name: metadata?.name || appDetails?.name || '',
            description: metadata?.description || '',
            keywords: metadata?.keywords || '',
            promotional_text: metadata?.promotionalText || '',
            support_url: metadata?.supportUrl || '',
            marketing_url: metadata?.marketingUrl || '',
            category: appInfo?.categoryId ? categoryMap[appInfo.categoryId] || appInfo.categoryId : '',
            secondary_category: appInfo?.subcategoryId ? categoryMap[appInfo.subcategoryId] || appInfo.subcategoryId : '',
            version: version?.versionString || '',
            // Sign-in info from review detail
            sign_in_required: reviewDetail?.signInRequired || false,
            demo_username: reviewDetail?.demoAccountName || '',
            demo_password: reviewDetail?.demoAccountPassword || '',
        }
    })
}
