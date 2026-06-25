/**
 * Historical Rejection Pattern Matcher
 *
 * Cross-references submission characteristics against curated
 * rejection patterns to generate advisory warnings.
 *
 * Patterns are loaded from the static knowledge base bundled with the CLI.
 *
 * All results are 'info' severity — these are "heads up" warnings,
 * not hard findings. Confidence is capped at 79 so they never
 * outweigh deterministic checks.
 */

import type { CheckResult, HardRulesInput, CheckCategory } from '../types';
import { ENHANCED_PATTERNS, type EnhancedRejectionPattern } from './patterns-enhanced';

interface PatternMatch {
    patternId: string;
    pattern: { category: string; title: string; guideline: string; trigger: string; fix: string };
    confidence: number;
    matchReasons: string[];
}

/**
 * Match submission characteristics against known rejection patterns.
 * Returns advisory CheckResult items for patterns that match.
 *
 * Matches against the static ENHANCED_PATTERNS array.
 */
export async function matchRejectionPatterns(
    input: HardRulesInput,
): Promise<CheckResult[]> {
    const matches = scoreStaticPatterns(input);
    return matches.map(toCheckResult);
}

/**
 * Score patterns from the static ENHANCED_PATTERNS array (fallback).
 */
function scoreStaticPatterns(input: HardRulesInput): PatternMatch[] {
    const results: PatternMatch[] = [];

    const inputCategory = (input.category || '').toLowerCase().trim();
    const searchableText = [input.app_name, input.subtitle, input.description, input.keywords]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    for (const pattern of ENHANCED_PATTERNS) {
        if (!pattern.match) continue;

        const matchReasons: string[] = [];
        let confidence = pattern.match.base_confidence ?? 50;
        let criteriaMatched = 0;

        if (pattern.match.categories?.length) {
            if (!inputCategory) continue;

            const categoryMatch = pattern.match.categories.some((category) => {
                const normalizedCategory = category.toLowerCase().trim();
                return inputCategory.includes(normalizedCategory) || normalizedCategory.includes(inputCategory);
            });
            if (categoryMatch) {
                criteriaMatched++;
                matchReasons.push(`App category "${inputCategory}" matches pattern`);
                confidence += 5;
            } else {
                continue;
            }
        }

        if (pattern.match.keywords?.length) {
            const matchedKeywords = pattern.match.keywords.filter((kw) =>
                searchableText.includes(kw.toLowerCase())
            );
            if (matchedKeywords.length > 0) {
                criteriaMatched++;
                matchReasons.push(`Keywords: ${matchedKeywords.join(', ')}`);
                confidence += Math.min(matchedKeywords.length * 3, 10);
            }
        }

        if (pattern.match.features_required?.length) {
            const inputAny = input as unknown as Record<string, unknown>;
            const hasAll = pattern.match.features_required.every((f) => inputAny[f] === true);
            if (hasAll) {
                criteriaMatched++;
                matchReasons.push(`Features present: ${pattern.match.features_required.join(', ')}`);
                confidence += 5;
            } else {
                continue;
            }
        }

        if (pattern.match.features_absent?.length) {
            const inputAny = input as unknown as Record<string, unknown>;
            const allAbsent = pattern.match.features_absent.every((f) => inputAny[f] !== true);
            if (allAbsent) {
                criteriaMatched++;
                matchReasons.push(`Missing features: ${pattern.match.features_absent.join(', ')}`);
                confidence += 5;
            }
        }

        const minRequired = pattern.match.min_matches ?? 1;
        if (criteriaMatched < minRequired) continue;
        if (matchReasons.length === 0) continue;

        results.push({
            patternId: pattern.id,
            pattern: {
                category: pattern.category,
                title: pattern.title,
                guideline: pattern.guideline,
                trigger: pattern.trigger,
                fix: pattern.fix,
            },
            confidence: Math.min(confidence, 79),
            matchReasons,
        });
    }

    return results;
}

function toCheckResult(match: PatternMatch): CheckResult {
    const validCategories = [
        'metadata', 'screenshots', 'privacy_manifest', 'info_plist',
        'urls', 'content_policy',
    ];
    const category = validCategories.includes(match.pattern.category)
        ? (match.pattern.category as CheckCategory)
        : ('content_policy' as CheckCategory);

    return {
        category,
        severity: 'info',
        title: `Historical pattern: ${match.pattern.title}`,
        description:
            `Apps like yours have been rejected for: ${match.pattern.trigger} ` +
            `(Guideline ${match.pattern.guideline}). ` +
            `Matched because: ${match.matchReasons.join('; ')}.`,
        guideline_ref: match.pattern.guideline,
        fix_suggestion: match.pattern.fix,
        confidence: match.confidence,
        pattern_id: match.patternId,
    };
}
