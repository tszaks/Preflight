import Anthropic from '@anthropic-ai/sdk';
import type { CheckResult, SoftRulesInput, ASOAnalysisResult } from '../types';
import type { OnProgressCallback } from '$lib/types/progress';
import {
    createProgressEvent,
    PROGRESS_CHECKS,
    PROGRESS_MESSAGES,
} from '$lib/types/progress';
import {
    SYSTEM_PROMPT,
    DESCRIPTION_ANALYSIS_PROMPT,
    SCREENSHOT_ANALYSIS_PROMPT,
    CONTENT_POLICY_PROMPT,
    METADATA_QUALITY_PROMPT,
    PRIVACY_POLICY_REVIEW_PROMPT,
    ASO_ANALYSIS_PROMPT,
    VERIFICATION_PROMPT,
    fillPrompt,
} from './prompts';
import { getCategoryContext, formatCategoryContext } from '../knowledge-base/categories/index';
import { getRelevantSections, type CheckTopic } from '../knowledge-base/guidelines-lookup';
import { getGuidelinesText } from '../knowledge-base/guidelines-text';

export interface SoftRulesResult {
    checks: CheckResult[];
    completed: boolean;
    aso_analysis?: ASOAnalysisResult;
}

interface SoftRulesOptions {
    onProgress?: OnProgressCallback;
    /** Pre-formatted calibration context string from historical false-positive rates */
    calibrationContext?: string;
}

/**
 * Runs all soft (AI-powered) rules against the submission.
 * Uses Claude API for nuanced analysis.
 *
 * Progress breakdown (0-100% within soft rules phase):
 * - Description: 0-15%
 * - Content Policy: 15-30%
 * - Screenshots AI: 30-65% (variable based on count)
 * - Privacy Policy: 65-80%
 * - Metadata Quality: 80-90%
 * - ASO Analysis: 90-100%
 */
