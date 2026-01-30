import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import type { HardRulesInput, SoftRulesInput, CheckResult, EngineResult } from './types';
import type { OnProgressCallback, ProgressEvent } from '$lib/types/progress';
import {
    createProgressEvent,
    PROGRESS_CHECKS,
    PROGRESS_MESSAGES,
    PROGRESS_RANGES,
} from '$lib/types/progress';
import { runHardRules } from './hard-rules';
import { runChecklistRules } from './checklist';
import { matchRejectionPatterns } from './historical-patterns';
import { analyzeScreenshots } from './screenshot-analyzer';
import type { ScreenshotEvidence } from './types';
import { generateReport } from './report/generator';

export type { CheckResult, EngineResult, HardRulesInput, SoftRulesInput };
export type { OnProgressCallback, ProgressEvent };

/**
 * Main analysis engine orchestrator.
 *
 * Pipeline:
 * 1. Run hard rules (deterministic, instant)
 * 2. Run checklist rules (deterministic, no AI)
 * 3. Generate report (scoring + DB save)
 *
 * This function is called by the analysis worker/edge function.
 */
export async function runAnalysis(
    supabase: SupabaseClient<Database>,
    submissionId: string,
    input: SoftRulesInput,
    options: {
        anthropicApiKey?: string;
        skipChecklistRules?: boolean;
        onProgress?: OnProgressCallback;
    }
): Promise<{ reportId: string; success: boolean; error?: string }> {
    const allChecks: CheckResult[] = [];
    const emit = options.onProgress || (() => {});

    // Update job status
    await updateJobStatus(supabase, submissionId, 'running');

    try {
        console.log('[Analysis] Starting analysis for submission:', submissionId);

        // === Phase 1: Hard Rules (0-40%) ===
        emit(createProgressEvent('phase_start', 'Starting compliance checks...', 0, {
            phase: 'hard_rules',
        }));

        console.log('[Analysis] Running hard rules...');
        const hardInput: HardRulesInput = {
            app_name: input.app_name,
            subtitle: input.subtitle,
            description: input.description,
            keywords: input.keywords,
            category: input.category,
            age_rating: input.age_rating,
            privacy_url: input.privacy_url,
            support_url: input.support_url,
            marketing_url: input.marketing_url,
            screenshot_paths: input.screenshot_paths,
            manifest_path: input.manifest_path,
            plist_path: input.plist_path,
            ipa_path: input.ipa_path,
            // Form-field based checks (for conditional warnings)
            sign_in_required: input.sign_in_required,
            has_iap: input.has_iap,
            has_subscriptions: input.has_subscriptions,
            has_third_party_login: input.has_third_party_login,
            // Explicit feature confirmations
            has_account_deletion: input.has_account_deletion,
            has_restore_purchases: input.has_restore_purchases,
            is_new_app: input.is_new_app,
            // Screenshot index hints (for cross-referencing)
            settings_screenshot_index: input.settings_screenshot_index,
            paywall_screenshot_index: input.paywall_screenshot_index,
            // Privacy data collection (for mismatch detection)
            data_collection: input.data_collection,
            // Self-report: Content & Features
            has_ugc: input.has_ugc,
            has_ugc_moderation: input.has_ugc_moderation,
            makes_health_claims: input.makes_health_claims,
            has_health_disclaimers: input.has_health_disclaimers,
            generates_ai_content: input.generates_ai_content,
            has_ai_content_filtering: input.has_ai_content_filtering,
            // Self-report: Monetization
            subscription_terms_on_paywall: input.subscription_terms_on_paywall,
            sells_digital_outside_iap: input.sells_digital_outside_iap,
            subscriptions_without_login: input.subscriptions_without_login,
            // Self-report: Technical
            screenshots_match_ui: input.screenshots_match_ui,
            tested_ipv6: input.tested_ipv6,
            contextual_permissions: input.contextual_permissions,
            has_alternate_icons: input.has_alternate_icons,
        };

        // Create progress callback for hard rules
        const hardRulesProgress: OnProgressCallback = (event) => {
            // Map hard rules progress (0-100) to overall progress (0-40)
            const { start, end } = PROGRESS_RANGES.hard_rules;
            const mappedProgress = start + (event.progress / 100) * (end - start);
            emit({ ...event, progress: mappedProgress });
        };

        const hardResult = await runHardRules(hardInput, {
            screenshotData: input.screenshots_data,
            manifestContent: input.manifest_content,
            plistContent: input.plist_content,
            ipaBuffer: input.ipa_buffer,
            onProgress: hardRulesProgress,
        });

        allChecks.push(...hardResult.checks);

        // Add info-level suggestion if no Info.plist was provided
        if (!input.plist_content) {
            allChecks.push({
                category: 'info_plist',
                severity: 'info',
                title: 'No Info.plist provided',
                description: 'Info.plist was not uploaded. Some compliance checks cannot be performed.',
                fix_suggestion: 'Upload your Info.plist for a more comprehensive review.',
                confidence: 100,
            });
        }

        console.log('[Analysis] Hard rules complete. Found', hardResult.checks.length, 'checks');

        emit(createProgressEvent('phase_complete', 'Compliance checks complete', 40, {
            phase: 'hard_rules',
            data: { checksFound: hardResult.checks.length },
        }));

        // Mark hard rules done
        await supabase
            .from('analysis_jobs')
            .update({ hard_rules_completed: true })
            .eq('submission_id', submissionId);

        // === Phase 2: Checklist Rules (40-85%) ===
        if (!options.skipChecklistRules) {
            emit(createProgressEvent('phase_start', 'Starting checklist analysis...', 40, {
                phase: 'checklist',
            }));

            console.log('[Analysis] Running checklist rules (deterministic)...');

            // Create progress callback for checklist rules
            const checklistProgress: OnProgressCallback = (event) => {
                // Map checklist progress (0-100) to overall progress (40-85)
                const { start, end } = PROGRESS_RANGES.soft_rules;
                const mappedProgress = start + (event.progress / 100) * (end - start);
                emit({ ...event, progress: mappedProgress });
            };

            const checklistResult = await runChecklistRules(input, {
                onProgress: checklistProgress,
            });
            allChecks.push(...checklistResult.checks);
            console.log('[Analysis] Checklist rules complete. Found', checklistResult.checks.length, 'checks');

            emit(createProgressEvent('phase_complete', 'Checklist analysis complete', 85, {
                phase: 'checklist',
                data: { checksFound: checklistResult.checks.length },
            }));

            // Mark checklist rules done
            await supabase
                .from('analysis_jobs')
                .update({ soft_rules_completed: true })
                .eq('submission_id', submissionId);
        } else {
            console.log('[Analysis] Skipping checklist rules');
            emit(createProgressEvent('phase_complete', 'Skipped checklist analysis', 85, {
                phase: 'checklist',
            }));
        }

        // === Phase 2.5: Historical Rejection Pattern Matching (instant) ===
        const patternChecks = matchRejectionPatterns(hardInput);
        allChecks.push(...patternChecks);
        if (patternChecks.length > 0) {
            console.log('[Analysis] Pattern matching found', patternChecks.length, 'advisory warnings');
        }

        // === Phase 2.75: Screenshot AI Analysis (70-84%) ===
        let screenshotEvidence: ScreenshotEvidence | undefined;

        if (input.screenshots_data?.length && options.anthropicApiKey) {
            emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.SCREENSHOTS_AI], 70, {
                check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                phase: 'soft_rules',
            }));

            try {
                const Anthropic = (await import('@anthropic-ai/sdk')).default;
                const anthropic = new Anthropic({ apiKey: options.anthropicApiKey });

                const screenshotResult = await analyzeScreenshots(anthropic, input.screenshots_data, {
                    app_name: input.app_name,
                    category: input.category,
                    age_rating: input.age_rating,
                    sign_in_required: input.sign_in_required,
                    has_iap: input.has_iap,
                    has_subscriptions: input.has_subscriptions,
                    has_third_party_login: input.has_third_party_login,
                });

                allChecks.push(...screenshotResult.checks);
                screenshotEvidence = screenshotResult.evidence;

                console.log('[Analysis] Screenshot AI found', screenshotResult.checks.length, 'issues');

                emit(createProgressEvent('check_complete', `Screenshot AI: ${screenshotResult.checks.length} findings`, 84, {
                    check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                    phase: 'soft_rules',
                    data: { evidence: screenshotEvidence },
                }));
            } catch (screenshotError) {
                console.error('[Analysis] Screenshot AI failed (continuing without):', screenshotError);
                emit(createProgressEvent('check_complete', 'Screenshot AI: skipped (error)', 84, {
                    check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                    phase: 'soft_rules',
                }));
            }
        }

        // Cross-reference: resolve conditional warnings using screenshot evidence
        if (screenshotEvidence) {
            const resolved = resolveConditionalWarnings(allChecks, screenshotEvidence);
            if (resolved > 0) {
                console.log('[Analysis] Cross-reference resolved', resolved, 'conditional warnings');
            }
        }

        // === Phase 3: Generate Report (85-100%) ===
        emit(createProgressEvent('phase_start', 'Generating report...', 85, {
            phase: 'report_generation',
        }));

        console.log('[Analysis] Generating report with', allChecks.length, 'total checks...');

        emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.SCORING], 87, {
            check: PROGRESS_CHECKS.SCORING,
            phase: 'report_generation',
        }));

        const reportResult = await generateReport(supabase, submissionId, allChecks);
        console.log('[Analysis] Report generation result:', reportResult);

        emit(createProgressEvent('check_complete', 'Report saved', 95, {
            check: PROGRESS_CHECKS.SAVING,
            phase: 'report_generation',
        }));

        if (reportResult.success) {
            // Mark job complete
            await supabase
                .from('analysis_jobs')
                .update({
                    status: 'completed',
                    report_generated: true,
                    completed_at: new Date().toISOString(),
                })
                .eq('submission_id', submissionId);

            // Update submission status to complete
            await supabase
                .from('submissions')
                .update({
                    status: 'complete',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', submissionId);

            emit(createProgressEvent('complete', 'Analysis complete!', 100, {
                phase: 'report_generation',
                data: { reportId: reportResult.reportId },
            }));
        }

        return reportResult;
    } catch (error) {
        console.error('[Analysis] Error caught:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Analysis] Error message:', message);

        emit(createProgressEvent('error', `Analysis failed: ${message}`, -1, {
            data: { error: message },
        }));

        // Mark job failed
        await supabase
            .from('analysis_jobs')
            .update({
                status: 'failed',
                error_message: message,
            })
            .eq('submission_id', submissionId);

        // Still try to generate a partial report from whatever we have
        if (allChecks.length > 0) {
            const partialReport = await generateReport(supabase, submissionId, allChecks);
            return { ...partialReport, error: `Analysis partially failed: ${message}` };
        }

        return { reportId: '', success: false, error: message };
    }
}

