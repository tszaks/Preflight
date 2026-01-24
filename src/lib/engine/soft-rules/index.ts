import Anthropic from '@anthropic-ai/sdk';
import type { CheckResult, SoftRulesInput } from '../types';
import {
    SYSTEM_PROMPT,
    DESCRIPTION_ANALYSIS_PROMPT,
    SCREENSHOT_ANALYSIS_PROMPT,
    CONTENT_POLICY_PROMPT,
    METADATA_QUALITY_PROMPT,
    PRIVACY_POLICY_REVIEW_PROMPT,
    fillPrompt,
} from './prompts';

export interface SoftRulesResult {
    checks: CheckResult[];
    completed: boolean;
}

/**
 * Runs all soft (AI-powered) rules against the submission.
 * Uses Claude API for nuanced analysis.
 */
export async function runSoftRules(
    input: SoftRulesInput,
    apiKey: string
): Promise<SoftRulesResult> {
    const client = new Anthropic({ apiKey });
    const checks: CheckResult[] = [];

    // Run checks in parallel for speed
    const tasks: Promise<CheckResult[]>[] = [];

    // Always run description analysis if description exists
    if (input.description) {
        tasks.push(analyzeDescription(client, input));
    }

    // Always run content policy check
    if (input.description) {
        tasks.push(analyzeContentPolicy(client, input));
    }

    // Run screenshot analysis for full reviews (uses Vision)
    if (input.review_type === 'full' && input.screenshots_data && input.screenshots_data.length > 0) {
        tasks.push(analyzeScreenshots(client, input));
    }

    // Run privacy policy cross-check for full reviews
    if (input.review_type === 'full' && input.privacy_policy_text && input.manifest_content) {
        tasks.push(analyzePrivacyPolicy(client, input));
    }

    // Run metadata quality suggestions (always, but info-level only)
    if (input.description || input.keywords) {
        tasks.push(analyzeMetadataQuality(client, input));
    }

    // Wait for all tasks
    const results = await Promise.allSettled(tasks);

    for (const result of results) {
        if (result.status === 'fulfilled') {
            checks.push(...result.value);
        } else {
            // Log error but don't fail the whole analysis
            console.error('Soft rule check failed:', result.reason);
            checks.push({
                category: 'metadata',
                severity: 'info',
                title: 'Analysis partially incomplete',
                description: 'One or more AI-powered checks could not complete. The remaining results are still valid.',
            });
        }
    }

    return {
        checks,
        completed: true,
    };
}

async function callClaude(
    client: Anthropic,
    prompt: string,
    images?: Array<{ base64: string; mime_type: string }>
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
        system: SYSTEM_PROMPT,
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
        }));
    } catch {
        console.error('Failed to parse Claude response:', text.slice(0, 200));
        return [];
    }
}

async function analyzeDescription(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    const prompt = fillPrompt(DESCRIPTION_ANALYSIS_PROMPT, {
        app_name: input.app_name,
        category: input.category || '',
        description: input.description || '',
    });

    const results = await callClaude(client, prompt);
    return results.map(r => ({ ...r, category: 'description' as const }));
}

async function analyzeScreenshots(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    if (!input.screenshots_data) return [];

    const allResults: CheckResult[] = [];

    // Analyze screenshots in batches of 3 to avoid token limits
    const batchSize = 3;
    for (let i = 0; i < input.screenshots_data.length; i += batchSize) {
        const batch = input.screenshots_data.slice(i, i + batchSize);

        const prompt = fillPrompt(SCREENSHOT_ANALYSIS_PROMPT, {
            app_name: input.app_name,
            category: input.category || '',
            index: `${i + 1}-${i + batch.length}`,
            total: String(input.screenshots_data.length),
        });

        const images = batch.map(s => ({
            base64: s.base64,
            mime_type: s.mime_type,
        }));

        const results = await callClaude(client, prompt, images);
        allResults.push(...results.map(r => ({ ...r, category: 'screenshots' as const })));
    }

    return allResults;
}

async function analyzePrivacyPolicy(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    // Create a summary of manifest declarations for the prompt
    const manifestSummary = summarizeManifest(input.manifest_content || '');

    const prompt = fillPrompt(PRIVACY_POLICY_REVIEW_PROMPT, {
        app_name: input.app_name,
        privacy_policy_text: (input.privacy_policy_text || '').slice(0, 8000), // Limit size
        manifest_summary: manifestSummary,
    });

    const results = await callClaude(client, prompt);
    return results.map(r => ({ ...r, category: 'privacy_manifest' as const }));
}

async function analyzeContentPolicy(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    const prompt = fillPrompt(CONTENT_POLICY_PROMPT, {
        app_name: input.app_name,
        category: input.category || '',
        age_rating: input.age_rating || 'Not specified',
        description: (input.description || '').slice(0, 4000),
    });

    const results = await callClaude(client, prompt);
    return results.map(r => ({ ...r, category: 'content_policy' as const }));
}

async function analyzeMetadataQuality(client: Anthropic, input: SoftRulesInput): Promise<CheckResult[]> {
    const prompt = fillPrompt(METADATA_QUALITY_PROMPT, {
        app_name: input.app_name,
        subtitle: input.subtitle || '',
        category: input.category || '',
        keywords: input.keywords || '',
        description_preview: (input.description || '').slice(0, 500),
    });

    const results = await callClaude(client, prompt);
    // Force all metadata quality results to info severity
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
