/**
 * Behavioral Heuristics Orchestrator
 *
 * Runs static category heuristics bundled with the local CLI.
 */

import type { HardRulesInput, CheckResult } from '../types';
import { matchCategoryHeuristics } from './category-heuristics';

/**
 * Run local behavioral heuristic checks.
 */
export async function runBehavioralHeuristics(
    input: HardRulesInput,
): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const categoryChecks = matchCategoryHeuristics(input);
    results.push(...categoryChecks);

    return results;
}
