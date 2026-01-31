/**
 * Feature extraction from a completed analysis report.
 * Extracts structured signals that feed into the approval prediction model.
 */

import type { CheckResult, ScoreResult } from '../types';

export interface PredictionFeatures {
    // Severity counts
    critical_count: number;
    warning_count: number;
    info_count: number;
    pass_count: number;

    // Category breakdown
    has_privacy_issues: boolean;
    has_metadata_issues: boolean;
    has_content_issues: boolean;
    has_screenshot_issues: boolean;
    has_plist_issues: boolean;

    // Score features
    overall_score: number;
    lowest_category_score: number;

    // Binary features
    has_privacy_manifest: boolean;
    has_plist: boolean;
    has_screenshots: boolean;

    // High-confidence critical issues (most predictive)
    high_confidence_criticals: number;
}

/**
 * Extract prediction features from check results and scores.
 */
export function extractFeatures(
    checks: CheckResult[],
    scores: ScoreResult,
    metadata: {
        has_privacy_manifest: boolean;
        has_plist: boolean;
        has_screenshots: boolean;
    }
): PredictionFeatures {
    const criticals = checks.filter(c => c.severity === 'critical');
    const warnings = checks.filter(c => c.severity === 'warning');

    const categoryScores = [
        scores.score_metadata,
        scores.score_screenshots,
        scores.score_privacy,
        scores.score_plist,
        scores.score_urls,
        scores.score_content,
    ].filter((s): s is number => s !== null);

    return {
        critical_count: criticals.length,
        warning_count: warnings.length,
        info_count: checks.filter(c => c.severity === 'info').length,
        pass_count: checks.filter(c => c.severity === 'pass').length,

        has_privacy_issues: criticals.some(c => c.category === 'privacy_manifest'),
        has_metadata_issues: criticals.some(c => c.category === 'metadata'),
        has_content_issues: criticals.some(c => c.category === 'content_policy' || c.category === 'description'),
        has_screenshot_issues: criticals.some(c => c.category === 'screenshots'),
        has_plist_issues: criticals.some(c => c.category === 'info_plist'),

        overall_score: scores.score_overall,
        lowest_category_score: categoryScores.length > 0 ? Math.min(...categoryScores) : 100,

        has_privacy_manifest: metadata.has_privacy_manifest,
        has_plist: metadata.has_plist,
        has_screenshots: metadata.has_screenshots,

        high_confidence_criticals: criticals.filter(c => (c.confidence ?? 100) >= 80).length,
    };
}
