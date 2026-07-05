/**
 * IPA Scanner orchestrator.
 * Coordinates extraction and analysis of an IPA file (iOS app binary archive).
 *
 * Pipeline:
 *   1. Extract key files from the IPA ZIP (extract.ts)
 *   2. Analyze embedded frameworks for known SDK issues (frameworks.ts)
 *   3. Analyze entitlements for capability concerns (entitlements.ts)
 *   4. Mach-O binary analysis - private API detection (macho/)
 *   5. Structural checks + return combined CheckResult[]
 */

import type { CheckResult } from '../types';
import { parsePlist } from '../utils/parse-plist';
import { parseApplePlist } from '../utils/parse-apple-plist';
import { PRIVACY_MANIFEST_API_TYPES } from '../knowledge-base/requirements';
import { extractIPA, type ExtractedIPA } from './extract';
import { analyzeFrameworks } from './frameworks';
import { analyzeEntitlements } from './entitlements';
import { analyzeMachOFromIPA } from './macho';
import { checkExportCompliance } from './export-compliance';

/** Summary of what was found inside the IPA */
export interface IPAScanResult {
    /** All check results from scanning */
    checks: CheckResult[];
    /** Extracted metadata (available for further use by the engine) */
    extracted: ExtractedIPA;
}

/** Maximum IPA file size we'll attempt to process (500 MB) */
const MAX_IPA_SIZE = 500 * 1024 * 1024;

/** Convert bytes to megabytes, formatted to a fixed number of decimal places. */
function toMB(bytes: number, decimals = 0): string {
    return (bytes / (1024 * 1024)).toFixed(decimals);
}

