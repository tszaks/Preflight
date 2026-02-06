import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { runAnalysis, fetchSubmissionFiles, type SoftRulesInput } from '@preflight/shared/engine';
import {
    getVersionDetails,
    getScreenshotStatus,
    getSubscriptionGroups,
    getSubscriptions,
    getInAppPurchases,
    getAgeRatingDeclaration,
    getLatestVersion,
    type ASCCredentials,
    type ASCSubscription,
} from '@/lib/app-store-connect';
import { decryptPrivateKey } from '@/lib/asc-credential-store';
import { getEncryptionKey } from '@/lib/asc-encryption';

export async function POST(req: NextRequest) {
    const supabase = createServiceClient();
    const { submissionId, secret } = await req.json();

    // Simple secret check
    if (secret !== process.env.WORKER_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch submission data
        const { data: submission, error: subError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (subError || !submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // 2. Fetch files from storage
        const files = await fetchSubmissionFiles(supabase, submission);

        // 3. Fetch ASC data if user has ASC connected
        const ascData = await fetchAscDataForUser(submission.user_id);

        // 4. Transform form data to engine expected format
        // Cast to any for fields that may not be in generated types yet
        const submissionData = submission as Partial<SoftRulesInput>;
        const sub = submission as Record<string, unknown>;
        const userId = typeof sub.user_id === 'string' ? sub.user_id : undefined;

        // Parse stored JSON fields (with safe fallbacks)
        const checklist = (typeof sub.checklist === 'object' && sub.checklist !== null) ? sub.checklist : {};
        const privacyDeclarations = (typeof sub.privacy_declarations === 'object' && sub.privacy_declarations !== null) ? sub.privacy_declarations : {};
        const ageRating = (typeof sub.age_rating === 'object' && sub.age_rating !== null) ? sub.age_rating : {};
        const ageRatingString =
            typeof sub.age_rating === 'string'
                ? sub.age_rating
                : (typeof (ageRating as Record<string, unknown>).rating === 'string'
                    ? (ageRating as Record<string, unknown>).rating as string
                    : null);

        // Cast to any for dynamic property access
        const cl = checklist as Record<string, boolean | undefined>;
        const pd = privacyDeclarations as Record<string, { collected?: boolean; linked?: boolean; tracking?: boolean } | boolean | undefined>;

        // Transform privacy declarations to flat data_collection format
        const dataCollection: Record<string, boolean> = {};
        for (const [key, value] of Object.entries(pd)) {
            if (typeof value === 'boolean') {
                dataCollection[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                dataCollection[key] = value.collected || false;
            }
        }

        // Build engine input with proper field mappings
        const engineInput: SoftRulesInput = {
            // Base submission data
            ...submissionData,
            app_name: submissionData.app_name || 'Untitled App',
            review_type: (submissionData.review_type ?? 'full') as SoftRulesInput['review_type'],
            screenshot_paths: submissionData.screenshot_paths || [],

            // File contents from storage
            screenshots_data: files.screenshotsData,
            manifest_content: files.manifestContent,
            plist_content: files.plistContent,
            ipa_buffer: files.ipaBuffer,

            // === ASC-Fetched Data (for automatic validation) ===
            asc_screenshots: ascData?.screenshots,
            asc_subscriptions: ascData?.subscriptions,
            asc_in_app_purchases: ascData?.inAppPurchases,
            asc_age_rating: ascData?.ageRating,
            asc_review_contact: ascData?.reviewContact,
            asc_copyright: ascData?.copyright,
            asc_app_store_state: ascData?.appStoreState,

            // === Checklist → Engine Field Mappings ===
            // Content & Features
            has_ugc: cl.ugc,
            has_ugc_moderation: cl.ugcModeration,
            makes_health_claims: cl.healthClaims,
            has_health_disclaimers: cl.healthDisclaimers,
            generates_ai_content: cl.aiContent,
            has_ai_content_filtering: cl.aiContentFiltering,
            has_creator_age_gate: cl.creatorAgeGate,

            // Authentication & Accounts
            sign_in_required: submissionData.sign_in_required ?? cl.login,
            has_third_party_login: cl.thirdPartyLogin,
            has_account_deletion: cl.accountDeletion,

            // Monetization
            has_iap: cl.iap,
            has_subscriptions: cl.subscriptions,
            has_restore_purchases: cl.restorePurchases,
            subscription_terms_on_paywall: cl.subscriptionTerms,
            sells_digital_outside_iap: cl.sellsDigitalOutsideIap,
            subscriptions_without_login: cl.subscriptionsWithoutLogin,

            // Technical
            screenshots_match_ui: cl.screenshotsMatchUi,
            tested_ipv6: cl.testedIpv6,
            contextual_permissions: cl.contextualPermissions,
            has_alternate_icons: cl.alternateIcons,

            // November 2025 + 2026 Policy Updates
            has_mini_apps: cl.miniApps,
            mini_apps_reviewed: cl.miniAppsReviewed,
            distributes_in_eu: cl.euDistribution,
            eu_trader_declared: cl.euTraderDeclared,
            has_external_payment_link: cl.externalPayments,
            external_link_compliant: cl.externalLinkCompliant,

            // === Privacy Declarations → data_collection ===
            data_collection: Object.keys(dataCollection).length > 0 ? dataCollection : undefined,

            // === Age Rating ===
            age_rating: ageRatingString,
        };

        // 5. Run Analysis with transformed input
        const result = await runAnalysis(
            supabase,
            submissionId,
            engineInput,
            {
                anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                userId,
            }
        );

        return NextResponse.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        console.error('[Worker API] Error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * Fetch ASC data for analysis if user has ASC connected.
 * This runs in the background during analysis - no user interaction needed.
 */
async function fetchAscDataForUser(userId: string): Promise<{
    screenshots?: { deviceType: string; count: number }[];
    subscriptions?: { id: string; name: string; productId: string; state: string; groupName?: string }[];
    inAppPurchases?: { id: string; name: string; productId: string; type: string; state: string }[];
    ageRating?: { rating: string | null; gambling: boolean; unrestrictedWebAccess: boolean; kidsAgeBand: string | null; seventeenPlus: boolean };
    reviewContact?: { firstName?: string; lastName?: string; email?: string; phone?: string };
    copyright?: string;
    appStoreState?: string;
} | null> {
    try {
        const supabase = createServiceClient();

        // Check if user has ASC connected
        const { data: conn } = await supabase
            .from('asc_connections')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!conn?.selected_app_id) {
            console.log('[ASC] User has no ASC connection or no app selected');
            return null;
        }

        // Decrypt credentials
        const privateKey = decryptPrivateKey(
            conn.encrypted_private_key,
            conn.encryption_iv,
            getEncryptionKey()
        );

        const credentials: ASCCredentials = {
            keyId: conn.key_id,
            issuerId: conn.issuer_id,
            privateKey,
        };

        const appId = conn.selected_app_id;

        // Fetch all ASC data in parallel
        const [version, ageRating, subscriptionGroups, inAppPurchases] = await Promise.all([
            getLatestVersion(credentials, appId).catch(() => null),
            getAgeRatingDeclaration(credentials, appId).catch(() => null),
            getSubscriptionGroups(credentials, appId).catch(() => []),
            getInAppPurchases(credentials, appId).catch(() => []),
        ]);

        // Version-dependent data
        let screenshots: { deviceType: string; count: number }[] = [];
        let versionDetails = null;

        if (version) {
            [screenshots, versionDetails] = await Promise.all([
                getScreenshotStatus(credentials, version.id).catch(() => []),
                getVersionDetails(credentials, version.id).catch(() => null),
            ]);
        }

        // Fetch subscriptions for each group
        let allSubscriptions: ASCSubscription[] = [];
        if (subscriptionGroups.length > 0) {
            const subResults = await Promise.all(
                subscriptionGroups.map(g => getSubscriptions(credentials, g.id, g.name).catch(() => []))
            );
            allSubscriptions = subResults.flat();
        }

        console.log('[ASC] Fetched data for analysis:', {
            screenshots: screenshots.length,
            subscriptions: allSubscriptions.length,
            iap: inAppPurchases.length,
            hasAgeRating: !!ageRating,
            hasCopyright: !!versionDetails?.copyright,
        });

        return {
            screenshots: screenshots.map(s => ({
                deviceType: s.deviceType,
                count: s.count,
            })),
            subscriptions: allSubscriptions.map(s => ({
                id: s.id,
                name: s.name,
                productId: s.productId,
                state: s.state,
                groupName: s.groupName,
            })),
            inAppPurchases: inAppPurchases.map(iap => ({
                id: iap.id,
                name: iap.name,
                productId: iap.productId,
                type: iap.inAppPurchaseType,
                state: iap.state,
            })),
            ageRating: ageRating ? {
                rating: ageRating.rating,
                gambling: ageRating.gambling,
                unrestrictedWebAccess: ageRating.unrestrictedWebAccess,
                kidsAgeBand: ageRating.kidsAgeBand,
                seventeenPlus: ageRating.seventeenPlus,
            } : undefined,
            copyright: versionDetails?.copyright || undefined,
            appStoreState: versionDetails?.appStoreState || undefined,
        };
    } catch (err) {
        console.warn('[ASC] Failed to fetch ASC data for analysis (continuing without):', err);
        return null;
    }
}
