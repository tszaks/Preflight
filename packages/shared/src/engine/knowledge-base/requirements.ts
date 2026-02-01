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

export const AGE_RATINGS = ['4+', '9+', '12+', '17+'] as const;

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
