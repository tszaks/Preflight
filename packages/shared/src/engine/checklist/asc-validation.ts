/**
 * ASC Data Validation Rules
 * 
 * Validates App Store Connect data against submission requirements.
 * These are Tier 1 (automated) rules that cross-reference ASC-fetched data
 * against user declarations and Apple requirements.
 */

import type { CheckResult, SoftRulesInput } from '../types';

// Minimum required screenshots per device type
const MIN_SCREENSHOTS_PER_DEVICE = 3;

// Device types that require screenshots
const REQUIRED_DEVICE_TYPES = [
    'APP_IPHONE_67',
    'APP_IPHONE_65',
    'APP_IPHONE_61',
    'APP_IPHONE_55',
];

/**
 * Validates ASC-fetched data for completeness and consistency.
 * 
 * Checks performed:
 * 1. Screenshot completeness (minimum 3 per required device)
 * 2. Subscription state validation (no MISSING_METADATA)
 * 3. IAP state validation (approved/ready)
 * 4. Age rating mismatch detection
 * 5. Review contact completeness
 * 6. Copyright field presence
 */
export function checkAscData(input: SoftRulesInput): CheckResult[] {
    const checks: CheckResult[] = [];

    // ─── Screenshot Completeness ─────────────────────────────────────────────
    if (input.asc_screenshots && input.asc_screenshots.length > 0) {
        for (const screenshot of input.asc_screenshots) {
            // Check if this is a required device type
            const isRequiredDevice = REQUIRED_DEVICE_TYPES.some(dt =>
                screenshot.deviceType.includes(dt) || dt.includes(screenshot.deviceType)
            );

            if (isRequiredDevice && screenshot.count < MIN_SCREENSHOTS_PER_DEVICE) {
                checks.push({
                    category: 'screenshots',
                    severity: screenshot.count === 0 ? 'critical' : 'warning',
                    title: `Insufficient screenshots for ${formatDeviceName(screenshot.deviceType)}`,
                    description: `You have ${screenshot.count} screenshot(s) for ${formatDeviceName(screenshot.deviceType)}, but Apple requires at least ${MIN_SCREENSHOTS_PER_DEVICE}. Missing screenshots will cause your submission to be incomplete.`,
                    guideline_ref: 'App Store Connect Screenshot Requirements',
                    fix_suggestion: `Upload at least ${MIN_SCREENSHOTS_PER_DEVICE - screenshot.count} more screenshot(s) for ${formatDeviceName(screenshot.deviceType)}.`,
                    confidence: 100,
                });
            }
        }

        // Check if any required device types have NO screenshots at all
        const uploadedDeviceTypes = input.asc_screenshots.map(s => s.deviceType);
        const hasAnyIPhoneScreenshots = uploadedDeviceTypes.some(dt =>
            dt.includes('IPHONE') || dt.includes('iPhone')
        );

        if (!hasAnyIPhoneScreenshots) {
            checks.push({
                category: 'screenshots',
                severity: 'critical',
                title: 'No iPhone screenshots uploaded to App Store Connect',
                description: 'Your App Store Connect account shows no iPhone screenshots. At least one set of iPhone screenshots is required for submission.',
                guideline_ref: 'App Store Connect Screenshot Requirements',
                fix_suggestion: 'Upload screenshots for at least one iPhone screen size (6.7", 6.5", 6.1", or 5.5").',
                confidence: 100,
            });
        }
    }

    // ─── Subscription State Validation ───────────────────────────────────────
    if (input.asc_subscriptions && input.asc_subscriptions.length > 0) {
        const problematicSubs = input.asc_subscriptions.filter(s =>
            s.state === 'MISSING_METADATA' ||
            s.state === 'WAITING_FOR_REVIEW' ||
            s.state === 'REJECTED'
        );

        for (const sub of problematicSubs) {
            const severity = sub.state === 'REJECTED' ? 'critical' : 'warning';
            checks.push({
                category: 'content_policy',
                severity,
                title: `Subscription "${sub.name}" is ${formatState(sub.state)}`,
                description: `Your subscription "${sub.name}" (${sub.productId}) has a state of ${sub.state}. This may prevent your app from being submitted or cause issues during review.`,
                guideline_ref: '3.1.1 — In-App Purchase',
                fix_suggestion: sub.state === 'MISSING_METADATA'
                    ? 'Complete all required metadata for this subscription in App Store Connect: localized name, description, and pricing.'
                    : sub.state === 'REJECTED'
                        ? 'Review the rejection reason in App Store Connect and fix the subscription configuration.'
                        : 'Wait for the subscription to complete review, or contact Apple if it has been pending for more than a few days.',
                confidence: 100,
            });
        }

        // Cross-reference: user declared has_subscriptions but ASC shows none
        if (input.has_subscriptions && input.asc_subscriptions.length === 0) {
            checks.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'Subscription declaration mismatch',
                description: 'You indicated your app has subscriptions, but no subscriptions are configured in App Store Connect. This may cause your submission to be rejected.',
                guideline_ref: '3.1 — Payments',
                fix_suggestion: 'Either configure your subscriptions in App Store Connect, or update your submission to indicate that your app does not have subscriptions.',
                confidence: 95,
            });
        }
    }

    // ─── IAP State Validation ────────────────────────────────────────────────
    if (input.asc_in_app_purchases && input.asc_in_app_purchases.length > 0) {
        const problematicIAPs = input.asc_in_app_purchases.filter(iap =>
            iap.state === 'MISSING_METADATA' ||
            iap.state === 'WAITING_FOR_REVIEW' ||
            iap.state === 'REJECTED'
        );

        for (const iap of problematicIAPs) {
            const severity = iap.state === 'REJECTED' ? 'critical' : 'warning';
            checks.push({
                category: 'content_policy',
                severity,
                title: `In-App Purchase "${iap.name}" is ${formatState(iap.state)}`,
                description: `Your in-app purchase "${iap.name}" (${iap.productId}) has a state of ${iap.state}. This may prevent your app from being submitted.`,
                guideline_ref: '3.1.1 — In-App Purchase',
                fix_suggestion: iap.state === 'MISSING_METADATA'
                    ? 'Complete all required metadata for this in-app purchase: localized name, description, and pricing.'
                    : iap.state === 'REJECTED'
                        ? 'Review the rejection reason and fix the IAP configuration.'
                        : 'Wait for the IAP to complete review.',
                confidence: 100,
            });
        }

        // Cross-reference: user declared has_iap but ASC shows none
        if (input.has_iap && input.asc_in_app_purchases.length === 0) {
            checks.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'In-App Purchase declaration mismatch',
                description: 'You indicated your app has in-app purchases, but none are configured in App Store Connect.',
                guideline_ref: '3.1 — Payments',
                fix_suggestion: 'Either configure your in-app purchases in App Store Connect, or update your submission to indicate that your app does not have IAPs.',
                confidence: 95,
            });
        }
    }

    // ─── Age Rating Validation ───────────────────────────────────────────────
    if (input.asc_age_rating && input.age_rating) {
        // Check for rating mismatch
        const userRating = input.age_rating.toUpperCase().replace(/[^0-9+]/g, '');
        const ascRating = input.asc_age_rating.rating || '';

        if (ascRating && !ratingMatches(userRating, ascRating)) {
            checks.push({
                category: 'metadata',
                severity: 'warning',
                title: 'Age rating mismatch between submission and App Store Connect',
                description: `Your submission declares an age rating of "${input.age_rating}", but App Store Connect shows "${ascRating}". This inconsistency may cause confusion or rejection.`,
                guideline_ref: 'Age Rating Guidelines',
                fix_suggestion: 'Ensure your age rating declarations are consistent between your submission and App Store Connect.',
                confidence: 85,
            });
        }

        // Check for gambling content without appropriate rating
        if (input.asc_age_rating.gambling && !input.asc_age_rating.seventeenPlus) {
            checks.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'Gambling content may require higher age rating',
                description: 'Your app is marked as containing gambling content in App Store Connect, but the age rating may not reflect this appropriately.',
                guideline_ref: '5.3.4 — Gambling',
                fix_suggestion: 'Review your age rating questionnaire answers in App Store Connect to ensure gambling content is properly declared.',
                confidence: 80,
            });
        }
    }

    // ─── Review Contact Completeness ─────────────────────────────────────────
    if (input.asc_review_contact) {
        const contact = input.asc_review_contact;
        const missingFields: string[] = [];

        if (!contact.firstName) missingFields.push('first name');
        if (!contact.email) missingFields.push('email');
        if (!contact.phone) missingFields.push('phone number');

        if (missingFields.length > 0) {
            checks.push({
                category: 'metadata',
                severity: 'info',
                title: 'Review contact information incomplete',
                description: `Your App Store Connect review contact is missing: ${missingFields.join(', ')}. While not always required, complete contact information can help Apple reach you if they have questions during review.`,
                fix_suggestion: 'Add complete contact information in App Store Connect under App Review Information.',
                confidence: 70,
            });
        }
    }

    // ─── Copyright Validation ────────────────────────────────────────────────
    if (input.asc_copyright) {
        // Check for placeholder or missing copyright
        const copyright = input.asc_copyright.toLowerCase();
        if (
            copyright.includes('copyright') && copyright.length < 20 ||
            copyright === 'tbd' ||
            copyright === 'todo' ||
            copyright.includes('placeholder')
        ) {
            checks.push({
                category: 'metadata',
                severity: 'warning',
                title: 'Copyright field appears incomplete',
                description: `Your copyright field "${input.asc_copyright}" may be a placeholder. Apple requires a valid copyright string like "© 2026 Your Company Name".`,
                guideline_ref: '2.3 — Accurate Metadata',
                fix_suggestion: 'Update your copyright to include the year and your legal entity name, e.g., "© 2026 Your Company LLC".',
                confidence: 75,
            });
        }
    }

    return checks;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatDeviceName(deviceType: string): string {
    const mapping: Record<string, string> = {
        'APP_IPHONE_67': 'iPhone 6.7"',
        'APP_IPHONE_65': 'iPhone 6.5"',
        'APP_IPHONE_61': 'iPhone 6.1"',
        'APP_IPHONE_55': 'iPhone 5.5"',
        'APP_IPAD_PRO_129': 'iPad Pro 12.9"',
        'APP_IPAD_PRO_11': 'iPad Pro 11"',
    };
    return mapping[deviceType] || deviceType.replace(/_/g, ' ').toLowerCase();
}

function formatState(state: string): string {
    const mapping: Record<string, string> = {
        'MISSING_METADATA': 'missing required metadata',
        'WAITING_FOR_REVIEW': 'pending review',
        'REJECTED': 'rejected',
        'APPROVED': 'approved',
        'READY_TO_SUBMIT': 'ready',
    };
    return mapping[state] || state.toLowerCase().replace(/_/g, ' ');
}

function ratingMatches(userRating: string, ascRating: string): boolean {
    // Normalize both ratings for comparison
    const normalizedUser = userRating.replace(/[^0-9]/g, '');
    const normalizedAsc = ascRating.replace(/[^0-9]/g, '');

    // If we can extract numbers, compare them
    if (normalizedUser && normalizedAsc) {
        return normalizedUser === normalizedAsc;
    }

    // Fallback to partial match
    return ascRating.toLowerCase().includes(userRating.toLowerCase()) ||
        userRating.toLowerCase().includes(ascRating.toLowerCase());
}