function isPlistDict(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getIconConfig(parsed: Record<string, unknown> | null): { hasIconKeys: boolean; iconName?: string } {
    if (!parsed) return { hasIconKeys: false };

    let iconName: string | undefined;
    let hasIconKeys = false;

    if (typeof parsed.CFBundleIconName === 'string') {
        iconName = parsed.CFBundleIconName;
        hasIconKeys = true;
    }

    if (Array.isArray(parsed.CFBundleIconFiles) && parsed.CFBundleIconFiles.length > 0) {
        hasIconKeys = true;
    }

    const iconsDict = isPlistDict(parsed.CFBundleIcons) ? parsed.CFBundleIcons as Record<string, unknown> : null;
    if (iconsDict) {
        hasIconKeys = true;
        const primaryIcon = isPlistDict(iconsDict.CFBundlePrimaryIcon)
            ? iconsDict.CFBundlePrimaryIcon as Record<string, unknown>
            : null;
        if (primaryIcon && typeof primaryIcon.CFBundleIconName === 'string') {
            iconName = primaryIcon.CFBundleIconName;
        }
        if (primaryIcon && Array.isArray(primaryIcon.CFBundleIconFiles) && primaryIcon.CFBundleIconFiles.length > 0) {
            hasIconKeys = true;
        }
    }

    const iconsIpad = isPlistDict(parsed['CFBundleIcons~ipad'])
        ? parsed['CFBundleIcons~ipad'] as Record<string, unknown>
        : null;
    if (iconsIpad) {
        hasIconKeys = true;
    }

    return { hasIconKeys, iconName };
}

function getPlistStringValue(plistContent: string | Buffer | undefined, key: string): string | null {
    if (!plistContent) return null;

    // Built Info.plist is commonly binary, so we must parse, not regex.
    const parsed = parseApplePlist(plistContent);
    const value = parsed ? (parsed as Record<string, unknown>)[key] : undefined;
    return typeof value === 'string' ? value : null;
}

const REQUIRED_REASON_API_SIGNALS: Array<{
    apiType: typeof PRIVACY_MANIFEST_API_TYPES[number];
    title: string;
    symbols: string[];
    confidence: number;
}> = [
    {
        apiType: 'NSPrivacyAccessedAPICategoryUserDefaults',
        title: 'UserDefaults access detected',
        symbols: ['NSUserDefaults', 'CFPreferencesCopyAppValue', 'CFPreferencesSetAppValue'],
        confidence: 80,
    },
    {
        apiType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
        title: 'File timestamp access detected',
        symbols: ['stat', 'fstat', 'lstat', 'getattrlist', 'getattrlistbulk', 'getattrlistat'],
        confidence: 70,
    },
    {
        apiType: 'NSPrivacyAccessedAPICategoryDiskSpace',
        title: 'Disk space access detected',
        symbols: ['statfs', 'statvfs', 'getfsstat', 'NSURLVolumeAvailableCapacity', 'volumeAvailableCapacity'],
        confidence: 70,
    },
    {
        apiType: 'NSPrivacyAccessedAPICategorySystemBootTime',
        title: 'System boot time access detected',
        symbols: ['KERN_BOOTTIME', 'sysctl', 'sysctlbyname'],
        confidence: 65,
    },
    {
        apiType: 'NSPrivacyAccessedAPICategoryActiveKeyboards',
        title: 'Active keyboard access detected',
        symbols: ['UIKeyboardInputMode', 'UITextInputMode', 'activeInputModes'],
        confidence: 70,
    },
];

function checkTrackingUsageDescription(plistContent: string | Buffer | undefined, importedSymbols: string[]): CheckResult[] {
    const results: CheckResult[] = [];
    const usesATT = importedSymbols.some(sym =>
        sym.includes('ATTrackingManager') || sym.includes('requestTrackingAuthorization')
    );
    if (!usesATT) return results;

    const desc = getPlistStringValue(plistContent, 'NSUserTrackingUsageDescription');
    if (desc === null) {
        results.push({
            category: 'info_plist',
            severity: 'critical',
            title: 'Missing NSUserTrackingUsageDescription',
            description: 'The binary references App Tracking Transparency APIs but NSUserTrackingUsageDescription is missing from Info.plist.',
            guideline_ref: '5.1.2',
            fix_suggestion: 'Add NSUserTrackingUsageDescription with a clear explanation of why tracking permission is needed.',
            confidence: 90,
        });
        return results;
    }

    if (desc.length === 0) {
        results.push({
            category: 'info_plist',
            severity: 'critical',
            title: 'Empty NSUserTrackingUsageDescription',
            description: 'NSUserTrackingUsageDescription is present but empty. Apple will reject apps that request tracking without a meaningful purpose string.',
            guideline_ref: '5.1.2',
            fix_suggestion: 'Provide a clear, specific explanation of why tracking permission is needed.',
            confidence: 90,
        });
        return results;
    }

    if (desc.length < 10) {
        results.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Vague NSUserTrackingUsageDescription',
            description: `NSUserTrackingUsageDescription ("${desc}") is too short to be meaningful.`,
            guideline_ref: '5.1.2',
            fix_suggestion: 'Explain the specific feature that requires tracking. Avoid generic phrases.',
            confidence: 85,
        });
    }

    return results;
}

function extractPlistFromMobileProvision(content: string): string | null {
    const start = content.indexOf('<plist');
    const end = content.indexOf('</plist>');
    if (start === -1 || end === -1) return null;
    return content.slice(start, end + '</plist>'.length);
}

