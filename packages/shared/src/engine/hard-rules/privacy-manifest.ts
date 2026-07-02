import type { CheckResult } from '../types';
import {
    PRIVACY_MANIFEST_API_TYPES,
    PRIVACY_MANIFEST_REASON_CODES,
    PRIVACY_MANIFEST_DATA_PURPOSES,
} from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';
import { parsePlist } from '../utils/parse-plist';

/**
 * Validates a PrivacyInfo.xcprivacy file content.
 * Uses structural plist parsing for accurate checks, with string-match fallback.
 */
export function checkPrivacyManifest(manifestContent: string | null | undefined): CheckResult[] {
    const results: CheckResult[] = [];

    if (!manifestContent) {
        results.push({
            category: 'privacy_manifest',
            severity: 'warning',
            title: 'No privacy manifest provided',
            description: 'A PrivacyInfo.xcprivacy file was not uploaded. If your app or a bundled SDK uses required-reason APIs, this can cause rejection.',
            guideline_ref: getGuidelineRef('5.1'),
            fix_suggestion: 'If your app code uses required-reason APIs, add a PrivacyInfo.xcprivacy file. If a third-party SDK uses them, update or replace the SDK so its bundle includes its own manifest.',
            confidence: 100,
        });
        return results;
    }

    // Basic XML/plist structure validation
    if (!manifestContent.includes('<?xml') && !manifestContent.includes('<plist')) {
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Invalid privacy manifest format',
            description: 'The file does not appear to be valid XML plist format.',
            guideline_ref: getGuidelineRef('5.1'),
            fix_suggestion: 'Ensure the file is a valid XML property list. Use Xcode to validate the format.',
            confidence: 100,
        });
        return results;
    }

    if (!manifestContent.includes('<plist')) {
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Missing plist root element',
            description: 'The privacy manifest is missing the <plist> root element.',
            guideline_ref: getGuidelineRef('5.1'),
            fix_suggestion: 'Wrap your manifest content in <plist version="1.0"> tags.',
            confidence: 100,
        });
        return results;
    }

    // Attempt structural parsing
    const parsed = parsePlist(manifestContent);

    if (parsed) {
        return checkPrivacyManifestStructural(parsed);
    }

    // Fallback to string matching with lower confidence
    return checkPrivacyManifestFallback(manifestContent);
}

/**
 * Structural checks using parsed plist data. High confidence.
 */