export async function runSoftRules(
    input: SoftRulesInput,
    apiKey: string,
    options?: SoftRulesOptions
): Promise<SoftRulesResult> {
    const client = new Anthropic({ apiKey });
    const checks: CheckResult[] = [];
    const emit = options?.onProgress || (() => {});
    const calibrationCtx = options?.calibrationContext;

    // Helper to run a check with progress tracking
    async function runCheckWithProgress<T>(
        checkName: string,
        progressStart: number,
        progressEnd: number,
        fn: () => Promise<T>
    ): Promise<T | null> {
        emit(createProgressEvent('check_start', PROGRESS_MESSAGES[checkName] || `Running ${checkName}...`, progressStart, {
            check: checkName,
            phase: 'soft_rules',
        }));

        try {
            const result = await fn();
            emit(createProgressEvent('check_complete', `${checkName} complete`, progressEnd, {
                check: checkName,
                phase: 'soft_rules',
            }));
            return result;
        } catch (error) {
            console.error(`Soft rule check failed (${checkName}):`, error);
            emit(createProgressEvent('check_complete', `${checkName} failed (continuing)`, progressEnd, {
                check: checkName,
                phase: 'soft_rules',
                data: { error: error instanceof Error ? error.message : 'Unknown error' },
            }));
            return null;
        }
    }

    // Run checks sequentially to provide meaningful progress feedback
    // (Parallel execution makes progress harder to track accurately)

    // 1. Description Analysis (0-15%)
    if (input.description) {
        const result = await runCheckWithProgress(
            PROGRESS_CHECKS.DESCRIPTION,
            0,
            15,
            () => analyzeDescription(client, input, calibrationCtx)
        );
        if (result) checks.push(...result);
    }

    // 2. Content Policy (15-30%)
    if (input.description) {
        const result = await runCheckWithProgress(
            PROGRESS_CHECKS.CONTENT_POLICY,
            15,
            30,
            () => analyzeContentPolicy(client, input, calibrationCtx)
        );
        if (result) checks.push(...result);
    }

    // 3. Screenshot AI Analysis (30-65%) - Most time-consuming
    if (input.review_type === 'full' && input.screenshots_data && input.screenshots_data.length > 0) {
        const totalScreenshots = input.screenshots_data.length;
        const batchSize = 3;
        const totalBatches = Math.ceil(totalScreenshots / batchSize);
        const progressPerBatch = 35 / totalBatches; // 35% total (30-65)

        emit(createProgressEvent('check_start', `AI reviewing ${totalScreenshots} screenshots...`, 30, {
            check: PROGRESS_CHECKS.SCREENSHOTS_AI,
            phase: 'soft_rules',
            data: { totalScreenshots },
        }));

        const allScreenshotResults: CheckResult[] = [];

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIdx = batchIndex * batchSize;
            const endIdx = Math.min(startIdx + batchSize, totalScreenshots);
            const batchProgress = 30 + (batchIndex + 1) * progressPerBatch;

            emit(createProgressEvent('check_start', `Analyzing screenshots ${startIdx + 1}-${endIdx} of ${totalScreenshots}...`, 30 + batchIndex * progressPerBatch, {
                check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                phase: 'soft_rules',
                data: { screenshotIndex: startIdx + 1, totalScreenshots },
            }));

            try {
                const batchResults = await analyzeScreenshotBatch(client, input, startIdx, endIdx, calibrationCtx);
                allScreenshotResults.push(...batchResults);
            } catch (error) {
                console.error(`Screenshot batch ${batchIndex + 1} failed:`, error);
                emit(createProgressEvent('check_complete', `Screenshot batch ${batchIndex + 1} failed`, batchProgress, {
                    check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                    phase: 'soft_rules',
                    data: { error: error instanceof Error ? error.message : 'Unknown error' },
                }));
                allScreenshotResults.push({
                    category: 'screenshots',
                    severity: 'info',
                    title: `Screenshots ${startIdx + 1}-${endIdx} could not be analyzed`,
                    description: `AI analysis failed for this batch of screenshots. The error has been logged. Other screenshots were still analyzed.`,
                    confidence: 0,
                });
            }

            emit(createProgressEvent('check_complete', `Screenshots ${startIdx + 1}-${endIdx} analyzed`, batchProgress, {
                check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                phase: 'soft_rules',
                data: { screenshotIndex: endIdx, totalScreenshots },
            }));
        }

        checks.push(...allScreenshotResults);
    } else {
        // Emit progress event so UI doesn't appear frozen between 30% and 65%
        emit(createProgressEvent('check_complete', 'Screenshot analysis skipped', 65, {
            check: PROGRESS_CHECKS.SCREENSHOTS_AI,
            phase: 'soft_rules',
        }));
    }

    // 4. Privacy Policy Cross-check (65-80%)
    if (input.review_type === 'full' && input.privacy_policy_text && input.manifest_content) {
        const result = await runCheckWithProgress(
            PROGRESS_CHECKS.PRIVACY_POLICY,
            65,
            80,
            () => analyzePrivacyPolicy(client, input, calibrationCtx)
        );
        if (result) checks.push(...result);
    }

    // 5. Metadata Quality (80-90%)
    if (input.description || input.keywords) {
        const result = await runCheckWithProgress(
            PROGRESS_CHECKS.METADATA_QUALITY,
            80,
            90,
            () => analyzeMetadataQuality(client, input, calibrationCtx)
        );
        if (result) checks.push(...result);
    }

    // 6. ASO Analysis (90-100%) - Structured data, not checks
    let aso_analysis: ASOAnalysisResult | undefined;
    if (input.description) {
        emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.ASO_ANALYSIS], 90, {
            check: PROGRESS_CHECKS.ASO_ANALYSIS,
            phase: 'soft_rules',
        }));

        try {
            aso_analysis = await runASOAnalysis(client, input);
            emit(createProgressEvent('check_complete', 'ASO analysis complete', 100, {
                check: PROGRESS_CHECKS.ASO_ANALYSIS,
                phase: 'soft_rules',
            }));
        } catch (error) {
            console.error('ASO analysis failed:', error);
            emit(createProgressEvent('check_complete', 'ASO analysis failed (continuing)', 100, {
                check: PROGRESS_CHECKS.ASO_ANALYSIS,
                phase: 'soft_rules',
                data: { error: error instanceof Error ? error.message : 'Unknown error' },
            }));
        }
    }

    return {
        checks,
        completed: true,
        aso_analysis,
    };
}

/** Returns the system prompt with current date + category/guidelines context */
function getSystemPrompt(category?: string | null, topics?: CheckTopic[], calibrationCtx?: string): string {
    const catContext = getCategoryContext(category);
    const categoryText = catContext ? formatCategoryContext(catContext) : '';

    const sections = topics ? topics.flatMap(t => getRelevantSections(t)) : [];
    const guidelinesText = sections.length > 0 ? getGuidelinesText([...new Set(sections)]) : '';

    return fillPrompt(SYSTEM_PROMPT, {
        current_date: new Date().toISOString().split('T')[0],
        category_context: categoryText,
        relevant_guidelines: guidelinesText,
        calibration_context: calibrationCtx || '',
    });
}

