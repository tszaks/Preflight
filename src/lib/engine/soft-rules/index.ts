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

    let currentProgress = 0;

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
            currentProgress = progressEnd;
            return result;
        } catch (error) {
            console.error(`Soft rule check failed (${checkName}):`, error);
            emit(createProgressEvent('check_complete', `${checkName} failed (continuing)`, progressEnd, {
                check: checkName,
                phase: 'soft_rules',
                data: { error: error instanceof Error ? error.message : 'Unknown error' },
            }));
            currentProgress = progressEnd;
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
            }

            emit(createProgressEvent('check_complete', `Screenshots ${startIdx + 1}-${endIdx} analyzed`, batchProgress, {
                check: PROGRESS_CHECKS.SCREENSHOTS_AI,
                phase: 'soft_rules',
                data: { screenshotIndex: endIdx, totalScreenshots },
            }));
        }

        checks.push(...allScreenshotResults);
        currentProgress = 65;
    } else {
        currentProgress = 65;
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
    } else {
        currentProgress = 80;
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
    } else {
        currentProgress = 90;
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

async function callClaude(
    client: Anthropic,
    prompt: string,
    images?: Array<{ base64: string; mime_type: string }>,
    systemPromptOverride?: string
): Promise<CheckResult[]> {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // Add images if present (Vision)
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

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPromptOverride || getSystemPrompt(),
        messages: [{ role: 'user', content }],
    });

    // Extract text response
    const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

    // Parse JSON from response
    try {
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
            category: 'metadata' as const, // Will be overridden by caller
            severity: (['critical', 'warning', 'info', 'pass'].includes(item.severity)
                ? item.severity
                : 'info') as CheckResult['severity'],
            title: item.title,
            description: item.description,
            guideline_ref: item.guideline_ref,
            fix_suggestion: item.fix_suggestion,
            confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(100, item.confidence)) : undefined,
        }));
    } catch {
        console.error('Failed to parse Claude response:', text.slice(0, 200));
        return [];
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

async function analyzeScreenshots(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    if (!input.screenshots_data) return [];

    const allResults: CheckResult[] = [];

    // Prepare description preview for metadata cross-reference
    const descriptionPreview = (input.description || '').slice(0, 500);

    // Analyze screenshots in batches of 3 to avoid token limits
    const batchSize = 3;
    for (let i = 0; i < input.screenshots_data.length; i += batchSize) {
        const batch = input.screenshots_data.slice(i, i + batchSize);

        // Enhanced prompt with full app metadata for cross-referencing
        const prompt = fillPrompt(SCREENSHOT_ANALYSIS_PROMPT, {
            app_name: input.app_name,
            category: input.category || 'Not specified',
            age_rating: input.age_rating || '4+',
            description_preview: descriptionPreview || 'No description provided',
            index: `${i + 1}-${i + batch.length}`,
            total: String(input.screenshots_data.length),
            current_date: new Date().toISOString().split('T')[0],
        });

        const images = batch.map(s => ({
            base64: s.base64,
            mime_type: s.mime_type,
        }));

        // Use a higher token limit for comprehensive screenshot analysis
        const results = await callClaudeForScreenshots(client, prompt, images);
        allResults.push(...results.map(r => ({ ...r, category: 'screenshots' as const })));
    }

    return allResults;
}

/**
 * Analyze a specific batch of screenshots (for progress tracking).
 * This is called by runSoftRules when streaming progress.
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
 * Specialized Claude call for screenshot analysis with higher token limits
 * to accommodate the comprehensive analysis prompt.
 */
async function callClaudeForScreenshots(
    client: Anthropic,
    prompt: string,
    images: Array<{ base64: string; mime_type: string }>,
    systemPromptOverride?: string
): Promise<CheckResult[]> {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    // Add images (Vision)
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

    content.push({ type: 'text', text: prompt });

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096, // Higher limit for comprehensive screenshot analysis
        system: systemPromptOverride || getSystemPrompt(),
        messages: [{ role: 'user', content }],
    });

    // Extract text response
    const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

    // Parse JSON from response
    try {
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
            category: 'screenshots' as const,
            severity: (['critical', 'warning', 'info', 'pass'].includes(item.severity)
                ? item.severity
                : 'info') as CheckResult['severity'],
            title: item.title,
            description: item.description,
            guideline_ref: item.guideline_ref,
            fix_suggestion: item.fix_suggestion,
            confidence: typeof item.confidence === 'number' ? Math.max(0, Math.min(100, item.confidence)) : undefined,
        }));
    } catch {
        console.error('Failed to parse Claude screenshot analysis response:', text.slice(0, 200));
        return [];
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

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return findings; // Fallback to unverified

        const verified = JSON.parse(jsonMatch[0]) as Array<{
            severity: string;
            title: string;
            description: string;
            guideline_ref?: string;
            fix_suggestion?: string;
            confidence?: number;
            verification_note?: string;
        }>;

        const verifiedResults: CheckResult[] = verified
            .filter(v => v.severity !== 'pass') // Remove items the judge demoted to pass
            .map(v => ({
                category: actionable[0]?.category || 'metadata' as const,
                severity: (['critical', 'warning', 'info', 'pass'].includes(v.severity)
                    ? v.severity
                    : 'info') as CheckResult['severity'],
                title: v.title,
                description: v.description,
                guideline_ref: v.guideline_ref,
                fix_suggestion: v.fix_suggestion,
                confidence: typeof v.confidence === 'number' ? Math.max(0, Math.min(100, v.confidence)) : undefined,
            }));

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

    // Extract text response
    const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

    // Parse JSON from response (handle potential markdown code blocks)
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
