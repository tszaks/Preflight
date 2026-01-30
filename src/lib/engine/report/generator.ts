import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import type { CheckResult } from '../types';
import { capSeverityByConfidence } from '../types';
import { calculateScores, countBySeverity } from './scoring';

/**
 * Generates and saves a report from check results.
 * Creates the report record and all associated report_items.
 */
export async function generateReport(
    supabase: SupabaseClient<Database>,
    submissionId: string,
    checks: CheckResult[]
): Promise<{ reportId: string; success: boolean; error?: string }> {
    // Cap severity based on confidence (low-confidence checks can't be critical)
    const cappedChecks = checks.map(capSeverityByConfidence);

    // Deduplicate similar issues (hard rules + soft rules can flag same thing)
    const deduplicatedChecks = deduplicateChecks(cappedChecks);

    // Filter low-value info items: confidence floor + cap total count
    const filteredChecks = filterInfoItems(deduplicatedChecks);

    // Calculate scores
    const scores = calculateScores(filteredChecks);
    const counts = countBySeverity(filteredChecks);

    // Generate summary
    const summary = generateSummary(filteredChecks, scores.score_overall);

    // Create report record
    const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
            submission_id: submissionId,
            ...scores,
            summary,
            ...counts,
        })
        .select('id')
        .single();

    if (reportError || !report) {
        return {
            reportId: '',
            success: false,
            error: `Failed to create report: ${reportError?.message}`,
        };
    }

    // Create report items (filter out pass results to keep it clean)
    const items = filteredChecks
        .filter(check => check.severity !== 'pass')
        .map(check => ({
            report_id: report.id,
            category: check.category,
            severity: check.severity,
            title: check.title,
            description: check.description,
            guideline_ref: check.guideline_ref || null,
            fix_suggestion: check.fix_suggestion || null,
            confidence: check.confidence ?? null,
            pattern_id: check.pattern_id || null,
        }));

    let itemsInsertFailed = false;
    if (items.length > 0) {
        const { error: itemsError } = await supabase
            .from('report_items')
            .insert(items);

        if (itemsError) {
            console.error('Failed to insert report items:', itemsError);
            itemsInsertFailed = true;
        }
    }

    // Update submission status
    const { error: statusError } = await supabase
        .from('submissions')
        .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

    if (statusError) {
        console.error('Failed to update submission status:', statusError);
    }

    if (itemsInsertFailed) {
        return {
            reportId: report.id,
            success: false,
            error: 'Report created but findings could not be saved. The report may be incomplete.',
        };
    }

    return {
        reportId: report.id,
        success: true,
    };
}

function generateSummary(checks: CheckResult[], overallScore: number): string {
    const criticals = checks.filter(c => c.severity === 'critical');
    const warnings = checks.filter(c => c.severity === 'warning');

    if (criticals.length === 0 && warnings.length === 0) {
        return 'Your app looks ready for submission! No critical issues or warnings detected. Review the suggestions below for optional improvements.';
    }

    if (criticals.length === 0) {
        return `No critical issues found, but ${warnings.length} warning(s) detected that could delay your review. Address these before submitting for the best chance of approval.`;
    }

    if (overallScore < 30) {
        return `${criticals.length} critical issue(s) and ${warnings.length} warning(s) found. Your submission has a high risk of rejection. Address all critical issues before submitting.`;
    }

    return `${criticals.length} critical issue(s) found that will likely cause rejection. Fix these before submitting. ${warnings.length > 0 ? `Also review ${warnings.length} warning(s).` : ''}`;
}

/**
 * Filter low-value info items to reduce noise.
 * - Drops info items with confidence < 50 (kills low-signal guesses)
 * - Caps total info items at 8, keeping highest confidence first
 * - Critical and warning items are never touched
 */
function filterInfoItems(checks: CheckResult[]): CheckResult[] {
    const INFO_CONFIDENCE_FLOOR = 50;
    const MAX_INFO_ITEMS = 8;

    const nonInfo = checks.filter(c => c.severity !== 'info');
    const infoItems = checks.filter(c => c.severity === 'info');

    // Drop info items below confidence floor
    const qualifiedInfo = infoItems.filter(c => (c.confidence ?? 0) >= INFO_CONFIDENCE_FLOOR);

    // Cap at max, sorted by confidence descending
    const cappedInfo = qualifiedInfo
        .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
        .slice(0, MAX_INFO_ITEMS);

    return [...nonInfo, ...cappedInfo];
}

/**
 * Deduplicate similar checks that may come from both hard and soft rules.
 * Groups by: (1) same guideline_ref + same severity, or (2) title word similarity.
 * Keeps the highest severity version; ties broken by confidence.
 */
function deduplicateChecks(checks: CheckResult[]): CheckResult[] {
    const severityRank: Record<string, number> = {
        'critical': 4,
        'warning': 3,
        'info': 2,
        'pass': 1,
    };

    // Normalize title for comparison (lowercase, remove extra spaces)
    const normalizeTitle = (title: string) => title.toLowerCase().trim().replace(/\s+/g, ' ');

    // Group by guideline_ref + severity, or by similar titles
    const groups = new Map<string, CheckResult[]>();

    for (const check of checks) {
        const normalizedTitle = normalizeTitle(check.title);
        let matchedKey: string | null = null;

        // 1. Guideline-based grouping: same guideline_ref + same severity = same issue
        //    (different severities under the same guideline are kept separate —
        //     e.g. a critical "missing from manifest" vs warning "not in policy" for 5.1.1)
        if (check.guideline_ref) {
            for (const [existingKey, existingChecks] of groups) {
                const sameGuidelineAndSeverity = existingChecks.some(
                    ec => ec.guideline_ref === check.guideline_ref && ec.severity === check.severity
                );
                if (sameGuidelineAndSeverity) {
                    matchedKey = existingKey;
                    break;
                }
            }
        }

        // 2. Title-based grouping: 60%+ significant word overlap
        if (!matchedKey) {
            const titleWords = normalizedTitle.split(' ').filter(w => w.length > 3);

            for (const [existingKey] of groups) {
                const existingWords = existingKey.split(' ').filter(w => w.length > 3);
                const matchingWords = titleWords.filter(w => existingWords.includes(w));
                const similarity = matchingWords.length / Math.max(titleWords.length, existingWords.length);

                if (similarity >= 0.6) {
                    matchedKey = existingKey;
                    break;
                }
            }
        }

        const key = matchedKey || normalizedTitle;
        const existing = groups.get(key) || [];
        existing.push(check);
        groups.set(key, existing);
    }

    // For each group, keep the highest severity version (confidence as tiebreaker)
    const result: CheckResult[] = [];

    for (const [, groupChecks] of groups) {
        if (groupChecks.length === 1) {
            result.push(groupChecks[0]);
        } else {
            groupChecks.sort((a, b) => {
                const sevDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
                if (sevDiff !== 0) return sevDiff;
                return (b.confidence ?? 0) - (a.confidence ?? 0);
            });
            result.push(groupChecks[0]);
        }
    }

    return result;
}
