/**
 * Report comparison / diff engine.
 * Compares two analysis reports to show what changed between submissions.
 * Used for the "before/after" view when users retest their app.
 */

import type { CheckResult, ScoreResult } from '../types';

export interface ReportDiff {
    /** Issues that were in the old report but not in the new one (resolved) */
    fixed: CheckResult[];
    /** Issues present in both reports (still there) */
    still_present: CheckResult[];
    /** Issues in the new report but not in the old one */
    new_issues: CheckResult[];
    /** Score changes */
    score_delta: ScoreDelta;
    /** Summary stats */
    summary: DiffSummary;
}

export interface ScoreDelta {
    overall: { old: number; new: number; delta: number };
    metadata: { old: number; new: number; delta: number } | null;
    screenshots: { old: number; new: number; delta: number } | null;
    privacy: { old: number; new: number; delta: number } | null;
    plist: { old: number; new: number; delta: number } | null;
    urls: { old: number; new: number; delta: number } | null;
    content: { old: number; new: number; delta: number } | null;
    ipa_binary: { old: number; new: number; delta: number } | null;
}

export interface DiffSummary {
    total_fixed: number;
    total_still_present: number;
    total_new_issues: number;
    net_change: number; // positive = improvement
    improved: boolean;
}

/**
 * Compare two sets of check results (old vs new).
 * Matching is based on title similarity since exact titles may differ slightly.
 */
export function diffReports(
    oldChecks: CheckResult[],
    newChecks: CheckResult[],
    oldScores: ScoreResult,
    newScores: ScoreResult
): ReportDiff {
    // Filter out passes for comparison — we only care about actionable findings
    const oldIssues = oldChecks.filter(c => c.severity !== 'pass');
    const newIssues = newChecks.filter(c => c.severity !== 'pass');

    // Match issues by normalized title
    const oldTitles = new Map<string, CheckResult>();
    for (const issue of oldIssues) {
        oldTitles.set(normalizeTitle(issue.title), issue);
    }

    const newTitles = new Map<string, CheckResult>();
    for (const issue of newIssues) {
        newTitles.set(normalizeTitle(issue.title), issue);
    }

    const fixed: CheckResult[] = [];
    const still_present: CheckResult[] = [];
    const new_issues: CheckResult[] = [];

    // Find fixed and still-present issues
    for (const [normalizedTitle, oldIssue] of oldTitles) {
        if (newTitles.has(normalizedTitle)) {
            still_present.push(newTitles.get(normalizedTitle)!);
        } else {
            fixed.push(oldIssue);
        }
    }

    // Find new issues
    for (const [normalizedTitle, newIssue] of newTitles) {
        if (!oldTitles.has(normalizedTitle)) {
            new_issues.push(newIssue);
        }
    }

    // Calculate score deltas
    const score_delta = calculateScoreDeltas(oldScores, newScores);

    const summary: DiffSummary = {
        total_fixed: fixed.length,
        total_still_present: still_present.length,
        total_new_issues: new_issues.length,
        net_change: fixed.length - new_issues.length,
        improved: newScores.score_overall > oldScores.score_overall,
    };

    return { fixed, still_present, new_issues, score_delta, summary };
}

/**
 * Normalize a check title for fuzzy matching.
 * Strips numbers, extra whitespace, and lowercases for comparison.
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/\d+/g, '#') // Normalize numbers
        .replace(/\s+/g, ' ')
        .trim();
}

function calculateScoreDeltas(old: ScoreResult, current: ScoreResult): ScoreDelta {
    const delta = (o: number | null, n: number | null) => {
        if (o === null || n === null) return null;
        return { old: o, new: n, delta: n - o };
    };

    return {
        overall: { old: old.score_overall, new: current.score_overall, delta: current.score_overall - old.score_overall },
        metadata: delta(old.score_metadata, current.score_metadata),
        screenshots: delta(old.score_screenshots, current.score_screenshots),
        privacy: delta(old.score_privacy, current.score_privacy),
        plist: delta(old.score_plist, current.score_plist),
        urls: delta(old.score_urls, current.score_urls),
        content: delta(old.score_content, current.score_content),
        ipa_binary: delta(old.score_ipa_binary, current.score_ipa_binary),
    };
}

/**
 * Generate a human-readable summary of the diff.
 */
export function formatDiffSummary(diff: ReportDiff): string {
    const lines: string[] = [];
    const { summary, score_delta } = diff;

    // Score headline
    const arrow = score_delta.overall.delta > 0 ? '↑' : score_delta.overall.delta < 0 ? '↓' : '→';
    lines.push(`Score: ${score_delta.overall.old} ${arrow} ${score_delta.overall.new} (${score_delta.overall.delta >= 0 ? '+' : ''}${score_delta.overall.delta})`);

    // Change summary
    if (summary.total_fixed > 0) {
        lines.push(`[FIXED] ${summary.total_fixed} issue(s) fixed`);
    }
    if (summary.total_still_present > 0) {
        lines.push(`[WARN] ${summary.total_still_present} issue(s) still present`);
    }
    if (summary.total_new_issues > 0) {
        lines.push(`[NEW] ${summary.total_new_issues} new issue(s)`);
    }

    return lines.join('\n');
}
