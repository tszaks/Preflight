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

    // Calculate scores
    const scores = calculateScores(deduplicatedChecks);
    const counts = countBySeverity(deduplicatedChecks);

    // Generate summary
    const summary = generateSummary(deduplicatedChecks, scores.score_overall);

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
    const items = deduplicatedChecks
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
 * Deduplicate similar checks that may come from both hard and soft rules.
 * Uses title similarity to identify duplicates - keeps the higher severity version.
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

    // Group by similar titles
    const groups = new Map<string, CheckResult[]>();

    for (const check of checks) {
        const normalizedTitle = normalizeTitle(check.title);

        // Check for similar existing titles (contains key words)
        let matchedKey: string | null = null;

        // Keywords that indicate similar issues
        const titleWords = normalizedTitle.split(' ').filter(w => w.length > 3);

        for (const [existingKey] of groups) {
            const existingWords = existingKey.split(' ').filter(w => w.length > 3);
            // If 60%+ of significant words match, consider it similar
            const matchingWords = titleWords.filter(w => existingWords.includes(w));
            const similarity = matchingWords.length / Math.max(titleWords.length, existingWords.length);

            if (similarity >= 0.6) {
                matchedKey = existingKey;
                break;
            }
        }

        const key = matchedKey || normalizedTitle;
        const existing = groups.get(key) || [];
        existing.push(check);
        groups.set(key, existing);
    }

    // For each group, keep the highest severity version (or merge info)
    const result: CheckResult[] = [];

    for (const [, groupChecks] of groups) {
        if (groupChecks.length === 1) {
            result.push(groupChecks[0]);
        } else {
            // Sort by severity (highest first)
            groupChecks.sort((a, b) =>
                (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
            );
            // Keep the highest severity version
            result.push(groupChecks[0]);
        }
    }

    return result;
}
