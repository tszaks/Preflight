import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

export interface CalibrationData {
    /** False positive rate per check category (0-1) */
    false_positive_rates: Record<string, number>;
    /** Total feedback count per category */
    feedback_counts: Record<string, number>;
}

/**
 * Fetches aggregated false-positive rates from user feedback.
 * Used to auto-calibrate AI severity: if >50% of users mark a
 * finding type as false positive, we auto-downgrade its severity.
 */
export async function getCalibrationData(
    supabase: SupabaseClient<Database>
): Promise<CalibrationData> {
    const result: CalibrationData = {
        false_positive_rates: {},
        feedback_counts: {},
    };

    try {
        // Query feedback aggregates grouped by category
        const { data } = await supabase
            .from('report_items')
            .select('category, user_feedback')
            .not('user_feedback', 'is', null);

        if (!data || data.length === 0) return result;

        // Aggregate by category
        const categoryStats: Record<string, { total: number; false_positives: number }> = {};

        for (const item of data) {
            const cat = item.category;
            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, false_positives: 0 };
            }
            categoryStats[cat].total++;
            if (item.user_feedback === 'false_positive') {
                categoryStats[cat].false_positives++;
            }
        }

        for (const [cat, stats] of Object.entries(categoryStats)) {
            result.false_positive_rates[cat] = stats.total > 0
                ? stats.false_positives / stats.total
                : 0;
            result.feedback_counts[cat] = stats.total;
        }
    } catch (error) {
        console.error('[Calibration] Failed to fetch calibration data:', error);
    }

    return result;
}

/**
 * Format calibration data as text for injection into AI prompts.
 * Only includes categories with meaningful feedback (10+ responses).
 */
export function formatCalibrationContext(data: CalibrationData): string {
    const lines: string[] = [];
    let hasData = false;

    for (const [cat, rate] of Object.entries(data.false_positive_rates)) {
        const count = data.feedback_counts[cat] || 0;
        if (count < 10) continue; // Not enough data to be meaningful

        hasData = true;
        const pct = Math.round(rate * 100);

        if (pct > 50) {
            lines.push(`- CAUTION: ${cat} findings have a ${pct}% false positive rate (${count} feedback samples). Be extra conservative with this category.`);
        } else if (pct > 30) {
            lines.push(`- NOTE: ${cat} findings have a ${pct}% false positive rate. Double-check before flagging.`);
        }
    }

    if (!hasData) return '';

    return `\n=== HISTORICAL CALIBRATION DATA ===\n${lines.join('\n')}\n=== END CALIBRATION ===`;
}
