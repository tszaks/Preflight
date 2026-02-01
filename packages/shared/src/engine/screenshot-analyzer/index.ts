/**
 * Screenshot AI Analysis Orchestrator
 *
 * Sends uploaded App Store screenshots to Claude Vision API to detect:
 * - Placeholder content (lorem ipsum, test data)
 * - UI quality issues (broken layouts, loading spinners)
 * - Required UI elements (Restore Purchases, account deletion, etc.)
 * - Content rating mismatches
 * - Text readability problems
 *
 * Screenshots are batched in groups of 5 for cost efficiency.
 * Results produce CheckResult items with 'screenshots' category.
 * All findings are capped at 'warning' severity (AI never produces 'critical').
 *
 * Graceful degradation: if AI fails, returns empty results and the report
 * still generates perfectly from deterministic checks.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CheckResult, ScreenshotData, ScreenshotEvidence } from '../types';
import { buildSystemPrompt, buildUserMessage, type ScreenshotAnalysisContext } from './prompt';
import { parseScreenshotAIResponse, mergeEvidence, emptyEvidence } from './parser';

export interface ScreenshotAnalysisResult {
    checks: CheckResult[];
    evidence: ScreenshotEvidence;
}

const BATCH_SIZE = 5;
const API_TIMEOUT_MS = 60_000;

/**
 * Analyze App Store screenshots using Claude Vision.
 *
 * @param client - Anthropic SDK client (pre-configured with API key)
 * @param screenshots - Screenshots with base64 data
 * @param context - App metadata for contextual analysis
 * @returns Checks found + evidence of required UI elements
 */
export async function analyzeScreenshots(
    client: Anthropic,
    screenshots: ScreenshotData[],
    context: ScreenshotAnalysisContext,
): Promise<ScreenshotAnalysisResult> {
    // Guard: no screenshots
    if (!screenshots || screenshots.length === 0) {
        return { checks: [], evidence: emptyEvidence() };
    }

    const allChecks: CheckResult[] = [];
    let evidence = emptyEvidence();

    const batches = batchScreenshots(screenshots);
    const systemPrompt = buildSystemPrompt(context);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];
        const startIndex = batchIdx * BATCH_SIZE;
        const endIndex = startIndex + batch.length - 1;

        try {
            console.log(
                `[ScreenshotAI] Analyzing batch ${batchIdx + 1}/${batches.length} ` +
                `(screenshots ${startIndex + 1}-${endIndex + 1} of ${screenshots.length})`
            );

            const batchResult = await analyzeScreenshotBatch(
                client,
                batch,
                systemPrompt,
                startIndex,
                endIndex,
                screenshots.length,
            );

            allChecks.push(...batchResult.checks);
            evidence = mergeEvidence(evidence, batchResult.evidence);

            console.log(
                `[ScreenshotAI] Batch ${batchIdx + 1} complete: ${batchResult.checks.length} findings`
            );
        } catch (batchError) {
            // Log but continue with remaining batches
            console.error(
                `[ScreenshotAI] Batch ${batchIdx + 1} failed:`,
                batchError instanceof Error ? batchError.message : batchError,
            );
        }
    }

    return { checks: allChecks, evidence };
}

async function analyzeScreenshotBatch(
    client: Anthropic,
    batch: ScreenshotData[],
    systemPrompt: string,
    startIndex: number,
    endIndex: number,
    totalScreenshots: number,
): Promise<{ checks: CheckResult[]; evidence: Partial<ScreenshotEvidence> }> {
    // Build multi-modal message content
    const content: Anthropic.Messages.ContentBlockParam[] = [
        {
            type: 'text',
            text: buildUserMessage(batch.length, startIndex, endIndex, totalScreenshots),
        },
    ];

    // Add each screenshot as an image block
    for (const screenshot of batch) {
        content.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: screenshot.mime_type,
                data: screenshot.base64,
            },
        });
    }

    // Call Claude Vision with timeout
    const response = await Promise.race([
        client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content }],
        }),
        timeout(API_TIMEOUT_MS),
    ]);

    if (!response || !('content' in response)) {
        throw new Error('Screenshot AI request timed out');
    }

    // Extract text from response
    const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');

    return parseScreenshotAIResponse(text, startIndex);
}

function batchScreenshots(screenshots: ScreenshotData[]): ScreenshotData[][] {
    const batches: ScreenshotData[][] = [];
    for (let i = 0; i < screenshots.length; i += BATCH_SIZE) {
        batches.push(screenshots.slice(i, i + BATCH_SIZE));
    }
    return batches;
}

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    );
}