function checkPrivacyManifestStructural(parsed: Record<string, unknown>): CheckResult[] {
    const results: CheckResult[] = [];

    // Check NSPrivacyTracking
    const hasTrackingKey = 'NSPrivacyTracking' in parsed;
    if (!hasTrackingKey) {
        results.push({
            category: 'privacy_manifest',
            severity: 'warning',
            title: 'Missing NSPrivacyTracking declaration',
            description: 'The manifest doesn\'t declare whether the app tracks users. This key should be present.',
            guideline_ref: getGuidelineRef('5.1.2'),
            fix_suggestion: 'Add NSPrivacyTracking key set to true/false to declare your tracking status.',
            confidence: 100,
        });
    }

    const trackingEnabled = parsed.NSPrivacyTracking === true;

    // Check tracking domains if tracking is enabled
    if (trackingEnabled) {
        const domains = parsed.NSPrivacyTrackingDomains;
        const hasDomains = Array.isArray(domains) && domains.length > 0;
        if (!hasDomains) {
            results.push({
                category: 'privacy_manifest',
                severity: 'critical',
                title: 'Tracking enabled but no domains listed',
                description: 'NSPrivacyTracking is true but NSPrivacyTrackingDomains is missing or empty.',
                guideline_ref: getGuidelineRef('5.1.2'),
                fix_suggestion: 'Add NSPrivacyTrackingDomains array listing all domains used for tracking.',
                confidence: 100,
            });
        }
    }

    // Validate tracking domains format only when tracking is enabled
    if (trackingEnabled && Array.isArray(parsed.NSPrivacyTrackingDomains)) {
        const invalidDomains = parsed.NSPrivacyTrackingDomains.filter(
            (d) => typeof d !== 'string' || !/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(d)
        ) as string[];
        if (invalidDomains.length > 0) {
            results.push({
                category: 'privacy_manifest',
                severity: 'warning',
                title: 'Invalid tracking domain format',
                description: `NSPrivacyTrackingDomains contains invalid entries: ${invalidDomains.join(', ')}.`,
                guideline_ref: getGuidelineRef('5.1.2'),
                fix_suggestion: 'Ensure all tracking domains are valid, fully-qualified hostnames.',
                confidence: 100,
            });
        }
    }

    // Check NSPrivacyAccessedAPITypes
    const apiTypes = parsed.NSPrivacyAccessedAPITypes;
    if (!Array.isArray(apiTypes) || apiTypes.length === 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'info',
            title: 'No API type declarations',
            description: 'No NSPrivacyAccessedAPITypes declared. This is fine if your app doesn\'t use required-reason APIs.',
            guideline_ref: getGuidelineRef('5.1'),
            confidence: 100,
        });
    } else {
        // Validate each declared API type entry has valid reason codes for THAT type
        for (const entry of apiTypes) {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
            const entryDict = entry as Record<string, unknown>;
            const apiType = entryDict.NSPrivacyAccessedAPIType;
            if (typeof apiType !== 'string') continue;

            // Only validate known API types
            if (!PRIVACY_MANIFEST_API_TYPES.includes(apiType as typeof PRIVACY_MANIFEST_API_TYPES[number])) {
                continue;
            }

            const reasons = entryDict.NSPrivacyAccessedAPITypeReasons;
            const reasonList = Array.isArray(reasons) ? reasons.filter((r): r is string => typeof r === 'string') : [];
            const validReasons = PRIVACY_MANIFEST_REASON_CODES[apiType] || [];

            const hasValidReason = reasonList.some(code => validReasons.includes(code));
            if (!hasValidReason) {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'critical',
                    title: `Missing reason code for ${apiType.replace('NSPrivacyAccessedAPICategory', '')}`,
                    description: `API type "${apiType}" is declared but no valid reason code was found in its entry.`,
                    guideline_ref: getGuidelineRef('5.1'),
                    fix_suggestion: `Add a valid reason code to this API type's NSPrivacyAccessedAPITypeReasons. Options: ${validReasons.join(', ')}`,
                    confidence: 100,
                });
            }
        }
    }

    // Check NSPrivacyCollectedDataTypes
    const collectedTypes = parsed.NSPrivacyCollectedDataTypes;
    if (!Array.isArray(collectedTypes) || collectedTypes.length === 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'info',
            title: 'No collected data types declared',
            description: 'NSPrivacyCollectedDataTypes is not present. Add this if your app collects user data.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'If your app collects any user data, declare it in NSPrivacyCollectedDataTypes.',
            confidence: 100,
        });
    } else {
        // Validate each collected data type entry includes required fields
        for (const entry of collectedTypes) {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'warning',
                    title: 'Invalid collected data type entry',
                    description: 'A NSPrivacyCollectedDataTypes entry is not a valid dictionary.',
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Ensure each collected data type entry is a dictionary with required keys.',
                    confidence: 100,
                });
                continue;
            }

            const dict = entry as Record<string, unknown>;
            const dataType = dict.NSPrivacyCollectedDataType;
            const purposes = dict.NSPrivacyCollectedDataTypePurposes;
            const linked = dict.NSPrivacyCollectedDataTypeLinked;
            const tracking = dict.NSPrivacyCollectedDataTypeTracking;

            if (typeof dataType !== 'string' || dataType.length === 0) {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'warning',
                    title: 'Collected data type missing NSPrivacyCollectedDataType',
                    description: 'A collected data entry is missing the NSPrivacyCollectedDataType value.',
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Include NSPrivacyCollectedDataType in each collected data entry.',
                    confidence: 100,
                });
            }

            const purposeList = Array.isArray(purposes)
                ? purposes.filter((p): p is string => typeof p === 'string')
                : [];

            if (!Array.isArray(purposes) || purposeList.length === 0) {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'warning',
                    title: 'Collected data type missing purposes',
                    description: 'A collected data entry is missing NSPrivacyCollectedDataTypePurposes or it is empty.',
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Provide at least one purpose in NSPrivacyCollectedDataTypePurposes.',
                    confidence: 100,
                });
            }

            if (purposeList.length > 0) {
                const invalidPurposes = purposeList.filter(
                    (p) => !PRIVACY_MANIFEST_DATA_PURPOSES.includes(
                        p as typeof PRIVACY_MANIFEST_DATA_PURPOSES[number]
                    )
                );

                if (invalidPurposes.length > 0) {
                    results.push({
                        category: 'privacy_manifest',
                        severity: 'warning',
                        title: 'Invalid purpose values in NSPrivacyCollectedDataTypePurposes',
                        description:
                            `Invalid purposes found: ${invalidPurposes.join(', ')}. ` +
                            'Purpose values must use Apple\'s allowed constants.',
                        guideline_ref: getGuidelineRef('5.1.1'),
                        fix_suggestion:
                            `Use one of: ${PRIVACY_MANIFEST_DATA_PURPOSES.join(', ')}.`,
                        confidence: 95,
                    });
                }
            }

            if (typeof linked !== 'boolean') {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'warning',
                    title: 'Collected data type missing linked flag',
                    description: 'A collected data entry is missing NSPrivacyCollectedDataTypeLinked (true/false).',
                    guideline_ref: getGuidelineRef('5.1.1'),
                    fix_suggestion: 'Add NSPrivacyCollectedDataTypeLinked with a boolean value.',
                    confidence: 100,
                });
            }

            if (typeof tracking !== 'boolean') {
                results.push({
                    category: 'privacy_manifest',
                    severity: 'warning',
                    title: 'Collected data type missing tracking flag',
                    description: 'A collected data entry is missing NSPrivacyCollectedDataTypeTracking (true/false).',
                    guideline_ref: getGuidelineRef('5.1.2'),
                    fix_suggestion: 'Add NSPrivacyCollectedDataTypeTracking with a boolean value.',
                    confidence: 100,
                });
            }
        }
    }

    // If all checks passed
    if (results.length === 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'pass',
            title: 'Privacy manifest checks passed',
            description: 'Privacy manifest has valid structure, API declarations, and reason codes.',
            confidence: 100,
        });
    }

    return results;
}

