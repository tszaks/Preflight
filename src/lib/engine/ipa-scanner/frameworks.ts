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