function checkMobileProvision(
    mobileProvision: string | undefined,
    bundleId: string | undefined,
): CheckResult[] {
    const results: CheckResult[] = [];
    if (!mobileProvision) return results;

    const plistXml = extractPlistFromMobileProvision(mobileProvision);
    if (!plistXml) {
        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Embedded provisioning profile could not be parsed',
            description:
                'The IPA contains an embedded.mobileprovision file, but its plist payload could not be extracted. ' +
                'This may indicate a malformed profile or a non-standard build.',
            guideline_ref: 'App Store Connect Build Requirements',
            fix_suggestion:
                'Rebuild and export using a standard App Store distribution profile in Xcode.',
            confidence: 70,
        });
        return results;
    }

    const parsed = parsePlist(plistXml);
    if (!parsed) {
        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Embedded provisioning profile is not valid plist',
            description:
                'embedded.mobileprovision was found but could not be parsed as a valid plist. ' +
                'App Store submissions require a valid distribution profile.',
            guideline_ref: 'App Store Connect Build Requirements',
            fix_suggestion:
                'Rebuild with a valid App Store distribution provisioning profile.',
            confidence: 70,
        });
        return results;
    }

    const expiration = parsed.ExpirationDate;
    const expDate =
        expiration instanceof Date
            ? expiration
            : typeof expiration === 'string'
                ? new Date(expiration)
                : null;

    if (expDate && !Number.isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        results.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'Provisioning profile expired',
            description:
                `The embedded provisioning profile expired on ${expDate.toDateString()}. ` +
                'Expired profiles will fail App Store submission.',
            guideline_ref: 'App Store Connect Build Requirements',
            fix_suggestion:
                'Create a new App Store distribution provisioning profile and re-export the IPA.',
            confidence: 95,
        });
    }

    const provisionedDevices = parsed.ProvisionedDevices;
    if (Array.isArray(provisionedDevices) && provisionedDevices.length > 0) {
        results.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'Ad-hoc or development provisioning profile detected',
            description:
                'The embedded provisioning profile includes specific device UDIDs. ' +
                'App Store submissions must use an App Store distribution profile (no ProvisionedDevices).',
            guideline_ref: 'App Store Connect Build Requirements',
            fix_suggestion:
                'Archive and export using an App Store distribution profile (not ad-hoc or development).',
            confidence: 95,
        });
    }

    if (parsed.ProvisionsAllDevices === true) {
        results.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'Enterprise provisioning profile detected',
            description:
                'The embedded provisioning profile is an enterprise profile (ProvisionsAllDevices=true). ' +
                'Enterprise builds cannot be submitted to the App Store.',
            guideline_ref: 'App Store Connect Build Requirements',
            fix_suggestion:
                'Use an App Store distribution profile when exporting the IPA.',
            confidence: 95,
        });
    }

    const appIdentifier = parsed['application-identifier'];
    if (typeof appIdentifier === 'string' && bundleId) {
        const parts = appIdentifier.split('.');
        const entBundleId = parts.slice(1).join('.');
        if (entBundleId && entBundleId !== bundleId) {
            results.push({
                category: 'ipa_binary',
                severity: 'critical',
                title: 'Provisioning profile bundle ID mismatch',
                description:
                    `The embedded provisioning profile is for "${entBundleId}", but the app bundle identifier is "${bundleId}". ` +
                    'This mismatch will fail App Store validation.',
                guideline_ref: 'App Store Connect Build Requirements',
                fix_suggestion:
                    'Rebuild with a provisioning profile that matches the app’s bundle identifier.',
                confidence: 90,
            });
        }
    }

    return results;
}

function extractAccessedApiTypes(manifestContent: string | undefined): Set<string> | null {
    if (!manifestContent) return null;
    const parsed = parsePlist(manifestContent);
    if (!parsed) return null;

    const apiTypes = parsed.NSPrivacyAccessedAPITypes;
    if (!Array.isArray(apiTypes)) {
        // If the key is present in raw XML but parsed shape is missing, fall back to string scan.
        return manifestContent.includes('NSPrivacyAccessedAPITypes')
            ? extractAccessedApiTypesByStringScan(manifestContent)
            : new Set();
    }

    const declared = new Set<string>();
    for (const entry of apiTypes) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
        const dict = entry as Record<string, unknown>;
        const apiType = dict.NSPrivacyAccessedAPIType;
        if (typeof apiType === 'string') {
            declared.add(apiType);
        }
    }

    // Guard against partially parsed entries (for example XML comments in nested arrays).
    if (declared.size === 0 && manifestContent.includes('NSPrivacyAccessedAPITypes')) {
        return extractAccessedApiTypesByStringScan(manifestContent);
    }
    return declared;
}

