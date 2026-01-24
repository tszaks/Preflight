import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import type { CheckResult } from '../types';
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
    // Calculate scores
    const scores = calculateScores(checks);
    const counts = countBySeverity(checks);

    // Generate summary
    const summary = generateSummary(checks, scores.score_overall);

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
    const items = checks
        .filter(check => check.severity !== 'pass')
        .map(check => ({
            report_id: report.id,
            category: check.category,
            severity: check.severity,
            title: check.title,
            description: check.description,
            guideline_ref: check.guideline_ref || null,
            fix_suggestion: check.fix_suggestion || null,
        }));

    if (items.length > 0) {
        const { error: itemsError } = await supabase
            .from('report_items')
            .insert(items);

        if (itemsError) {
            console.error('Failed to insert report items:', itemsError);
            // Report was created, items partially failed
        }
    }

    // Update submission status
    await supabase
        .from('submissions')
        .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

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
