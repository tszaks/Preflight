/**
 * Auto-detection from App Store Connect data.
 * Highest confidence source (95) since it's Apple's own data.
 */

import type { DetectionSource } from './index';

export interface AscDetectionInput {
    signInRequired?: boolean;
    subscriptions?: Array<{ state: string; name?: string }>;
    inAppPurchases?: Array<{ state: string; name?: string; type?: string }>;
    category?: string;
}

/**
 * Detect app characteristics from App Store Connect data.
 * ASC is the most authoritative source since it reflects what Apple already knows.
 */
export function detectFromAsc(asc: AscDetectionInput): DetectionSource[] {
    const detections: DetectionSource[] = [];

    // Sign-in required (from ASC review detail)
    if (asc.signInRequired !== undefined) {
        detections.push({
            field: 'sign_in_required',
            value: asc.signInRequired,
            source: 'asc',
            confidence: 95,
            evidence: asc.signInRequired
                ? 'App requires sign-in (App Store Connect)'
                : 'No sign-in required (App Store Connect)',
        });
    }

    // Subscriptions (exclude REMOVED state)
    if (asc.subscriptions) {
        const activeSubscriptions = asc.subscriptions.filter(
            s => s.state !== 'REMOVED' && s.state !== 'DEVELOPER_REMOVED_FROM_SALE'
        );
        detections.push({
            field: 'has_subscriptions',
            value: activeSubscriptions.length > 0,
            source: 'asc',
            confidence: 95,
            evidence: activeSubscriptions.length > 0
                ? `${activeSubscriptions.length} subscription${activeSubscriptions.length > 1 ? 's' : ''} configured (App Store Connect)`
                : 'No active subscriptions (App Store Connect)',
        });
    }

    // In-app purchases (exclude REMOVED state)
    if (asc.inAppPurchases) {
        const activeIAPs = asc.inAppPurchases.filter(
            p => p.state !== 'REMOVED' && p.state !== 'DEVELOPER_REMOVED_FROM_SALE'
        );
        detections.push({
            field: 'has_iap',
            value: activeIAPs.length > 0,
            source: 'asc',
            confidence: 95,
            evidence: activeIAPs.length > 0
                ? `${activeIAPs.length} in-app purchase${activeIAPs.length > 1 ? 's' : ''} configured (App Store Connect)`
                : 'No active in-app purchases (App Store Connect)',
        });
    }

    // Category
    if (asc.category) {
        detections.push({
            field: 'category',
            value: asc.category,
            source: 'asc',
            confidence: 95,
            evidence: `Category: ${asc.category} (App Store Connect)`,
        });
    }

    return detections;
}
