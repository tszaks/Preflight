/**
 * Conditional Warnings - Form-field-based warnings for common rejection reasons
 *
 * These checks analyze submission metadata (not files) to catch common
 * App Store rejection reasons that developers often miss.
 *
 * When developers explicitly confirm feature presence/absence, confidence
 * increases dramatically (30 → 90+), allowing severity to be upgraded
 * through the confidence-severity capping system.
 */

import type { CheckResult } from '../types';

export interface ConditionalWarningsInput {
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
    // Explicit feature confirmations (null = not asked, true = exists, false = missing)
    has_account_deletion?: boolean | null;
    has_restore_purchases?: boolean | null;
}

/**
 * Checks for common App Store rejection reasons based on app characteristics.
 *
 * Apple Requirements Checked:
 * 1. Account Deletion (Guideline 5.1.1) - Required if app has sign-in
 * 2. Restore Purchases (Guideline 3.1.1) - Required if app has IAP/subscriptions
 * 3. Sign in with Apple (Guideline 4.8) - Required if app has third-party login
 *
 * Severity Logic (with explicit confirmations):
 * - Developer confirmed feature EXISTS (true)  → severity: 'pass' (verified)
 * - Developer confirmed feature MISSING (false) → severity: 'critical', confidence: 90
 * - Not asked / unknown (null)                  → severity: 'info', confidence: 30 (reminder only)
 */
export function checkConditionalWarnings(input: ConditionalWarningsInput): CheckResult[] {
    const results: CheckResult[] = [];

    // === 1. Account Deletion Requirement ===
    // Apple Guideline 5.1.1: Apps that support account creation must also offer account deletion
    // This became mandatory June 30, 2022
    if (input.sign_in_required) {
        if (input.has_account_deletion === true) {
            // Developer confirmed the feature exists — pass
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
            // Developer confirmed the feature is MISSING — critical (high confidence)
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
            // Not asked / unknown — low confidence reminder
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Verify account deletion feature is implemented',
                description:
                    'Your app requires sign-in, which means Apple requires you to provide a way for users ' +
                    'to delete their account from within the app. This has been a mandatory requirement since ' +
                    'June 30, 2022. PreFlight cannot verify this from your submission files — please confirm ' +
                    'this feature exists in your app before submitting.',
                guideline_ref: '5.1.1',
                fix_suggestion:
                    'Ensure your app has a "Delete Account" option in settings or account section. ' +
                    'The deletion must be easy to find (not buried in menus) and must delete the account ' +
                    'within 7 days. If you need to retain data for legal reasons, clearly explain this to users.',
                confidence: 30,
            });
        }

        results.push({
            category: 'content_policy',
            severity: 'info',
            title: 'Demo credentials provided for review',
            description:
                'Since your app requires sign-in, make sure your demo credentials work and the ' +
                'test account has access to all features the reviewer needs to evaluate.',
            guideline_ref: '2.1',
            fix_suggestion:
                'Test your demo credentials before submission. Ensure the account is not expired, ' +
                'has premium features unlocked if applicable, and contains sample data to review.',
            confidence: 100,
        });
    }

    // === 2. Restore Purchases Requirement ===
    // Apple Guideline 3.1.1: Apps with IAP must include a "Restore Purchases" button
    if (input.has_iap || input.has_subscriptions) {
        if (input.has_restore_purchases === true) {
            // Developer confirmed the feature exists — pass
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
            // Developer confirmed the feature is MISSING — critical (high confidence)
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
            // Not asked / unknown — low confidence reminder
            results.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Verify "Restore Purchases" button is implemented',
                description:
                    'Your app has in-app purchases or subscriptions. Apple requires a clearly visible ' +
                    '"Restore Purchases" button that allows users to restore previously purchased content ' +
                    'when they reinstall the app or switch devices. PreFlight cannot verify this from your ' +
                    'submission files — please confirm this feature exists in your app before submitting.',
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
        results.push({
            category: 'content_policy',
            severity: 'warning',
            title: 'Subscription terms must be clearly displayed',
            description:
                'Apps with auto-renewable subscriptions must clearly display subscription terms ' +
                'including price, duration, and that payment will be charged to iTunes Account. ' +
                'Cancellation and renewal information must also be visible.',
            guideline_ref: '3.1.2',
            fix_suggestion:
                'On your paywall/subscription screen, display: (1) Price per period, ' +
                '(2) Subscription duration, (3) "Payment will be charged to your Apple ID account", ' +
                '(4) "Subscription automatically renews unless canceled at least 24 hours before the end of the current period", ' +
                '(5) Link to Terms of Service and Privacy Policy.',
            confidence: 50,
        });
    }

    // === 4. Sign in with Apple Requirement ===
    // Apple Guideline 4.8: If you offer third-party login (Google, Facebook, etc.),
    // you MUST also offer Sign in with Apple as an option
    if (input.has_third_party_login) {
        results.push({
            category: 'content_policy',
            severity: 'critical',
            title: 'Sign in with Apple required',
            description:
                'Your app uses third-party login services (like Google, Facebook, or Twitter). ' +
                'Apple requires that you also offer Sign in with Apple as an equally prominent option. ' +
                'This is a mandatory requirement since April 2020 and a common rejection reason.',
            guideline_ref: '4.8',
            fix_suggestion:
                'Add Sign in with Apple button alongside your other social login options. ' +
                'It must be the same size and prominence as other login buttons. ' +
                'Use Apple\'s official Sign in with Apple button assets and follow their HIG.',
            confidence: 40,
        });
    }

    return results;
}
