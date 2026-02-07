/**
 * Curated blocklist of private Apple APIs and frameworks.
 *
 * Using any of these in a production app will result in rejection under
 * Apple's App Review Guidelines (primarily 2.5.1 - Private APIs).
 *
 * The symbols listed here are prefixed with '_' in the binary's symbol table
 * (standard C name mangling). We store them without the leading underscore
 * and match both forms during analysis.
 *
 * Sources:
 *   - Known rejections from r/iOSProgramming and Apple Developer Forums
 *   - Apple's published list of private frameworks
 *   - Runtime header dumps of iOS private frameworks
 */

export interface PrivateAPIEntry {
    /** Symbol name (without leading underscore) */
    symbol: string;
    /** Source framework */
    framework: string;
    /**
     * Severity:
     * - critical: near-certain rejection (private frameworks / known private symbols)
     * - warning:  higher-risk usage that frequently leads to rejection depending on context
     * - info:     common runtime primitives; keep as "manual review" to avoid false positives
     */
    severity: 'critical' | 'warning' | 'info';
    /** Human-readable explanation */
    description: string;
    /** Apple guideline reference */
    guideline_ref: string;
}

export const PRIVATE_API_BLOCKLIST: PrivateAPIEntry[] = [
    // === UIKit Internals ===
    {
        symbol: 'UIKeyboardImpl',
        framework: 'UIKit (private)',
        severity: 'critical',
        description: 'Direct access to private keyboard implementation class',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'UIStatusBarItem',
        framework: 'UIKit (private)',
        severity: 'critical',
        description: 'Accessing private status bar item API',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'UIAlertControllerTextField',
        framework: 'UIKit (private)',
        severity: 'critical',
        description: 'Using private UIAlertController text field API',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'UIDebuggingInformationOverlay',
        framework: 'UIKit (private)',
        severity: 'critical',
        description: 'Using private UIKit debugging overlay',
        guideline_ref: '2.5.1',
    },
    {
        symbol: '_UIStatusBar',
        framework: 'UIKit (private)',
        severity: 'critical',
        description: 'Accessing private modern status bar class',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'UIWebView',
        framework: 'UIKit (deprecated)',
        severity: 'warning',
        description: 'UIWebView is deprecated since iOS 12; use WKWebView instead. Apple rejects new submissions using UIWebView.',
        guideline_ref: 'ITMS-90809',
    },

    // === SpringBoard Services ===
    {
        symbol: 'SBSLaunchApplicationWithIdentifier',
        framework: 'SpringBoardServices',
        severity: 'critical',
        description: 'Launching apps via private SpringBoard API',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'SBFWallpaperView',
        framework: 'SpringBoard',
        severity: 'critical',
        description: 'Accessing private wallpaper view class',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'SBSCopyApplicationDisplayIdentifiers',
        framework: 'SpringBoardServices',
        severity: 'critical',
        description: 'Listing installed apps via private API',
        guideline_ref: '2.5.1',
    },

    // === LaunchServices ===
    {
        symbol: 'LSApplicationProxy',
        framework: 'LaunchServices (private)',
        severity: 'critical',
        description: 'Querying app metadata via private LaunchServices proxy',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'LSApplicationWorkspace',
        framework: 'LaunchServices (private)',
        severity: 'critical',
        description: 'Accessing private app workspace (install/uninstall apps)',
        guideline_ref: '2.5.1',
    },

    // === IOKit ===
    {
        symbol: 'IOHIDEventSystemClientCreate',
        framework: 'IOKit (private)',
        severity: 'critical',
        description: 'Creating private HID event system client (raw input access)',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'IOServiceGetMatchingService',
        framework: 'IOKit',
        severity: 'warning',
        description: 'Direct IOKit service access; may be rejected depending on usage',
        guideline_ref: '2.5.1',
    },

    // === MobileGestalt ===
    {
        symbol: 'MGCopyAnswer',
        framework: 'MobileGestalt',
        severity: 'critical',
        description: 'Reading private device info (UDID, serial, etc.) via MobileGestalt',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'MGGetBoolAnswer',
        framework: 'MobileGestalt',
        severity: 'critical',
        description: 'Querying device capabilities via private MobileGestalt API',
        guideline_ref: '2.5.1',
    },

    // === BackBoardServices ===
    {
        symbol: 'BKSProcessAssertion',
        framework: 'BackBoardServices',
        severity: 'critical',
        description: 'Using private process assertion API',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'BKSDisplaySetScreenBlanked',
        framework: 'BackBoardServices',
        severity: 'critical',
        description: 'Controlling screen blanking via private API',
        guideline_ref: '2.5.1',
    },

    // === FrontBoardServices ===
    {
        symbol: 'FBSOpenApplicationService',
        framework: 'FrontBoardServices',
        severity: 'critical',
        description: 'Using private app opening service',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'FBSSystemService',
        framework: 'FrontBoardServices',
        severity: 'critical',
        description: 'Accessing private system service',
        guideline_ref: '2.5.1',
    },

    // === GraphicsServices ===
    {
        symbol: 'GSEventLockDevice',
        framework: 'GraphicsServices',
        severity: 'critical',
        description: 'Locking device via private GraphicsServices API',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'GSKeyboardCreate',
        framework: 'GraphicsServices',
        severity: 'critical',
        description: 'Creating keyboard via private GraphicsServices',
        guideline_ref: '2.5.1',
    },

    // === TCC (Transparency, Consent, Control) ===
    {
        symbol: 'TCCAccessRequest',
        framework: 'TCC (private)',
        severity: 'critical',
        description: 'Directly calling private TCC permission system',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'TCCAccessCheckAuditToken',
        framework: 'TCC (private)',
        severity: 'critical',
        description: 'Bypassing TCC permission checks via private API',
        guideline_ref: '2.5.1',
    },

    // === dyld Internals ===
    {
        symbol: '_dyld_get_all_image_infos',
        framework: 'dyld (private)',
        severity: 'warning',
        description: 'Accessing private dyld image info (common in jailbreak detection)',
        guideline_ref: '2.5.1',
    },

    // === Telephony / Carrier ===
    {
        symbol: 'CTCallCenter',
        framework: 'CoreTelephony (deprecated)',
        severity: 'warning',
        description: 'CTCallCenter is deprecated; use CXCallObserver from CallKit instead',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'CTServerConnectionCreate',
        framework: 'CoreTelephony (private)',
        severity: 'critical',
        description: 'Creating private telephony server connection',
        guideline_ref: '2.5.1',
    },

    // === Preferences / Settings ===
    {
        symbol: 'CFPreferencesSetAppValue',
        framework: 'CoreFoundation',
        severity: 'warning',
        description: 'Direct CFPreferences manipulation; may conflict with sandbox in some contexts',
        guideline_ref: '2.5.1',
    },
    {
        symbol: 'PSSpecifierGroupSpecifier',
        framework: 'Preferences (private)',
        severity: 'critical',
        description: 'Using private Settings.app preferences API',
        guideline_ref: '2.5.1',
    },

    // === WebKit Internals ===
    {
        symbol: 'WKBrowsingContextController',
        framework: 'WebKit (private)',
        severity: 'critical',
        description: 'Using private WebKit browsing context controller',
        guideline_ref: '2.5.1',
    },

    // === App Installation / Management ===
    {
        symbol: 'MIInstallableBundle',
        framework: 'MobileInstallation',
        severity: 'critical',
        description: 'Using private mobile installation framework',
        guideline_ref: '2.5.1',
    },

    // === Networking Internals ===
    {
        symbol: 'NEVPNConnectionStartVPN',
        framework: 'NetworkExtension (private)',
        severity: 'warning',
        description: 'Direct VPN manipulation via private API variant; use public NEVPNManager instead',
        guideline_ref: '2.5.1',
    },

    // === File System ===
    {
        symbol: 'MobileContainerManager',
        framework: 'MobileContainerManager',
        severity: 'critical',
        description: 'Accessing private container management API (sandbox escape)',
        guideline_ref: '2.5.1',
    },

    // === Apple Pay Internals ===
    {
        symbol: 'PKPaymentAuthorizationController',
        framework: 'PassKit (private variant)',
        severity: 'warning',
        description: 'Using non-public Apple Pay authorization flow',
        guideline_ref: '2.5.1',
    },

    // === Device Identity ===
    {
        symbol: 'uniqueIdentifier',
        framework: 'UIDevice (deprecated)',
        severity: 'critical',
        description: 'Accessing deprecated UDID property; use identifierForVendor instead',
        guideline_ref: '2.5.1',
    },

    // === Accessibility Internals ===
    {
        symbol: 'AXSpringBoardServer',
        framework: 'AccessibilityUtilities (private)',
        severity: 'critical',
        description: 'Accessing private accessibility server',
        guideline_ref: '2.5.1',
    },

    // === Runtime Manipulation ===
    {
        symbol: 'dlopen',
        framework: 'libdl',
        severity: 'info',
        description: 'Dynamic library loading. Common in legitimate SDKs; only risky when used to load private frameworks at runtime. Flagged for manual review.',
        guideline_ref: '2.5.2',
    },
    {
        symbol: 'objc_getClass',
        framework: 'libobjc',
        severity: 'info',
        description: 'Runtime class lookup. Common in legitimate SDKs; only risky when used to access private classes. Flagged for manual review.',
        guideline_ref: '2.5.1',
    },
];

/**
 * Known private frameworks. If an app links against any of these,
 * it will be rejected regardless of which symbols it uses.
 */
export const PRIVATE_FRAMEWORKS: string[] = [
    'SpringBoardServices',
    'SpringBoardUI',
    'BackBoardServices',
    'FrontBoardServices',
    'GraphicsServices',
    'MobileGestalt',
    'MobileInstallation',
    'MobileContainerManager',
    'TCC',
    'AppSupport',
    'ChatKit',
    'Celestial',
    'IMCore',
    'IMAVCore',
    'MediaRemote',
    'MobileBluetooth',
    'MobileCoreServices',
    'MobileTimer',
    'Notes',
    'Preferences',
    'TelephonyUtilities',
    'TextInput',
    'WebCore',
    'WebKitLegacy',
    'WiFiKit',
];
