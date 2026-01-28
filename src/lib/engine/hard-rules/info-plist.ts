import type { CheckResult } from '../types';
import {
    REQUIRED_PLIST_KEYS,
    OPTIONAL_PLIST_KEYS,
    USAGE_DESCRIPTION_KEYS,
    BUNDLE_ID_REGEX,
    VERSION_REGEX,
} from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';

/**
 * Detects Xcode build variables in plist values.
 * Matches: $(VAR), $(VAR:modifier), ${VAR}, $(inherited), and combinations with literal text.
 * Examples: $(PRODUCT_BUNDLE_IDENTIFIER), $(MARKETING_VERSION), $(CURRENT_PROJECT_VERSION),
 *           $(PRODUCT_NAME:rfc1034identifier), com.company.$(PRODUCT_NAME)
 */
function isXcodeBuildVariable(value: string): boolean {
    return /\$[\({][A-Za-z_][A-Za-z0-9_]*(:[a-z0-9]+)?[\)}]/.test(value);
}

/**
 * Validates Info.plist file content.
 * The file is XML plist format.
 */
export function checkInfoPlist(plistContent: string | null | undefined): CheckResult[] {
    const results: CheckResult[] = [];

    if (!plistContent) {
        // Return empty array - no plist means no checks performed
        // The category will show as "not checked" rather than falsely scoring 100
        // We still add it to suggestions via a separate mechanism
        return results;
    }

    // Basic format validation
    if (!plistContent.includes('<plist') || !plistContent.includes('<dict>')) {
        results.push({
            category: 'info_plist',
            severity: 'critical',
            title: 'Invalid Info.plist format',
            description: 'The file does not appear to be a valid XML property list.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Ensure the file is a valid XML plist. Use Xcode to regenerate if needed.',
        });
        return results;
    }

    // Check required keys
    for (const key of REQUIRED_PLIST_KEYS) {
        if (!plistContent.includes(`<key>${key}</key>`)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: `Missing required key: ${key}`,
                description: `The required key "${key}" is not present in Info.plist.`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: `Add the "${key}" key with an appropriate value to your Info.plist.`,
            });
        }
    }

    // Check optional keys (info-level if missing)
    for (const key of OPTIONAL_PLIST_KEYS) {
        if (!plistContent.includes(`<key>${key}</key>`)) {
            results.push({
                category: 'info_plist',
                severity: 'info',
                title: `Optional key not found: ${key}`,
                description: `"${key}" is not present. Modern apps often omit this key, but it's needed if your app requires specific device hardware (e.g., ARKit, NFC).`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: `Only add "${key}" if your app requires specific device capabilities. Most apps don't need it.`,
            });
        }
    }

    // Validate CFBundleIdentifier format
    const bundleIdMatch = plistContent.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
    if (bundleIdMatch) {
        const bundleId = bundleIdMatch[1];

        if (isXcodeBuildVariable(bundleId)) {
            results.push({
                category: 'info_plist',
                severity: 'info',
                title: 'Bundle ID uses Xcode build variable',
                description: `Bundle ID "${bundleId}" is an Xcode build variable that resolves at compile time. This is normal for source-level Info.plist files.`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'No action needed. Xcode will substitute the real bundle ID from your build settings when compiling.',
            });
        } else if (!BUNDLE_ID_REGEX.test(bundleId)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: 'Invalid bundle identifier format',
                description: `Bundle ID "${bundleId}" doesn't match the required reverse-domain format.`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'Use reverse-domain notation: com.company.appname (alphanumeric, dots, hyphens only).',
            });
        }

        // Check for placeholder bundle IDs (skip if build variable)
        if (!isXcodeBuildVariable(bundleId) &&
            (bundleId.includes('example') || bundleId.includes('test') || bundleId.includes('placeholder'))) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: 'Placeholder bundle identifier',
                description: `Bundle ID "${bundleId}" appears to be a placeholder.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Replace with your actual registered bundle identifier from Apple Developer portal.',
            });
        }
    }

    // Validate version format
    const versionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
    if (versionMatch) {
        const version = versionMatch[1];

        if (isXcodeBuildVariable(version)) {
            results.push({
                category: 'info_plist',
                severity: 'info',
                title: 'Version uses Xcode build variable',
                description: `Version "${version}" is an Xcode build variable that resolves at compile time. This is normal for source-level Info.plist files.`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'No action needed. Xcode will substitute the real version from your build settings when compiling.',
            });
        } else if (!VERSION_REGEX.test(version)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: 'Invalid version format',
                description: `Version "${version}" doesn't match the required format (X.Y or X.Y.Z).`,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'Use semantic versioning: major.minor or major.minor.patch (e.g., 1.0, 2.1.3).',
            });
        }
    }

    // Also check CFBundleVersion (build number) for build variables
    const buildMatch = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);
    if (buildMatch && isXcodeBuildVariable(buildMatch[1])) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Build number uses Xcode build variable',
            description: `Build number "${buildMatch[1]}" is an Xcode build variable. This is normal.`,
            fix_suggestion: 'No action needed.',
        });
    }

    // Check usage descriptions for permissions
    const permissionKeys = USAGE_DESCRIPTION_KEYS.filter(key =>
        plistContent.includes(`<key>${key}</key>`)
    );

    for (const key of permissionKeys) {
        const descMatch = plistContent.match(
            new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]*)<\\/string>`)
        );

        if (descMatch) {
            const desc = descMatch[1].trim();

            if (desc.length === 0) {
                results.push({
                    category: 'info_plist',
                    severity: 'critical',
                    title: `Empty usage description: ${key.replace('NS', '').replace('UsageDescription', '')}`,
                    description: `Permission "${key}" has an empty usage description string.`,
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Provide a clear, specific explanation of why your app needs this permission.',
                });
            } else if (desc.length < 10) {
                results.push({
                    category: 'info_plist',
                    severity: 'warning',
                    title: `Vague usage description: ${key.replace('NS', '').replace('UsageDescription', '')}`,
                    description: `Usage description "${desc}" is too short to be meaningful.`,
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Explain the specific feature that requires this permission. E.g., "Take photos for your profile picture".',
                });
            }
        }
    }

    // Check for background modes
    if (plistContent.includes('UIBackgroundModes')) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Background modes declared',
            description: 'App declares background modes. Ensure each declared mode is actively used.',
            guideline_ref: getGuidelineRef('2.5'),
            fix_suggestion: 'Only declare background modes your app actually uses. Unused modes cause rejections.',
        });
    }

    // If no issues found
    if (results.length === 0) {
        results.push({
            category: 'info_plist',
            severity: 'pass',
            title: 'Info.plist checks passed',
            description: 'All required keys present, bundle ID valid, version format correct, usage descriptions adequate.',
        });
    }

    return results;
}
