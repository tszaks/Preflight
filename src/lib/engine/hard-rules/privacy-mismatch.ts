/**
 * Privacy Mismatch Detection - Cross-references form data collection
 * declarations against privacy manifest (PrivacyInfo.xcprivacy).
 *
 * Catches the #1 real issue missed in the Vero audit: form says data
 * is collected, but privacy manifest is empty or missing the types.
 */

import type { CheckResult, DataCollectionDeclaration } from '../types';
import { getGuidelineRef } from '../knowledge-base/guidelines';

/**
 * Maps form field keys to their corresponding NSPrivacyCollectedDataType values.
 * These are the Apple-defined privacy manifest data type identifiers.
 */
const FORM_TO_MANIFEST_MAP: Record<keyof DataCollectionDeclaration, string> = {
    contactInfo: 'NSPrivacyCollectedDataTypeContactInfo',
    healthFitness: 'NSPrivacyCollectedDataTypeHealthAndFitness',
    financialInfo: 'NSPrivacyCollectedDataTypeFinancialInfo',
    location: 'NSPrivacyCollectedDataTypeLocation',
    sensitiveInfo: 'NSPrivacyCollectedDataTypeSensitiveInfo',
    contacts: 'NSPrivacyCollectedDataTypeContacts',
    userContent: 'NSPrivacyCollectedDataTypeUserContent',
    browsingHistory: 'NSPrivacyCollectedDataTypeBrowsingHistory',
    searchHistory: 'NSPrivacyCollectedDataTypeSearchHistory',
    identifiers: 'NSPrivacyCollectedDataTypeIdentifiers',
    purchases: 'NSPrivacyCollectedDataTypePurchases',
    usageData: 'NSPrivacyCollectedDataTypeUsageData',
    diagnostics: 'NSPrivacyCollectedDataTypeDiagnostics',
};

/** Human-readable names for form data types */
const DATA_TYPE_DISPLAY_NAMES: Record<keyof DataCollectionDeclaration, string> = {
    contactInfo: 'Contact Info',
    healthFitness: 'Health & Fitness',
    financialInfo: 'Financial Info',
    location: 'Location',
    sensitiveInfo: 'Sensitive Info',
    contacts: 'Contacts',
    userContent: 'User Content',
    browsingHistory: 'Browsing History',
    searchHistory: 'Search History',
    identifiers: 'Identifiers',
    purchases: 'Purchases',
    usageData: 'Usage Data',
    diagnostics: 'Diagnostics',
};

/**
 * Cross-references form data collection declarations against the privacy manifest.
 * Detects mismatches where the form says data is collected but the manifest doesn't declare it.
 */
export function checkPrivacyMismatch(
    dataCollection: DataCollectionDeclaration | undefined,
    manifestContent: string | null | undefined
): CheckResult[] {
    const results: CheckResult[] = [];

    if (!dataCollection) {
        // No data collection info from form - can't cross-reference
        return results;
    }

    // Which data types does the form say are collected?
    const collectedTypes = Object.entries(dataCollection)
        .filter(([, collected]) => collected === true)
        .map(([key]) => key as keyof DataCollectionDeclaration);

    if (collectedTypes.length === 0) {
        // Form says no data is collected - nothing to cross-reference
        return results;
    }

    // Case 1: Form says data IS collected, but NO manifest was provided at all
    if (!manifestContent) {
        const typeNames = collectedTypes.map(k => DATA_TYPE_DISPLAY_NAMES[k]).join(', ');
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Data collected but no privacy manifest provided',
            description:
                `You indicated your app collects: ${typeNames}. ` +
                'However, no PrivacyInfo.xcprivacy file was uploaded. ' +
                'Apple requires a privacy manifest when your app collects user data.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion:
                'Create a PrivacyInfo.xcprivacy file and declare all collected data types ' +
                'in NSPrivacyCollectedDataTypes. Upload it with your submission.',
            confidence: 100,
        });
        return results;
    }

    // Case 2: Manifest exists but NSPrivacyCollectedDataTypes section is empty/missing
    const hasCollectedDataSection = manifestContent.includes('NSPrivacyCollectedDataTypes');
    if (!hasCollectedDataSection) {
        const typeNames = collectedTypes.map(k => DATA_TYPE_DISPLAY_NAMES[k]).join(', ');
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: 'Data collected but privacy manifest has no data type declarations',
            description:
                `You indicated your app collects: ${typeNames}. ` +
                'However, the privacy manifest does not contain NSPrivacyCollectedDataTypes. ' +
                'This will cause rejection during App Store review.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion:
                'Add NSPrivacyCollectedDataTypes to your PrivacyInfo.xcprivacy file ' +
                'declaring each data type your app collects.',
            confidence: 100,
        });
        return results;
    }

    // Case 3: Manifest exists with data types section - check individual types
    const missingTypes: string[] = [];
    for (const formKey of collectedTypes) {
        const manifestType = FORM_TO_MANIFEST_MAP[formKey];
        if (!manifestContent.includes(manifestType)) {
            missingTypes.push(DATA_TYPE_DISPLAY_NAMES[formKey]);
        }
    }

    if (missingTypes.length > 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'critical',
            title: `${missingTypes.length} collected data type(s) missing from privacy manifest`,
            description:
                `Your form indicates these data types are collected but they are not declared ` +
                `in your privacy manifest: ${missingTypes.join(', ')}. ` +
                'Apple requires all collected data types to be declared in PrivacyInfo.xcprivacy.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion:
                `Add the following to NSPrivacyCollectedDataTypes in your manifest: ${missingTypes.join(', ')}.`,
            confidence: 95,
        });
    }

    // Case 4 (info): Manifest declares types that form says aren't collected
    const manifestDeclaredKeys = Object.entries(FORM_TO_MANIFEST_MAP)
        .filter(([, manifestType]) => manifestContent.includes(manifestType))
        .map(([formKey]) => formKey as keyof DataCollectionDeclaration);

    const extraInManifest = manifestDeclaredKeys.filter(
        key => !dataCollection[key]
    );

    if (extraInManifest.length > 0) {
        const extraNames = extraInManifest.map(k => DATA_TYPE_DISPLAY_NAMES[k]).join(', ');
        results.push({
            category: 'privacy_manifest',
            severity: 'info',
            title: 'Privacy manifest declares data types not selected in form',
            description:
                `Your privacy manifest declares collection of: ${extraNames}, ` +
                'but you did not indicate these are collected in the submission form. ' +
                'This may be correct (third-party SDKs can add types), but verify your form answers are accurate.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion:
                'Double-check your data collection form answers match what your app actually collects. ' +
                'Include data collected by third-party SDKs.',
            confidence: 80,
        });
    }

    // If no mismatches found
    if (results.length === 0) {
        results.push({
            category: 'privacy_manifest',
            severity: 'pass',
            title: 'Privacy data declarations match manifest',
            description: 'All data types marked as collected in the form are properly declared in the privacy manifest.',
            confidence: 100,
        });
    }

    return results;
}
