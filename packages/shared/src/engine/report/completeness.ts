import type { ScoreResult } from '../types';

/**
 * Completeness is a lightweight indicator of how many key artifacts were available
 * for analysis. It is intentionally separate from the rejection "risk" score.
 *
 * We treat these as the main evidence sources:
 * - Screenshots
 * - Privacy manifest
 * - Info.plist
 * - IPA binary
 */
export function computeCompleteness(scores: Pick<
    ScoreResult,
    'score_screenshots' | 'score_privacy' | 'score_plist' | 'score_ipa_binary'
>): number {
    const provided = [
        scores.score_screenshots,
        scores.score_privacy,
        scores.score_plist,
        scores.score_ipa_binary,
    ].filter((v) => v !== null && v !== undefined).length;

    return Math.round((provided / 4) * 100);
}

