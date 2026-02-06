import type { CheckResult, HardRulesInput } from '../types';

/**
 * Form-based content policy evaluation.
 *
 * These checks combine multiple form fields to produce deterministic pass/fail results.
 * Unlike self-report rules (which are simple trigger->confirm pairs), content policy
 * checks may evaluate more complex field combinations.
 */
export function checkContentPolicy(input: HardRulesInput): CheckResult[] {
    const checks: CheckResult[] = [];

    // === AI features without privacy data disclosure ===
    if (input.generates_ai_content === true) {
        const dc = input.data_collection;
        const hasUsageData = dc?.usageData === true;
        const hasUserContent = dc?.userContent === true;

        if (!hasUsageData && !hasUserContent) {
            checks.push({
                category: 'content_policy',
                severity: 'warning',
                title: 'AI feature may require data collection disclosure',
                description: 'Your app generates AI content. If user inputs are sent to an AI service, your privacy nutrition label should disclose "Usage Data" or "User Content" collection.',
                guideline_ref: '5.1.1(i) — Data Collection and Storage',
                fix_suggestion: 'Review your App Store privacy nutrition label. If your AI feature sends user data to a server, check the appropriate data collection types.',
                confidence: 100,
            });
        }
    }

    // === Subscriptions: multiple compliance checks ===
    if (input.has_subscriptions === true) {
        // subscription_terms_on_paywall is not collected in all flows yet.
        // Avoid generating "missing answer" reminders until the question is universally asked.
    }

    // === IAP without restore purchases ===
    if (input.has_iap === true && input.has_restore_purchases !== true) {
        // This is already covered by conditional-warnings.ts but we emit a content_policy check too
        // if the user hasn't confirmed either way
        if (input.has_restore_purchases === null || input.has_restore_purchases === undefined) {
            checks.push({
                category: 'content_policy',
                severity: 'info',
                title: 'Confirm Restore Purchases is available',
                description: 'Your app has in-app purchases. Please confirm a "Restore Purchases" button is accessible.',
                guideline_ref: '3.1.1 — In-App Purchase',
                fix_suggestion: 'Answer the restore purchases question in the submission form.',
                confidence: 100,
            });
        }
    }

    // === Sign-in required but no account deletion ===
    if (input.sign_in_required === true && input.has_account_deletion === null) {
        checks.push({
            category: 'content_policy',
            severity: 'info',
            title: 'Confirm account deletion is available',
            description: 'Your app requires sign-in. Please confirm that users can delete their accounts from within the app.',
            guideline_ref: '5.1.1(v) — Account Deletion',
            fix_suggestion: 'Answer the account deletion question in the submission form.',
            confidence: 100,
        });
    }

    return checks;
}
