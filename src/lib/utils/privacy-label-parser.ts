/**
 * Parses a PrivacyInfo.xcprivacy file and extracts data for the
 * App Store privacy "nutrition label" preview.
 *
 * The privacy label shows users what data your app collects and how it's used.
 * This parser translates the technical manifest into human-readable categories.
 */

export interface PrivacyLabelData {
    tracking: {
        enabled: boolean;
        domains: string[];
    };
    collectedDataTypes: CollectedDataType[];
    accessedAPITypes: AccessedAPIType[];
}

export interface CollectedDataType {
    category: string;
    categoryDisplayName: string;
    dataTypes: {
        type: string;
        displayName: string;
        purposes: string[];
        linkedToUser: boolean;
        usedForTracking: boolean;
    }[];
}

export interface AccessedAPIType {
    type: string;
    displayName: string;
    reasons: string[];
    reasonDescriptions: string[];
}

// Human-readable names for data categories
const DATA_CATEGORY_NAMES: Record<string, string> = {
    'NSPrivacyCollectedDataTypeContactInfo': 'Contact Info',
    'NSPrivacyCollectedDataTypeHealthAndFitness': 'Health & Fitness',
    'NSPrivacyCollectedDataTypeFinancialInfo': 'Financial Info',
    'NSPrivacyCollectedDataTypeLocation': 'Location',
    'NSPrivacyCollectedDataTypeSensitiveInfo': 'Sensitive Info',
    'NSPrivacyCollectedDataTypeContacts': 'Contacts',
    'NSPrivacyCollectedDataTypeUserContent': 'User Content',
    'NSPrivacyCollectedDataTypeBrowsingHistory': 'Browsing History',
    'NSPrivacyCollectedDataTypeSearchHistory': 'Search History',
    'NSPrivacyCollectedDataTypeIdentifiers': 'Identifiers',
    'NSPrivacyCollectedDataTypePurchases': 'Purchases',
    'NSPrivacyCollectedDataTypeUsageData': 'Usage Data',
    'NSPrivacyCollectedDataTypeDiagnostics': 'Diagnostics',
    'NSPrivacyCollectedDataTypeOtherData': 'Other Data',
};

// Human-readable names for API types
const API_TYPE_NAMES: Record<string, string> = {
    'NSPrivacyAccessedAPICategoryFileTimestamp': 'File Timestamps',
    'NSPrivacyAccessedAPICategorySystemBootTime': 'System Boot Time',
    'NSPrivacyAccessedAPICategoryDiskSpace': 'Disk Space',
    'NSPrivacyAccessedAPICategoryActiveKeyboards': 'Active Keyboards',
    'NSPrivacyAccessedAPICategoryUserDefaults': 'User Defaults',
};

// Human-readable descriptions for reason codes
const REASON_DESCRIPTIONS: Record<string, string> = {
    // File Timestamp reasons
    'DDA9.1': 'Display file timestamps to the user',
    'C617.1': 'Access timestamps within app container',
    '3B52.1': 'Access timestamps for files user granted access to',
    '0A2A.1': 'Access timestamps for third-party SDK functionality',

    // System Boot Time reasons
    '35F9.1': 'Calculate time elapsed between events',
    '8FFB.1': 'Calculate time elapsed for internal operations',
    '3D61.1': 'Access boot time for third-party SDK functionality',

    // Disk Space reasons
    '85F4.1': 'Display disk space to the user',
    'E174.1': 'Check disk space for writing files',
    '7D9E.1': 'Check disk space for app functionality',
    'B728.1': 'Access disk space for third-party SDK functionality',

    // Active Keyboards reasons
    '3EC4.1': 'Customize app based on active keyboards',
    '54BD.1': 'Access keyboards for third-party SDK functionality',

    // User Defaults reasons
    'CA92.1': 'Access user defaults within app',
    '1C8F.1': 'Access user defaults from App Groups',
    'C56D.1': 'Read previously written user defaults',
    'AC6B.1': 'Access user defaults for third-party SDK functionality',
};

// Purpose display names
const PURPOSE_NAMES: Record<string, string> = {
    'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising': 'Third-Party Advertising',
    'NSPrivacyCollectedDataTypePurposeDeveloperAdvertising': 'Developer Advertising',
    'NSPrivacyCollectedDataTypePurposeAnalytics': 'Analytics',
    'NSPrivacyCollectedDataTypePurposeProductPersonalization': 'Product Personalization',
    'NSPrivacyCollectedDataTypePurposeAppFunctionality': 'App Functionality',
    'NSPrivacyCollectedDataTypePurposeOther': 'Other Purposes',
};

/**
 * Parses a PrivacyInfo.xcprivacy file content and extracts structured data
 * for the privacy nutrition label preview.
 */