/** Build multimodal content array from optional images + text prompt */
function buildContent(
    prompt: string,
    images?: Array<{ base64: string; mime_type: string }>
): Anthropic.MessageCreateParams['messages'][0]['content'] {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    if (images) {
        for (const img of images) {
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: img.mime_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: img.base64,
                },
            });
        }
    }

    content.push({ type: 'text', text: prompt });
    return content;
}

/** Extract text from a Claude response */
function extractResponseText(response: Anthropic.Message): string {
    return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');
}

/** Parse a JSON array of check findings from raw Claude text */
function parseCheckFindings(text: string, defaultCategory: CheckResult['category'] = 'metadata'): CheckResult[] {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
        severity: string;
        title: string;
        description: string;
        guideline_ref?: string;
        fix_suggestion?: string;
        confidence?: number;
    }>;

    return parsed.map(item => ({
        category: defaultCategory,
        severity: (['critical', 'warning', 'info', 'pass'].includes(item.severity)
            ? item.severity
            : 'info') as CheckResult['severity'],
        title: item.title,
        description: item.description,
        guideline_ref: item.guideline_ref,
        fix_suggestion: item.fix_suggestion,
        confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(100, item.confidence)) : undefined,
    }));
}

async function callClaude(
    client: Anthropic,
    prompt: string,
    images?: Array<{ base64: string; mime_type: string }>,
    systemPromptOverride?: string
): Promise<CheckResult[]> {
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPromptOverride || getSystemPrompt(),
        messages: [{ role: 'user', content: buildContent(prompt, images) }],
    });

    try {
        return parseCheckFindings(extractResponseText(response));
    } catch (error) {
        console.error('Failed to parse Claude response:', error, extractResponseText(response).slice(0, 200));
        return [{
            category: 'metadata',
            severity: 'info',
            title: 'AI analysis incomplete',
            description: 'The AI analysis for this category could not be completed due to a processing error. Results may be partial.',
            confidence: 0,
        }];
    }
}

async function analyzeDescription(client: Anthropic, input: SoftRulesInput, calibrationCtx?: string): Promise<CheckResult[]> {
    const systemPrompt = getSystemPrompt(input.category, ['description'], calibrationCtx);

    const prompt = fillPrompt(DESCRIPTION_ANALYSIS_PROMPT, {
        app_name: input.app_name,
        category: input.category || '',
        description: input.description || '',
    });

    const results = await callClaude(client, prompt, undefined, systemPrompt);
    const categorized = results.map(r => ({ ...r, category: 'description' as const }));

    // Multi-pass verification
    return verifyFindings(client, categorized, `App description for "${input.app_name}": ${input.description}`, input.category);
}

/**
 * Analyze a specific batch of screenshots (for progress tracking).
 * Called by runSoftRules when streaming progress.
 */
async function analyzeScreenshotBatch(
    client: Anthropic,
    input: SoftRulesInput,
    startIdx: number,
    endIdx: number,
    calibrationCtx?: string
): Promise<CheckResult[]> {
    if (!input.screenshots_data) return [];

    const systemPrompt = getSystemPrompt(input.category, ['screenshots'], calibrationCtx);
    const batch = input.screenshots_data.slice(startIdx, endIdx);
    const descriptionPreview = (input.description || '').slice(0, 500);

    const prompt = fillPrompt(SCREENSHOT_ANALYSIS_PROMPT, {
        app_name: input.app_name,
        category: input.category || 'Not specified',
        age_rating: input.age_rating || '4+',
        description_preview: descriptionPreview || 'No description provided',
        index: `${startIdx + 1}-${endIdx}`,
        total: String(input.screenshots_data.length),
        current_date: new Date().toISOString().split('T')[0],
    });

    const images = batch.map(s => ({
        base64: s.base64,
        mime_type: s.mime_type,
    }));

    const results = await callClaudeForScreenshots(client, prompt, images, systemPrompt);
    const categorized = results.map(r => ({ ...r, category: 'screenshots' as const }));

    // Multi-pass verification (text-only — can't re-send images to judge)
    return verifyFindings(
        client,
        categorized,
        `Screenshots ${startIdx + 1}-${endIdx} of "${input.app_name}" (${input.category || 'uncategorized'}). Description: ${descriptionPreview}`,
        input.category
    );
}

