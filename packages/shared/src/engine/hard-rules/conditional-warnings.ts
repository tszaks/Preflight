/**
 * Conditional Warnings - Form-field-based warnings for common rejection reasons
 *
 * These checks analyze submission metadata (not files) to catch common
 * App Store rejection reasons that developers often miss.
 *
 * When developers explicitly confirm feature presence/absence, confidence
 * increases dramatically (30 -> 90+), allowing severity to be upgraded
 * through the confidence-severity capping system.
 *
 * Auto-detected signals (from binary/entitlements/plist) further boost
 * confidence when they corroborate user answers or stand alone.
 */

import type { CheckResult } from '../types';

export interface ConditionalWarningsInput {
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
    detected_third_party_login?: boolean;
    detected_third_party_login_confidence?: number;
    // Explicit feature confirmations (null = not asked, true = exists, false = missing)
    has_account_deletion?: boolean | null;
    has_restore_purchases?: boolean | null;
    // Self-report fields
    subscription_terms_on_paywall?: boolean | null;
    has_health_disclaimers?: boolean | null;
    // Auto-detected signals (from binary/entitlements/plist)
    detected_healthkit?: boolean;
    detected_background_location?: boolean;
    detected_sign_in_with_apple?: boolean;
    detected_push_notifications?: boolean;
    detected_vpn?: boolean;
    detected_apple_pay?: boolean;
    category?: string | null;
}

/**
 * Checks for common App Store rejection reasons based on app characteristics.
 *
 * Apple Requirements Checked:
 * 1. Account Deletion (Guideline 5.1.1) - Required if app has sign-in
 * 2. Restore Purchases (Guideline 3.1.1) - Required if app has IAP/subscriptions
 * 3. Sign in with Apple (Guideline 4.8) - Required if app has third-party login
 * 4. Subscription terms (Guideline 3.1.2) - Required if app has subscriptions
 * 5. HealthKit disclaimers (Guideline 1.4.1) - Required if app uses HealthKit
 * 6. Background location justification (Guideline 2.5.4)
 * 7. Category-specific scrutiny (Finance, Medical)
 * 8. VPN additional review scrutiny
 *
 * Severity Logic (with explicit confirmations):
 * - Developer confirmed feature EXISTS (true)  -> severity: 'pass' (verified)
 * - Developer confirmed feature MISSING (false) -> severity: 'critical', confidence: 90
 * - Not asked / unknown (null)                  -> severity: 'info', confidence: 30 (reminder only)
 */
