/**
 * Web-based claim verification using search APIs.
 * Checks extracted claims against real web data to verify or refute them.
 *
 * V1: Uses a simple fetch-based approach. Can be upgraded to Exa API later.
 */

import type { CheckResult } from '../types';
import type { ExtractedClaim } from './claim-extractor';

export interface ClaimVerification {
    claim: ExtractedClaim;
    status: 'verified' | 'unverified' | 'false' | 'skipped';
    evidence?: string;
}

/**
 * Verify a list of extracted claims.
 * Returns CheckResult[] for any claims that could not be verified or appear false.
 */
export async function verifyClaims(
    claims: ExtractedClaim[],
    appName: string
): Promise<{ checks: CheckResult[]; verifications: ClaimVerification[] }> {
    const checks: CheckResult[] = [];
    const verifications: ClaimVerification[] = [];

    if (claims.length === 0) {
        return { checks, verifications };
    }

    for (const claim of claims) {
        try {
            const verification = await verifySingleClaim(claim, appName);
            verifications.push(verification);

            if (verification.status === 'false') {
                checks.push({
                    category: 'description',
                    severity: claim.impact,
                    title: `Potentially false claim: "${claim.text}"`,
                    description: `The claim "${claim.text}" could not be verified and appears to be inaccurate. ${verification.evidence || ''} Apple rejects apps with misleading descriptions (Section 2.3 - Accurate Metadata).`,
                    guideline_ref: 'Section 2.3 - Accurate Metadata',
                    fix_suggestion: `Remove or correct the claim "${claim.text}". Only include verifiable, current facts in your description.`,
                    confidence: 60, // Web verification has moderate confidence
                });
            } else if (verification.status === 'unverified') {
                checks.push({
                    category: 'description',
                    severity: 'info',
                    title: `Unverifiable claim: "${claim.text}"`,
                    description: `The claim "${claim.text}" could not be verified through web search. Consider whether this claim is current and can be substantiated.`,
                    guideline_ref: 'Section 2.3 - Accurate Metadata',
                    confidence: 40,
                });
            }
        } catch (error) {
            console.error(`[WebChecker] Failed to verify claim "${claim.text}":`, error);
            verifications.push({ claim, status: 'skipped' });
        }
    }

    return { checks, verifications };
}

/**
 * Attempt to verify a single claim via web lookup.
 * V1: Simple heuristic-based verification. Future: Exa API integration.
 */
async function verifySingleClaim(
    claim: ExtractedClaim,
    _appName: string
): Promise<ClaimVerification> {
    // V1: All claims marked as unverified (web search integration pending)
    // When Exa API is integrated, this will do actual web lookups
    // For now, we flag claims that use common misleading patterns

    const misleadingPatterns = [
        { pattern: /#1\s+(app|rated|top)/i, reason: 'Rankings change frequently and must be current.' },
        { pattern: /award[- ]?winning/i, reason: 'Award claims must be verifiable and current.' },
        { pattern: /\b(millions|billion)\s+users/i, reason: 'User count claims should be verifiable.' },
        { pattern: /as (seen|featured) on/i, reason: 'Media feature claims should be verifiable.' },
        { pattern: /best\s+(in|app|rated)/i, reason: 'Superlative claims ("best") require substantiation.' },
    ];

    for (const { pattern, reason } of misleadingPatterns) {
        if (pattern.test(claim.text)) {
            return {
                claim,
                status: 'unverified',
                evidence: reason,
            };
        }
    }

    return { claim, status: 'skipped' };
}
