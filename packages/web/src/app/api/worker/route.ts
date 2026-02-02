import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { runAnalysis, fetchSubmissionFiles } from '@preflight/shared/engine';

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

        // 3. Transform form data to engine expected format
        // Cast to any for fields that may not be in generated types yet
        const sub = submission as Record<string, any>;

        // Parse stored JSON fields (with safe fallbacks)
        const checklist = (typeof sub.checklist === 'object' && sub.checklist !== null) ? sub.checklist : {};
        const privacyDeclarations = (typeof sub.privacy_declarations === 'object' && sub.privacy_declarations !== null) ? sub.privacy_declarations : {};
        const ageRating = (typeof sub.age_rating === 'object' && sub.age_rating !== null) ? sub.age_rating : {};

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
        const engineInput = {
            // Base submission data
            ...submission,
            app_name: submission.app_name || 'Untitled App',
            screenshot_paths: submission.screenshot_paths || [],

            // File contents from storage
            screenshots_data: files.screenshotsData,
            manifest_content: files.manifestContent,
            plist_content: files.plistContent,
            ipa_buffer: files.ipaBuffer,

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
            sign_in_required: submission.sign_in_required ?? cl.login,
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
            age_rating: ageRating,

            // Privacy tracking flag (from declarations)
            tracking: pd.tracking === true || (typeof pd.tracking === 'object' && pd.tracking),
        };

        // 4. Run Analysis with transformed input
        const result = await runAnalysis(
            supabase,
            submissionId,
            engineInput as any,
            {
                anthropicApiKey: process.env.ANTHROPIC_API_KEY,
                userId: submission.user_id,
            }
        );

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('[Worker API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
