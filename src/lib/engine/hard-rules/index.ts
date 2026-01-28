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

export interface HardRulesResult {
    checks: CheckResult[];
    completed: boolean;
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

    // Check 5: URL Reachability (80-100%) - This is async
    emit(createProgressEvent('check_start', PROGRESS_MESSAGES[PROGRESS_CHECKS.URLS], 80, {
        check: PROGRESS_CHECKS.URLS,
        phase: 'hard_rules',
    }));
    const urlChecks = await checkUrls(input);
    checks.push(...urlChecks);
    emit(createProgressEvent('check_complete', `URL validation complete`, 100, {
        check: PROGRESS_CHECKS.URLS,
        phase: 'hard_rules',
        data: { checksFound: urlChecks.length },
    }));

    return {
        checks,
        completed: true,
    };
}
