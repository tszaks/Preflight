/**
 * Conditional Warnings - Form-field-based warnings for common rejection reasons
 *
 * These checks analyze submission metadata (not files) to catch common
 * App Store rejection reasons that developers often miss.
 */

import type { CheckResult } from '../types';

export interface ConditionalWarningsInput {
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
}

/**
 * Checks for common App Store rejection reasons based on app characteristics.
 *
 * Apple Requirements Checked:
 * 1. Account Deletion (Guideline 5.1.1) - Required if app has sign-in
 * 2. Restore Purchases (Guideline 3.1.1) - Required if app has IAP/subscriptions
 * 3. Sign in with Apple (Guideline 4.8) - Required if app has third-party login
 */
export function checkConditionalWarnings(input: ConditionalWarningsInput): CheckResult[] {
    const results: CheckResult[] = [];

    // === 1. Account Deletion Requirement ===
    // Apple Guideline 5.1.1: Apps that support account creation must also offer account deletion
    // This became mandatory June 30, 2022
    if (input.sign_in_required) {
        results.push({
            category: 'content_policy',
            severity: 'critical',
            title: 'Account deletion feature required',
            description:
                'Your app requires sign-in, which means Apple requires you to provide a way for users ' +
                'to delete their account from within the app. This has been a mandatory requirement since ' +
                'June 30, 2022, and is a common rejection reason.',
            guideline_ref: '5.1.1',
            fix_suggestion:
                'Add an "Delete Account" option in your app\'s settings or account section. ' +
                'The deletion must be easy to find (not buried in menus) and must delete the account ' +
                'within 7 days. If you need to retain data for legal reasons, clearly explain this to users.',
        });

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
        });
    }

    // === 2. Restore Purchases Requirement ===
    // Apple Guideline 3.1.1: Apps with IAP must include a "Restore Purchases" button
    // Users who reinstall or switch devices need to recover their purchases
    if (input.has_iap || input.has_subscriptions) {
        results.push({
            category: 'content_policy',
            severity: 'critical',
            title: '"Restore Purchases" button required',
            description:
                'Your app has in-app purchases or subscriptions. Apple requires a clearly visible ' +
                '"Restore Purchases" button that allows users to restore previously purchased content ' +
                'when they reinstall the app or switch devices. Missing this is a common rejection reason.',
            guideline_ref: '3.1.1',
            fix_suggestion:
                'Add a "Restore Purchases" button in your app\'s settings, subscription screen, ' +
                'or paywall. It should call StoreKit\'s restoreCompletedTransactions() method. ' +
                'Make sure it\'s visible without requiring a purchase first.',
        });
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
        });
    }

    return results;
}