export function parsePrivacyManifest(manifestContent: string | null | undefined): PrivacyLabelData | null {
    if (!manifestContent) {
        return null;
    }

    const result: PrivacyLabelData = {
        tracking: {
            enabled: false,
            domains: [],
        },
        collectedDataTypes: [],
        accessedAPITypes: [],
    };

    // Parse tracking status
    if (manifestContent.includes('NSPrivacyTracking')) {
        result.tracking.enabled = manifestContent.includes('<key>NSPrivacyTracking</key>') &&
            manifestContent.includes('<true/>');
    }

    // Extract tracking domains (basic extraction - would need proper XML parsing for production)
    const domainsMatch = manifestContent.match(/<key>NSPrivacyTrackingDomains<\/key>\s*<array>([\s\S]*?)<\/array>/);
    if (domainsMatch) {
        const domains = domainsMatch[1].match(/<string>([^<]+)<\/string>/g);
        if (domains) {
            result.tracking.domains = domains.map(d => d.replace(/<\/?string>/g, ''));
        }
    }

    // Extract accessed API types
    for (const [apiType, displayName] of Object.entries(API_TYPE_NAMES)) {
        if (manifestContent.includes(apiType)) {
            const accessedAPI: AccessedAPIType = {
                type: apiType,
                displayName,
                reasons: [],
                reasonDescriptions: [],
            };

            // Find reason codes for this API type
            for (const [code, description] of Object.entries(REASON_DESCRIPTIONS)) {
                if (manifestContent.includes(code)) {
                    accessedAPI.reasons.push(code);
                    accessedAPI.reasonDescriptions.push(description);
                }
            }

            if (accessedAPI.reasons.length > 0) {
                result.accessedAPITypes.push(accessedAPI);
            }
        }
    }

    // Extract collected data types (simplified - real implementation would parse XML properly)
    for (const [dataType, displayName] of Object.entries(DATA_CATEGORY_NAMES)) {
        if (manifestContent.includes(dataType)) {
            // Check if linked to user
            const isLinked = manifestContent.includes('NSPrivacyCollectedDataTypeLinked') &&
                manifestContent.includes('<true/>');

            // Check if used for tracking
            const isTracking = manifestContent.includes('NSPrivacyCollectedDataTypeTracking') &&
                manifestContent.includes('<true/>');

            // Extract purposes
            const purposes: string[] = [];
            for (const [purposeKey, purposeName] of Object.entries(PURPOSE_NAMES)) {
                if (manifestContent.includes(purposeKey)) {
                    purposes.push(purposeName);
                }
            }

            result.collectedDataTypes.push({
                category: dataType,
                categoryDisplayName: displayName,
                dataTypes: [{
                    type: dataType,
                    displayName,
                    purposes: purposes.length > 0 ? purposes : ['App Functionality'],
                    linkedToUser: isLinked,
                    usedForTracking: isTracking,
                }],
            });
        }
    }

    return result;
}

/**
 * Generates a summary description for the privacy label.
 * This is the text that appears under "App Privacy" on the App Store.
 */
export function generatePrivacySummary(data: PrivacyLabelData): string {
    const parts: string[] = [];

    if (data.tracking.enabled) {
        parts.push('This app may track you across apps and websites owned by other companies.');
    } else {
        parts.push('This app does not track you.');
    }

    if (data.collectedDataTypes.length === 0) {
        parts.push('No data is collected from this app.');
    } else {
        const linked = data.collectedDataTypes.filter(d =>
            d.dataTypes.some(t => t.linkedToUser)
        );
        const notLinked = data.collectedDataTypes.filter(d =>
            d.dataTypes.every(t => !t.linkedToUser)
        );

        if (linked.length > 0) {
            parts.push(`Data linked to you: ${linked.map(d => d.categoryDisplayName).join(', ')}.`);
        }
        if (notLinked.length > 0) {
            parts.push(`Data not linked to you: ${notLinked.map(d => d.categoryDisplayName).join(', ')}.`);
        }
    }

    return parts.join(' ');
}

/**
 * Categorizes collected data into the three App Store privacy sections:
 * 1. Data Used to Track You
 * 2. Data Linked to You
 * 3. Data Not Linked to You
 */
export function categorizePrivacyData(data: PrivacyLabelData): {
    dataUsedToTrack: string[];
    dataLinkedToYou: string[];
    dataNotLinkedToYou: string[];
} {
    const dataUsedToTrack: string[] = [];
    const dataLinkedToYou: string[] = [];
    const dataNotLinkedToYou: string[] = [];

    for (const category of data.collectedDataTypes) {
        for (const dataType of category.dataTypes) {
            if (dataType.usedForTracking) {
                dataUsedToTrack.push(dataType.displayName);
            } else if (dataType.linkedToUser) {
                dataLinkedToYou.push(dataType.displayName);
            } else {
                dataNotLinkedToYou.push(dataType.displayName);
            }
        }
    }

    return { dataUsedToTrack, dataLinkedToYou, dataNotLinkedToYou };
}
