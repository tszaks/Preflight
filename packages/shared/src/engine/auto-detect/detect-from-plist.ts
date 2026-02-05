/**
 * Auto-detection from Info.plist content.
 * Parses plist XML for background modes, usage descriptions, encryption keys, and URL schemes.
 */

import type { DetectionSource } from './index';

/** Background mode values and their meanings */
const BACKGROUND_MODES: Record<string, string> = {
    'location': 'Background location updates',
    'fetch': 'Background fetch',
    'remote-notification': 'Remote notifications',
    'audio': 'Background audio playback',
    'voip': 'Voice over IP',
    'bluetooth-central': 'Bluetooth central',
    'bluetooth-peripheral': 'Bluetooth peripheral',
    'external-accessory': 'External accessory communication',
    'processing': 'Background processing',
};

/** NS*UsageDescription keys and what they relate to */
const USAGE_DESCRIPTION_KEYS: Record<string, string> = {
    'NSCameraUsageDescription': 'Camera',
    'NSMicrophoneUsageDescription': 'Microphone',
    'NSLocationWhenInUseUsageDescription': 'Location (when in use)',
    'NSLocationAlwaysUsageDescription': 'Location (always)',
    'NSLocationAlwaysAndWhenInUseUsageDescription': 'Location (always and when in use)',
    'NSPhotoLibraryUsageDescription': 'Photo Library',
    'NSPhotoLibraryAddUsageDescription': 'Photo Library (add only)',
    'NSContactsUsageDescription': 'Contacts',
    'NSCalendarsUsageDescription': 'Calendars',
    'NSRemindersUsageDescription': 'Reminders',
    'NSHealthShareUsageDescription': 'HealthKit (read)',
    'NSHealthUpdateUsageDescription': 'HealthKit (write)',
    'NSMotionUsageDescription': 'Motion & Fitness',
    'NSBluetoothAlwaysUsageDescription': 'Bluetooth',
    'NSBluetoothPeripheralUsageDescription': 'Bluetooth Peripheral',
    'NSSpeechRecognitionUsageDescription': 'Speech Recognition',
    'NSFaceIDUsageDescription': 'Face ID',
    'NSAppleMusicUsageDescription': 'Media Library',
    'NSSiriUsageDescription': 'Siri',
    'NSHomeKitUsageDescription': 'HomeKit',
    'NFCReaderUsageDescription': 'NFC',
    'NSUserTrackingUsageDescription': 'App Tracking (ATT)',
};

/**
 * Detect app features from Info.plist XML content.
 */
export function detectFromPlist(plistContent: string): DetectionSource[] {
    const detections: DetectionSource[] = [];

    // --- Background location detection ---
    if (plistContent.includes('UIBackgroundModes')) {
        const backgroundModes = extractArrayValues(plistContent, 'UIBackgroundModes');

        if (backgroundModes.includes('location')) {
            detections.push({
                field: 'detected_background_location',
                value: true,
                source: 'plist',
                confidence: 95,
                evidence: 'UIBackgroundModes contains "location" in Info.plist',
            });
        }
    }

    // --- HealthKit plist keys (supplements binary detection) ---
    const hasHealthShare = plistContent.includes('NSHealthShareUsageDescription');
    const hasHealthUpdate = plistContent.includes('NSHealthUpdateUsageDescription');
    if (hasHealthShare || hasHealthUpdate) {
        const keys: string[] = [];
        if (hasHealthShare) keys.push('NSHealthShareUsageDescription');
        if (hasHealthUpdate) keys.push('NSHealthUpdateUsageDescription');

        detections.push({
            field: 'detected_healthkit',
            value: true,
            source: 'plist',
            confidence: 90,
            evidence: `Found ${keys.join(', ')} in Info.plist`,
        });
    }

    // --- Export encryption key ---
    if (plistContent.includes('ITSAppUsesNonExemptEncryption')) {
        const value = extractBooleanValue(plistContent, 'ITSAppUsesNonExemptEncryption');
        if (value !== null) {
            detections.push({
                field: 'encryption_non_exempt',
                value,
                source: 'plist',
                confidence: 95,
                evidence: `ITSAppUsesNonExemptEncryption = ${value} in Info.plist`,
            });
        }
    }

    // --- URL Schemes (potential OAuth flows) ---
    if (plistContent.includes('CFBundleURLTypes')) {
        detections.push({
            field: 'has_url_schemes',
            value: true,
            source: 'plist',
            confidence: 60, // URL schemes have many uses beyond OAuth
            evidence: 'CFBundleURLTypes found in Info.plist (custom URL schemes)',
        });
    }

    // --- Collect detected usage descriptions for informational purposes ---
    const detectedUsageKeys: string[] = [];
    for (const [key, label] of Object.entries(USAGE_DESCRIPTION_KEYS)) {
        if (plistContent.includes(key)) {
            detectedUsageKeys.push(label);
        }
    }

    if (detectedUsageKeys.length > 0) {
        detections.push({
            field: 'usage_descriptions',
            value: detectedUsageKeys.join(', '),
            source: 'plist',
            confidence: 95,
            evidence: `Permission usage descriptions found: ${detectedUsageKeys.join(', ')}`,
        });
    }

    return detections;
}

/**
 * Extract string values from a plist array that follows a specific key.
 * Simple XML parsing for plist format.
 */
function extractArrayValues(plistContent: string, key: string): string[] {
    const keyTag = `<key>${key}</key>`;
    const keyIndex = plistContent.indexOf(keyTag);
    if (keyIndex === -1) return [];

    const afterKey = plistContent.slice(keyIndex + keyTag.length);
    const arrayStart = afterKey.indexOf('<array>');
    if (arrayStart === -1 || arrayStart > 200) return [];

    const arrayEnd = afterKey.indexOf('</array>');
    if (arrayEnd === -1) return [];

    const arrayContent = afterKey.slice(arrayStart, arrayEnd);
    const values: string[] = [];
    const stringRegex = /<string>(.*?)<\/string>/g;
    let match;
    while ((match = stringRegex.exec(arrayContent)) !== null) {
        values.push(match[1]);
    }

    return values;
}

/**
 * Extract a boolean value from a plist that follows a specific key.
 */
function extractBooleanValue(plistContent: string, key: string): boolean | null {
    const keyTag = `<key>${key}</key>`;
    const keyIndex = plistContent.indexOf(keyTag);
    if (keyIndex === -1) return null;

    const afterKey = plistContent.slice(keyIndex + keyTag.length, keyIndex + keyTag.length + 100);
    if (afterKey.includes('<true/>') || afterKey.includes('<true />')) return true;
    if (afterKey.includes('<false/>') || afterKey.includes('<false />')) return false;
    return null;
}
