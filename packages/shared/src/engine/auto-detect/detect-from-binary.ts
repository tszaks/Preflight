/**
 * Auto-detection from IPA binary analysis.
 * Detects frameworks, entitlements, and imported symbols to infer app features.
 *
 * Confidence varies: framework detection is high (85-95) because the framework
 * is provably linked. But linking a framework doesn't always mean active usage
 * (e.g., StoreKit linked but no active IAPs), so some detections are lower.
 */

import type { DetectionSource } from './index';

export interface BinaryDetectionInput {
    frameworks: string[];
    entitlements?: string;
    importedSymbols?: string[];
}

/** Framework patterns that indicate third-party login */
const THIRD_PARTY_LOGIN_FRAMEWORKS = [
    { pattern: /^(GoogleSignIn|GIDSignIn)/i, name: 'Google Sign-In' },
    { pattern: /^(FBSDKLoginKit|FacebookLogin|FBSDKCoreKit)/i, name: 'Facebook Login' },
    { pattern: /^TwitterKit/i, name: 'Twitter Login' },
    { pattern: /^(FirebaseAuth|GTMSessionFetcher)/i, name: 'Firebase Auth' },
    { pattern: /^LineSDK/i, name: 'LINE Login' },
    { pattern: /^(KakaoSDKAuth|KakaoSDKUser)/i, name: 'Kakao Login' },
    { pattern: /^NaverThirdPartyLogin/i, name: 'Naver Login' },
];

/** StoreKit-related symbols that indicate IAP usage */
const STOREKIT_SYMBOLS = [
    'SKPaymentQueue',
    'SKProduct',
    'SKReceiptRefreshRequest',
    'SKPaymentTransaction',
    'SKProductsRequest',
];

/**
 * Detect app features from IPA binary contents.
 */
export function detectFromBinary(input: BinaryDetectionInput): DetectionSource[] {
    const detections: DetectionSource[] = [];
    const { frameworks, entitlements, importedSymbols } = input;

    // --- Third-party login detection ---
    const detectedLoginFrameworks: string[] = [];
    for (const fw of frameworks) {
        for (const rule of THIRD_PARTY_LOGIN_FRAMEWORKS) {
            if (rule.pattern.test(fw)) {
                detectedLoginFrameworks.push(rule.name);
                break;
            }
        }
    }

    if (detectedLoginFrameworks.length > 0) {
        detections.push({
            field: 'has_third_party_login',
            value: true,
            source: 'ipa_framework',
            confidence: 90,
            evidence: `Found ${detectedLoginFrameworks.join(', ')} framework${detectedLoginFrameworks.length > 1 ? 's' : ''} in binary`,
        });
    }

    // --- StoreKit / IAP detection (fallback when no ASC data) ---
    const hasStoreKit = frameworks.some(fw => /^StoreKit/i.test(fw));
    const hasStoreKitSymbols = importedSymbols?.some(sym => {
        const normalized = sym.startsWith('_') ? sym.slice(1) : sym;
        return STOREKIT_SYMBOLS.some(sk => normalized.includes(sk));
    }) ?? false;

    if (hasStoreKit || hasStoreKitSymbols) {
        detections.push({
            field: 'has_iap',
            value: true,
            source: hasStoreKit ? 'ipa_framework' : 'ipa_symbol',
            confidence: 70, // Linking StoreKit != active IAPs
            evidence: hasStoreKit
                ? 'StoreKit framework linked in binary'
                : 'StoreKit symbols found in binary imports',
        });
    }

    // --- HealthKit detection ---
    const hasHealthKitFramework = frameworks.some(fw => /^HealthKit/i.test(fw));
    const hasHealthKitEntitlement = entitlements?.includes('com.apple.developer.healthkit') ?? false;

    if (hasHealthKitFramework || hasHealthKitEntitlement) {
        const sources: string[] = [];
        if (hasHealthKitFramework) sources.push('HealthKit.framework');
        if (hasHealthKitEntitlement) sources.push('HealthKit entitlement');

        detections.push({
            field: 'detected_healthkit',
            value: true,
            source: hasHealthKitEntitlement ? 'ipa_entitlement' : 'ipa_framework',
            confidence: hasHealthKitEntitlement ? 95 : 85,
            evidence: `Found ${sources.join(' + ')} in binary`,
        });
    }

    // --- Sign in with Apple detection ---
    const hasAuthServices = frameworks.some(fw => /^AuthenticationServices/i.test(fw));
    if (hasAuthServices) {
        detections.push({
            field: 'detected_sign_in_with_apple',
            value: true,
            source: 'ipa_framework',
            confidence: 85, // Could be ASWebAuthenticationSession, not SIWA
            evidence: 'AuthenticationServices framework detected (may include Sign in with Apple)',
        });
    }

    // --- VPN detection ---
    const hasVpnEntitlement = entitlements?.includes('com.apple.developer.networking.vpn.api') ?? false;
    if (hasVpnEntitlement) {
        detections.push({
            field: 'detected_vpn',
            value: true,
            source: 'ipa_entitlement',
            confidence: 95,
            evidence: 'VPN API entitlement detected',
        });
    }

    // --- Apple Pay detection ---
    const hasApplePayEntitlement = entitlements?.includes('com.apple.developer.in-app-payments') ?? false;
    if (hasApplePayEntitlement) {
        detections.push({
            field: 'detected_apple_pay',
            value: true,
            source: 'ipa_entitlement',
            confidence: 95,
            evidence: 'Apple Pay entitlement detected',
        });
    }

    // --- Push notifications detection ---
    const hasUserNotifications = frameworks.some(fw => /^UserNotifications/i.test(fw));
    const hasPushEntitlement = entitlements?.includes('aps-environment') ?? false;

    if (hasUserNotifications || hasPushEntitlement) {
        const sources: string[] = [];
        if (hasUserNotifications) sources.push('UserNotifications.framework');
        if (hasPushEntitlement) sources.push('aps-environment entitlement');

        detections.push({
            field: 'detected_push_notifications',
            value: true,
            source: hasPushEntitlement ? 'ipa_entitlement' : 'ipa_framework',
            confidence: 90,
            evidence: `Found ${sources.join(' + ')} in binary`,
        });
    }

    return detections;
}
