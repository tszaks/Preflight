import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WORKER_SECRET, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { runAnalysis, fetchSubmissionFiles } from '$lib/engine';
import type { SoftRulesInput } from '$lib/engine';
import { parseDataCollection } from '$lib/engine/types';

/**
 * Worker endpoint that processes analysis jobs.
 * Called by a cron job or Supabase webhook after payment.
 * Protected by WORKER_SECRET header.
 */
export const POST: RequestHandler = async ({ request }) => {
    // Verify worker auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${WORKER_SECRET}`) {
        throw error(401, 'Unauthorized');
    }

    const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch next pending job
    const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .select('*, submissions(*)')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (jobError || !job) {
        return json({ message: 'No pending jobs' });
    }

    const submission = (job as any).submissions;
    if (!submission) {
        return json({ error: 'Submission not found for job' }, { status: 404 });
    }

    // Increment attempts
    await supabase
        .from('analysis_jobs')
        .update({ attempts: job.attempts + 1 })
        .eq('id', job.id);

    // Fetch files from storage
    const files = await fetchSubmissionFiles(supabase, submission);

    // Build soft rules input (include ALL form fields for conditional warnings)
    const input: SoftRulesInput = {
        app_name: submission.app_name,
        subtitle: submission.subtitle,
        description: submission.description,
        keywords: submission.keywords,
        category: submission.category,
        age_rating: submission.age_rating,
        privacy_url: submission.privacy_url,
        support_url: submission.support_url,
        marketing_url: submission.marketing_url,
        screenshot_paths: submission.screenshot_paths || [],
        manifest_path: submission.manifest_path,
        plist_path: submission.plist_path,
        review_type: submission.review_type,
        screenshots_data: files.screenshotsData,
        manifest_content: files.manifestContent,
        plist_content: files.plistContent,
        privacy_policy_text: files.privacyPolicyText,
        // Form-field based checks (for conditional warnings)
        sign_in_required: submission.sign_in_required ?? false,
        has_iap: submission.has_iap ?? false,
        has_subscriptions: submission.has_subscriptions ?? false,
        has_third_party_login: submission.has_third_party_login ?? false,
        // Privacy data collection (for mismatch detection)
        data_collection: parseDataCollection(submission.data_collection),
        // Explicit feature confirmations (Phase 3: Smarter Form Questions)
        has_account_deletion: submission.has_account_deletion ?? undefined,
        has_restore_purchases: submission.has_restore_purchases ?? undefined,
        is_new_app: submission.is_new_app ?? undefined,
        // Screenshot index hints
        settings_screenshot_index: submission.settings_screenshot_index ?? undefined,
        paywall_screenshot_index: submission.paywall_screenshot_index ?? undefined,
        // Self-report: Content & Features
        has_ugc: submission.has_ugc ?? undefined,
        has_ugc_moderation: submission.has_ugc_moderation ?? undefined,
        makes_health_claims: submission.makes_health_claims ?? undefined,
        has_health_disclaimers: submission.has_health_disclaimers ?? undefined,
        generates_ai_content: submission.generates_ai_content ?? undefined,
        has_ai_content_filtering: submission.has_ai_content_filtering ?? undefined,
        // Self-report: Monetization
        subscription_terms_on_paywall: submission.subscription_terms_on_paywall ?? undefined,
        sells_digital_outside_iap: submission.sells_digital_outside_iap ?? undefined,
        subscriptions_without_login: submission.subscriptions_without_login ?? undefined,
        // Self-report: Technical
        screenshots_match_ui: submission.screenshots_match_ui ?? undefined,
        tested_ipv6: submission.tested_ipv6 ?? undefined,
        contextual_permissions: submission.contextual_permissions ?? undefined,
        has_alternate_icons: submission.has_alternate_icons ?? undefined,
    };

    // Run analysis
    console.log('[Worker] Starting analysis. ANTHROPIC_API_KEY present:', !!ANTHROPIC_API_KEY);
    console.log('[Worker] Submission ID:', submission.id);
    console.log('[Worker] Review type:', submission.review_type);
    console.log('[Worker] Has manifest content:', !!files.manifestContent);

    const result = await runAnalysis(supabase, submission.id, input, {
        skipChecklistRules: submission.review_type === 'quick' && !files.manifestContent,
    });

    console.log('[Worker] Analysis result:', result);

    return json({
        success: result.success,
        reportId: result.reportId,
        error: result.error,
    });
};