function extractAccessedApiTypesByStringScan(manifestContent: string): Set<string> {
    const declared = new Set<string>();
    for (const apiType of PRIVACY_MANIFEST_API_TYPES) {
        if (manifestContent.includes(apiType)) {
            declared.add(apiType);
        }
    }
    return declared;
}

function detectRequiredReasonApis(importedSymbols: string[]): Array<{ apiType: string; title: string; confidence: number }> {
    const hits: Array<{ apiType: string; title: string; confidence: number }> = [];
    for (const signal of REQUIRED_REASON_API_SIGNALS) {
        const matched = signal.symbols.some(sym =>
            importedSymbols.some(s => s.includes(sym))
        );
        if (matched) {
            hits.push({
                apiType: signal.apiType,
                title: signal.title,
                confidence: signal.confidence,
            });
        }
    }
    return hits;
}

function checkRequiredReasonApiDeclarations(
    importedSymbols: string[],
    manifestContent: string | undefined,
): CheckResult[] {
    const results: CheckResult[] = [];
    const detected = detectRequiredReasonApis(importedSymbols);
    if (detected.length === 0) return results;

    const declaredTypes = extractAccessedApiTypes(manifestContent);
    const hasManifest = typeof manifestContent === 'string' && manifestContent.length > 0;

    for (const hit of detected) {
        const declared =
            declaredTypes !== null
                ? declaredTypes.has(hit.apiType)
                : hasManifest && manifestContent!.includes(hit.apiType);

        if (!declared) {
            results.push({
                category: 'privacy_manifest',
                severity: 'warning',
                title: `Required-reason API not declared: ${hit.apiType.replace('NSPrivacyAccessedAPICategory', '')}`,
                description:
                    `${hit.title}, but the privacy manifest does not declare ${hit.apiType}. ` +
                    'Apple requires required-reason APIs to be declared with valid reason codes.',
                guideline_ref: '5.1 — Privacy Manifest',
                fix_suggestion:
                    `Add ${hit.apiType} with at least one valid NSPrivacyAccessedAPITypeReasons entry in PrivacyInfo.xcprivacy.`,
                confidence: declaredTypes ? hit.confidence : Math.max(60, hit.confidence - 10),
            });
        }
    }

    return results;
}

