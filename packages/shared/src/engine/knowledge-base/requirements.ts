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
    'iPhone_6_9': { width: 1320, height: 2868, label: '6.9" iPhone (iPhone 16 Pro Max)' },
    'iPhone_6_7': { width: 1290, height: 2796, label: '6.7" iPhone (iPhone 16 Plus / 15 Pro Max)' },
    'iPhone_6_5': { width: 1284, height: 2778, label: '6.5" iPhone (iPhone 14 Plus / 13 Pro Max)' },
    'iPhone_5_5': { width: 1242, height: 2208, label: '5.5" iPhone (iPhone 8 Plus)' },
    'iPad_13': { width: 2064, height: 2752, label: '13" iPad Pro (M4)' },
    'iPad_12_9': { width: 2048, height: 2732, label: '12.9" iPad Pro' },
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
    'NSMicrophoneUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSLocationAlwaysUsageDescription',
    'NSContactsUsageDescription',
    'NSCalendarsUsageDescription',
    'NSFaceIDUsageDescription',
    'NSHealthShareUsageDescription',
    'NSMotionUsageDescription',
    'NSSpeechRecognitionUsageDescription',
    'NSBluetoothAlwaysUsageDescription',
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
    minimum_xcode: '16.0',
    minimum_sdk: 'iOS 18 SDK',
    minimum_deployment_target: 'iOS 16.0',
    deadline: '2026-04-01',
    note: 'Starting April 2026, all apps must be built with Xcode 16+ and iOS 18 SDK. Apps targeting iOS below 16.0 may be flagged.',
} as const;
