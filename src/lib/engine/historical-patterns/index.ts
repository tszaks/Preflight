/**
 * Historical Rejection Pattern Matcher
 *
 * Cross-references submission characteristics against 40+ curated
 * rejection patterns to generate advisory warnings.
 *
 * All results are 'info' severity — these are "heads up" warnings,
 * not hard findings. Confidence is capped at 79 so they never
 * outweigh deterministic checks.
 */

import type { CheckResult, HardRulesInput, CheckCategory } from '../types';
import { ENHANCED_PATTERNS, type EnhancedRejectionPattern } from './patterns-enhanced';

interface PatternMatch {
    pattern: EnhancedRejectionPattern;
    confidence: number;
    matchReasons: string[];
}

/**
 * Match submission characteristics against known rejection patterns.
 * Returns advisory CheckResult items for patterns that match.
 */
export function matchRejectionPatterns(input: HardRulesInput): CheckResult[] {
    const matches = scorePatterns(input);
    return matches.map(toCheckResult);
}

function scorePatterns(input: HardRulesInput): PatternMatch[] {
    const results: PatternMatch[] = [];

    // Build searchable text from all text fields (lowercase)
    const inputCategory = (input.category || '').toLowerCase().trim();
    const searchableText = [
        input.app_name,
        input.subtitle,
        input.description,
        input.keywords,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    for (const pattern of ENHANCED_PATTERNS) {
        // Skip patterns without matching criteria (reference-only)
        if (!pattern.match) continue;

        const matchReasons: string[] = [];
        let confidence = pattern.match.base_confidence ?? 50;
        let criteriaChecked = 0;
        let criteriaMatched = 0;

        // --- Category matching ---
        if (pattern.match.categories?.length) {
            criteriaChecked++;
            const categoryMatch = pattern.match.categories.some(
                (cat) => inputCategory.includes(cat) || cat.includes(inputCategory)
            );
            if (categoryMatch) {
                criteriaMatched++;
                matchReasons.push(`App category "${inputCategory}" matches pattern`);
                confidence += 5;
            } else {
                // Category-specific patterns must match their category
                continue;
            }
        }

        // --- Keyword matching ---
        if (pattern.match.keywords?.length) {
            criteriaChecked++;
            const matchedKeywords = pattern.match.keywords.filter((kw) =>
                searchableText.includes(kw.toLowerCase())
            );
            if (matchedKeywords.length > 0) {
                criteriaMatched++;
                matchReasons.push(`Keywords: ${matchedKeywords.join(', ')}`);
                confidence += Math.min(matchedKeywords.length * 3, 10);
            }
        }

        // --- Feature flag matching (required) ---
        if (pattern.match.features_required?.length) {
            criteriaChecked++;
            const inputAny = input as Record<string, unknown>;
            const hasAll = pattern.match.features_required.every(
                (f) => inputAny[f] === true
            );
            if (hasAll) {
                criteriaMatched++;
                matchReasons.push(`Features present: ${pattern.match.features_required.join(', ')}`);
                confidence += 5;
            } else {
                // Required features are mandatory — skip if not met
                continue;
            }
        }

        // --- Feature flag matching (absent) ---
        if (pattern.match.features_absent?.length) {
            criteriaChecked++;
            const inputAny = input as Record<string, unknown>;
            const allAbsent = pattern.match.features_absent.every(
                (f) => inputAny[f] !== true
            );
            if (allAbsent) {
                criteriaMatched++;
                matchReasons.push(`Missing features: ${pattern.match.features_absent.join(', ')}`);
                confidence += 5;
            }
        }

        // --- Minimum match threshold ---
        const minRequired = pattern.match.min_matches ?? 1;
        if (criteriaMatched < minRequired) continue;
        if (matchReasons.length === 0) continue;

        // Cap confidence at 79 (pattern matches never reach 'critical')
        results.push({
            pattern,
            confidence: Math.min(confidence, 79),
            matchReasons,
        });
    }

    return results;
}

function toCheckResult(match: PatternMatch): CheckResult {
    // Validate that the category is a known CheckCategory, fallback to 'content_policy'
    const validCategories = [
        'metadata', 'screenshots', 'privacy_manifest', 'info_plist',
        'urls', 'content_policy',
    ];
    const category = validCategories.includes(match.pattern.category)
        ? (match.pattern.category as CheckCategory)
        : ('content_policy' as CheckCategory);

    return {
        category,
        severity: 'info', // Advisory only — never warning or critical
        title: `Historical pattern: ${match.pattern.title}`,
        description:
            `Apps like yours have been rejected for: ${match.pattern.trigger} ` +
            `(Guideline ${match.pattern.guideline}). ` +
            `Matched because: ${match.matchReasons.join('; ')}.`,
        guideline_ref: match.pattern.guideline,
        fix_suggestion: match.pattern.fix,
        confidence: match.confidence,
    };
}
