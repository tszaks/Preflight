import type { CheckResult, HardRulesInput } from '../types';
import {
    REQUIRED_PLIST_KEYS,
    USAGE_DESCRIPTION_KEYS,
    BUNDLE_ID_REGEX,
    VERSION_REGEX,
    BUILD_NUMBER_REGEX,
} from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';
import { parsePlist } from '../utils/parse-plist';

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
export function checkInfoPlist(
    plistContent: string | null | undefined,
    input?: Pick<HardRulesInput, 'minimum_os_version'>,
): CheckResult[] {
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
            confidence: 100,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Ensure the file is a valid XML plist. Use Xcode to regenerate if needed.',
        });
        return results;
    }

    const parsed = parsePlist(plistContent);

    // Check required keys
    for (const key of REQUIRED_PLIST_KEYS) {
        if (!plistContent.includes(`<key>${key}</key>`)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: `Missing required key: ${key}`,
                description: `The required key "${key}" is not present in Info.plist.`,
                confidence: 100,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: `Add the "${key}" key with an appropriate value to your Info.plist.`,
            });
        }
    }

    // Validate CFBundleIdentifier format
    const bundleIdMatch = plistContent.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
    if (bundleIdMatch) {
        const bundleId = bundleIdMatch[1];

        if (isXcodeBuildVariable(bundleId)) {
            // Build variable — this is normal, don't generate a finding
        } else if (!BUNDLE_ID_REGEX.test(bundleId)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: 'Invalid bundle identifier format',
                description: `Bundle ID "${bundleId}" doesn't match the required reverse-domain format.`,
                confidence: 100,
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
                confidence: 100,
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
                confidence: 100,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'No action needed. Xcode will substitute the real version from your build settings when compiling.',
            });
        } else if (!VERSION_REGEX.test(version)) {
            results.push({
                category: 'info_plist',
                severity: 'critical',
                title: 'Invalid version format',
                description: `Version "${version}" doesn't match the required format (X.Y or X.Y.Z).`,
                confidence: 100,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'Use semantic versioning: major.minor or major.minor.patch (e.g., 1.0, 2.1.3).',
            });
        }

        // Check for 0.x pre-release version
        if (!isXcodeBuildVariable(version) && VERSION_REGEX.test(version) && version.startsWith('0.')) {
            results.push({
                category: 'info_plist',
                severity: 'info',
                title: 'Pre-release version number detected',
                description: `Version ${version} starts with 0.x which suggests a pre-release build. Apple may question this during review.`,
                confidence: 60,
                guideline_ref: getGuidelineRef('2.5'),
                fix_suggestion: 'Consider using version 1.0 or higher for production releases.',
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
            confidence: 100,
            fix_suggestion: 'No action needed.',
        });
    }

    // Validate CFBundleVersion format (if not a build variable)
    if (buildMatch && !isXcodeBuildVariable(buildMatch[1])) {
        const buildNumber = buildMatch[1];
        if (!BUILD_NUMBER_REGEX.test(buildNumber)) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'Unexpected build number format',
                description: `Build number '${buildNumber}' doesn't match expected format (X, X.Y, or X.Y.Z, all numeric).`,
                confidence: 90,
                guideline_ref: 'CFBundleVersion',
                fix_suggestion: 'Use a numeric build number in the format X, X.Y, or X.Y.Z (e.g., 1, 1.0, 1.0.1).',
            });
        }
    }

    // Check if version and build number are identical
    if (versionMatch && buildMatch &&
        !isXcodeBuildVariable(versionMatch[1]) && !isXcodeBuildVariable(buildMatch[1]) &&
        versionMatch[1] === buildMatch[1]) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Version and build number are identical',
            description: `Version and build number are both '${versionMatch[1]}'. Using separate incrementing build numbers (e.g., 1, 2, 3) helps track builds.`,
            confidence: 50,
            guideline_ref: getGuidelineRef('2.5'),
            fix_suggestion: 'Use an incrementing integer or date-based build number (e.g., 20240115) separate from the marketing version.',
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
                    confidence: 100,
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Provide a clear, specific explanation of why your app needs this permission.',
                });
            } else if (desc.length < 10) {
                results.push({
                    category: 'info_plist',
                    severity: 'warning',
                    title: `Vague usage description: ${key.replace('NS', '').replace('UsageDescription', '')}`,
                    description: `Usage description "${desc}" is too short to be meaningful.`,
                    confidence: 100,
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Explain the specific feature that requires this permission. E.g., "Take photos for your profile picture".',
                });
            }
        }
    }

    // ATS exceptions (App Transport Security)
    results.push(...checkATSExceptions(parsed, plistContent));

    // UIRequiredDeviceCapabilities validation
    results.push(...checkRequiredDeviceCapabilities(parsed, plistContent));

    // LSApplicationQueriesSchemes validation
    results.push(...checkApplicationQuerySchemes(parsed, plistContent));

    // Bonjour / Local Network validation
    results.push(...checkBonjourAndLocalNetwork(parsed, plistContent));

    // CFBundleURLTypes validation
    results.push(...checkBundleUrlTypes(parsed, plistContent));

    // Minimum OS version vs binary
    results.push(...checkMinimumOsVersion(parsed, plistContent, input?.minimum_os_version));

    // Check for background modes
    if (plistContent.includes('UIBackgroundModes')) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Background modes declared',
            description: 'App declares background modes. Ensure each declared mode is actively used.',
            confidence: 100,
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
            confidence: 100,
        });
    }

    return results;
}

