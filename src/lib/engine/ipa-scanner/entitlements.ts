/**
 * Parse and analyze app entitlements from the IPA binary.
 * Entitlements declare which system capabilities the app requests
 * (push notifications, HealthKit, Apple Pay, etc.)
 */

import type { CheckResult } from '../types';

/** Well-known entitlement keys and their meaning */
const ENTITLEMENT_INFO: Record<string, { name: string; review_note?: string }> = {
    'com.apple.developer.healthkit': {
        name: 'HealthKit',
        review_note: 'App must provide clear health disclaimers and comply with Section 1.4 (Physical Harm).',
    },
    'com.apple.developer.in-app-payments': {
        name: 'Apple Pay',
        review_note: 'Must follow Section 3.1 payment guidelines. Apple Pay can only be used for physical goods/services.',
    },
    'com.apple.developer.siri': {
        name: 'SiriKit',
    },
    'com.apple.developer.associated-domains': {
        name: 'Associated Domains (Universal Links)',
    },
    'com.apple.developer.networking.vpn.api': {
        name: 'VPN Configuration',
        review_note: 'VPN apps undergo additional review scrutiny. Must have clear privacy policy about traffic handling.',
    },
    'com.apple.developer.nfc.readersession.formats': {
        name: 'NFC Reader',
    },
    'com.apple.developer.homekit': {
        name: 'HomeKit',
    },
    'com.apple.developer.networking.HotspotConfiguration': {
        name: 'Hotspot Configuration',
        review_note: 'Must explain why the app needs to configure Wi-Fi networks.',
    },
    'com.apple.developer.carplay-audio': {
        name: 'CarPlay Audio',
    },
    'com.apple.developer.carplay-maps': {
        name: 'CarPlay Maps',
    },
    'aps-environment': {
        name: 'Push Notifications',
    },
    'com.apple.developer.icloud-container-identifiers': {
        name: 'iCloud',
    },
    'com.apple.developer.game-center': {
        name: 'Game Center',
    },
    'com.apple.external-accessory.wireless-configuration': {
        name: 'Wireless Accessory Configuration',
    },
    'com.apple.developer.kernel.increased-memory-limit': {
        name: 'Increased Memory Limit',
    },
    'com.apple.developer.user-management': {
        name: 'User Management',
    },
};

/**
 * Analyze entitlements XML string for review-relevant capabilities.
 */
export function analyzeEntitlements(entitlementsXml: string): CheckResult[] {
    const results: CheckResult[] = [];

    for (const [key, info] of Object.entries(ENTITLEMENT_INFO)) {
        if (entitlementsXml.includes(key)) {
            if (info.review_note) {
                results.push({
                    category: 'ipa_binary',
                    severity: 'info',
                    title: `${info.name} entitlement detected`,
                    description: `The app requests the ${info.name} capability. ${info.review_note}`,
                    confidence: 100, // Binary-level detection
                });
            }
        }
    }

    // Check for production vs development push notifications
    if (entitlementsXml.includes('aps-environment')) {
        const isDev = entitlementsXml.includes('<string>development</string>');
        if (isDev) {
            results.push({
                category: 'info_plist',
                severity: 'warning',
                title: 'Development push notification environment detected',
                description: 'The IPA uses the development push notification environment. This should be "production" for App Store submissions.',
                guideline_ref: 'ITMS-90078',
                fix_suggestion: 'Archive the app using a distribution provisioning profile, which automatically sets the push environment to production.',
                confidence: 95,
            });
        }
    }

    return results;
}
