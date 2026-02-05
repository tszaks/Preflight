import type { CheckResult, SoftRulesInput } from '../types';
import type { OnProgressCallback } from '../../types/progress';
import { createProgressEvent } from '../../types/progress';
import { checkDescription } from './description';
import { checkContentPolicy } from './content-policy';
import { checkPrivacyPolicy } from './privacy-policy';
import { evaluateSelfReports } from './self-report';
import { checkAscData } from './asc-validation';

export interface ChecklistResult {
    checks: CheckResult[];
}

/**
 * Deterministic checklist rules orchestrator.
 *
 * Replaces the AI-powered soft rules with fully deterministic checks:
 * 1. Description analysis (regex/keyword matching)
 * 2. Content policy evaluation (form-field based)
 * 3. Privacy policy keyword matching
 * 4. Self-report answer evaluation
 * 5. ASC data validation (screenshot status, subscriptions, age rating)
 * 6. Informational tips (always included)
 *
 * Same input = same output, every time. No API calls.
 */
export async function runChecklistRules(
    input: SoftRulesInput,
    options?: {
        onProgress?: OnProgressCallback;
    },
): Promise<ChecklistResult> {
    const emit = options?.onProgress || (() => { });
    const allChecks: CheckResult[] = [];

    // --- Step 1: Description checks (20%) ---
    emit(createProgressEvent('check_start', 'Checking description and metadata text...', 10, {
        check: 'checklist_description',
        phase: 'checklist',
    }));

    const descriptionChecks = checkDescription(input);
    allChecks.push(...descriptionChecks);

    emit(createProgressEvent('check_complete', `Description: ${descriptionChecks.length} checks`, 25, {
        check: 'checklist_description',
        phase: 'checklist',
    }));

    // --- Step 2: Content policy (form-based) (40%) ---
    emit(createProgressEvent('check_start', 'Evaluating content policy compliance...', 25, {
        check: 'checklist_content_policy',
        phase: 'checklist',
    }));

    const contentChecks = checkContentPolicy(input);
    allChecks.push(...contentChecks);

    emit(createProgressEvent('check_complete', `Content policy: ${contentChecks.length} checks`, 45, {
        check: 'checklist_content_policy',
        phase: 'checklist',
    }));

    // --- Step 3: Privacy policy keyword matching (60%) ---
    emit(createProgressEvent('check_start', 'Analyzing privacy policy...', 45, {
        check: 'checklist_privacy_policy',
        phase: 'checklist',
    }));

    const privacyChecks = checkPrivacyPolicy(
        input.privacy_policy_text,
        input.data_collection,
    );
    allChecks.push(...privacyChecks);

    emit(createProgressEvent('check_complete', `Privacy policy: ${privacyChecks.length} checks`, 60, {
        check: 'checklist_privacy_policy',
        phase: 'checklist',
    }));

    // --- Step 4: Self-report evaluations (75%) ---
    emit(createProgressEvent('check_start', 'Evaluating self-report answers...', 60, {
        check: 'checklist_self_report',
        phase: 'checklist',
    }));

    const selfReportChecks = evaluateSelfReports(input);
    allChecks.push(...selfReportChecks);

    emit(createProgressEvent('check_complete', `Self-report: ${selfReportChecks.length} checks`, 80, {
        check: 'checklist_self_report',
        phase: 'checklist',
    }));

    // --- Step 5: ASC data validation (100%) ---
    // Only run if ASC data is present (user connected to ASC)
    if (hasAscData(input)) {
        emit(createProgressEvent('check_start', 'Validating App Store Connect data...', 80, {
            check: 'checklist_asc',
            phase: 'checklist',
        }));

        const ascChecks = checkAscData(input);
        allChecks.push(...ascChecks);

        emit(createProgressEvent('check_complete', `ASC validation: ${ascChecks.length} checks`, 100, {
            check: 'checklist_asc',
            phase: 'checklist',
        }));
    } else {
        emit(createProgressEvent('check_complete', 'ASC validation: skipped (not connected)', 100, {
            check: 'checklist_asc',
            phase: 'checklist',
        }));
    }

    return { checks: allChecks };
}

/**
 * Check if the input contains any ASC-fetched data.
 * If user hasn't connected to ASC, we skip those validations.
 */
function hasAscData(input: SoftRulesInput): boolean {
    return !!(
        input.asc_screenshots?.length ||
        input.asc_subscriptions?.length ||
        input.asc_in_app_purchases?.length ||
        input.asc_age_rating ||
        input.asc_review_contact ||
        input.asc_copyright
    );
}