function isPlistDict(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function plistKeyIsTrue(plistContent: string, key: string): boolean {
    const re = new RegExp(`<key>${key}<\\/key>\\s*<true\\s*\\/>`, 'i');
    return re.test(plistContent);
}

function hasPlistKey(plistContent: string, key: string): boolean {
    return plistContent.includes(`<key>${key}</key>`);
}

function hasUsageDescription(plistContent: string, key: string): boolean {
    return hasPlistKey(plistContent, key);
}

function checkATSExceptions(parsed: Record<string, unknown> | null, plistContent: string): CheckResult[] {
    const results: CheckResult[] = [];
    let confidence = 90;

    if (parsed && isPlistDict(parsed.NSAppTransportSecurity)) {
        const ats = parsed.NSAppTransportSecurity as Record<string, unknown>;

        if (ats.NSAllowsArbitraryLoads === true) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: NSAllowsArbitraryLoads enabled',
                description: 'NSAllowsArbitraryLoads is set to true, allowing insecure HTTP traffic. Apple may reject apps that broadly disable ATS without strong justification.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Remove NSAllowsArbitraryLoads or scope exceptions to specific domains. Use HTTPS wherever possible.',
                confidence,
            });
        }

        if (ats.NSAllowsArbitraryLoadsForMedia === true) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: Arbitrary loads allowed for media',
                description: 'NSAllowsArbitraryLoadsForMedia is enabled. This weakens ATS protections for media loads and can raise review scrutiny.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Prefer HTTPS media URLs or scope exceptions to specific domains.',
                confidence,
            });
        }

        if (ats.NSAllowsArbitraryLoadsInWebContent === true) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: Arbitrary loads allowed in web content',
                description: 'NSAllowsArbitraryLoadsInWebContent is enabled. Apple may request justification for broad ATS exceptions.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Prefer HTTPS within web content or scope ATS exceptions to specific domains.',
                confidence,
            });
        }

        if (isPlistDict(ats.NSExceptionDomains)) {
            const exceptions = ats.NSExceptionDomains as Record<string, unknown>;
            const insecureDomains: string[] = [];

            for (const [domain, config] of Object.entries(exceptions)) {
                if (!isPlistDict(config)) continue;
                const allowsInsecure = config.NSExceptionAllowsInsecureHTTPLoads === true;
                const tempInsecure = config.NSTemporaryExceptionAllowsInsecureHTTPLoads === true;
                if (allowsInsecure || tempInsecure) {
                    insecureDomains.push(domain);
                }
            }

            if (insecureDomains.length > 0) {
                results.push({
                    category: 'info_plist',
                    severity: 'warning',
                    title: 'ATS: Insecure HTTP allowed for exception domains',
                    description: `ATS exceptions allow insecure HTTP for: ${insecureDomains.join(', ')}. Apple may reject apps that allow insecure traffic without justification.`,
                    guideline_ref: 'App Transport Security',
                    fix_suggestion: 'Remove insecure exceptions or migrate those endpoints to HTTPS.',
                    confidence,
                });
            }
        }
    } else if (hasPlistKey(plistContent, 'NSAppTransportSecurity')) {
        confidence = 70;

        if (plistKeyIsTrue(plistContent, 'NSAllowsArbitraryLoads')) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: NSAllowsArbitraryLoads appears enabled',
                description: 'NSAllowsArbitraryLoads appears to be true (string-match check). Broad ATS exceptions can trigger review questions or rejection.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Remove NSAllowsArbitraryLoads or scope exceptions to specific domains.',
                confidence,
            });
        }

        if (plistKeyIsTrue(plistContent, 'NSAllowsArbitraryLoadsForMedia') ||
            plistKeyIsTrue(plistContent, 'NSAllowsArbitraryLoadsInWebContent')) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: Arbitrary loads enabled (string match)',
                description: 'ATS exceptions appear enabled for media or web content. Verify this is intentional and justified.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Prefer HTTPS or scope exceptions to specific domains.',
                confidence,
            });
        }

        if (plistKeyIsTrue(plistContent, 'NSExceptionAllowsInsecureHTTPLoads') ||
            plistKeyIsTrue(plistContent, 'NSTemporaryExceptionAllowsInsecureHTTPLoads')) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'ATS: Insecure HTTP allowed for exception domains (string match)',
                description: 'ATS exception domains appear to allow insecure HTTP. Apple may reject apps that allow insecure traffic without justification.',
                guideline_ref: 'App Transport Security',
                fix_suggestion: 'Remove insecure exceptions or migrate those endpoints to HTTPS.',
                confidence,
            });
        }
    }

    return results;
}

