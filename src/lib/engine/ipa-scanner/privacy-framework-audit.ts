/**
 * Privacy-Framework Cross-Reference Audit.
 * Checks that frameworks/entitlements detected in the IPA binary have
 * corresponding privacy manifest data type declarations.
 *
 * Example: If HealthKit framework is linked, the privacy manifest should
 * declare NSPrivacyCollectedDataTypeHealth or NSPrivacyCollectedDataTypeFitness.
 */

import type { CheckResult } from '../types';

/** Maps frameworks/entitlements to required privacy manifest data types */
interface FrameworkPrivacyRule {
    /** Human-readable name for display */
    displayName: string;
    /** Framework names to match (e.g., 'HealthKit') */
    frameworks?: string[];
    /** Entitlement keys to match (checked against entitlementsXml) */
    entitlements?: string[];
    /** Required NSPrivacyCollectedDataType values (any match = satisfied) */
    requiredManifestTypes?: string[];
    /** If true, this is advisory-only (info severity, no manifest check) */
    advisory?: boolean;
    /** Advisory message when the framework is detected */
    advisoryMessage?: string;
    /** Confidence level for the check (default 85) */
    confidence?: number;
}

const FRAMEWORK_PRIVACY_RULES: FrameworkPrivacyRule[] = [
    {
        displayName: 'HealthKit',
        frameworks: ['HealthKit'],
        entitlements: ['com.apple.developer.healthkit'],
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypeHealth',
            'NSPrivacyCollectedDataTypeFitness',
        ],
        confidence: 85,
    },
    {
        displayName: 'CoreLocation',
        frameworks: ['CoreLocation'],
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypePreciseLocation',
            'NSPrivacyCollectedDataTypeCoarseLocation',
        ],
        confidence: 85,
    },
    {
        displayName: 'Contacts',
        frameworks: ['Contacts', 'ContactsUI'],
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypeContacts',
        ],
        confidence: 85,
    },
    {
        displayName: 'EventKit',
        frameworks: ['EventKit'],
        advisory: true,
        advisoryMessage: 'EventKit is linked, which accesses calendar data. Ensure your privacy manifest and App Store privacy labels account for any calendar data collection.',
        confidence: 70,
    },
    {
        displayName: 'Photos',
        frameworks: ['Photos', 'PhotosUI'],
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypePhotosorVideos',
        ],
        confidence: 80,
    },
    {
        displayName: 'AVFoundation',
        frameworks: ['AVFoundation'],
        advisory: true,
        advisoryMessage: 'AVFoundation is linked, which can capture photos, video, and audio. If your app records or processes media, ensure the privacy manifest declares the relevant data types (photos/videos, audio).',
        confidence: 70,
    },
    {
        displayName: 'AdSupport',
        frameworks: ['AdSupport'],
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypeAdvertisingData',
        ],
        confidence: 90,
    },
];

/**
 * Audit privacy frameworks and entitlements against the privacy manifest.
 * Returns warnings when frameworks that access sensitive data are linked
 * but the corresponding data types are not declared in the manifest.
 */
export function auditPrivacyFrameworks(
    frameworks: string[],
    entitlementsXml: string | undefined,
    manifestContent: string | undefined,
): CheckResult[] {
    const results: CheckResult[] = [];
    const frameworkSet = new Set(frameworks);

    for (const rule of FRAMEWORK_PRIVACY_RULES) {
        // Check if this rule matches any detected framework or entitlement
        const frameworkMatch = rule.frameworks?.some(f => frameworkSet.has(f)) ?? false;
        const entitlementMatch = rule.entitlements?.some(e =>
            entitlementsXml?.includes(e)
        ) ?? false;

        if (!frameworkMatch && !entitlementMatch) {
            continue;
        }

        // Advisory-only rules (no manifest check)
        if (rule.advisory) {
            results.push({
                category: 'ipa_binary',
                severity: 'info',
                title: `${rule.displayName} framework detected`,
                description: rule.advisoryMessage || `${rule.displayName} framework is linked.`,
                confidence: rule.confidence ?? 70,
            });
            continue;
        }

        // Check manifest for required data types
        const requiredTypes = rule.requiredManifestTypes;
        if (!requiredTypes || requiredTypes.length === 0) {
            continue;
        }

        const anyDeclared = manifestContent
            ? requiredTypes.some(t => manifestContent.includes(t))
            : false;

        if (!anyDeclared) {
            const expectedTypes = requiredTypes.join(' or ');
            results.push({
                category: 'ipa_binary',
                severity: 'warning',
                title: `${rule.displayName} linked but privacy manifest may be incomplete`,
                description:
                    `The app links ${rule.displayName}, which accesses sensitive user data, ` +
                    `but the privacy manifest does not appear to declare ${expectedTypes}. ` +
                    'Apple may flag this during review if the data is collected.',
                fix_suggestion:
                    `If your app collects data via ${rule.displayName}, add the appropriate ` +
                    'NSPrivacyCollectedDataType entries to your PrivacyInfo.xcprivacy file.',
                confidence: rule.confidence ?? 85,
            });
        }
    }

    // Special check: AdSupport without AppTrackingTransparency
    if (frameworkSet.has('AdSupport') && !frameworkSet.has('AppTrackingTransparency')) {
        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'AdSupport linked without AppTrackingTransparency',
            description:
                'The app links the AdSupport framework (advertising identifier access) ' +
                'but does not link AppTrackingTransparency. Since iOS 14.5, apps must use ATT ' +
                'to request user permission before accessing the IDFA. This will likely cause rejection.',
            guideline_ref: 'SKAdNetwork',
            fix_suggestion:
                'Add the AppTrackingTransparency framework and call ATTrackingManager.requestTrackingAuthorization() ' +
                'before accessing the advertising identifier.',
            confidence: 90,
        });
    }

    // Info check: AppTrackingTransparency detected
    if (frameworkSet.has('AppTrackingTransparency')) {
        results.push({
            category: 'ipa_binary',
            severity: 'pass',
            title: 'AppTrackingTransparency framework detected',
            description: 'The app includes the ATT framework for tracking transparency compliance.',
            confidence: 100,
        });
    }

    return results;
}
