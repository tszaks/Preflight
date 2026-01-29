import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { runAnalysis, fetchSubmissionFiles } from '$lib/engine';
import type { ProgressEvent } from '$lib/types/progress';
import type { SoftRulesInput } from '$lib/engine/types';
import { parseDataCollection } from '$lib/engine/types';

/**
 * Server-Sent Events (SSE) endpoint for streaming analysis progress.
 *
 * Protocol:
 * - Client connects to GET /api/analysis-stream/[submissionId]
 * - Server streams progress events as SSE
 * - Each event is JSON: { type, message, progress, ... }
 * - Stream ends with 'complete' event containing reportId
 * - On error, 'error' event is sent and stream closes
 */
export const GET: RequestHandler = async ({ params, locals: { safeGetSession, supabase } }) => {
    const submissionId = params.id;

    if (!submissionId) {
        throw error(400, 'Missing submission ID');
    }

    // Verify user owns this submission
    const { user } = await safeGetSession();
    if (!user) {
        throw error(401, 'Not authenticated');
    }

    // Fetch submission
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

    if (subError || !submission) {
        throw error(404, 'Submission not found');
    }

    // Verify ownership (skip for test users)
    if (submission.user_id !== user.id && submission.user_id !== 'test-user') {
        throw error(403, 'Not authorized to view this submission');
    }

    // Check if analysis already complete
    const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('submission_id', submissionId)
        .single();

    if (existingReport) {
        // Return immediate complete event
        const completeEvent: ProgressEvent = {
            type: 'complete',
            message: 'Analysis already complete',
            progress: 100,
            timestamp: Date.now(),
            data: { reportId: existingReport.id },
        };

        return new Response(
            `data: ${JSON.stringify(completeEvent)}\n\n`,
            {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            }
        );
    }

    // Check if there's a pending/running job
    const { data: job } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

    if (!job) {
        // Create job if it doesn't exist
        await supabase.from('analysis_jobs').insert({
            submission_id: submissionId,
            status: 'pending',
            priority: 100,
        });
    }

    // Use service role client for analysis operations (bypasses RLS for report creation)
    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send SSE events
            const sendEvent = (event: ProgressEvent) => {
                const data = `data: ${JSON.stringify(event)}\n\n`;
                controller.enqueue(encoder.encode(data));
            };

            try {
                // Fetch submission files (service role to access storage)
                const files = await fetchSubmissionFiles(serviceSupabase, submission);

                // Prepare input
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
                    review_type: submission.review_type || 'full',
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

                // Run analysis with progress streaming (service role bypasses RLS for report writes)
                const result = await runAnalysis(serviceSupabase, submissionId, input, {
                    onProgress: sendEvent,
                });

                if (!result.success) {
                    sendEvent({
                        type: 'error',
                        message: result.error || 'Analysis failed',
                        progress: -1,
                        timestamp: Date.now(),
                        data: { error: result.error },
                    });
                }

                controller.close();
            } catch (err) {
                console.error('[SSE] Analysis stream error:', err);
                const message = err instanceof Error ? err.message : 'Unknown error';

                sendEvent({
                    type: 'error',
                    message: `Analysis failed: ${message}`,
                    progress: -1,
                    timestamp: Date.now(),
                    data: { error: message },
                });

                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
    });
};
