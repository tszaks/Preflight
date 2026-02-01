import type { CheckResult } from '../types';
import { PRIVACY_MANIFEST_API_TYPES, PRIVACY_MANIFEST_REASON_CODES } from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';

/**
 * Validates a PrivacyInfo.xcprivacy file content.
 * The file is XML plist format containing privacy declarations.
 */
export function checkPrivacyManifest(manifestContent: string | null | undefined): CheckResult[] {
    const results: CheckResult[] = [];

    if (!manifestContent) {
        results.push({
            category: 'privacy_manifest',
            severity: 'warning',
            title: 'No privacy manifest provided',
            description: 'A PrivacyInfo.xcprivacy file was not uploaded. If your app uses required-reason APIs, this will cause rejection.',
            guideline_ref: getGuidelineRef('5.1'),
            fix_suggestion: 'If your app uses any required-reason APIs (file timestamps, disk space, user defaults, etc.), add a PrivacyInfo.xcprivacy file.',
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
            confidence: 100,
        });
    }

    // Check for NSPrivacyTrackingDomains if tracking is enabled
    if (manifestContent.includes('NSPrivacyTracking') &&
        manifestContent.includes('<true/>') &&
        !manifestContent.includes('NSPrivacyTrackingDomains')) {
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Tracking enabled but no domains listed',
            description: 'NSPrivacyTracking is true but NSPrivacyTrackingDomains is missing.',
            guideline_ref: getGuidelineRef('5.1.2'),
            fix_suggestion: 'Add NSPrivacyTrackingDomains array listing all domains used for tracking.',
            confidence: 100,
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
            confidence: 100,
        });
    } else {
        // Validate each declared API type has reason codes
        for (const apiType of PRIVACY_MANIFEST_API_TYPES) {
            if (manifestContent.includes(apiType)) {
                // Check if there's a corresponding reason code
                const validReasons = PRIVACY_MANIFEST_REASON_CODES[apiType] || [];
                const hasValidReason = validReasons.some(code => manifestContent.includes(code));

                if (!hasValidReason) {
                    results.push({
                        category: 'privacy_manifest',
                        severity: 'critical',
                        title: `Missing reason code for ${apiType.replace('NSPrivacyAccessedAPICategory', '')}`,
                        description: `API type "${apiType}" is declared but no valid reason code was found.`,
                        guideline_ref: getGuidelineRef('5.1'),
                        fix_suggestion: `Add a valid reason code. Options: ${validReasons.join(', ')}`,
                        confidence: 100,
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
            confidence: 100,
        });
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
