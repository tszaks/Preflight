import type { CheckResult, HardRulesInput, ScreenshotData } from '../types';
import type { OnProgressCallback } from '$lib/types/progress';
import {
    createProgressEvent,
    PROGRESS_CHECKS,
    PROGRESS_MESSAGES,
} from '$lib/types/progress';
import { checkMetadata } from './metadata';
import { checkScreenshots } from './screenshots';
import { checkPrivacyManifest } from './privacy-manifest';
import { checkInfoPlist } from './info-plist';
import { checkUrls } from './urls';
import { checkConditionalWarnings } from './conditional-warnings';
import { checkPrivacyMismatch } from './privacy-mismatch';
import { scanIPA } from '../ipa-scanner';

export interface HardRulesResult {
    checks: CheckResult[];
    completed: boolean;
    /** Info.plist content extracted from IPA (overrides uploaded plist) */
    ipaExtractedPlist?: string;
    /** Privacy manifest content extracted from IPA (overrides uploaded manifest) */
    ipaExtractedManifest?: string;
}

/**
 * Runs all hard (deterministic) rules against the submission.
 * These are instant checks that don't require AI.
 */
export async function runHardRules(
    input: HardRulesInput,
    options?: {
        screenshotData?: ScreenshotData[];
        manifestContent?: string;
        plistContent?: string;
        ipaBuffer?: ArrayBuffer;
        onProgress?: OnProgressCallback;
    }
): Promise<HardRulesResult> {
    const checks: CheckResult[] = [];
    const emit = options?.onProgress || (() => {});

    // Check 1: Metadata (0-20%)
    emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.METADATA], 0, {
        check: PROGRESS_CHECKS.METADATA,
        phase: 'hard_rules',
    }));
    const metadataChecks = checkMetadata(input);
    checks.push(...metadataChecks);
    emit(createProgressEvent('check_complete', `Found ${metadataChecks.length} metadata issues`, 20, {
        check: PROGRESS_CHECKS.METADATA,
        phase: 'hard_rules',
        data: { checksFound: metadataChecks.length },
    }));

    // Check 2: Screenshots (20-40%)
    const totalScreenshots = input.screenshot_paths?.length || 0;
    emit(createProgressEvent('check_start', `Checking ${totalScreenshots} screenshots...`, 20, {
        check: PROGRESS_CHECKS.SCREENSHOTS,
        phase: 'hard_rules',
        data: { totalScreenshots },
    }));
    const screenshotChecks = checkScreenshots(input, options?.screenshotData);
    checks.push(...screenshotChecks);
    emit(createProgressEvent('check_complete', `Screenshot validation complete`, 40, {
        check: PROGRESS_CHECKS.SCREENSHOTS,
        phase: 'hard_rules',
        data: { checksFound: screenshotChecks.length, totalScreenshots },
    }));

    // Check 3: Privacy Manifest (40-60%)
    emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.PRIVACY_MANIFEST], 40, {
        check: PROGRESS_CHECKS.PRIVACY_MANIFEST,
        phase: 'hard_rules',
    }));
    const manifestChecks = checkPrivacyManifest(options?.manifestContent);
    checks.push(...manifestChecks);
    emit(createProgressEvent('check_complete', `Privacy manifest analyzed`, 60, {
        check: PROGRESS_CHECKS.PRIVACY_MANIFEST,
        phase: 'hard_rules',
        data: { checksFound: manifestChecks.length },
    }));

    // Check 4: Info.plist (60-80%)
    emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.INFO_PLIST], 60, {
        check: PROGRESS_CHECKS.INFO_PLIST,
        phase: 'hard_rules',
    }));
    const plistChecks = checkInfoPlist(options?.plistContent);
    checks.push(...plistChecks);
    emit(createProgressEvent('check_complete', `Info.plist parsed`, 80, {
        check: PROGRESS_CHECKS.INFO_PLIST,
        phase: 'hard_rules',
        data: { checksFound: plistChecks.length },
    }));

    // Check 5: URL Reachability (80-95%) - This is async
    emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.URLS], 80, {
        check: PROGRESS_CHECKS.URLS,
        phase: 'hard_rules',
    }));
    const urlChecks = await checkUrls(input);
    checks.push(...urlChecks);
    emit(createProgressEvent('check_complete', `URL validation complete`, 95, {
        check: PROGRESS_CHECKS.URLS,
        phase: 'hard_rules',
        data: { checksFound: urlChecks.length },
    }));

    // Check 6: IPA Binary Scan (85-93%) - Extract and analyze the actual app binary
    let ipaExtractedPlist: string | undefined;
    let ipaExtractedManifest: string | undefined;
    let effectiveManifest = options?.manifestContent;
    let effectivePlist = options?.plistContent;

    if (options?.ipaBuffer) {
        emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.IPA_SCAN], 85, {
            check: PROGRESS_CHECKS.IPA_SCAN,
            phase: 'hard_rules',
        }));

        const ipaScanResult = await scanIPA(options.ipaBuffer);
        checks.push(...ipaScanResult.checks);

        // Use IPA-extracted files as ground truth (override uploaded files)
        if (ipaScanResult.extracted.infoPlist) {
            ipaExtractedPlist = ipaScanResult.extracted.infoPlist;
            effectivePlist = ipaExtractedPlist;
        }
        if (ipaScanResult.extracted.privacyManifest) {
            ipaExtractedManifest = ipaScanResult.extracted.privacyManifest;
            effectiveManifest = ipaExtractedManifest;
        }

        emit(createProgressEvent('check_complete', `IPA scan complete — found ${ipaScanResult.checks.length} findings, ${ipaScanResult.extracted.frameworks.length} SDKs`, 93, {
            check: PROGRESS_CHECKS.IPA_SCAN,
            phase: 'hard_rules',
            data: { checksFound: ipaScanResult.checks.length },
        }));
    }

    // Check 7: Privacy Mismatch (93-96%) - Cross-reference form vs manifest
    // Uses IPA-extracted manifest if available (ground truth from actual binary)
    emit(createProgressEvent('check_start', 'Cross-referencing data collection vs privacy manifest...', 93, {
        check: 'privacy_mismatch',
        phase: 'hard_rules',
    }));
    const mismatchChecks = checkPrivacyMismatch(input.data_collection, effectiveManifest);
    checks.push(...mismatchChecks);
    emit(createProgressEvent('check_complete', `Privacy mismatch check complete`, 96, {
        check: 'privacy_mismatch',
        phase: 'hard_rules',
        data: { checksFound: mismatchChecks.length },
    }));

    // Check 8: Conditional Warnings (96-100%) - Form-field based warnings
    // These check for common rejection reasons based on app characteristics
    const conditionalChecks = checkConditionalWarnings({
        sign_in_required: input.sign_in_required,
        has_iap: input.has_iap,
        has_subscriptions: input.has_subscriptions,
        has_third_party_login: input.has_third_party_login,
        has_account_deletion: input.has_account_deletion,
        has_restore_purchases: input.has_restore_purchases,
    });
    checks.push(...conditionalChecks);
    emit(createProgressEvent('check_complete', `Found ${conditionalChecks.length} compliance reminders`, 100, {
        check: 'conditional_warnings',
        phase: 'hard_rules',
        data: { checksFound: conditionalChecks.length },
    }));

    return {
        checks,
        completed: true,
        ipaExtractedPlist,
        ipaExtractedManifest,
    };
}