export function checkConditionalWarnings(input: ConditionalWarningsInput): CheckResult[] {
    const results: CheckResult[] = [];

    // === 1. Account Deletion Requirement ===
    // Apple Guideline 5.1.1: Apps that support account creation must also offer account deletion
    // This became mandatory June 30, 2022
    if (input.sign_in_required) {
        if (input.has_account_deletion === true) {
            // Developer confirmed the feature exists - pass
            results.push({
                category: 'content_policy',
                severity: 'pass',
                title: 'Account deletion feature confirmed',
                description:
                    'You confirmed your app includes an account deletion option, as required by Apple ' +
                    'Guideline 5.1.1. Make sure it is easy to find and completes within 7 days.',
                guideline_ref: '5.1.1',
                confidence: 100,
            });
        } else if (input.has_account_deletion === false) {
            // Developer confirmed the feature is MISSING - critical (high confidence)
            results.push({
                category: 'content_policy',
                severity: 'critical',
                title: 'Account deletion feature is missing',
                description:
                    'You indicated your app does NOT have an account deletion option. Apple requires all apps ' +
                    'with sign-in to provide account deletion (Guideline 5.1.1, mandatory since June 30, 2022). ' +
                    'This is a guaranteed rejection reason.',
                guideline_ref: '5.1.1',
                fix_suggestion:
                    'Add a "Delete Account" option in your settings or account section. ' +
                    'The deletion must be easy to find (not buried in menus) and must delete the account ' +
                    'within 7 days. If you need to retain data for legal reasons, clearly explain this to users.',
                confidence: 90,
            });
        } else {
            // Not asked / unknown - low confidence reminder
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Verify account deletion feature is implemented',
                description:
                    'Your app requires sign-in, which means Apple requires you to provide a way for users ' +
                    'to delete their account from within the app. This has been a mandatory requirement since ' +
                    'June 30, 2022. PreFlight cannot verify this from your submission files -- please confirm ' +
                    'this feature exists in your app before submitting.',
                guideline_ref: '5.1.1',
                fix_suggestion:
                    'Ensure your app has a "Delete Account" option in settings or account section. ' +
                    'The deletion must be easy to find (not buried in menus) and must delete the account ' +
                    'within 7 days. If you need to retain data for legal reasons, clearly explain this to users.',
                confidence: 30,
            });
        }

    }

    // === 2. Restore Purchases Requirement ===
    // Apple Guideline 3.1.1: Apps with IAP must include a "Restore Purchases" button
    if (input.has_iap || input.has_subscriptions) {
        if (input.has_restore_purchases === true) {
            // Developer confirmed the feature exists - pass
            results.push({
                category: 'content_policy',
                severity: 'pass',
                title: 'Restore Purchases feature confirmed',
                description:
                    'You confirmed your app includes a "Restore Purchases" button, as required by Apple ' +
                    'Guideline 3.1.1. Make sure it is clearly visible without requiring a purchase first.',
                guideline_ref: '3.1.1',
                confidence: 100,
            });
        } else if (input.has_restore_purchases === false) {
            // Developer confirmed the feature is MISSING - critical (high confidence)
            results.push({
                category: 'content_policy',
                severity: 'critical',
                title: '"Restore Purchases" button is missing',
                description:
                    'You indicated your app does NOT have a "Restore Purchases" button. Apple requires all apps ' +
                    'with in-app purchases or subscriptions to provide this functionality (Guideline 3.1.1). ' +
                    'This is a guaranteed rejection reason.',
                guideline_ref: '3.1.1',
                fix_suggestion:
                    'Add a "Restore Purchases" button in settings, subscription screen, or paywall. ' +
                    'It should call StoreKit\'s restoreCompletedTransactions() method. ' +
                    'Make sure it\'s visible without requiring a purchase first.',
                confidence: 90,
            });
        } else {
            // Not asked / unknown - low confidence reminder
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Verify "Restore Purchases" button is implemented',
                description:
                    'Your app has in-app purchases or subscriptions. Apple requires a clearly visible ' +
                    '"Restore Purchases" button that allows users to restore previously purchased content ' +
                    'when they reinstall the app or switch devices. PreFlight cannot verify this from your ' +
                    'submission files -- please confirm this feature exists in your app before submitting.',
                guideline_ref: '3.1.1',
                fix_suggestion:
                    'Ensure your app has a "Restore Purchases" button in settings, subscription screen, ' +
                    'or paywall. It should call StoreKit\'s restoreCompletedTransactions() method. ' +
                    'Make sure it\'s visible without requiring a purchase first.',
                confidence: 30,
            });
        }
    }

    // === 3. Subscription-specific warnings ===
    if (input.has_subscriptions) {
        if (input.subscription_terms_on_paywall === true) {
            results.push({
                category: 'content_policy',
                severity: 'pass',
                title: 'Subscription terms displayed on paywall',
                description:
                    'You confirmed subscription terms are displayed on your paywall, as required by Apple Guideline 3.1.2.',
                guideline_ref: '3.1.2',
                confidence: 100,
            });
        } else if (input.subscription_terms_on_paywall === false) {
            results.push({
                category: 'content_policy',
                severity: 'critical',
                title: 'Subscription terms missing from paywall',
                description:
                    'You indicated subscription terms are NOT displayed on your paywall. Apple requires all apps ' +
                    'with auto-renewable subscriptions to clearly display terms including price, duration, and ' +
                    'that payment will be charged to iTunes Account. Subscription commitment plans also need clear commitment pricing and cancellation terms.',
                guideline_ref: '3.1.2',
                fix_suggestion:
                    'On your paywall/subscription screen, display: (1) Price per period, ' +
                    '(2) Subscription duration, (3) "Payment will be charged to your Apple ID account", ' +
                    '(4) "Subscription automatically renews unless canceled at least 24 hours before the end of the current period", ' +
                    '(5) Link to Terms of Service and Privacy Policy. If using monthly billing with a 12-month commitment, also show the total commitment price, required payment count, and cancellation behavior.',
                confidence: 90,
            });
        } else {
            results.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'Subscription terms must be clearly displayed',
                description:
                    'Apps with auto-renewable subscriptions must clearly display subscription terms ' +
                    'including price, duration, and that payment will be charged to iTunes Account. ' +
                    'Cancellation and renewal information must also be visible. If the app offers monthly billing with a 12-month commitment, the total commitment price and required payment count should be clear before purchase.',
                guideline_ref: '3.1.2',
                fix_suggestion:
                    'On your paywall/subscription screen, display: (1) Price per period, ' +
                    '(2) Subscription duration, (3) "Payment will be charged to your Apple ID account", ' +
                    '(4) "Subscription automatically renews unless canceled at least 24 hours before the end of the current period", ' +
                    '(5) Link to Terms of Service and Privacy Policy. If using monthly billing with a 12-month commitment, also show the total commitment price, required payment count, and cancellation behavior.',
                confidence: 50,
            });
        }
    }

    // === 4. Sign in with Apple Requirement ===
    // Apple Guideline 4.8: If you offer third-party login (Google, Facebook, etc.),
    // you MUST also offer Sign in with Apple as an option
    const selfReportedThirdParty = input.has_third_party_login === true;
    const detectedThirdParty = input.detected_third_party_login === true;
    const siwaDetected = input.detected_sign_in_with_apple === true;
    const detectedThirdPartyConfidence = input.detected_third_party_login_confidence ?? (detectedThirdParty ? 85 : 60);

    if (selfReportedThirdParty || detectedThirdParty) {
        if (siwaDetected) {
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Sign in with Apple framework detected alongside third-party login',
                description:
                    'Third-party login appears to be present and AuthenticationServices framework was detected, ' +
                    'which likely includes Sign in with Apple. Ensure the SIWA button is equally prominent ' +
                    'as other login options.',
                guideline_ref: '4.8',
                confidence: detectedThirdParty ? 90 : 75,
            });
        } else if (detectedThirdParty) {
            results.push({
                category: 'content_policy',
                severity: 'critical',
                title: 'Sign in with Apple likely missing',
                description:
                    'Third-party login was detected, but the AuthenticationServices framework ' +
                    'was not detected in the binary. Apple requires Sign in with Apple as an equally ' +
                    'prominent option when offering third-party login (Guideline 4.8). ' +
                    'This is a common rejection reason.',
                guideline_ref: '4.8',
                fix_suggestion:
                    'Add Sign in with Apple alongside your other social login options. ' +
                    'It must be the same size and prominence as other login buttons. ' +
                    'Use Apple\'s official Sign in with Apple button assets and follow their HIG.',
                // Important: leave severity "critical" but let confidence-severity capping demote when detection is weak.
                confidence: detectedThirdPartyConfidence,
            });
        } else {
            results.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'Confirm whether you offer third-party login (SIWA requirement)',
                description:
                    'You indicated third-party social login (Google/Facebook/etc), but Preflight could not ' +
                    'confirm it from the IPA or Info.plist. If you do offer third-party login, Apple requires ' +
                    'Sign in with Apple as an equally prominent option (Guideline 4.8). If you do not, uncheck this item.',
                guideline_ref: '4.8',
                fix_suggestion:
                    'If you have Google/Facebook login: add Sign in with Apple. If you only use email/magic-link, uncheck third-party login.',
                confidence: 60,
            });
        }
    }

    // === 5. HealthKit + No Disclaimers ===
    // Guideline 1.4.1: Apps using HealthKit must provide health disclaimers
    if (input.detected_healthkit) {
        if (input.has_health_disclaimers === true) {
            results.push({
                category: 'content_policy',
                severity: 'pass',
                title: 'Health disclaimers confirmed',
                description:
                    'HealthKit was detected in your app and you confirmed health disclaimers are present. ' +
                    'Ensure disclaimers are visible before any health data is displayed.',
                guideline_ref: '1.4.1',
                confidence: 95,
            });
        } else if (input.has_health_disclaimers === false) {
            results.push({
                category: 'content_policy',
                severity: 'critical',
                title: 'HealthKit detected but health disclaimers missing',
                description:
                    'Your app uses HealthKit but you indicated health disclaimers are missing. ' +
                    'Apple requires apps using health data to clearly state that the app is not intended ' +
                    'to replace professional medical advice, diagnosis, or treatment.',
                guideline_ref: '1.4.1',
                fix_suggestion:
                    'Add a health disclaimer stating: "This app is not intended to be a substitute for ' +
                    'professional medical advice, diagnosis, or treatment." Display it before showing ' +
                    'any health data and include it in your Terms of Service.',
                confidence: 95,
            });
        } else {
            // Not asked yet - reminder
            results.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'HealthKit detected - verify health disclaimers exist',
                description:
                    'HealthKit framework was detected in your app binary. Apple requires apps that use health ' +
                    'data to include appropriate disclaimers stating the app is not a replacement for ' +
                    'professional medical advice (Guideline 1.4.1).',
                guideline_ref: '1.4.1',
                fix_suggestion:
                    'Add a health disclaimer before displaying any health data. Include it in your ' +
                    'Terms of Service as well.',
                confidence: 70,
            });
        }
    }

    // === 6. Background Location Justification ===
    // Guideline 2.5.4: Background location requires justification
    if (input.detected_background_location) {
        results.push({
            category: 'content_policy',
            severity: 'warning',
            title: 'Background location detected - justification required',
            description:
                'Your app declares background location in UIBackgroundModes. Apple requires a clear ' +
                'justification for continuous background location access. Apps that use background location ' +
                'without a compelling reason are frequently rejected.',
            guideline_ref: '2.5.4',
            fix_suggestion:
                'In your App Store review notes, explain specifically why your app needs background location. ' +
                'Valid reasons: turn-by-turn navigation, fitness tracking during workouts, location-based ' +
                'reminders. Apple will reject apps that use background location for analytics or advertising.',
            confidence: 90,
        });
    }

    // === 7. Category-Specific Warnings ===
    if (input.category) {
        const lowerCategory = input.category.toLowerCase();

        if (lowerCategory.includes('finance') || lowerCategory.includes('banking')) {
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Finance category: additional privacy scrutiny expected',
                description:
                    'Finance and banking apps receive enhanced privacy review from Apple. Ensure your app ' +
                    'clearly explains all data collection, has a comprehensive privacy policy, and uses ' +
                    'appropriate encryption for financial data.',
                guideline_ref: '5.1',
                confidence: 80,
            });
        }

        if (lowerCategory.includes('medical') || lowerCategory.includes('health')) {
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Health/Medical category: additional compliance requirements',
                description:
                    'Health and medical apps face stricter review. Ensure all health claims are substantiated, ' +
                    'include appropriate disclaimers, and comply with applicable regulations (HIPAA in the US, ' +
                    'GDPR health data provisions in the EU).',
                guideline_ref: '1.4',
                confidence: 80,
            });
        }
    }

    // === 8. VPN Additional Scrutiny ===
    if (input.detected_vpn) {
        results.push({
            category: 'content_policy',
            severity: 'info',
            title: 'VPN capability detected - expect extended review',
            description:
                'Your app uses the VPN API entitlement. VPN apps undergo additional review scrutiny from Apple. ' +
                'Ensure your app has a clear and comprehensive privacy policy explaining how network traffic ' +
                'is handled, what data is logged, and your data retention policy.',
            guideline_ref: '5.4',
            fix_suggestion:
                'Include a detailed privacy policy explaining: (1) What traffic data is logged, ' +
                '(2) Data retention periods, (3) Third-party data sharing policies, ' +
                '(4) Jurisdiction of data storage. Link this in both your app and App Store listing.',
            confidence: 90,
        });
    }

    return results;
}