/**
 * Specialized Claude call for screenshot analysis with higher token limits.
 * Uses shared buildContent/parseCheckFindings helpers.
 */
async function callClaudeForScreenshots(
    client: Anthropic,
    prompt: string,
    images: Array<{ base64: string; mime_type: string }>,
    systemPromptOverride?: string
): Promise<CheckResult[]> {
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPromptOverride || getSystemPrompt(),
        messages: [{ role: 'user', content: buildContent(prompt, images) }],
    });

    try {
        return parseCheckFindings(extractResponseText(response), 'screenshots');
    } catch (error) {
        console.error('Failed to parse Claude screenshot analysis response:', error, extractResponseText(response).slice(0, 200));
        return [{
            category: 'screenshots',
            severity: 'info',
            title: 'Screenshot AI analysis incomplete',
            description: 'The AI analysis for these screenshots could not be completed due to a processing error. Results may be partial.',
            confidence: 0,
        }];
    }
}

/**
 * Multi-pass verification: sends first-pass findings through a "judge" Claude call
 * to filter false positives and adjust severity/confidence.
 * Only verifies non-pass findings to save API cost.
 */
async function verifyFindings(
    client: Anthropic,
    findings: CheckResult[],
    sourceDescription: string,
    category?: string | null
): Promise<CheckResult[]> {
    // Skip verification if no actionable findings
    const actionable = findings.filter(f => f.severity !== 'pass');
    const passes = findings.filter(f => f.severity === 'pass');

    if (actionable.length === 0) return findings;

    try {
        const catContext = getCategoryContext(category);
        const categoryText = catContext ? formatCategoryContext(catContext) : '';

        const prompt = fillPrompt(VERIFICATION_PROMPT, {
            current_date: new Date().toISOString().split('T')[0],
            category_context: categoryText,
            source_data: sourceDescription.slice(0, 4000),
            findings_json: JSON.stringify(actionable.map(f => ({
                severity: f.severity,
                title: f.title,
                description: f.description,
                guideline_ref: f.guideline_ref,
                fix_suggestion: f.fix_suggestion,
                confidence: f.confidence,
            })), null, 2),
        });

        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: 'You are a senior App Store review judge. Return only valid JSON arrays.',
            messages: [{ role: 'user', content: prompt }],
        });

        const inferredCategory = actionable[0]?.category || 'metadata' as const;
        const verifiedResults = parseCheckFindings(extractResponseText(response), inferredCategory)
            .filter(v => v.severity !== 'pass'); // Remove items the judge demoted to pass

        if (verifiedResults.length === 0 && actionable.length > 0) {
            // parseCheckFindings returned nothing (no JSON match) -- fall back to unverified
            console.warn('[Verification] Judge returned no parseable JSON, using unverified findings');
            return findings;
        }

        // Return verified actionable findings + original pass findings
        return [...verifiedResults, ...passes];
    } catch (error) {
        console.error('[Verification] Judge pass failed, using unverified findings:', error);
        return findings; // Fallback to unverified on error
    }
}

async function analyzePrivacyPolicy(client: Anthropic, input: SoftRulesInput, calibrationCtx?: string): Promise<CheckResult[]> {
    const systemPrompt = getSystemPrompt(input.category, ['privacy', 'privacy_manifest'], calibrationCtx);

    // Create a summary of manifest declarations for the prompt
    const manifestSummary = summarizeManifest(input.manifest_content || '');

    const prompt = fillPrompt(PRIVACY_POLICY_REVIEW_PROMPT, {
        app_name: input.app_name,
        privacy_policy_text: (input.privacy_policy_text || '').slice(0, 8000), // Limit size
        manifest_summary: manifestSummary,
    });

    const results = await callClaude(client, prompt, undefined, systemPrompt);
    const categorized = results.map(r => ({ ...r, category: 'privacy_manifest' as const }));

    // Multi-pass verification
    return verifyFindings(
        client,
        categorized,
        `Privacy policy cross-check for "${input.app_name}". Manifest: ${manifestSummary}`,
        input.category
    );
}

