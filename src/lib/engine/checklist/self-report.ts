import type { CheckResult, HardRulesInput } from '../types';
import { SELF_REPORT_RULES, INFORMATIONAL_RULES } from './rules';
import type { SelfReportRule } from './rules';

/**
 * Self-report answer evaluation.
 *
 * Converts user form answers into deterministic CheckResults.
 * Each SelfReportRule defines:
 *   - trigger_field: which input field activates this rule
 *   - trigger_value: what value means the rule applies (usually true)
 *   - confirm_field: optional second field to check for compliance
 *   - pass_value: what the confirm field should be for a pass
 *
 * Logic:
 *   - If trigger field is null/undefined → info reminder
 *   - If trigger field !== trigger_value → pass (rule doesn't apply)
 *   - If confirm_field exists and matches pass_value → pass
 *   - If confirm_field exists and doesn't match → fail at rule's severity
 *   - If no confirm_field → the trigger itself determines pass/fail
 */
export function evaluateSelfReports(input: HardRulesInput): CheckResult[] {
    const checks: CheckResult[] = [];

    for (const rule of SELF_REPORT_RULES) {
        const result = evaluateRule(rule, input);
        if (result) {
            checks.push(result);
        }
    }

    // Add informational tips (always shown)
    for (const rule of INFORMATIONAL_RULES) {
        checks.push({
            category: rule.category,
            severity: 'info',
            title: rule.title,
            description: rule.description,
            guideline_ref: rule.guideline_ref,
            fix_suggestion: rule.fix_suggestion,
            confidence: 100,
        });
    }

    return checks;
}

function evaluateRule(rule: SelfReportRule, input: HardRulesInput): CheckResult | null {
    const triggerValue = getFieldValue(input, rule.trigger_field);

    // Null/undefined trigger = user didn't answer → info reminder
    if (triggerValue === null || triggerValue === undefined) {
        return {
            category: rule.category,
            severity: 'info',
            title: `${rule.title} (not answered)`,
            description: `This question was not answered. ${rule.description}`,
            guideline_ref: rule.guideline_ref,
            fix_suggestion: 'Answer this question in the submission form for a more accurate review.',
            confidence: 30,
        };
    }

    // Trigger doesn't match → rule doesn't apply (pass or skip)
    if (triggerValue !== rule.trigger_value) {
        // Special case: for rules where trigger_value is false (like screenshots_match_ui),
        // a true answer from the user means they're compliant
        if (rule.confirm_field) {
            // Has a confirm field — this rule only applies when trigger matches
            return {
                category: rule.category,
                severity: 'pass',
                title: rule.title,
                description: 'Not applicable — prerequisite not met.',
                guideline_ref: rule.guideline_ref,
                confidence: 100,
            };
        }
        // No confirm field — the trigger value directly determines the result
        // trigger doesn't match trigger_value → this is a pass
        return {
            category: rule.category,
            severity: 'pass',
            title: rule.title,
            description: 'Compliant.',
            guideline_ref: rule.guideline_ref,
            confidence: 100,
        };
    }

    // Trigger matches — now evaluate compliance
    if (rule.confirm_field) {
        const confirmValue = getFieldValue(input, rule.confirm_field);

        if (confirmValue === null || confirmValue === undefined) {
            // Confirm field not answered
            return {
                category: rule.category,
                severity: 'info',
                title: `${rule.title} (not confirmed)`,
                description: `The prerequisite applies, but compliance was not confirmed. ${rule.description}`,
                guideline_ref: rule.guideline_ref,
                fix_suggestion: 'Answer the follow-up question in the submission form.',
                confidence: 30,
            };
        }

        if (confirmValue === rule.pass_value) {
            return {
                category: rule.category,
                severity: 'pass',
                title: rule.title,
                description: 'Compliant — confirmed by developer.',
                guideline_ref: rule.guideline_ref,
                confidence: 100,
            };
        }

        // Confirm field doesn't match pass_value → fail
        return {
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            guideline_ref: rule.guideline_ref,
            fix_suggestion: rule.fix_suggestion,
            confidence: 100,
        };
    }

    // No confirm field — trigger matching trigger_value determines result directly
    // For rules like sells_digital_outside_iap where pass_value is false,
    // the trigger being true means failure
    if (rule.pass_value === false) {
        // A "yes" answer (true trigger) means they're doing the bad thing
        return {
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            guideline_ref: rule.guideline_ref,
            fix_suggestion: rule.fix_suggestion,
            confidence: 100,
        };
    }

    return {
        category: rule.category,
        severity: 'pass',
        title: rule.title,
        description: 'Compliant.',
        guideline_ref: rule.guideline_ref,
        confidence: 100,
    };
}

/**
 * Safely get a field value from the input by string key.
 */
function getFieldValue(input: HardRulesInput, field: string): boolean | null | undefined {
    return (input as Record<string, unknown>)[field] as boolean | null | undefined;
}
