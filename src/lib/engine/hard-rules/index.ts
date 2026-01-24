import type { CheckResult, HardRulesInput, ScreenshotData } from '../types';
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
    }
): Promise<HardRulesResult> {
    const checks: CheckResult[] = [];

    // Run all deterministic checks
    checks.push(...checkMetadata(input));
    checks.push(...checkScreenshots(input, options?.screenshotData));
    checks.push(...checkPrivacyManifest(options?.manifestContent));
    checks.push(...checkInfoPlist(options?.plistContent));

    // URL checks are async (reachability)
    const urlResults = await checkUrls(input);
    checks.push(...urlResults);

    return {
        checks,
        completed: true,
    };
}