async function analyzeContentPolicy(client: Anthropic, input: SoftRulesInput, calibrationCtx?: string): Promise<CheckResult[]> {
    const systemPrompt = getSystemPrompt(input.category, ['content_policy'], calibrationCtx);

    const prompt = fillPrompt(CONTENT_POLICY_PROMPT, {
        app_name: input.app_name,
        category: input.category || '',
        age_rating: input.age_rating || 'Not specified',
        description: (input.description || '').slice(0, 4000),
        sign_in_required: input.sign_in_required ? 'Yes' : 'No',
        has_iap: input.has_iap ? 'Yes' : 'No',
        has_subscriptions: input.has_subscriptions ? 'Yes' : 'No',
    });

    const results = await callClaude(client, prompt, undefined, systemPrompt);
    const categorized = results.map(r => ({ ...r, category: 'content_policy' as const }));

    // Multi-pass verification
    return verifyFindings(
        client,
        categorized,
        `Content policy for "${input.app_name}" (${input.category || 'uncategorized'}, age: ${input.age_rating || '4+'})`,
        input.category
    );
}

async function analyzeMetadataQuality(client: Anthropic, input: SoftRulesInput, calibrationCtx?: string): Promise<CheckResult[]> {
    const systemPrompt = getSystemPrompt(input.category, ['metadata'], calibrationCtx);

    const prompt = fillPrompt(METADATA_QUALITY_PROMPT, {
        app_name: input.app_name,
        subtitle: input.subtitle || '',
        category: input.category || '',
        keywords: input.keywords || '',
        description_preview: (input.description || '').slice(0, 500),
    });

    const results = await callClaude(client, prompt, undefined, systemPrompt);
    // Force all metadata quality results to info severity (no verification needed — these are suggestions)
    return results.map(r => ({
        ...r,
        category: 'metadata_quality' as const,
        severity: 'info' as const,
    }));
}

function summarizeManifest(content: string): string {
    const summary: string[] = [];

    if (content.includes('NSPrivacyTracking')) {
        const tracking = content.includes('<true/>') ? 'YES' : 'NO';
        summary.push(`Tracking declared: ${tracking}`);
    }

    if (content.includes('NSPrivacyTrackingDomains')) {
        summary.push('Tracking domains declared');
    }

    if (content.includes('NSPrivacyAccessedAPITypes')) {
        summary.push('Required-reason APIs declared');
    }

    if (content.includes('NSPrivacyCollectedDataTypes')) {
        summary.push('Collected data types declared');
    }

    return summary.length > 0 ? summary.join('\n') : 'No privacy declarations found in manifest';
}

/**
 * Runs ASO (App Store Optimization) analysis.
 * Returns structured recommendations for improving discoverability.
 */
async function runASOAnalysis(
    client: Anthropic,
    input: SoftRulesInput
): Promise<ASOAnalysisResult> {
    const prompt = fillPrompt(ASO_ANALYSIS_PROMPT, {
        app_name: input.app_name,
        subtitle: input.subtitle || '',
        category: input.category || '',
        keywords: input.keywords || '',
        description: input.description || '',
    });

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096, // Larger limit for full description rewrite
        system: 'You are an expert App Store Optimization (ASO) specialist. Return only valid JSON without any markdown formatting or code blocks.',
        messages: [{ role: 'user', content: prompt }],
    });

    const text = extractResponseText(response);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON object found in ASO analysis response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
        optimized_description?: string;
        suggested_keywords?: string[];
        character_optimization?: Array<{
            field: string;
            current: number;
            max: number;
            tip: string;
        }>;
        positioning_statement?: string;
    };

    // Validate and provide defaults for missing fields
    return {
        optimized_description: parsed.optimized_description || input.description || '',
        suggested_keywords: Array.isArray(parsed.suggested_keywords)
            ? parsed.suggested_keywords.slice(0, 20)
            : [],
        character_optimization: Array.isArray(parsed.character_optimization)
            ? parsed.character_optimization
            : [
                { field: 'app_name', current: input.app_name.length, max: 30, tip: 'No analysis available' },
                { field: 'subtitle', current: (input.subtitle || '').length, max: 30, tip: 'No analysis available' },
                { field: 'keywords', current: (input.keywords || '').length, max: 100, tip: 'No analysis available' },
                { field: 'description', current: (input.description || '').length, max: 4000, tip: 'No analysis available' },
            ],
        positioning_statement: parsed.positioning_statement || '',
    };
}
