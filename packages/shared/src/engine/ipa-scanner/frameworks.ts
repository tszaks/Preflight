/**
 * Known problematic or notable SDK/framework detection.
 * Maps framework names to potential App Store review concerns.
 */

import type { CheckResult } from '../types';

interface FrameworkRule {
    /** Pattern to match against framework name (case-insensitive) */
    pattern: RegExp;
    /** Human-readable SDK name */
    name: string;
    /** What this SDK is used for */
    purpose: string;
    /** Severity if detected */
    severity: 'critical' | 'warning' | 'info';
    /** Title for the finding */
    title: string;
    /** Description of the concern */
    description: string;
    /** Guideline reference */
    guideline_ref?: string;
    /** How to fix */
    fix_suggestion?: string;
}

const FRAMEWORK_RULES: FrameworkRule[] = [
    // Deprecated or banned SDKs
    {
        pattern: /^UIWebView$/i,
        name: 'UIWebView',
        purpose: 'Legacy web view',
        severity: 'critical',
        title: 'Deprecated UIWebView framework detected',
        description: 'UIWebView has been deprecated since iOS 12 and Apple rejects new submissions using it. Use WKWebView instead.',
        guideline_ref: 'ITMS-90809',
        fix_suggestion: 'Replace all UIWebView usage with WKWebView. If a third-party SDK includes UIWebView, update to the latest version of that SDK.',
    },

    // Tracking / Privacy-sensitive SDKs
    {
        pattern: /^(FBAudienceNetwork|FBSDKCoreKit|FacebookCore)/i,
        name: 'Facebook SDK',
        purpose: 'Social login, analytics, ads',
        severity: 'info',
        title: 'Facebook SDK detected',
        description: 'Facebook SDK is embedded. Ensure ATT (App Tracking Transparency) prompt is implemented before any tracking, and that your privacy manifest declares Facebook data collection.',
        guideline_ref: 'Section 5.1.2 - Data Use and Sharing',
        fix_suggestion: 'Verify that ATT permission is requested before initializing Facebook SDK tracking. Update your privacy manifest to declare all data types collected by Facebook.',
    },
    {
        pattern: /^(GoogleMobileAds|Google-Mobile-Ads-SDK)/i,
        name: 'Google AdMob',
        purpose: 'Mobile advertising',
        severity: 'info',
        title: 'Google AdMob SDK detected',
        description: 'AdMob is embedded for advertising. Ensure ATT is implemented, privacy manifest declares ad-related data collection, and ads are appropriate for your age rating.',
        guideline_ref: 'Section 5.1.1 - Data Collection and Storage',
        fix_suggestion: 'Confirm ATT prompt fires before ad loading. Verify age-appropriate ads if your app targets children.',
    },
    {
        pattern: /^(Adjust|AdjustSdk)/i,
        name: 'Adjust SDK',
        purpose: 'Attribution and analytics',
        severity: 'info',
        title: 'Adjust attribution SDK detected',
        description: 'Adjust is an attribution SDK that tracks user acquisition sources. Ensure ATT is properly implemented and privacy manifest covers Adjust data types.',
        guideline_ref: 'Section 5.1.2 - Data Use and Sharing',
    },
    {
        pattern: /^(Branch|BranchSDK)/i,
        name: 'Branch SDK',
        purpose: 'Deep linking and attribution',
        severity: 'info',
        title: 'Branch deep linking SDK detected',
        description: 'Branch SDK handles deep links and attribution. Verify privacy manifest includes Branch data collection declarations.',
    },

    // Hot-code-push SDKs (potentially rejected)
    {
        pattern: /^(CodePush|ReactNativeCodePush)/i,
        name: 'CodePush',
        purpose: 'Over-the-air code updates',
        severity: 'warning',
        title: 'CodePush OTA update framework detected',
        description: 'CodePush enables over-the-air JavaScript updates. Apple may reject apps that download and execute code outside of WebKit. Ensure updates only change JavaScript/assets, not native functionality.',
        guideline_ref: 'Section 2.5.2 - Software Requirements',
        fix_suggestion: 'Verify CodePush is only used for JS bundle updates. Do not use it to add new native features or change app behavior significantly.',
    },

    // WebView-based frameworks
    {
        pattern: /^(Cordova|Capacitor|Ionic)/i,
        name: 'Hybrid Framework',
        purpose: 'Cross-platform hybrid app',
        severity: 'info',
        title: 'Hybrid app framework detected',
        description: 'This app uses a hybrid web-native framework. Apple scrutinizes hybrid apps for minimum functionality (Section 4.2). Ensure the app provides a native-quality experience.',
        guideline_ref: 'Section 4.2 - Minimum Functionality',
    },

    // Flutter
    {
        pattern: /^Flutter$/i,
        name: 'Flutter',
        purpose: 'Cross-platform UI framework',
        severity: 'info',
        title: 'Flutter framework detected',
        description: 'App built with Flutter. Generally accepted, but ensure platform-specific behaviors (haptics, gestures, navigation) follow iOS conventions.',
    },

    // React Native
    {
        pattern: /^(React|ReactNative|hermes)/i,
        name: 'React Native',
        purpose: 'Cross-platform UI framework',
        severity: 'info',
        title: 'React Native framework detected',
        description: 'App built with React Native. Generally accepted. Ensure the app follows iOS design patterns and navigation conventions.',
    },

    // Hot-patching SDKs (explicitly banned)
    {
        pattern: /^JSPatch/i,
        name: 'JSPatch',
        purpose: 'Hot-patching native code via JavaScript',
        severity: 'critical',
        title: 'Banned hot-patching SDK detected: JSPatch',
        description: 'JSPatch enables runtime modification of native code via JavaScript. Apple explicitly bans hot-patching frameworks that can change native behavior after review.',
        guideline_ref: 'Section 2.5.2 - Software Requirements',
        fix_suggestion: 'Remove JSPatch entirely. Apple will reject any submission containing this framework. Use standard App Store updates to deliver code changes.',
    },
    {
        pattern: /^Rollout/i,
        name: 'Rollout.io',
        purpose: 'Hot-code push for native apps',
        severity: 'critical',
        title: 'Banned hot-code push SDK detected: Rollout.io',
        description: 'Rollout.io enables over-the-air native code modifications. Apple bans frameworks that can alter native app behavior outside of the review process.',
        guideline_ref: 'Section 2.5.2 - Software Requirements',
        fix_suggestion: 'Remove Rollout.io entirely. Use standard App Store updates or permitted JavaScript-only OTA solutions instead.',
    },
    {
        pattern: /^(ExpoUpdates|EXUpdates)/i,
        name: 'Expo Updates',
        purpose: 'Over-the-air updates for Expo apps',
        severity: 'warning',
        title: 'Expo OTA update framework detected',
        description: 'Expo Updates enables over-the-air JavaScript updates. While generally tolerated for JS bundle updates, Apple may scrutinize apps that significantly change behavior post-review.',
        guideline_ref: 'Section 2.5.2 - Software Requirements',
        fix_suggestion: 'Ensure Expo Updates only delivers JavaScript and asset changes. Do not use OTA updates to add native functionality or significantly alter app behavior.',
    },

    // Encryption / Export compliance
    {
        pattern: /^(OpenSSL|libssl|libcrypto)/i,
        name: 'OpenSSL',
        purpose: 'Third-party cryptographic library',
        severity: 'info',
        title: 'OpenSSL cryptographic library detected',
        description: 'OpenSSL (or libssl/libcrypto) is embedded. This triggers export compliance requirements. You will be asked about encryption usage during App Store submission.',
        guideline_ref: 'Export Compliance - ITSAppUsesEncryption',
        fix_suggestion: 'Ensure your app includes the ITSAppUsesEncryption key in Info.plist. If using encryption beyond HTTPS, you may need an ECCN classification or exemption documentation.',
    },
    {
        pattern: /^CommonCrypto/i,
        name: 'CommonCrypto',
        purpose: 'Apple cryptographic functions',
        severity: 'info',
        title: 'CommonCrypto usage detected',
        description: 'The app uses Apple\'s CommonCrypto library for encryption operations. This may trigger export compliance questions during submission.',
        guideline_ref: 'Export Compliance - ITSAppUsesEncryption',
        fix_suggestion: 'Add ITSAppUsesEncryption to Info.plist. If only using standard hashing (SHA, MD5) or HTTPS, you likely qualify for an exemption.',
    },

    // Analytics / Attribution SDKs
    {
        pattern: /^(Firebase|GoogleUtilities)/i,
        name: 'Firebase',
        purpose: 'Analytics, push notifications, backend services',
        severity: 'info',
        title: 'Firebase SDK detected',
        description: 'Firebase is embedded. Ensure your privacy manifest covers all Firebase data collection types. Firebase modules may use required reason APIs that must be declared.',
        guideline_ref: 'Section 5.1.2 - Data Use and Sharing',
        fix_suggestion: 'Verify your PrivacyInfo.xcprivacy declares all required reason APIs used by Firebase. Update to the latest Firebase version which includes its own privacy manifest.',
    },
    {
        pattern: /^AppsFlyerLib/i,
        name: 'AppsFlyer',
        purpose: 'Attribution and analytics',
        severity: 'info',
        title: 'AppsFlyer attribution SDK detected',
        description: 'AppsFlyer is an attribution SDK that tracks user acquisition. Ensure ATT (App Tracking Transparency) is implemented before any tracking begins.',
        guideline_ref: 'Section 5.1.2 - Data Use and Sharing',
        fix_suggestion: 'Implement ATT prompt before initializing AppsFlyer tracking. Declare AppsFlyer data types in your privacy manifest.',
    },
    {
        pattern: /^Singular/i,
        name: 'Singular',
        purpose: 'Attribution and analytics',
        severity: 'info',
        title: 'Singular attribution SDK detected',
        description: 'Singular is an attribution SDK for user acquisition tracking. Ensure ATT is implemented and privacy manifest covers Singular data collection.',
        guideline_ref: 'Section 5.1.2 - Data Use and Sharing',
        fix_suggestion: 'Implement ATT prompt before Singular tracking. Include Singular data types in your privacy manifest.',
    },

    // Cross-platform frameworks
    {
        pattern: /^Unity/i,
        name: 'Unity',
        purpose: 'Cross-platform game engine',
        severity: 'info',
        title: 'Unity game engine detected',
        description: 'App built with Unity. Generally accepted for games. Ensure the app follows iOS design conventions where applicable and that Unity\'s privacy manifest is included.',
    },
    {
        pattern: /^Xamarin/i,
        name: 'Xamarin',
        purpose: 'Cross-platform .NET framework',
        severity: 'info',
        title: 'Xamarin framework detected',
        description: 'App built with Xamarin (.NET). Generally accepted, but ensure the app provides a native-quality iOS experience and follows platform conventions.',
        guideline_ref: 'Section 4.2 - Minimum Functionality',
    },

    // Ad mediation SDKs
    {
        pattern: /^Chartboost/i,
        name: 'Chartboost',
        purpose: 'Ad mediation and monetization',
        severity: 'info',
        title: 'Chartboost ad SDK detected',
        description: 'Chartboost is embedded for ad mediation. Ensure ATT is implemented before ad tracking and that ad content is appropriate for your age rating.',
        guideline_ref: 'Section 5.1.1 - Data Collection and Storage',
        fix_suggestion: 'Implement ATT prompt before loading ads. Verify age-appropriate ad settings if your app targets children.',
    },
    {
        pattern: /^(IronSource|ISMediationSDK)/i,
        name: 'IronSource',
        purpose: 'Ad mediation platform',
        severity: 'info',
        title: 'IronSource ad mediation SDK detected',
        description: 'IronSource (Unity Ads mediation) is embedded. Ensure ATT is implemented and privacy manifest declares all ad-related data collection.',
        guideline_ref: 'Section 5.1.1 - Data Collection and Storage',
        fix_suggestion: 'Implement ATT prompt before ad loading. Update to the latest IronSource version with privacy manifest support.',
    },

    // Payment / Subscription SDKs
    {
        pattern: /^(RevenueCat|Purchases)/i,
        name: 'RevenueCat',
        purpose: 'Subscription management',
        severity: 'info',
        title: 'RevenueCat subscription SDK detected',
        description: 'RevenueCat handles in-app subscriptions. Ensure your paywall displays subscription terms, pricing, and renewal info as required by Apple.',
        guideline_ref: 'Section 3.1.2 - Subscriptions',
        fix_suggestion: 'Verify your paywall clearly shows subscription price, duration, renewal terms, and instructions for managing/canceling subscriptions.',
    },
    {
        pattern: /^(Stripe|StripePaymentSheet)/i,
        name: 'Stripe',
        purpose: 'Payment processing',
        severity: 'info',
        title: 'Stripe payment SDK detected',
        description: 'Stripe is embedded for payment processing. If selling digital content or services consumed within the app, you usually need Apple In-App Purchase unless a regional external-purchase option applies.',
        guideline_ref: 'Section 3.1.1 - In-App Purchase',
        fix_suggestion: 'Ensure Stripe is only used for physical goods/services, out-of-app consumption, or a storefront where Apple permits alternative payment options and you have implemented the required entitlement, disclosures, eligibility checks, reporting, and child-safety controls. In Brazil, call StoreKit canMakePayments before purchase or payment-information flows. Otherwise, digital content consumed in-app must use Apple IAP.',
    },
    {
        pattern: /^(Plaid|LinkKit)/i,
        name: 'Plaid',
        purpose: 'Financial data aggregation',
        severity: 'info',
        title: 'Plaid financial data SDK detected',
        description: 'Plaid enables bank account linking and financial data access. Ensure your privacy policy covers financial data collection and that user consent flows are clear.',
        guideline_ref: 'Section 5.1 - Privacy',
        fix_suggestion: 'Verify your privacy policy explicitly describes financial data collection via Plaid. Ensure users are clearly informed before linking accounts.',
    },
];

/**
 * Analyze embedded frameworks for potential App Store review issues.
 */
export function analyzeFrameworks(frameworks: string[]): CheckResult[] {
    const results: CheckResult[] = [];

    for (const fw of frameworks) {
        for (const rule of FRAMEWORK_RULES) {
            if (rule.pattern.test(fw)) {
                results.push({
                    category: 'ipa_binary',
                    severity: rule.severity,
                    title: rule.title,
                    description: rule.description,
                    guideline_ref: rule.guideline_ref,
                    fix_suggestion: rule.fix_suggestion,
                    confidence: 95, // Binary detection is high-confidence
                });
                break; // Only match first rule per framework
            }
        }
    }

    return results;
}
