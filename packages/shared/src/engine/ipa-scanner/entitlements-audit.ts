/**
 * Entitlements Deep Validation.
 * Cross-references entitlements declared in the IPA against linked frameworks
 * and privacy manifest to catch inconsistencies that may slow or block review.
 *
 * Checks:
 *   1. Entitlement → Framework consistency (unused capabilities)
 *   2. Framework → Entitlement consistency (missing required capabilities)
 *   3. Entitlement → Privacy manifest consistency (missing data declarations)
 *   4. Unused entitlement count threshold
 */

import type { CheckResult } from '../types';

/** Maps entitlement keys to expected framework names */
const ENTITLEMENT_TO_FRAMEWORK: Record<string, { framework: string; displayName: string }> = {
    'com.apple.developer.healthkit': {
        framework: 'HealthKit',
        displayName: 'HealthKit',
    },
    'com.apple.developer.in-app-payments': {
        framework: 'PassKit',
        displayName: 'Apple Pay (PassKit)',
    },
    'com.apple.developer.homekit': {
        framework: 'HomeKit',
        displayName: 'HomeKit',
    },
    'com.apple.developer.nfc.readersession.formats': {
        framework: 'CoreNFC',
        displayName: 'NFC (CoreNFC)',
    },
    'com.apple.developer.siri': {
        framework: 'Intents',
        displayName: 'SiriKit (Intents)',
    },
    'com.apple.developer.game-center': {
        framework: 'GameKit',
        displayName: 'Game Center (GameKit)',
    },
};

/** Maps entitlement keys to expected privacy manifest data types */
interface EntitlementPrivacyRule {
    /** Required NSPrivacyCollectedDataType values (any match = satisfied) */
    requiredManifestTypes?: string[];
    /** If true, this is advisory-only (no hard check) */
    advisory?: boolean;
    /** Advisory message */
    advisoryMessage?: string;
    /** Display name for the entitlement */
    displayName: string;
}

const REQUIRED_FRAMEWORK_ENTITLEMENTS: Array<{
    framework: string;
    entitlement: string;
    displayName: string;
    guidelineRef: string;
    source: string;
}> = [
    {
        framework: 'GameKit',
        entitlement: 'com.apple.developer.game-center',
        displayName: 'Game Center (GameKit)',
        guidelineRef: 'ASC-Game-Center-Entitlement',
        source: 'https://developer.apple.com/news/upcoming-requirements/?id=06262023a',
    },
];

const ENTITLEMENT_TO_PRIVACY: Record<string, EntitlementPrivacyRule> = {
    'com.apple.developer.healthkit': {
        displayName: 'HealthKit',
        requiredManifestTypes: [
            'NSPrivacyCollectedDataTypeHealth',
        ],
    },
    'com.apple.developer.networking.vpn.api': {
        displayName: 'VPN Configuration',
        advisory: true,
        advisoryMessage:
            'VPN entitlement is present. If the app routes network traffic, ensure your privacy manifest ' +
            'and privacy policy account for any network data collection or processing.',
    },
    'com.apple.developer.associated-domains': {
        displayName: 'Associated Domains',
        advisory: true,
        advisoryMessage:
            'Associated Domains entitlement is present (used for Universal Links, Shared Web Credentials, etc.). ' +
            'If data is shared between your app and website, ensure this is disclosed in your privacy manifest.',
    },
};

/**
 * Deep-audit entitlements against frameworks and privacy manifest.
 * Returns findings for mismatches, unused capabilities, and missing declarations.
 */
export function auditEntitlements(
    entitlementsXml: string,
    frameworks: string[],
    manifestContent: string | undefined,
): CheckResult[] {
    const results: CheckResult[] = [];
    const frameworkSet = new Set(frameworks);

    // --- 1. Entitlement → Framework consistency ---
    let unusedEntitlementCount = 0;

    for (const [entitlementKey, info] of Object.entries(ENTITLEMENT_TO_FRAMEWORK)) {
        if (!entitlementsXml.includes(entitlementKey)) {
            continue;
        }

        if (!frameworkSet.has(info.framework)) {
            unusedEntitlementCount++;
            results.push({
                category: 'ipa_binary',
                severity: 'info',
                title: `${info.displayName} entitlement without corresponding framework`,
                description:
                    `Entitlement '${entitlementKey}' is declared but the corresponding ` +
                    `${info.framework} framework was not detected in the binary. This may indicate ` +
                    'an unused capability that could slow review.',
                fix_suggestion:
                    `If ${info.displayName} is no longer used, remove the capability from your ` +
                    'Xcode project (Signing & Capabilities tab) to reduce review friction.',
                confidence: 75,
            });
        }
    }

    // --- 2. Framework → Entitlement consistency ---
    for (const rule of REQUIRED_FRAMEWORK_ENTITLEMENTS) {
        if (!frameworkSet.has(rule.framework)) {
            continue;
        }

        if (entitlementsXml.includes(rule.entitlement)) {
            continue;
        }

        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: `${rule.displayName} framework detected without required entitlement`,
            description:
                `${rule.framework} is linked, but '${rule.entitlement}' was not found in the entitlements. ` +
                'Apple requires new apps and app updates that offer Game Center features to include the Game Center entitlement and configure Game Center in App Store Connect.',
            guideline_ref: rule.guidelineRef,
            fix_suggestion:
                'If the app uses Game Center, add the Game Center capability in Xcode and configure Game Center features in App Store Connect before submitting. ' +
                `If Game Center is not used, remove the ${rule.framework} dependency. Source: ${rule.source}`,
            confidence: 85,
        });
    }

    // --- 3. Entitlement → Privacy manifest consistency ---
    for (const [entitlementKey, rule] of Object.entries(ENTITLEMENT_TO_PRIVACY)) {
        if (!entitlementsXml.includes(entitlementKey)) {
            continue;
        }

        if (rule.advisory) {
            results.push({
                category: 'ipa_binary',
                severity: 'info',
                title: `${rule.displayName} entitlement detected`,
                description: rule.advisoryMessage || `${rule.displayName} entitlement is present.`,
                confidence: 70,
            });
            continue;
        }

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
                title: `${rule.displayName} entitlement present but privacy manifest may be incomplete`,
                description:
                    `The ${rule.displayName} entitlement is present but the privacy manifest ` +
                    `does not declare ${expectedTypes}. If your app collects this data, ` +
                    'the manifest should include the appropriate data type declarations.',
                fix_suggestion:
                    `Add ${expectedTypes} to NSPrivacyCollectedDataTypes in your ` +
                    'PrivacyInfo.xcprivacy if your app collects this data.',
                confidence: 85,
            });
        }
    }

    // --- 4. Unused entitlement count threshold ---
    if (unusedEntitlementCount > 2) {
        results.push({
            category: 'ipa_binary',
            severity: 'info',
            title: `Multiple capabilities (${unusedEntitlementCount}) appear unused`,
            description:
                `${unusedEntitlementCount} entitlements are declared but their corresponding ` +
                'frameworks were not detected in the binary. Unnecessary entitlements may trigger ' +
                'additional App Review scrutiny and slow down the review process.',
            fix_suggestion:
                'Review your Xcode project capabilities (Signing & Capabilities) and remove ' +
                'any that are no longer needed. This simplifies review and reduces your app\'s attack surface.',
            confidence: 70,
        });
    }

    return results;
}
