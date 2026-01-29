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
import { runSoftRules } from './soft-rules';
import { generateReport } from './report/generator';

export type { CheckResult, EngineResult, HardRulesInput, SoftRulesInput };
export type { OnProgressCallback, ProgressEvent };

/**
 * Main analysis engine orchestrator.
 *
 * Pipeline:
 * 1. Run hard rules (deterministic, instant)
 * 2. Run soft rules (Claude API, async) - only for paid submissions
 * 3. Generate report (scoring + DB save)
 *
 * This function is called by the analysis worker/edge function.
 */
export async function runAnalysis(
    supabase: SupabaseClient<Database>,
    submissionId: string,
    input: SoftRulesInput,
    options: {
        anthropicApiKey: string;
        skipSoftRules?: boolean;
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
            // Form-field based checks (for conditional warnings)
            sign_in_required: input.sign_in_required,
            has_iap: input.has_iap,
            has_subscriptions: input.has_subscriptions,
            has_third_party_login: input.has_third_party_login,
            // Privacy data collection (for mismatch detection)
            data_collection: input.data_collection,
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

        // === Phase 2: Soft Rules (40-85%) ===
        if (!options.skipSoftRules) {
            emit(createProgressEvent('phase_start', 'Starting PreFlight analysis...', 40, {
                phase: 'soft_rules',
            }));

            console.log('[Analysis] Running soft rules (Claude API)...');
            if (!options.anthropicApiKey) {
                console.error('[Analysis] ANTHROPIC_API_KEY is missing!');
                throw new Error('ANTHROPIC_API_KEY is not configured');
            }

            // Create progress callback for soft rules
            const softRulesProgress: OnProgressCallback = (event) => {
                // Map soft rules progress (0-100) to overall progress (40-85)
                const { start, end } = PROGRESS_RANGES.soft_rules;
                const mappedProgress = start + (event.progress / 100) * (end - start);
                emit({ ...event, progress: mappedProgress });
            };

            const softResult = await runSoftRules(input, options.anthropicApiKey, {
                onProgress: softRulesProgress,
            });
            allChecks.push(...softResult.checks);
            console.log('[Analysis] Soft rules complete. Found', softResult.checks.length, 'checks');

            emit(createProgressEvent('phase_complete', 'PreFlight analysis complete', 85, {
                phase: 'soft_rules',
                data: { checksFound: softResult.checks.length },
            }));

            // Mark soft rules done
            await supabase
                .from('analysis_jobs')
                .update({ soft_rules_completed: true })
                .eq('submission_id', submissionId);
        } else {
            console.log('[Analysis] Skipping soft rules');
            emit(createProgressEvent('phase_complete', 'Skipped PreFlight analysis', 85, {
                phase: 'soft_rules',
            }));
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
}> {
    const result: {
        manifestContent?: string;
        plistContent?: string;
        screenshotsData?: SoftRulesInput['screenshots_data'];
        privacyPolicyText?: string;
    } = {};

    // Fetch manifest content
    if (submission.manifest_path) {
        const { data } = await supabase.storage
            .from('manifests')
            .download(submission.manifest_path);

        if (data) {
            result.manifestContent = await data.text();
        }
    }

    // Fetch plist content
    if (submission.plist_path) {
        const { data } = await supabase.storage
            .from('plists')
            .download(submission.plist_path);

        if (data) {
            result.plistContent = await data.text();
        }
    }

    // Fetch screenshots (for vision analysis)
    if (submission.screenshot_paths && submission.screenshot_paths.length > 0) {
        const screenshots: SoftRulesInput['screenshots_data'] = [];

        for (const path of submission.screenshot_paths) {
            const { data } = await supabase.storage
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
        } catch {
            // Privacy policy fetch failed - URL check will catch this
        }
    }

    return result;
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