function checkTrackingDeclarationConsistency(
    manifestContent: string | undefined,
    plistContent: string | Buffer | undefined,
    importedSymbols: string[],
): CheckResult[] {
    const results: CheckResult[] = [];
    if (!manifestContent) return results;

    const parsed = parsePlist(manifestContent);
    const trackingEnabled =
        parsed && typeof parsed.NSPrivacyTracking === 'boolean'
            ? parsed.NSPrivacyTracking === true
            : manifestContent.includes('NSPrivacyTracking') && manifestContent.includes('<true/>');

    if (!trackingEnabled) return results;

    const usesATT = importedSymbols.some(sym =>
        sym.includes('ATTrackingManager') || sym.includes('requestTrackingAuthorization')
    );
    const hasUsage = getPlistStringValue(plistContent, 'NSUserTrackingUsageDescription');

    if (!usesATT || !hasUsage) {
        results.push({
            category: 'privacy_manifest',
            severity: 'warning',
            title: 'Tracking declared without ATT compliance',
            description:
                'Privacy manifest declares tracking, but App Tracking Transparency APIs or usage description are missing. ' +
                'Apps that track must request ATT permission and include NSUserTrackingUsageDescription.',
            guideline_ref: '5.1.2',
            fix_suggestion:
                'Add AppTrackingTransparency usage with ATTrackingManager.requestTrackingAuthorization() and include NSUserTrackingUsageDescription.',
            confidence: 75,
        });
    }

    return results;
}

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
            category: 'ipa_binary',
            severity: 'warning',
            title: 'IPA file is very large',
            description: `The IPA is ${toMB(buffer.byteLength)} MB. Apple recommends keeping app size under 200 MB for cellular downloads. Apps over 4 GB are rejected.`,
            guideline_ref: 'App Thinning and Download Size',
            fix_suggestion:
                'Use App Thinning and review asset sizes. For large downloadable content, prefer Apple-Hosted/Managed Background Assets; On-Demand Resources are deprecated starting with iOS-family 27.',
            confidence: 100,
        });
    }

    // Step 1: Extract
    let extracted: ExtractedIPA;
    try {
        extracted = await extractIPA(buffer);
    } catch (error) {
        console.error('IPA extraction failed:', error);
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'IPA file could not be read',
            description: `The IPA file appears to be corrupted or is not a valid iOS application archive. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            fix_suggestion: 'Re-export the IPA from Xcode (Product → Archive → Distribute App) and try uploading again. Ensure the file was not truncated during upload.',
            confidence: 100,
        });
        return {
            checks,
            extracted: {
                bundleName: '',
                frameworks: [],
                frameworksMissingPrivacyManifest: [],
                iconFiles: [],
                iconDimensions: {},
                hasAssetsCar: false,
                totalSize: buffer.byteLength,
            },
        };
    }

    // Step 2: Analyze frameworks
    if (extracted.frameworks.length > 0) {
        const frameworkChecks = analyzeFrameworks(extracted.frameworks);
        checks.push(...frameworkChecks);
    }

    // Step 2b: Check frameworks for missing privacy manifests (ITMS-91061)
    if (extracted.frameworksMissingPrivacyManifest.length > 0) {
        const missing = extracted.frameworksMissingPrivacyManifest;
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: `${missing.length} SDK${missing.length > 1 ? 's' : ''} missing privacy manifest`,
            description: `The following embedded framework${missing.length > 1 ? 's are' : ' is'} missing a PrivacyInfo.xcprivacy file: ${missing.join(', ')}. Since Spring 2024, Apple requires every third-party SDK to include its own privacy manifest declaring API usage reasons.`,
            guideline_ref: 'ITMS-91061',
            fix_suggestion: `Update ${missing.length > 1 ? 'these SDKs' : 'this SDK'} to the latest version (most maintainers have added privacy manifests). If this is an Apple-listed commonly used SDK added as a binary dependency, use a version with the required valid signature as well. If the SDK is unmaintained, you may need to create a PrivacyInfo.xcprivacy for it manually or find an alternative.`,
            confidence: 95,
        });
    }

    // Step 3: Analyze entitlements
    if (extracted.entitlements) {
        const entitlementChecks = analyzeEntitlements(extracted.entitlements);
        checks.push(...entitlementChecks);
    }

    // Step 3b: Provisioning profile checks
    const bundleId = extracted.infoPlist ? getPlistStringValue(extracted.infoPlist, 'CFBundleIdentifier') || undefined : undefined;
    const provisioningChecks = checkMobileProvision(extracted.mobileProvision, bundleId);
    checks.push(...provisioningChecks);

    // Step 4: Mach-O binary analysis
    let importedSymbols: string[] = [];
    if (extracted.zip && extracted.appDir && extracted.bundleName) {
        try {
            const machoResult = await analyzeMachOFromIPA(
                extracted.zip, extracted.appDir, extracted.bundleName
            );
            checks.push(...machoResult.checks);
            importedSymbols = machoResult.metadata.importedSymbols;
            if (machoResult.metadata.minOS) {
                extracted.minOSVersion = machoResult.metadata.minOS;
            }
            console.log(
                `[IPA] Mach-O analysis: ${machoResult.checks.length} findings, ` +
                `${machoResult.metadata.importedSymbolCount} symbols analyzed, ` +
                `arch=${machoResult.metadata.arch}`
            );
        } catch (machoError) {
            console.error('[IPA] Mach-O analysis failed (continuing):', machoError);
            // Graceful degradation: continue without binary analysis
        }
    }

    // Step 4b: Export compliance detection
    const exportChecks = checkExportCompliance(
        extracted.frameworks,
        importedSymbols,
        extracted.infoPlist,
    );
    checks.push(...exportChecks);

    // Step 4c: ATT usage description validation (if ATT symbols detected)
    const attChecks = checkTrackingUsageDescription(extracted.infoPlist, importedSymbols);
    checks.push(...attChecks);

    // Step 4d: Required-reason API declaration checks
    const requiredReasonChecks = checkRequiredReasonApiDeclarations(
        importedSymbols,
        extracted.privacyManifest,
    );
    checks.push(...requiredReasonChecks);

    // Step 4e: Tracking declaration consistency (manifest vs ATT)
    const trackingConsistencyChecks = checkTrackingDeclarationConsistency(
        extracted.privacyManifest,
        extracted.infoPlist,
        importedSymbols,
    );
    checks.push(...trackingConsistencyChecks);

    // Step 5: Structural checks
    if (!extracted.infoPlist) {
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'No Info.plist found in IPA',
            description: 'The IPA bundle does not contain an Info.plist file. This is required for all iOS applications and will cause an automatic rejection.',
            guideline_ref: 'ITMS-90240',
            confidence: 100,
        });
    }

    const parsedInfoPlist = extracted.infoPlist ? parseApplePlist(extracted.infoPlist) : null;
    const iconConfig = getIconConfig(parsedInfoPlist);
    const hasAppIconPngs = extracted.iconFiles.length > 0;
    const hasAssetsCar = extracted.hasAssetsCar;

    if (!hasAppIconPngs && !hasAssetsCar) {
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'No app icon assets found in IPA',
            description:
                'No AppIcon PNG files or Assets.car were found in the app bundle. ' +
                'Apps without a valid AppIcon set will fail App Store validation.',
            fix_suggestion:
                'Ensure your AppIcon set is present in the Asset Catalog and included in the app bundle.',
            confidence: 90,
        });
    } else if (!iconConfig.hasIconKeys && !hasAssetsCar) {
        checks.push({
            category: 'info_plist',
            severity: 'warning',
            title: 'Missing CFBundleIcons configuration',
            description:
                'Info.plist does not declare CFBundleIcons/CFBundleIconName, and no asset catalog was detected. ' +
                'This may indicate a misconfigured app icon setup.',
            fix_suggestion:
                'Ensure CFBundleIcons and CFBundleIconName are set, or use an Asset Catalog AppIcon set.',
            confidence: 80,
        });
    }

    const iconDims = extracted.iconDimensions || {};
    const hasParsedIconDims = Object.keys(iconDims).length > 0;
    if (hasParsedIconDims && hasAppIconPngs) {
        const hasMarketingIcon = Object.values(iconDims).some(
            (dim) => dim.width === 1024 && dim.height === 1024
        );
        if (!hasMarketingIcon && !hasAssetsCar) {
            checks.push({
                category: 'ipa_binary',
                severity: 'warning',
                title: 'Missing 1024x1024 App Store icon',
                description:
                    'AppIcon PNGs were found, but no 1024x1024 marketing icon was detected in the bundle. ' +
                    'App Store submissions require a 1024x1024 icon in the AppIcon set.',
                fix_suggestion:
                    'Add a 1024x1024 marketing icon to the AppIcon set in Xcode.',
                confidence: 85,
            });
        }
    }

    // Size check (Apple rejects apps > 4 GB)
    const sizeGB = extracted.totalSize / (1024 * 1024 * 1024);
    if (sizeGB > 4) {
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'IPA exceeds 4 GB limit',
            description: `The IPA is ${sizeGB.toFixed(1)} GB. Apple rejects apps that exceed the 4 GB maximum size limit.`,
            guideline_ref: 'App Store Connect Size Limits',
            fix_suggestion: 'Reduce binary size by enabling bitcode, stripping unused architectures, compressing assets, and using on-demand resources.',
            confidence: 100,
        });
    } else if (extracted.totalSize > 200 * 1024 * 1024) {
        checks.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'Large app bundle size',
            description: `The IPA is ${toMB(extracted.totalSize)} MB. Apps over 200 MB cannot be downloaded over cellular data without user confirmation.`,
            fix_suggestion:
                'Consider App Thinning and Apple-Hosted/Managed Background Assets to reduce initial download size; plan migration away from On-Demand Resources for iOS-family 27.',
            confidence: 100,
        });
    }

    // Step 6: Size breakdown analysis
    if (extracted.totalSize > 100 * 1024 * 1024 && extracted.sizeBreakdown) {
        const breakdown = extracted.sizeBreakdown;
        const totalUncompressed = breakdown.frameworksSize + breakdown.assetsSize + breakdown.executableSize + breakdown.otherSize;

        if (totalUncompressed > 0) {
            const pct = (bytes: number): string => ((bytes / totalUncompressed) * 100).toFixed(1);
            const fwPct = pct(breakdown.frameworksSize);
            const assetPct = pct(breakdown.assetsSize);
            const execPct = pct(breakdown.executableSize);
            const otherPct = pct(breakdown.otherSize);

            checks.push({
                category: 'ipa_binary',
                severity: 'info',
                title: 'App binary size breakdown',
                description:
                    `IPA size breakdown: ` +
                    `Frameworks ${fwPct}% (${toMB(breakdown.frameworksSize, 1)} MB), ` +
                    `Assets ${assetPct}% (${toMB(breakdown.assetsSize, 1)} MB), ` +
                    `Executable ${execPct}% (${toMB(breakdown.executableSize, 1)} MB), ` +
                    `Other ${otherPct}% (${toMB(breakdown.otherSize, 1)} MB).`,
                confidence: 90,
            });

            // Flag individual frameworks > 20 MB
            for (const fw of breakdown.largestFrameworks) {
                if (fw.size > 20 * 1024 * 1024) {
                    const fwMB = toMB(fw.size, 1);
                    checks.push({
                        category: 'ipa_binary',
                        severity: 'info',
                        title: `Large framework: ${fw.name} (${fwMB} MB)`,
                        description:
                            `The embedded framework "${fw.name}" is ${fwMB} MB. ` +
                            `Large frameworks significantly increase download size. Consider whether all features of this SDK are needed.`,
                        fix_suggestion:
                            `Check if ${fw.name} offers a modular/lite build. Remove unused SDK features or consider alternatives with a smaller footprint.`,
                        confidence: 90,
                    });
                }
            }

            // Check if executable + frameworks > 60% of total
            const codeSize = breakdown.executableSize + breakdown.frameworksSize;
            const codePct = (codeSize / totalUncompressed) * 100;
            if (codePct > 60) {
                checks.push({
                    category: 'ipa_binary',
                    severity: 'info',
                    title: 'Code-heavy binary (executable + frameworks > 60%)',
                    description:
                        `Executable and framework code make up ${codePct.toFixed(0)}% of the app. ` +
                        `This suggests significant code weight. Consider App Thinning and Apple-Hosted/Managed Background Assets to reduce download size.`,
                    fix_suggestion:
                        'Enable App Thinning in Xcode to generate optimized variants. Use Apple-Hosted/Managed Background Assets ' +
                        'for content that isn\'t needed at launch, and plan migration away from On-Demand Resources for iOS-family 27. ' +
                        'Strip unused architectures and debug symbols from release builds.',
                    guideline_ref: 'App Thinning and Download Size',
                    confidence: 85,
                });
            }
        }
    }

    return { checks, extracted };
}

// Re-export types for external use
export type { ExtractedIPA } from './extract';
