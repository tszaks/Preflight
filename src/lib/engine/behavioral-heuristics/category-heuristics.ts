/**
 * Category Heuristics Matcher
 *
 * Matches the submitted app's category against known rejection patterns
 * and generates advisory CheckResults. Available for ALL users (no ASC
 * connection needed) since it uses static knowledge + submission metadata.
 *
 * Confidence range: 40-70 (capped to max 'warning' by capSeverityByConfidence)
 */

import type { HardRulesInput, CheckResult } from '../types';
import { CATEGORY_HEURISTICS, type CategoryHeuristic, type CategoryRejectionReason } from './heuristic-data';

const BASE_CONFIDENCE_MATCH = 45;
const KEYWORD_CONFIDENCE_BOOST = 15;
const MAX_CONFIDENCE = 70;

/**
 * Match the app's category to known heuristic patterns and generate checks.
 */
export function matchCategoryHeuristics(input: HardRulesInput): CheckResult[] {
    const matched = findMatchingCategory(input.category);
    if (!matched) return [];

    const { key, heuristic } = matched;
    const results: CheckResult[] = [];

    // Build a searchable text corpus from the app's metadata
    const corpus = buildSearchCorpus(input);

    // Generate checks for each common rejection reason
    for (const reason of heuristic.common_rejection_reasons) {
        const keywordHit = hasKeywordMatch(reason.trigger_keywords, corpus);
        const confidence = computeConfidence(reason.frequency, keywordHit);

        // Only emit if we have enough signal
        if (confidence < 40) continue;

        const severity = keywordHit && reason.frequency === 'very_common' ? 'warning' : 'info';

        results.push({
            category: 'content_policy',
            severity,
            title: `${formatCategoryName(key)}: ${reason.description.slice(0, 80)}`,
            description: reason.description,
            guideline_ref: reason.guideline,
            fix_suggestion: buildFixSuggestion(reason, key),
            confidence,
        });
    }

    // Check for missing required features (advisory)
    for (const feature of heuristic.required_features) {
        results.push({
            category: 'content_policy',
            severity: 'info',
            title: `${formatCategoryName(key)} requirement: ${feature}`,
            description: `Apps in the ${formatCategoryName(key)} category typically need: ${feature}. Verify this is addressed in your submission.`,
            confidence: 40,
        });
    }

    // General category advisory (one combined note if risk is high)
    if (heuristic.rejection_risk_level === 'high' && heuristic.advisory_notes.length > 0) {
        results.push({
            category: 'content_policy',
            severity: 'info',
            title: `${formatCategoryName(key)} apps face elevated review scrutiny`,
            description: heuristic.advisory_notes.join(' '),
            confidence: 50,
        });
    }

    return results;
}

/**
 * Find the best matching category heuristic for the given category string.
 * Uses fuzzy keyword matching against category_keywords.
 */
function findMatchingCategory(
    category: string | null | undefined,
): { key: string; heuristic: CategoryHeuristic } | null {
    if (!category) return null;

    const normalized = category.toLowerCase().trim();

    for (const [key, heuristic] of Object.entries(CATEGORY_HEURISTICS)) {
        for (const keyword of heuristic.category_keywords) {
            if (normalized.includes(keyword) || keyword.includes(normalized)) {
                return { key, heuristic };
            }
        }
    }

    return null;
}

/**
 * Build a single lowercase string from all searchable metadata fields.
 */
function buildSearchCorpus(input: HardRulesInput): string {
    return [
        input.app_name,
        input.subtitle,
        input.description,
        input.keywords,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

/**
 * Check if any trigger keywords appear in the metadata corpus.
 */
function hasKeywordMatch(
    triggers: string[] | undefined,
    corpus: string,
): boolean {
    if (!triggers || triggers.length === 0) return false;
    return triggers.some((kw) => corpus.includes(kw.toLowerCase()));
}

/**
 * Compute confidence based on rejection frequency and keyword presence.
 */
function computeConfidence(
    frequency: CategoryRejectionReason['frequency'],
    keywordHit: boolean,
): number {
    let confidence = BASE_CONFIDENCE_MATCH;

    // Boost based on how commonly this rejection happens
    if (frequency === 'very_common') confidence += 10;
    else if (frequency === 'common') confidence += 5;

    // Boost if we found matching keywords in the app's metadata
    if (keywordHit) confidence += KEYWORD_CONFIDENCE_BOOST;

    return Math.min(confidence, MAX_CONFIDENCE);
}

/**
 * Generate a targeted fix suggestion for a rejection reason.
 */
function buildFixSuggestion(reason: CategoryRejectionReason, categoryKey: string): string {
    const base = `Review Apple guideline ${reason.guideline} for ${formatCategoryName(categoryKey)} apps.`;

    if (reason.trigger_keywords && reason.trigger_keywords.length > 0) {
        return `${base} Your app metadata references related terms (${reason.trigger_keywords.slice(0, 3).join(', ')}), so this check is especially relevant.`;
    }

    return base;
}

/**
 * Format a category key into a human-readable name.
 */
function formatCategoryName(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