function checkRequiredDeviceCapabilities(parsed: Record<string, unknown> | null, plistContent: string): CheckResult[] {
    const results: CheckResult[] = [];
    let confidence = 90;
    let hasKey = false;
    let invalidFormat = false;
    const capabilities: string[] = [];

    if (parsed && 'UIRequiredDeviceCapabilities' in parsed) {
        hasKey = true;
        const value = (parsed as Record<string, unknown>).UIRequiredDeviceCapabilities;

        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === 'string') capabilities.push(entry);
                else invalidFormat = true;
            }
        } else if (isPlistDict(value)) {
            for (const [cap, enabled] of Object.entries(value)) {
                if (enabled === true) capabilities.push(cap);
                else if (enabled !== false) invalidFormat = true;
            }
        } else {
            invalidFormat = true;
        }
    } else if (hasPlistKey(plistContent, 'UIRequiredDeviceCapabilities')) {
        hasKey = true;
        confidence = 70;
    }

    if (!hasKey) return results;

    if (invalidFormat) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'UIRequiredDeviceCapabilities has invalid format',
            description: 'UIRequiredDeviceCapabilities should be an array of strings or a dictionary of capability booleans. The current format may cause App Store validation issues.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Use an array of capability strings or a dictionary of capability keys with true/false values.',
            confidence,
        });
    }

    if (!invalidFormat && capabilities.length === 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'UIRequiredDeviceCapabilities is empty',
            description: 'UIRequiredDeviceCapabilities is present but contains no enabled capabilities. This can confuse App Store validation.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Remove the key if you do not require specific hardware capabilities.',
            confidence,
        });
    }

    if (capabilities.length > 0) {
        const legacyCaps = capabilities.filter(cap => ['armv6', 'armv7', 'armv7s'].includes(cap));
        if (legacyCaps.length > 0) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'Legacy device capability requirements',
                description: `UIRequiredDeviceCapabilities includes legacy architectures: ${legacyCaps.join(', ')}. Apple no longer supports 32-bit devices, and this may limit distribution or trigger review questions.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Remove legacy architecture requirements unless absolutely necessary.',
                confidence,
            });
        }

        const missingUsage: string[] = [];
        const hasLocationUsage =
            hasUsageDescription(plistContent, 'NSLocationWhenInUseUsageDescription') ||
            hasUsageDescription(plistContent, 'NSLocationAlwaysUsageDescription');

        if ((capabilities.includes('gps') || capabilities.includes('location-services')) && !hasLocationUsage) {
            missingUsage.push('Location');
        }
        if ((capabilities.includes('camera') || capabilities.includes('front-facing-camera')) &&
            !hasUsageDescription(plistContent, 'NSCameraUsageDescription')) {
            missingUsage.push('Camera');
        }
        if (capabilities.includes('microphone') && !hasUsageDescription(plistContent, 'NSMicrophoneUsageDescription')) {
            missingUsage.push('Microphone');
        }
        if (capabilities.includes('photo-library') && !hasUsageDescription(plistContent, 'NSPhotoLibraryUsageDescription')) {
            missingUsage.push('Photo Library');
        }

        if (missingUsage.length > 0) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'Required capabilities may be missing usage descriptions',
                description: `UIRequiredDeviceCapabilities requires: ${missingUsage.join(', ')}. Ensure the corresponding usage descriptions are present, or App Store review may flag permission issues.`,
                guideline_ref: getGuidelineRef('5.1.1'),
                fix_suggestion: 'Add the appropriate *UsageDescription keys for each required capability.',
                confidence,
            });
        }
    }

    return results;
}

function checkApplicationQuerySchemes(parsed: Record<string, unknown> | null, plistContent: string): CheckResult[] {
    const results: CheckResult[] = [];
    const schemes: string[] = [];
    let hasKey = false;
    let invalidFormat = false;
    let confidence = 90;

    if (parsed && 'LSApplicationQueriesSchemes' in parsed) {
        hasKey = true;
        const value = (parsed as Record<string, unknown>).LSApplicationQueriesSchemes;
        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === 'string') schemes.push(entry);
                else invalidFormat = true;
            }
        } else {
            invalidFormat = true;
        }
    } else if (hasPlistKey(plistContent, 'LSApplicationQueriesSchemes')) {
        hasKey = true;
        confidence = 70;
    }

    if (!hasKey) return results;

    if (invalidFormat) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'LSApplicationQueriesSchemes has invalid format',
            description: 'LSApplicationQueriesSchemes should be an array of URL scheme strings. Invalid formats can cause App Store validation issues.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Use an array of URL scheme strings, e.g., ["myapp", "twitter"].',
            confidence,
        });
        return results;
    }

    if (schemes.length === 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'LSApplicationQueriesSchemes is empty',
            description: 'LSApplicationQueriesSchemes is present but contains no entries.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Remove the key if you do not need to query other apps, or add the required schemes.',
            confidence,
        });
        return results;
    }

    if (schemes.length > 50) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Too many LSApplicationQueriesSchemes entries',
            description: `You declared ${schemes.length} URL schemes. iOS limits this list, and large lists can trigger review scrutiny.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Reduce the number of schemes to only those you actively query.',
            confidence,
        });
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const scheme of schemes) {
        const normalized = scheme.trim().toLowerCase();
        if (seen.has(normalized)) duplicates.push(scheme);
        seen.add(normalized);
    }

    if (duplicates.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Duplicate LSApplicationQueriesSchemes entries',
            description: `Duplicate schemes found: ${Array.from(new Set(duplicates)).join(', ')}.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Remove duplicate entries to keep the list clean.',
            confidence,
        });
    }

    const schemeRegex = /^[A-Za-z][A-Za-z0-9+.-]*$/;
    const invalidSchemes = schemes.filter(s => !schemeRegex.test(s));
    if (invalidSchemes.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Invalid URL scheme format in LSApplicationQueriesSchemes',
            description: `Invalid schemes: ${invalidSchemes.join(', ')}. URL schemes must start with a letter and contain only letters, numbers, "+", "-", or ".".`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Fix invalid scheme names or remove them.',
            confidence,
        });
    }

    const placeholderSchemes = schemes.filter(s =>
        /\b(test|demo|sample|example|placeholder)\b/i.test(s) || s.includes('yourapp')
    );
    if (placeholderSchemes.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Placeholder URL schemes detected',
            description: `Placeholder schemes found: ${placeholderSchemes.join(', ')}. Placeholder entries can trigger App Review questions.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Replace placeholder scheme names with real, production schemes.',
            confidence,
        });
    }

    return results;
}

