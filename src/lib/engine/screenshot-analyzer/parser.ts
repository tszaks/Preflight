/**
 * Parses Claude Vision AI responses into CheckResult[] and ScreenshotEvidence.
 *
 * Handles:
 * - JSON extraction (strips markdown fences if present)
 * - Confidence capping (AI findings max 85, most land at 50-75)
 * - Severity capping (AI findings max 'warning', never 'critical')
 * - Evidence merging across batches (OR-merge boolean fields)
 */

import type { CheckResult, ScreenshotEvidence, CheckCategory, SeverityLevel } from '../types';
import type { AIResponse, AIFinding, AIEvidence } from './prompt';

/**
 * Parse a raw AI response text into structured checks and evidence.
 * @param rawText - The raw text from Claude's response
 * @param batchStartIndex - The starting screenshot index for this batch (for absolute indices)
 */
export function parseScreenshotAIResponse(
    rawText: string,
    batchStartIndex: number,
): { checks: CheckResult[]; evidence: Partial<ScreenshotEvidence> } {
    const parsed = extractJSON(rawText);
    if (!parsed) {
        console.warn('[ScreenshotAI] Failed to parse AI response as JSON');
        return { checks: [], evidence: {} };
    }

    const response = parsed as AIResponse;
    const checks: CheckResult[] = [];

    // Parse findings into CheckResult items
    if (Array.isArray(response.findings)) {
        for (const finding of response.findings) {
            const check = findingToCheckResult(finding, batchStartIndex);
            if (check) {
                checks.push(check);
            }
        }
    }

    // Extract evidence
    const evidence: Partial<ScreenshotEvidence> = {};
    if (response.evidence) {
        evidence.account_deletion_seen = response.evidence.account_deletion_seen === true;
        evidence.restore_purchases_seen = response.evidence.restore_purchases_seen === true;
        evidence.subscription_terms_seen = response.evidence.subscription_terms_seen === true;
        evidence.sign_in_with_apple_seen = response.evidence.sign_in_with_apple_seen === true;

        if (response.evidence.evidence_locations) {
            evidence.evidence_locations = {};
            for (const [key, indices] of Object.entries(response.evidence.evidence_locations)) {
                if (Array.isArray(indices)) {
                    // Adjust indices to be absolute (add batch offset)
                    evidence.evidence_locations[key] = indices.map((i) =>
                        typeof i === 'number' ? i + batchStartIndex : i
                    );
                }
            }
        }
    }

    return { checks, evidence };
}

/**
 * Merge partial evidence from multiple batches using OR logic.
 */
export function mergeEvidence(
    existing: ScreenshotEvidence,
    partial: Partial<ScreenshotEvidence>,
): ScreenshotEvidence {
    return {
        account_deletion_seen: existing.account_deletion_seen || (partial.account_deletion_seen ?? false),
        restore_purchases_seen: existing.restore_purchases_seen || (partial.restore_purchases_seen ?? false),
        subscription_terms_seen: existing.subscription_terms_seen || (partial.subscription_terms_seen ?? false),
        sign_in_with_apple_seen: existing.sign_in_with_apple_seen || (partial.sign_in_with_apple_seen ?? false),
        evidence_locations: mergeLocations(
            existing.evidence_locations,
            partial.evidence_locations || {},
        ),
    };
}

/**
 * Create empty evidence (all false, no locations).
 */
export function emptyEvidence(): ScreenshotEvidence {
    return {
        account_deletion_seen: false,
        restore_purchases_seen: false,
        subscription_terms_seen: false,
        sign_in_with_apple_seen: false,
        evidence_locations: {},
    };
}

// --- Internal helpers ---

function extractJSON(text: string): unknown | null {
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch {
        // Strip markdown code fences
        const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
        if (fenceMatch) {
            try {
                return JSON.parse(fenceMatch[1]);
            } catch {
                // Fall through
            }
        }

        // Try to find a JSON object in the text
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch {
                // Give up
            }
        }

        return null;
    }
}

function findingToCheckResult(
    finding: AIFinding,
    batchStartIndex: number,
): CheckResult | null {
    if (!finding || !finding.title || !finding.description) return null;

    // Clamp confidence: 30-85 range
    const rawConfidence = typeof finding.confidence === 'number' ? finding.confidence : 60;
    const confidence = Math.max(30, Math.min(85, rawConfidence));

    // Cap severity at 'warning' (AI findings never reach 'critical')
    const severityMap: Record<string, SeverityLevel> = {
        critical: 'warning', // Downgrade critical → warning
        warning: 'warning',
        info: 'info',
    };
    const severity: SeverityLevel = severityMap[finding.severity] || 'info';

    // Apply confidence-based severity cap:
    // < 50 → max 'info', 50-79 → max 'warning', 80+ → max 'warning' (AI cap)
    const effectiveSeverity: SeverityLevel = confidence < 50 ? 'info' : severity;

    // Build title with screenshot reference
    const absoluteIndex = batchStartIndex + (finding.screenshot_index || 0);
    const title = `Screenshot ${absoluteIndex + 1}: ${finding.title}`;

    return {
        category: 'screenshots' as CheckCategory,
        severity: effectiveSeverity,
        title,
        description: finding.description,
        guideline_ref: finding.guideline_ref || undefined,
        fix_suggestion: undefined, // AI doesn't generate fix suggestions
        confidence,
    };
}

function mergeLocations(
    existing: Record<string, number[]>,
    partial: Record<string, number[]>,
): Record<string, number[]> {
    const merged = { ...existing };
    for (const [key, indices] of Object.entries(partial)) {
        if (!merged[key]) {
            merged[key] = [...indices];
        } else {
            // Combine and deduplicate
            const combined = new Set([...merged[key], ...indices]);
            merged[key] = Array.from(combined).sort((a, b) => a - b);
        }
    }
    return merged;
}
