/**
 * Technical requirements and limits from Apple's App Store documentation.
 * Sources: Apple Developer Documentation, App Store Connect Help
 */

export const METADATA_LIMITS = {
    app_name: { max: 30, min: 2 },
    subtitle: { max: 30, min: 2 },
    description: { max: 4000, min: 100 },
    keywords: { max: 100 },
    whats_new: { max: 4000 },
    promotional_text: { max: 170 },
} as const;

export const SCREENSHOT_LIMITS = {
    min_count: 1,
    max_count: 10,
    max_size_bytes: 5 * 1024 * 1024, // 5MB
    allowed_formats: ['image/jpeg', 'image/png'] as const,
} as const;

export const PRIMARY_SCREENSHOT_DIMENSIONS = {
    'iPhone_6_9': { width: 1320, height: 2868, label: '6.9" iPhone accepted size' },
    'iPhone_6_9_alt': { width: 1260, height: 2736, label: '6.9" iPhone accepted size' },
    'iPhone_6_7': { width: 1290, height: 2796, label: '6.7" iPhone (iPhone 16 Plus / 15 Pro Max)' },
    'iPhone_6_5': { width: 1284, height: 2778, label: '6.5" iPhone (iPhone 14 Plus / 13 Pro Max)' },
    'iPhone_6_5_alt': { width: 1242, height: 2688, label: '6.5" iPhone accepted size' },
    'iPhone_6_3': { width: 1206, height: 2622, label: '6.3" iPhone accepted size' },
    'iPhone_6_1': { width: 1179, height: 2556, label: '6.1" iPhone accepted size' },
    'iPhone_6_1_alt': { width: 1170, height: 2532, label: '6.1" iPhone accepted size' },
    'iPhone_6_1_legacy': { width: 1125, height: 2436, label: '6.1" iPhone accepted size' },
    'iPhone_6_1_e': { width: 1080, height: 2340, label: '6.1" iPhone accepted size' },
    'iPhone_5_5': { width: 1242, height: 2208, label: '5.5" iPhone (iPhone 8 Plus)' },
    'iPhone_4_7': { width: 750, height: 1334, label: '4.7" iPhone accepted size' },
    'iPhone_4_no_status': { width: 640, height: 1096, label: '4" iPhone accepted size without status bar' },
    'iPhone_4': { width: 640, height: 1136, label: '4" iPhone accepted size with status bar' },
    'iPhone_3_5_no_status': { width: 640, height: 920, label: '3.5" iPhone accepted size without status bar' },
    'iPhone_3_5': { width: 640, height: 960, label: '3.5" iPhone accepted size with status bar' },
    'iPad_13': { width: 2064, height: 2752, label: '13" iPad Pro (M4)' },
    'iPad_12_9': { width: 2048, height: 2732, label: '12.9" iPad Pro' },
    'iPad_11_small': { width: 1488, height: 2266, label: '11" iPad accepted size' },
    'iPad_11': { width: 1668, height: 2420, label: '11" iPad accepted size' },
    'iPad_11_legacy': { width: 1668, height: 2388, label: '11" iPad accepted size' },
    'iPad_11_air': { width: 1640, height: 2360, label: '11" iPad accepted size' },
    'iPad_10_5': { width: 1668, height: 2224, label: '10.5" iPad accepted size' },
    'iPad_9_7_no_status': { width: 1536, height: 2008, label: '9.7" iPad accepted size without status bar' },
    'iPad_9_7': { width: 1536, height: 2048, label: '9.7" iPad accepted size with status bar' },
    'iPad_9_7_small_no_status': { width: 768, height: 1004, label: '9.7" iPad accepted size without status bar' },
    'iPad_9_7_small': { width: 768, height: 1024, label: '9.7" iPad accepted size with status bar' },
} as const;

export const URL_REQUIREMENTS = {
    timeout_ms: 5000,
    must_be_https: true,
} as const;

export const BUNDLE_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/;
export const VERSION_REGEX = /^\d+\.\d+(\.\d+)?$/;
export const BUILD_NUMBER_REGEX = /^\d+(\.\d+){0,2}$/;

export const REQUIRED_PLIST_KEYS = [
    'CFBundleIdentifier',
    'CFBundleName',
    'CFBundleShortVersionString',
    'CFBundleVersion',
    'UISupportedInterfaceOrientations',
] as const;