function checkBonjourAndLocalNetwork(parsed: Record<string, unknown> | null, plistContent: string): CheckResult[] {
    const results: CheckResult[] = [];
    let hasBonjour = false;
    let hasLocalNetworkDesc = hasUsageDescription(plistContent, 'NSLocalNetworkUsageDescription');
    let confidence = 90;

    if (parsed && 'NSBonjourServices' in parsed) {
        hasBonjour = true;
        const value = (parsed as Record<string, unknown>).NSBonjourServices;
        if (!Array.isArray(value) || value.length === 0) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'NSBonjourServices is empty or invalid',
                description: 'NSBonjourServices should be a non-empty array of Bonjour service types.',
                guideline_ref: getGuidelineRef('5.1.1'),
                fix_suggestion: 'Declare at least one Bonjour service type or remove the key if unused.',
                confidence,
            });
        }
    } else if (hasPlistKey(plistContent, 'NSBonjourServices')) {
        hasBonjour = true;
        confidence = 70;
    }

    if (hasBonjour && !hasLocalNetworkDesc) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Missing NSLocalNetworkUsageDescription',
            description: 'NSBonjourServices is declared but NSLocalNetworkUsageDescription is missing. Apple requires a local network usage purpose string.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'Add NSLocalNetworkUsageDescription explaining why you need local network access.',
            confidence,
        });
    }

    return results;
}

