/**
 * Approval prediction model (V1: rule-based).
 *
 * Maps analysis features to an estimated probability of App Store approval.
 * This is a heuristic model based on known Apple review patterns.
 * Future versions can use ML trained on actual submission outcomes.
 */

import type { PredictionFeatures } from './features';

export interface PredictionResult {
    /** Estimated approval probability (0-100) */
    probability: number;
    /** Margin of error (±percentage points) */
    margin: number;
    /** Human-readable verdict */
    verdict: 'likely_approved' | 'needs_fixes' | 'likely_rejected';
    /** Key factors driving the prediction */
    factors: PredictionFactor[];
}

interface PredictionFactor {
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
}

/**
 * Predict likelihood of App Store approval.
 */
export function predictApproval(features: PredictionFeatures): PredictionResult {
    let probability = 95; // Start optimistic
    const factors: PredictionFactor[] = [];

    // === Critical Issues (strongest negative signal) ===
    if (features.high_confidence_criticals > 0) {
        const penalty = Math.min(50, features.high_confidence_criticals * 20);
        probability -= penalty;
        factors.push({
            label: `${features.high_confidence_criticals} high-confidence critical issue(s)`,
            impact: 'negative',
            weight: penalty,
        });
    }

    // Additional low-confidence criticals
    const lowConfCriticals = features.critical_count - features.high_confidence_criticals;
    if (lowConfCriticals > 0) {
        const penalty = Math.min(20, lowConfCriticals * 8);
        probability -= penalty;
        factors.push({
            label: `${lowConfCriticals} lower-confidence critical issue(s)`,
            impact: 'negative',
            weight: penalty,
        });
    }

    // === Warnings ===
    if (features.warning_count > 0) {
        const penalty = Math.min(15, features.warning_count * 3);
        probability -= penalty;
        factors.push({
            label: `${features.warning_count} warning(s)`,
            impact: 'negative',
            weight: penalty,
        });
    }

    // === Privacy (biggest rejection category in 2024-2025) ===
    if (features.has_privacy_issues) {
        probability -= 15;
        factors.push({
            label: 'Privacy compliance issues detected',
            impact: 'negative',
            weight: 15,
        });
    }

    if (!features.has_privacy_manifest) {
        probability -= 10;
        factors.push({
            label: 'Missing privacy manifest',
            impact: 'negative',
            weight: 10,
        });
    }

    // === Metadata quality ===
    if (features.has_metadata_issues) {
        probability -= 10;
        factors.push({
            label: 'Metadata compliance issues',
            impact: 'negative',
            weight: 10,
        });
    }

    // === Content policy ===
    if (features.has_content_issues) {
        probability -= 12;
        factors.push({
            label: 'Content policy concerns',
            impact: 'negative',
            weight: 12,
        });
    }

    // === Positive signals ===
    if (features.overall_score >= 90) {
        factors.push({
            label: 'High overall compliance score',
            impact: 'positive',
            weight: 5,
        });
    }

    if (features.pass_count > features.critical_count + features.warning_count) {
        factors.push({
            label: 'Majority of checks passed',
            impact: 'positive',
            weight: 3,
        });
    }

    // Clamp probability
    probability = Math.max(5, Math.min(99, probability));

    // Calculate margin of error (wider when we have less data)
    const margin = calculateMargin(features);

    // Determine verdict
    let verdict: PredictionResult['verdict'];
    if (probability >= 80) {
        verdict = 'likely_approved';
    } else if (probability >= 50) {
        verdict = 'needs_fixes';
    } else {
        verdict = 'likely_rejected';
    }

    // Sort factors by weight (most impactful first)
    factors.sort((a, b) => b.weight - a.weight);

    return { probability, margin, verdict, factors };
}

function calculateMargin(features: PredictionFeatures): number {
    let margin = 5; // Base margin

    // More data = tighter margin
    const totalChecks = features.critical_count + features.warning_count + features.info_count + features.pass_count;
    if (totalChecks < 10) margin += 5;
    if (totalChecks < 5) margin += 5;

    // Missing inputs widen margin
    if (!features.has_screenshots) margin += 3;
    if (!features.has_plist) margin += 3;
    if (!features.has_privacy_manifest) margin += 2;

    return Math.min(20, margin);
}
