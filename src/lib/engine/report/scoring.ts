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
 *
 * Overall score is a weighted average of category scores.
 */
export function calculateScores(checks: CheckResult[]): ScoreResult {
    const categoryChecks = groupByCategory(checks);

    const score_metadata = scoreCategory(categoryChecks.metadata || []);
    const score_screenshots = scoreCategory(categoryChecks.screenshots || []);
    const score_privacy = scoreCategory(categoryChecks.privacy_manifest || []);
    const score_plist = scoreCategory(categoryChecks.info_plist || []);
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
        score_screenshots * weights.screenshots +
        score_privacy * weights.privacy +
        score_plist * weights.plist +
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
        switch (check.severity) {
            case 'critical':
                score -= 30;
                break;
            case 'warning':
                score -= 15;
                break;
            // info and pass don't affect score
        }
    }

    return Math.max(0, Math.min(100, score));
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