function checkBundleUrlTypes(parsed: Record<string, unknown> | null, plistContent: string): CheckResult[] {
    const results: CheckResult[] = [];
    let hasKey = false;
    let confidence = 90;
    const schemes: string[] = [];

    if (parsed && 'CFBundleURLTypes' in parsed) {
        hasKey = true;
        const value = (parsed as Record<string, unknown>).CFBundleURLTypes;
        if (Array.isArray(value)) {
            for (const entry of value) {
                if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
                const dict = entry as Record<string, unknown>;
                const schemeList = dict.CFBundleURLSchemes;
                if (Array.isArray(schemeList)) {
                    for (const s of schemeList) {
                        if (typeof s === 'string') schemes.push(s);
                    }
                }
            }
        }
    } else if (hasPlistKey(plistContent, 'CFBundleURLTypes')) {
        hasKey = true;
        confidence = 70;
    }

    if (!hasKey) return results;

    if (schemes.length === 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'CFBundleURLTypes contains no URL schemes',
            description: 'CFBundleURLTypes is present but no CFBundleURLSchemes were found.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Add at least one URL scheme or remove CFBundleURLTypes if unused.',
            confidence,
        });
        return results;
    }

    const schemeRegex = /^[A-Za-z][A-Za-z0-9+.-]*$/;
    const invalid = schemes.filter(s => !schemeRegex.test(s));
    if (invalid.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Invalid URL scheme format in CFBundleURLTypes',
            description: `Invalid schemes: ${invalid.join(', ')}. URL schemes must start with a letter and contain only letters, numbers, "+", "-", or ".".`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Fix invalid scheme names or remove them.',
            confidence,
        });
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const scheme of schemes) {
        const normalized = scheme.trim().toLowerCase();
        if (seen.has(normalized)) duplicates.push(scheme);
        seen.add(normalized);
    }
    if (duplicates.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'info',
            title: 'Duplicate URL schemes in CFBundleURLTypes',
            description: `Duplicate schemes found: ${Array.from(new Set(duplicates)).join(', ')}.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Remove duplicate entries.',
            confidence,
        });
    }

    const placeholderSchemes = schemes.filter(s =>
        /\b(test|demo|sample|example|placeholder)\b/i.test(s) || s.includes('yourapp')
    );
    if (placeholderSchemes.length > 0) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Placeholder URL schemes detected',
            description: `Placeholder schemes found: ${placeholderSchemes.join(', ')}.`,
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Replace placeholder scheme names with real, production schemes.',
            confidence,
        });
    }

    return results;
}

function parseVersionNumber(value: string | undefined): number | null {
    if (!value) return null;
    const match = value.match(/(\d+)(\.\d+)?/);
    if (!match) return null;
    return parseFloat(match[0]);
}

function checkMinimumOsVersion(parsed: Record<string, unknown> | null, plistContent: string, minOsFromBinary?: string | null): CheckResult[] {
    const results: CheckResult[] = [];
    let plistMin: string | null = null;
    let confidence = 90;

    if (parsed && typeof parsed.MinimumOSVersion === 'string') {
        plistMin = parsed.MinimumOSVersion;
    } else {
        const match = plistContent.match(/<key>MinimumOSVersion<\/key>\s*<string>([^<]+)<\/string>/i);
        if (match) {
            plistMin = match[1].trim();
            confidence = 70;
        }
    }

    if (!plistMin || !minOsFromBinary) return results;

    const plistVal = parseVersionNumber(plistMin);
    const binVal = parseVersionNumber(minOsFromBinary);
    if (plistVal === null || binVal === null) return results;

    if (Math.abs(plistVal - binVal) >= 0.1) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Minimum OS version mismatch',
            description:
                `Info.plist MinimumOSVersion is "${plistMin}" but the binary declares "${minOsFromBinary}". ` +
                'Mismatched OS versions can cause App Store validation issues or unexpected availability.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Ensure MinimumOSVersion matches the deployment target used to build the IPA.',
            confidence,
        });
    }

    return results;
}
