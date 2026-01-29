/**
 * Cross-Reference Engine
 *
 * Resolves conditional warnings by comparing hard-rule guesses against
 * evidence extracted from AI screenshot analysis.
 *
 * Flow:
 * 1. Hard rules generate conditional warnings (e.g., "account deletion may be missing")
 *    with low confidence (30) because they can't see the app UI.
 * 2. AI analyzes screenshots and reports what it sees (ScreenshotEvidence).
 * 3. This module matches evidence to warnings and resolves them:
 *    - Evidence found → severity: 'pass', confidence: 85
 *    - Evidence not found → keep current severity, append note
 */

import type { CheckResult, ScreenshotEvidence } from './types';

/**
 * Empty evidence object — used when no screenshots were analyzed.
 */
export const EMPTY_EVIDENCE: ScreenshotEvidence = {
    account_deletion_seen: false,
    restore_purchases_seen: false,
    subscription_terms_seen: false,
    sign_in_with_apple_seen: false,
    evidence_locations: {},
};

/**
 * Mapping from evidence keys to the conditional warning titles they can resolve.
 * Each entry maps an evidence boolean to the titles it addresses.
 */
const EVIDENCE_TO_WARNING_TITLES: Record<keyof Omit<ScreenshotEvidence, 'evidence_locations'>, string[]> = {
    account_deletion_seen: [
        'Account Deletion Required',
        'Account deletion may be required',
    ],
    restore_purchases_seen: [
        'Restore Purchases Required',
        'Restore purchases may be required',
    ],
    subscription_terms_seen: [
        'Subscription Terms Disclosure',
        'Subscription terms disclosure needed',
    ],
    sign_in_with_apple_seen: [
        'Sign in with Apple Required',
        'Sign in with Apple may be required',
    ],
};

/**
 * Cross-references conditional warning checks against screenshot evidence.
 * Returns a new array of checks with resolved warnings where evidence was found.
 *
 * Only modifies checks that:
 * 1. Have a title matching a known conditional warning
 * 2. Are not already severity 'pass' (no need to resolve what's already passing)
 * 3. Have matching evidence from screenshot analysis
 */
export function crossReferenceChecks(
    checks: CheckResult[],
    evidence: ScreenshotEvidence
): CheckResult[] {
    return checks.map(check => {
        // Skip checks that are already passing
        if (check.severity === 'pass') return check;

        // Check each evidence key to see if it resolves this check
        for (const [evidenceKey, titles] of Object.entries(EVIDENCE_TO_WARNING_TITLES)) {
            const key = evidenceKey as keyof Omit<ScreenshotEvidence, 'evidence_locations'>;
            const titleMatches = titles.some(t =>
                check.title.toLowerCase().includes(t.toLowerCase())
            );

            if (!titleMatches) continue;

            if (evidence[key]) {
                // Evidence found — resolve the warning to pass
                const locations = evidence.evidence_locations[key];
                const locationNote = locations && locations.length > 0
                    ? ` (verified in screenshot${locations.length > 1 ? 's' : ''} ${locations.map(i => i + 1).join(', ')})`
                    : '';

                return {
                    ...check,
                    severity: 'pass' as const,
                    confidence: 85,
                    description: `${check.description}\n\n✅ Cross-reference: Feature verified in screenshots${locationNote}.`,
                };
            } else {
                // Evidence NOT found — keep severity, add note
                return {
                    ...check,
                    description: `${check.description}\n\n⚠️ Cross-reference: Feature not found in uploaded screenshots. Verify it exists in your app before submitting.`,
                };
            }
        }

        // No matching evidence key — return check unchanged
        return check;
    });
}

/**
 * Merges multiple ScreenshotEvidence objects from different batches.
 * Evidence is OR'd — if any batch sees a feature, it's considered seen.
 * Location arrays are concatenated.
 */
export function mergeEvidence(evidences: ScreenshotEvidence[]): ScreenshotEvidence {
    if (evidences.length === 0) return { ...EMPTY_EVIDENCE };
    if (evidences.length === 1) return evidences[0];

    const merged: ScreenshotEvidence = {
        account_deletion_seen: false,
        restore_purchases_seen: false,
        subscription_terms_seen: false,
        sign_in_with_apple_seen: false,
        evidence_locations: {},
    };

    for (const ev of evidences) {
        merged.account_deletion_seen = merged.account_deletion_seen || ev.account_deletion_seen;
        merged.restore_purchases_seen = merged.restore_purchases_seen || ev.restore_purchases_seen;
        merged.subscription_terms_seen = merged.subscription_terms_seen || ev.subscription_terms_seen;
        merged.sign_in_with_apple_seen = merged.sign_in_with_apple_seen || ev.sign_in_with_apple_seen;

        // Merge location arrays
        for (const [key, locs] of Object.entries(ev.evidence_locations)) {
            if (!merged.evidence_locations[key]) {
                merged.evidence_locations[key] = [];
            }
            merged.evidence_locations[key].push(...locs);
        }
    }

    return merged;
}