/**
 * Fetches file contents from Supabase Storage for analysis.
 * Called before runAnalysis to prepare the SoftRulesInput.
 */
export async function fetchSubmissionFiles(
    supabase: SupabaseClient<Database>,
    submission: Database['public']['Tables']['submissions']['Row']
): Promise<{
    manifestContent?: string;
    plistContent?: string;
    screenshotsData?: SoftRulesInput['screenshots_data'];
    privacyPolicyText?: string;
    ipaBuffer?: ArrayBuffer;
}> {
    const result: {
        manifestContent?: string;
        plistContent?: string;
        screenshotsData?: SoftRulesInput['screenshots_data'];
        privacyPolicyText?: string;
        ipaBuffer?: ArrayBuffer;
    } = {};

    // Fetch manifest content
    if (submission.manifest_path) {
        const { data, error } = await supabase.storage
            .from('manifests')
            .download(submission.manifest_path);

        if (data) {
            result.manifestContent = await data.text();
        } else if (error) {
            console.warn(`[Storage] Failed to download manifest (${submission.manifest_path}):`, error.message);
        }
    }

    // Fetch plist content
    if (submission.plist_path) {
        const { data, error } = await supabase.storage
            .from('plists')
            .download(submission.plist_path);

        if (data) {
            result.plistContent = await data.text();
        } else if (error) {
            console.warn(`[Storage] Failed to download plist (${submission.plist_path}):`, error.message);
        }
    }

    // Fetch screenshots (for vision analysis)
    if (submission.screenshot_paths && submission.screenshot_paths.length > 0) {
        const screenshots: SoftRulesInput['screenshots_data'] = [];

        for (const path of submission.screenshot_paths) {
            const { data, error } = await supabase.storage
                .from('screenshots')
                .download(path);

            if (data) {
                const buffer = await data.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                const mime_type = path.endsWith('.png') ? 'image/png' : 'image/jpeg';

                screenshots.push({
                    path,
                    base64,
                    mime_type,
                    size_bytes: buffer.byteLength,
                });
            } else if (error) {
                console.warn(`[Storage] Failed to download screenshot (${path}):`, error.message);
            }
        }

        result.screenshotsData = screenshots;
    }

    // Fetch privacy policy text (if URL provided)
    if (submission.privacy_url) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(submission.privacy_url, {
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
                const html = await response.text();
                // Strip HTML tags for text analysis
                result.privacyPolicyText = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 15000); // Limit size
            }
        } catch (fetchError) {
            console.warn(`[Storage] Privacy policy fetch failed (${submission.privacy_url}):`, fetchError instanceof Error ? fetchError.message : fetchError);
        }
    }

    // Fetch IPA binary (if uploaded)
    if (submission.ipa_path) {
        const { data, error } = await supabase.storage
            .from('ipas')
            .download(submission.ipa_path);

        if (data) {
            result.ipaBuffer = await data.arrayBuffer();
            console.log(`[Storage] IPA downloaded: ${(result.ipaBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB`);
        } else if (error) {
            console.warn(`[Storage] Failed to download IPA (${submission.ipa_path}):`, error.message);
        }
    }

    return result;
}

