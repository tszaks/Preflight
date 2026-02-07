/**
 * Auto-detection from Info.plist content.
 * Supports XML and binary plists (built iOS apps typically use binary Info.plist).
 */

import type { DetectionSource } from './index';
import { parseApplePlist } from '../utils/parse-apple-plist';

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
 * Detect app features from Info.plist content (XML or binary).
 */
export function detectFromPlist(plistContent: string | Buffer): DetectionSource[] {
    const detections: DetectionSource[] = [];
    const parsed = parseApplePlist(plistContent) || {};

    // --- Background location detection ---
    const backgroundModes = Array.isArray((parsed as any).UIBackgroundModes)
        ? ((parsed as any).UIBackgroundModes as unknown[]).filter((v) => typeof v === 'string') as string[]
        : [];
    if (backgroundModes.includes('location')) {
        detections.push({
            field: 'detected_background_location',
            value: true,
            source: 'plist',
            confidence: 95,
            evidence: 'UIBackgroundModes contains "location" in Info.plist',
        });
    }

    // --- HealthKit plist keys (supplements binary detection) ---
    const hasHealthShare = typeof (parsed as any).NSHealthShareUsageDescription === 'string';
    const hasHealthUpdate = typeof (parsed as any).NSHealthUpdateUsageDescription === 'string';
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
    if ('ITSAppUsesNonExemptEncryption' in (parsed as any)) {
        const v = (parsed as any).ITSAppUsesNonExemptEncryption;
        if (typeof v === 'boolean') {
            detections.push({
                field: 'encryption_non_exempt',
                value: v,
                source: 'plist',
                confidence: 95,
                evidence: `ITSAppUsesNonExemptEncryption = ${v} in Info.plist`,
            });
        }
    }

    // --- URL Schemes (potential OAuth flows) ---
    if (Array.isArray((parsed as any).CFBundleURLTypes)) {
        detections.push({
            field: 'has_url_schemes',
            value: true,
            source: 'plist',
            confidence: 60, // URL schemes have many uses beyond OAuth
            evidence: 'CFBundleURLTypes found in Info.plist (custom URL schemes)',
        });
    }

    // --- Third-party login detection from URL schemes (OAuth callbacks) ---
    // We intentionally keep this "detected_third_party_login" separate from the form field
    // "has_third_party_login" so self-report alone cannot create a critical SIWA issue.
    const schemes = extractUrlSchemesFromParsedPlist(parsed);
    if (schemes.length > 0) {
        const hits: string[] = [];
        for (const scheme of schemes) {
            // Facebook: fb<APP_ID>
            if (/^fb\\d+$/i.test(scheme)) hits.push(`Facebook (${scheme})`);
            // Google Sign-In / OAuth: com.googleusercontent.apps.<CLIENT_ID>
            else if (/^com\\.googleusercontent\\.apps\\./i.test(scheme)) hits.push(`Google (${scheme})`);
            // Microsoft MSAL: msauth.<bundle_id> (common)
            else if (/^msauth\\./i.test(scheme)) hits.push(`Microsoft (${scheme})`);
            // Auth0: often uses "a0" prefixes or includes auth0 in callback scheme
            else if (/auth0/i.test(scheme) || /^a0/i.test(scheme)) hits.push(`Auth0 (${scheme})`);
        }

        if (hits.length > 0) {
            detections.push({
                field: 'detected_third_party_login',
                value: true,
                source: 'plist',
                confidence: 75,
                evidence: `OAuth/social login callback URL scheme(s) detected: ${hits.join(', ')}`,
            });
        }
    }

    // --- Collect detected usage descriptions for informational purposes ---
    const detectedUsageKeys: string[] = [];
    for (const [key, label] of Object.entries(USAGE_DESCRIPTION_KEYS)) {
        if (typeof (parsed as any)[key] === 'string') {
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

    // --- Background mode listing (informational) ---
    const meaningfulBackground = backgroundModes.filter((m) => m in BACKGROUND_MODES);
    if (meaningfulBackground.length > 0) {
        detections.push({
            field: 'background_modes',
            value: meaningfulBackground.map((m) => BACKGROUND_MODES[m]).join(', '),
            source: 'plist',
            confidence: 90,
            evidence: `UIBackgroundModes includes: ${meaningfulBackground.join(', ')}`,
        });
    }

    return detections;
}

function extractUrlSchemesFromParsedPlist(parsed: Record<string, unknown>): string[] {
    const urlTypes = (parsed as any).CFBundleURLTypes;
    if (!Array.isArray(urlTypes)) return [];

    const schemes: string[] = [];
    for (const t of urlTypes) {
        if (!t || typeof t !== 'object' || Array.isArray(t)) continue;
        const s = (t as any).CFBundleURLSchemes;
        if (!Array.isArray(s)) continue;
        for (const raw of s) {
            if (typeof raw === 'string') schemes.push(raw.trim());
        }
    }

    return schemes.filter(Boolean);
}

