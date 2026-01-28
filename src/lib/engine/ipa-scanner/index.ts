/**
 * IPA Scanner orchestrator.
 * Coordinates extraction and analysis of an IPA file (iOS app binary archive).
 *
 * Pipeline:
 *   1. Extract key files from the IPA ZIP (extract.ts)
 *   2. Analyze embedded frameworks for known SDK issues (frameworks.ts)
 *   3. Analyze entitlements for capability concerns (entitlements.ts)
 *   4. Return combined CheckResult[] for the report
 */

import type { CheckResult } from '../types';
import { extractIPA, type ExtractedIPA } from './extract';
import { analyzeFrameworks } from './frameworks';
import { analyzeEntitlements } from './entitlements';

/** Summary of what was found inside the IPA */
export interface IPAScanResult {
    /** All check results from scanning */
    checks: CheckResult[];
    /** Extracted metadata (available for further use by the engine) */
    extracted: ExtractedIPA;
}

/** Maximum IPA file size we'll attempt to process (500 MB) */
const MAX_IPA_SIZE = 500 * 1024 * 1024;

/**
 * Scan an IPA file buffer and return App Store review findings.
 *
 * This is the main entry point for IPA analysis. It:
 * - Extracts key files from the ZIP archive
 * - Detects known problematic frameworks/SDKs
 * - Analyzes entitlements for capability concerns
 * - Validates IPA structure and size
 */
export async function scanIPA(buffer: ArrayBuffer): Promise<IPAScanResult> {
    const checks: CheckResult[] = [];

    // Guard: file size
    if (buffer.byteLength > MAX_IPA_SIZE) {
        checks.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'IPA file is very large',
            description: `The IPA is ${(buffer.byteLength / (1024 * 1024)).toFixed(0)} MB. Apple recommends keeping app size under 200 MB for cellular downloads. Apps over 4 GB are rejected.`,
            guideline_ref: 'App Thinning and Download Size',
            fix_suggestion: 'Use App Thinning (bitcode, sliced assets) and review asset sizes. Consider on-demand resources for large content.',
            confidence: 100,
        });
    }

    // Step 1: Extract
    const extracted = await extractIPA(buffer);

    // Step 2: Analyze frameworks
    if (extracted.frameworks.length > 0) {
        const frameworkChecks = analyzeFrameworks(extracted.frameworks);
        checks.push(...frameworkChecks);
    }

    // Step 3: Analyze entitlements
    if (extracted.entitlements) {
        const entitlementChecks = analyzeEntitlements(extracted.entitlements);
        checks.push(...entitlementChecks);
    }

    // Step 4: Structural checks
    if (!extracted.infoPlist) {
        checks.push({
            category: 'info_plist',
            severity: 'critical',
            title: 'No Info.plist found in IPA',
            description: 'The IPA bundle does not contain an Info.plist file. This is required for all iOS applications and will cause an automatic rejection.',
            guideline_ref: 'ITMS-90240',
            confidence: 100,
        });
    }

    if (extracted.iconFiles.length === 0) {
        checks.push({
            category: 'screenshots',
            severity: 'warning',
            title: 'No app icon found in IPA',
            description: 'No AppIcon PNG files were found in the app bundle. While icons are typically provided via the Asset Catalog, missing icons in the binary may indicate a build configuration issue.',
            fix_suggestion: 'Ensure your app icon is included in the Xcode Asset Catalog and that the build process copies it into the final bundle.',
            confidence: 85,
        });
    }

    // Size check (Apple rejects apps > 4 GB)
    const sizeGB = extracted.totalSize / (1024 * 1024 * 1024);
    if (sizeGB > 4) {
        checks.push({
            category: 'info_plist',
            severity: 'critical',
            title: 'IPA exceeds 4 GB limit',
            description: `The IPA is ${sizeGB.toFixed(1)} GB. Apple rejects apps that exceed the 4 GB maximum size limit.`,
            guideline_ref: 'App Store Connect Size Limits',
            fix_suggestion: 'Reduce binary size by enabling bitcode, stripping unused architectures, compressing assets, and using on-demand resources.',
            confidence: 100,
        });
    } else if (extracted.totalSize > 200 * 1024 * 1024) {
        checks.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Large app bundle size',
            description: `The IPA is ${(extracted.totalSize / (1024 * 1024)).toFixed(0)} MB. Apps over 200 MB cannot be downloaded over cellular data without user confirmation.`,
            fix_suggestion: 'Consider App Thinning and on-demand resources to reduce initial download size.',
            confidence: 100,
        });
    }

    return { checks, extracted };
}

// Re-export types for external use
export type { ExtractedIPA } from './extract';
