import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
    getLatestVersion,
    getAppMetadata,
    getAppInfo,
    getAppDetails,
    getReviewDetail,
    getAppInfoLocalization,
    getVersionDetails,
    getScreenshotStatus,
    getSubscriptionGroups,
    getSubscriptions,
    getInAppPurchases,
    getAgeRatingDeclaration,
    getAppPreviewStatus,
    getContentRights,
    getAppAvailability,
    type ASCCredentials,
    type ASCSubscription,
    type ASCScreenshot,
    type ASCAppPreview,
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

    // ─── Phase 1: Core App Data ──────────────────────────────────────────────
    const [version, appInfo, appDetails, privacyInfo, ageRating, subscriptionGroups, inAppPurchases, contentRights, appAvailability] = await Promise.all([
        getLatestVersion(credentials, appId).catch(e => { console.error('getLatestVersion failed', e); return null }),
        getAppInfo(credentials, appId).catch(e => { console.error('getAppInfo failed', e); return null }),
        getAppDetails(credentials, appId).catch(e => { console.error('getAppDetails failed', e); return null }),
        getAppInfoLocalization(credentials, appId).catch(e => { console.error('getAppInfoLocalization failed', e); return null }),
        getAgeRatingDeclaration(credentials, appId).catch(e => { console.error('getAgeRatingDeclaration failed', e); return null }),
        getSubscriptionGroups(credentials, appId).catch(e => { console.error('getSubscriptionGroups failed', e); return [] }),
        getInAppPurchases(credentials, appId).catch(e => { console.error('getInAppPurchases failed', e); return [] }),
        getContentRights(credentials, appId).catch(() => null),
        getAppAvailability(credentials, appId).catch(() => null),
    ])

    console.log('ASC Autofill Debug:', {
        appId,
        hasVersion: !!version,
        hasAppInfo: !!appInfo,
        hasAppDetails: !!appDetails,
        hasAgeRating: !!ageRating,
        hasPrivacyPolicyUrl: !!privacyInfo?.privacyPolicyUrl,
        privacyPolicyUrl: privacyInfo?.privacyPolicyUrl || null,
        subscriptionGroups: subscriptionGroups?.length || 0,
        inAppPurchases: inAppPurchases?.length || 0,
        versionId: version?.id
    })

    // ─── Phase 2: Version-Dependent Data ─────────────────────────────────────
    let metadata = null
    let reviewDetail = null
    let versionDetails = null
    let screenshotStatus: Awaited<ReturnType<typeof getScreenshotStatus>> = []
    let appPreviewStatus: Awaited<ReturnType<typeof getAppPreviewStatus>> = []

    if (version) {
        [metadata, reviewDetail, versionDetails, screenshotStatus, appPreviewStatus] = await Promise.all([
            getAppMetadata(credentials, version.id).catch(() => null),
            getReviewDetail(credentials, version.id).catch(() => null),
            getVersionDetails(credentials, version.id).catch(() => null),
            getScreenshotStatus(credentials, version.id).catch(() => []),
            getAppPreviewStatus(credentials, version.id).catch(() => []),
        ])
    }

    // ─── Phase 3: Subscription Details ───────────────────────────────────────
    let allSubscriptions: ASCSubscription[] = []
    if (subscriptionGroups && subscriptionGroups.length > 0) {
        const subPromises = subscriptionGroups.map(group =>
            getSubscriptions(credentials, group.id, group.name).catch(() => [])
        )
        const subResults = await Promise.all(subPromises)
        allSubscriptions = subResults.flat()
    }

    // ─── Update Selected App ─────────────────────────────────────────────────
    await serviceSupabase
        .from('asc_connections')
        .update({
            selected_app_id: appId,
            selected_app_name: metadata?.name || appDetails?.name || null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    // ─── Category Mapping ────────────────────────────────────────────────────
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

    // ─── Build Response ──────────────────────────────────────────────────────
    return NextResponse.json({
        success: true,
        data: {
            // Basic metadata
            app_name: metadata?.name || appDetails?.name || '',
            description: metadata?.description || '',
            keywords: metadata?.keywords || '',
            promotional_text: metadata?.promotionalText || '',
            privacy_policy_url: privacyInfo?.privacyPolicyUrl || metadata?.privacyUrl || '',
            support_url: metadata?.supportUrl || '',
            marketing_url: metadata?.marketingUrl || '',
            category: appInfo?.categoryId ? categoryMap[appInfo.categoryId] || appInfo.categoryId : '',
            secondary_category: appInfo?.subcategoryId ? categoryMap[appInfo.subcategoryId] || appInfo.subcategoryId : '',

            // Version info
            version: version?.versionString || '',
            copyright: versionDetails?.copyright || '',
            release_type: versionDetails?.releaseType || '',
            app_store_state: versionDetails?.appStoreState || '',

            // Review details
            sign_in_required: reviewDetail?.signInRequired || false,
            demo_username: reviewDetail?.demoAccountName || '',
            demo_password: reviewDetail?.demoAccountPassword || '',
            contact_first_name: reviewDetail?.contactFirstName || '',
            contact_last_name: reviewDetail?.contactLastName || '',
            contact_email: reviewDetail?.contactEmail || '',
            contact_phone: reviewDetail?.contactPhone || '',
            review_notes: reviewDetail?.notes || '',

            // Screenshots (with URLs for auto-download)
            screenshots: screenshotStatus.map(s => ({
                device_type: s.deviceType,
                count: s.count,
                images: s.screenshots.map((img: ASCScreenshot) => ({
                    id: img.id,
                    file_name: img.fileName,
                    url: img.url,
                    state: img.state,
                })),
            })),

            // Monetization (for analysis: are subscriptions configured?)
            subscriptions: allSubscriptions.map(s => ({
                id: s.id,
                name: s.name,
                product_id: s.productId,
                state: s.state,
                group_name: s.groupName,
            })),
            in_app_purchases: (inAppPurchases || []).map(iap => ({
                id: iap.id,
                name: iap.name,
                product_id: iap.productId,
                type: iap.inAppPurchaseType,
                state: iap.state,
            })),

            // Age rating (for analysis: does it match what user declared?)
            age_rating: ageRating ? {
                rating: ageRating.rating,
                gambling: ageRating.gambling,
                unrestricted_web_access: ageRating.unrestrictedWebAccess,
                kids_age_band: ageRating.kidsAgeBand,
                seventeen_plus: ageRating.seventeenPlus,
            } : null,

            // App Privacy status (whether user has filled out App Privacy in ASC)
            // Privacy is considered configured if privacyPolicyUrl is set (required for App Privacy)
            privacy_status: {
                configured: !!(privacyInfo?.privacyPolicyUrl),
                privacy_policy_url: privacyInfo?.privacyPolicyUrl || null,
            },

            // App Previews (videos) with URLs
            app_previews: appPreviewStatus.map((s: any) => ({
                device_type: s.deviceType,
                count: s.count,
                videos: s.previews.map((p: ASCAppPreview) => ({
                    id: p.id,
                    file_name: p.fileName,
                    url: p.url,
                    state: p.state,
                })),
            })),

            // Content rights declaration
            content_rights: contentRights ? {
                uses_third_party_content: contentRights.usesThirdPartyContent,
                has_rights_to_content: contentRights.hasRightsToContent,
            } : null,

            // App availability
            availability: appAvailability ? {
                available_in_new_territories: appAvailability.availableInNewTerritories,
            } : null,

            // What's New (required for updates)
            whats_new: metadata?.whatsNew || null,

            // Version state detection
            is_first_version: version?.appStoreState === 'PREPARE_FOR_SUBMISSION',
            version_state: version?.appStoreState || null,
        }
    })
}
