/**
 * Behavioral Heuristics Orchestrator
 *
 * Combines two complementary analysis layers:
 *
 * Layer 1 - Category Heuristics (all users):
 *   Static knowledge base matching app category to known rejection patterns.
 *   Runs synchronously, no external calls.
 *
 * Layer 2 - ASC Review History (connected users only):
 *   Analyzes the user's actual App Store Connect submission history.
 *   Requires ASC connection. Gracefully skipped if unavailable.
 *
 * Together these layers add behavioral context that pure rule-based
 * analysis misses — a Finance app with 3 consecutive rejections gets
 * very different advice than a first-time Photo app.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { HardRulesInput, CheckResult } from '../types';
import { matchCategoryHeuristics } from './category-heuristics';
import { analyzeASCHistory } from './asc-review-history';

export interface BehavioralHeuristicsOptions {
    userId?: string;
    ascEncryptionKey?: string;
}

/**
 * Run all behavioral heuristic checks.
 *
 * Layer 1 (category) always runs.
 * Layer 2 (ASC history) runs only when userId and ascEncryptionKey are provided.
 */
export async function runBehavioralHeuristics(
    input: HardRulesInput,
    supabase: SupabaseClient<Database>,
    options?: BehavioralHeuristicsOptions,
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Layer 1: Category heuristics (sync, all users)
    const categoryChecks = matchCategoryHeuristics(input);
    results.push(...categoryChecks);

    if (categoryChecks.length > 0) {
        console.log('[BehavioralHeuristics] Category heuristics found', categoryChecks.length, 'checks');
    }

    // Layer 2: ASC review history (async, connected users only)
    if (options?.userId && options?.ascEncryptionKey) {
        const ascChecks = await analyzeASCHistory(supabase, options.userId, options.ascEncryptionKey);
        results.push(...ascChecks);

        if (ascChecks.length > 0) {
            console.log('[BehavioralHeuristics] ASC history found', ascChecks.length, 'checks');
        }
    }

    return results;
}
