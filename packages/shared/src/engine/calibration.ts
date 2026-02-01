import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export interface CalibrationData {
    /** False positive rate per check category (0-1) */
    false_positive_rates: Record<string, number>;
    /** Total feedback count per category */
    feedback_counts: Record<string, number>;
    /** False positive rate per title, keyed by "category::title" (0-1) */
    title_false_positive_rates: Record<string, number>;
    /** Total feedback count per title, keyed by "category::title" */
    title_feedback_counts: Record<string, number>;
    /** Whether calibration data was successfully loaded from the database */
    loaded: boolean;
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
        title_false_positive_rates: {},
        title_feedback_counts: {},
        loaded: false,
    };

    try {
        // Query feedback aggregates grouped by category and title
        const { data, error } = await supabase
            .from('report_items')
            .select('category, title, user_feedback')
            .not('user_feedback', 'is', null);

        if (error) {
            console.error('[Calibration] Database query failed:', error);
            return result; // loaded: false signals DB failure
        }

        if (!data || data.length === 0) {
            result.loaded = true; // DB succeeded, just no data yet
            return result;
        }

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

        // Aggregate by title (keyed as "category::title")
        const titleStats: Record<string, { total: number; false_positives: number }> = {};

        for (const item of data) {
            const key = `${item.category}::${item.title}`;
            if (!titleStats[key]) {
                titleStats[key] = { total: 0, false_positives: 0 };
            }
            titleStats[key].total++;
            if (item.user_feedback === 'false_positive') {
                titleStats[key].false_positives++;
            }
        }

        for (const [key, stats] of Object.entries(titleStats)) {
            result.title_false_positive_rates[key] = stats.total > 0
                ? stats.false_positives / stats.total
                : 0;
            result.title_feedback_counts[key] = stats.total;
        }

        result.loaded = true;
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

    // Title-level calibration (more granular, 5+ samples threshold)
    for (const [key, rate] of Object.entries(data.title_false_positive_rates)) {
        const count = data.title_feedback_counts[key] || 0;
        if (count < 5) continue; // Not enough title-level data

        const pct = Math.round(rate * 100);
        if (pct > 30) {
            hasData = true;
            lines.push(`- TITLE CAUTION: "${key}" has a ${pct}% false positive rate (${count} samples).`);
        }
    }

    if (!hasData) return '';

    return `\n=== HISTORICAL CALIBRATION DATA ===\n${lines.join('\n')}\n=== END CALIBRATION ===`;
}