/** Keys that are recommended but not required — missing generates info, not critical */
export const OPTIONAL_PLIST_KEYS = [
    'UIRequiredDeviceCapabilities',
] as const;

export const USAGE_DESCRIPTION_KEYS = [
    'NSCameraUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSPhotoLibraryAddUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSContactsUsageDescription',
    'NSCalendarsUsageDescription',
    'NSRemindersUsageDescription',
    'NSFaceIDUsageDescription',
    'NSHealthShareUsageDescription',
    'NSHealthUpdateUsageDescription',
    'NSMotionUsageDescription',
    'NSSpeechRecognitionUsageDescription',
    'NSBluetoothAlwaysUsageDescription',
    'NSBluetoothPeripheralUsageDescription',
    'NSNearbyInteractionUsageDescription',
    'NSLocalNetworkUsageDescription',
    'NSAppleMusicUsageDescription',
    'NSMediaLibraryUsageDescription',
    'NSSiriUsageDescription',
    'NSUserTrackingUsageDescription',
] as const;

export const PRIVACY_MANIFEST_API_TYPES = [
    'NSPrivacyAccessedAPICategoryFileTimestamp',
    'NSPrivacyAccessedAPICategorySystemBootTime',
    'NSPrivacyAccessedAPICategoryDiskSpace',
    'NSPrivacyAccessedAPICategoryActiveKeyboards',
    'NSPrivacyAccessedAPICategoryUserDefaults',
] as const;

export const PRIVACY_MANIFEST_REASON_CODES: Record<string, string[]> = {
    'NSPrivacyAccessedAPICategoryFileTimestamp': ['DDA9.1', 'C617.1', '3B52.1', '0A2A.1'],
    'NSPrivacyAccessedAPICategorySystemBootTime': ['35F9.1', '8FFB.1', '3D61.1'],
    'NSPrivacyAccessedAPICategoryDiskSpace': ['85F4.1', 'E174.1', '7D9E.1', 'B728.1'],
    'NSPrivacyAccessedAPICategoryActiveKeyboards': ['3EC4.1', '54BD.1'],
    'NSPrivacyAccessedAPICategoryUserDefaults': ['CA92.1', '1C8F.1', 'C56D.1', 'AC6B.1'],
} as const;

export const PRIVACY_MANIFEST_DATA_PURPOSES = [
    'NSPrivacyCollectedDataTypePurposeThirdPartyAdvertising',
    'NSPrivacyCollectedDataTypePurposeDeveloperAdvertising',
    'NSPrivacyCollectedDataTypePurposeAnalytics',
    'NSPrivacyCollectedDataTypePurposeProductPersonalization',
    'NSPrivacyCollectedDataTypePurposeAppFunctionality',
    'NSPrivacyCollectedDataTypePurposeOther',
] as const;

export const APP_CATEGORIES = [
    'Books', 'Business', 'Developer Tools', 'Education', 'Entertainment',
    'Finance', 'Food & Drink', 'Games', 'Graphics & Design', 'Health & Fitness',
    'Lifestyle', 'Medical', 'Music', 'Navigation', 'News', 'Photo & Video',
    'Productivity', 'Reference', 'Shopping', 'Social Networking', 'Sports',
    'Travel', 'Utilities', 'Weather',
] as const;

export const AGE_RATINGS = ['4+', '9+', '12+', '13+', '16+', '17+', '18+'] as const;

// Common placeholder/test strings to flag
export const PLACEHOLDER_PATTERNS = [
    /lorem ipsum/i,
    /placeholder/i,
    /todo/i,
    /coming soon/i,
    /test app/i,
    /my app/i,
    /example\.com/i,
    /yourwebsite\.com/i,
    /https?:\/\/localhost/i,
    /https?:\/\/127\.0\.0\.1/i,
    /https?:\/\/192\.168\./i,
] as const;

export const SDK_REQUIREMENTS = {
    minimum_xcode: '26.0',
    minimum_sdk: 'iOS 26 SDK',
    minimum_deployment_target: 'iOS 16.0',
    deadline: '2026-04-28',
    note: 'Starting April 28, 2026, all new app submissions and updates must be built with Xcode 26+ and the iOS 26 SDK. Apps targeting iOS below 16.0 may be flagged.',
} as const;