/**
 * Cross-reference conditional warnings against screenshot evidence.
 * If the AI saw a required UI element in a screenshot, downgrade the
 * corresponding conditional warning from 'warning' to 'pass'.
 *
 * Returns the number of warnings resolved.
 */
function resolveConditionalWarnings(checks: CheckResult[], evidence: ScreenshotEvidence): number {
    let resolved = 0;

    // Map evidence fields to the warning titles they resolve
    const resolutions: Array<{
        evidenceKey: keyof Omit<ScreenshotEvidence, 'evidence_locations'>;
        titleIncludes: string;
    }> = [
        { evidenceKey: 'account_deletion_seen', titleIncludes: 'account deletion' },
        { evidenceKey: 'restore_purchases_seen', titleIncludes: 'restore purchases' },
        { evidenceKey: 'subscription_terms_seen', titleIncludes: 'subscription' },
        { evidenceKey: 'sign_in_with_apple_seen', titleIncludes: 'sign in with apple' },
    ];

    for (const resolution of resolutions) {
        if (evidence[resolution.evidenceKey] !== true) continue;

        for (let i = 0; i < checks.length; i++) {
            const check = checks[i];
            if (
                check.severity === 'warning' &&
                check.title.toLowerCase().includes(resolution.titleIncludes)
            ) {
                checks[i] = {
                    ...check,
                    severity: 'pass',
                    description:
                        check.description +
                        ' [Resolved: AI confirmed this element is visible in screenshots.]',
                };
                resolved++;
            }
        }
    }

    return resolved;
}

async function updateJobStatus(
    supabase: SupabaseClient<Database>,
    submissionId: string,
    status: 'running' | 'completed' | 'failed'
) {
    await supabase
        .from('analysis_jobs')
        .update({
            status,
            ...(status === 'running' ? { started_at: new Date().toISOString() } : {}),
        })
        .eq('submission_id', submissionId);

    // Also update submission status
    if (status === 'running') {
        await supabase
            .from('submissions')
            .update({ status: 'analyzing' })
            .eq('id', submissionId);
    }
}