/**
 * Fallback string-match checks when plist parsing fails.
 * Lower confidence because string matching can produce false positives.
 */
function checkPrivacyManifestFallback(manifestContent: string): CheckResult[] {
    const results: CheckResult[] = [];

    // Check for NSPrivacyTracking key
    const hasTrackingKey = manifestContent.includes('NSPrivacyTracking');
    if (!hasTrackingKey) {
        results.push({
            category: 'privacy_manifest',
            severity: 'warning',
            title: 'Missing NSPrivacyTracking declaration',
            description: 'The manifest doesn\'t declare whether the app tracks users. This key should be present.',
            guideline_ref: getGuidelineRef('5.1.2'),
            fix_suggestion: 'Add NSPrivacyTracking key set to true/false to declare your tracking status.',
            confidence: 75,
        });
    }

    // Check for NSPrivacyTrackingDomains if tracking appears enabled
    const trackingEnabled = parseManifestBoolean(manifestContent, 'NSPrivacyTracking');
    if (trackingEnabled === true && !manifestContent.includes('NSPrivacyTrackingDomains')) {
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Tracking enabled but no domains listed',
            description: 'NSPrivacyTracking appears to be true but NSPrivacyTrackingDomains is missing. (Note: string-match check, verify manually.)',
            guideline_ref: getGuidelineRef('5.1.2'),
            fix_suggestion: 'Add NSPrivacyTrackingDomains array listing all domains used for tracking.',
            confidence: 75,
        });
    }

    // Check for NSPrivacyAccessedAPITypes
    const hasAPITypes = manifestContent.includes('NSPrivacyAccessedAPITypes');
    if (!hasAPITypes) {
        results.push({
            category: 'privacy_manifest',
            severity: 'info',
            title: 'No API type declarations',
            description: 'No NSPrivacyAccessedAPITypes declared. This is fine if your app doesn\'t use required-reason APIs.',
            guideline_ref: getGuidelineRef('5.1'),
            confidence: 75,
        });
    } else {
        for (const apiType of PRIVACY_MANIFEST_API_TYPES) {
            if (manifestContent.includes(apiType)) {
                const validReasons = PRIVACY_MANIFEST_REASON_CODES[apiType] || [];
                const hasValidReason = validReasons.some(code => manifestContent.includes(code));

                if (!hasValidReason) {
                    results.push({
                        category: 'privacy_manifest',
                        severity: 'critical',
                        title: `Missing reason code for ${apiType.replace('NSPrivacyAccessedAPICategory', '')}`,
                        description: `API type "${apiType}" is declared but no valid reason code was found. (String-match check — reason may be present but unpaired.)`,
                        guideline_ref: getGuidelineRef('5.1'),
                        fix_suggestion: `Add a valid reason code. Options: ${validReasons.join(', ')}`,
                        confidence: 75,
                    });
                }
            }
        }
    }

    // Check for NSPrivacyCollectedDataTypes
    if (!manifestContent.includes('NSPrivacyCollectedDataTypes')) {
        results.push({
            category: 'privacy_manifest',
            severity: 'info',
            title: 'No collected data types declared',
            description: 'NSPrivacyCollectedDataTypes is not present. Add this if your app collects user data.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'If your app collects any user data, declare it in NSPrivacyCollectedDataTypes.',
            confidence: 75,
        });
    }

    if (results.length === 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'pass',
            title: 'Privacy manifest checks passed',
            description: 'Privacy manifest appears to have valid structure (string-match verification).',
            confidence: 75,
        });
    }

    return results;
}

function parseManifestBoolean(manifestContent: string, key: string): boolean | null {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = manifestContent.match(
        new RegExp(`<key>\\s*${escapedKey}\\s*<\\/key>\\s*<(true|false)\\s*\\/>`, 'i'),
    );
    if (!match) return null;
    return match[1].toLowerCase() === 'true';
}
