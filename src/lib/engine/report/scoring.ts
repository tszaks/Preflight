import type { CheckResult, ScoreResult, CheckCategory } from '../types';

/**
 * Calculates scores (0-100) for each category and overall.
 *
 * Scoring logic:
 * - Start at 100 for each category
 * - Critical: -30 points each
 * - Warning: -15 points each
 * - Info: -0 points (suggestions only)
 * - Pass: +0 (no penalty)
 * - Minimum score: 0
 * - Categories with NO data (only "not provided" checks) return null
 *
 * Overall score is a weighted average of category scores.
 */
export function calculateScores(checks: CheckResult[]): ScoreResult {
    const categoryChecks = groupByCategory(checks);

    const score_metadata = scoreCategory(categoryChecks.metadata || []);
    const score_screenshots = scoreCategoryOrNull(categoryChecks.screenshots || [], 'No screenshots provided');
    const score_privacy = scoreCategoryOrNull(categoryChecks.privacy_manifest || [], 'No privacy manifest provided');
    const score_plist = scoreCategoryOrNull(categoryChecks.info_plist || [], 'No Info.plist provided');
    const score_urls = scoreCategory(categoryChecks.urls || []);
    const score_content = scoreCategory([
        ...(categoryChecks.content_policy || []),
        ...(categoryChecks.description || []),
    ]);

    // Weighted overall (privacy and metadata matter most for rejections)
    const weights = {
        metadata: 0.25,
        screenshots: 0.15,
        privacy: 0.25,
        plist: 0.15,
        urls: 0.10,
        content: 0.10,
    };

    const score_overall = Math.round(
        score_metadata * weights.metadata +
        (score_screenshots ?? 100) * weights.screenshots +
        (score_privacy ?? 100) * weights.privacy +
        (score_plist ?? 100) * weights.plist +
        score_urls * weights.urls +
        score_content * weights.content
    );

    return {
        score_metadata,
        score_screenshots,
        score_privacy,
        score_plist,
        score_urls,
        score_content,
        score_overall,
    };
}

function scoreCategory(checks: CheckResult[]): number {
    if (checks.length === 0) return 100;

    let score = 100;

    for (const check of checks) {
        // Weight penalty by confidence (default 100 for hard rules)
        const conf = (check.confidence ?? 100) / 100;

        switch (check.severity) {
            case 'critical':
                score -= 30 * conf;
                break;
            case 'warning':
                score -= 15 * conf;
                break;
            // info and pass don't affect score
        }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Returns null if the only check is "not provided" - meaning we can't score this category.
 * Otherwise scores normally.
 */
function scoreCategoryOrNull(checks: CheckResult[], notProvidedTitle: string): number | null {
    // If empty or only contains "not provided" check, return null (not checked)
    if (checks.length === 0) return null;
    if (checks.length === 1 && checks[0].title === notProvidedTitle) return null;

    // Otherwise score normally
    return scoreCategory(checks);
}

function groupByCategory(checks: CheckResult[]): Partial<Record<CheckCategory, CheckResult[]>> {
    const groups: Partial<Record<CheckCategory, CheckResult[]>> = {};

    for (const check of checks) {
        if (!groups[check.category]) {
            groups[check.category] = [];
        }
        groups[check.category]!.push(check);
    }

    return groups;
}

/**
 * Count checks by severity
 */
export function countBySeverity(checks: CheckResult[]) {
    return {
        total_critical: checks.filter(c => c.severity === 'critical').length,
        total_warnings: checks.filter(c => c.severity === 'warning').length,
        total_info: checks.filter(c => c.severity === 'info').length,
        total_pass: checks.filter(c => c.severity === 'pass').length,
    };
}
