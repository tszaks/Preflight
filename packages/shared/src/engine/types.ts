export type CheckCategory =
    | 'metadata'
    | 'description'
    | 'screenshots'
    | 'privacy_manifest'
    | 'info_plist'
    | 'ipa_binary'
    | 'urls'
    | 'content_policy';

export type SeverityLevel = 'pass' | 'info' | 'warning' | 'critical';

// Engine-specific types
export interface CheckResult {
    category: CheckCategory;
    severity: SeverityLevel;
    title: string;
    description: string;
    guideline_ref?: string;
    fix_suggestion?: string;
    /** Confidence in this finding (0-100). Hard rules = 100. AI rules vary. */
    confidence: number;
    /** Optional pattern ID for linking to historical rejection patterns */
    pattern_id?: string;
}

export interface HardRulesInput {
    app_name: string;
    subtitle?: string | null;
    description?: string | null;
    keywords?: string | null;
    category?: string | null;
    age_rating?: string | null;
    privacy_url?: string | null;
    terms_url?: string | null;
    support_url?: string | null;
    marketing_url?: string | null;
    demo_username?: string | null;
    demo_password?: string | null;
    minimum_os_version?: string | null;
    screenshot_paths: string[];
    manifest_path?: string | null;
    plist_path?: string | null;
    ipa_path?: string | null;
    // Form-field based checks (for conditional warnings)
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
    /**
     * Artifact-backed third-party social login detection (binary/framework/plist evidence).
     * This is used to prevent false positives from self-report checkboxes and to
     * enable SIWA warnings even if a user forgets to self-report.
     */
    detected_third_party_login?: boolean;
    /** Confidence (0-100) for detected_third_party_login when available (artifact-backed). */
    detected_third_party_login_confidence?: number;
    // Explicit feature confirmations (null = not asked, true = confirmed exists, false = confirmed missing)
    has_account_deletion?: boolean | null;
    has_restore_purchases?: boolean | null;
    is_new_app?: boolean | null;
    // Screenshot index hints (for cross-referencing)
    settings_screenshot_index?: number | null;
    paywall_screenshot_index?: number | null;
    // Privacy data collection declarations from form
    data_collection?: DataCollectionDeclaration;

    // === Self-Report: Content & Features ===
    has_ugc?: boolean | null;
    has_ugc_moderation?: boolean | null;
    makes_health_claims?: boolean | null;
    has_health_disclaimers?: boolean | null;
    generates_ai_content?: boolean | null;
    has_ai_content_filtering?: boolean | null;

    // === Self-Report: Monetization ===
    subscription_terms_on_paywall?: boolean | null;
    sells_digital_outside_iap?: boolean | null;
    subscriptions_without_login?: boolean | null;

    // === Self-Report: Technical ===
    screenshots_match_ui?: boolean | null;
    tested_ipv6?: boolean | null;
    contextual_permissions?: boolean | null;
    has_alternate_icons?: boolean | null;

    // === Self-Report: November 2025 + 2026 Policy Updates ===
    has_creator_age_gate?: boolean | null;
    has_mini_apps?: boolean | null;
    mini_apps_reviewed?: boolean | null;
    distributes_in_eu?: boolean | null;
    eu_trader_declared?: boolean | null;
    has_external_payment_link?: boolean | null;
    external_link_compliant?: boolean | null;

    // === Auto-Detected Signals (from binary/entitlements/plist) ===
    detected_healthkit?: boolean;
    detected_background_location?: boolean;
    detected_sign_in_with_apple?: boolean;
    detected_push_notifications?: boolean;
    detected_vpn?: boolean;
    detected_apple_pay?: boolean;
}

/**
 * Maps form-field data collection declarations.
 * Keys match the form's checkbox field names, values indicate collected (true/false).
 */
export interface DataCollectionDeclaration {
    contactInfo?: boolean;
    healthFitness?: boolean;
    financialInfo?: boolean;
    location?: boolean;
    sensitiveInfo?: boolean;
    contacts?: boolean;
    userContent?: boolean;
    browsingHistory?: boolean;
    searchHistory?: boolean;
    identifiers?: boolean;
    purchases?: boolean;
    usageData?: boolean;
    diagnostics?: boolean;
}

/**
 * Parses raw data collection JSON into a flat DataCollectionDeclaration.
 * Handles both formats:
 * - Nested (from form): { contactInfo: { collected: true, linked: false, tracking: false }, ... }
 * - Flat (expected):     { contactInfo: true, ... }
 * Also normalizes field name: form uses "locationData", engine uses "location".
 */
export function parseDataCollection(raw: string | null | undefined): DataCollectionDeclaration | undefined {
    if (!raw) return undefined;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return undefined;

        const result: DataCollectionDeclaration = {};
        const VALID_KEYS: (keyof DataCollectionDeclaration)[] = [
            'contactInfo', 'healthFitness', 'financialInfo', 'location',
            'sensitiveInfo', 'contacts', 'userContent', 'browsingHistory',
            'searchHistory', 'identifiers', 'purchases', 'usageData', 'diagnostics',
        ];

        for (const key of VALID_KEYS) {
            // Check both the canonical key and the form alias "locationData" → "location"
            const formKey = key === 'location' ? 'locationData' : key;
            const value = parsed[key] ?? parsed[formKey];

            if (value === true || value === false) {
                // Flat format: already a boolean
                result[key] = value;
            } else if (value && typeof value === 'object' && 'collected' in value) {
                // Nested format: extract the collected boolean
                result[key] = value.collected === true;
            }
        }

        return result;
    } catch {
        console.warn('[DataCollection] Failed to parse data_collection JSON:', raw.slice(0, 200));
        return undefined;
    }
}

export interface ScreenshotData {
    path: string;
    base64: string;
    mime_type: 'image/jpeg' | 'image/png';
    width?: number;
    height?: number;
    size_bytes: number;
}

// Valid screenshot dimensions (points × scale factor)
export const VALID_SCREENSHOT_DIMENSIONS: Array<{ width: number; height: number; device: string }> = [
    // iPhone 6.9" accepted App Store Connect sizes
    { width: 1320, height: 2868, device: '6.9" iPhone' },
    { width: 1260, height: 2736, device: '6.9" iPhone' },
    // iPhone 6.7" / 6.5" accepted App Store Connect sizes
    { width: 1290, height: 2796, device: '6.7" iPhone' },
    { width: 1284, height: 2778, device: '6.5" iPhone' },
    { width: 1242, height: 2688, device: '6.5" iPhone' },
    // iPhone 6.3" / 6.1" accepted App Store Connect sizes
    { width: 1206, height: 2622, device: '6.3" iPhone' },
    { width: 1179, height: 2556, device: '6.1" iPhone' },
    { width: 1170, height: 2532, device: '6.1" iPhone' },
    { width: 1125, height: 2436, device: '6.1" iPhone' },
    { width: 1080, height: 2340, device: '6.1" iPhone' },
    // iPhone 5.5" / 4.7" / 4" / 3.5" legacy accepted App Store Connect sizes
    { width: 1242, height: 2208, device: '5.5" iPhone' },
    { width: 750, height: 1334, device: '4.7" iPhone' },
    { width: 640, height: 1096, device: '4" iPhone (without status bar)' },
    { width: 640, height: 1136, device: '4" iPhone (with status bar)' },
    { width: 640, height: 920, device: '3.5" iPhone (without status bar)' },
    { width: 640, height: 960, device: '3.5" iPhone (with status bar)' },
    // iPad accepted App Store Connect sizes
    { width: 2064, height: 2752, device: '13" iPad Pro' },
    { width: 2048, height: 2732, device: '12.9" iPad Pro' },
    { width: 1488, height: 2266, device: '11" iPad Pro' },
    { width: 1668, height: 2420, device: '11" iPad Pro' },
    { width: 1668, height: 2388, device: '11" iPad Pro' },
    { width: 1640, height: 2360, device: '11" iPad Pro' },
    { width: 1668, height: 2224, device: '10.5" iPad Pro' },
    { width: 1536, height: 2008, device: '9.7" iPad (without status bar)' },
    { width: 1536, height: 2048, device: '9.7" iPad (with status bar)' },
    { width: 768, height: 1004, device: '9.7" iPad (without status bar)' },
    { width: 768, height: 1024, device: '9.7" iPad (with status bar)' },
    // Also allow landscape (swapped)
    { width: 2868, height: 1320, device: '6.9" iPhone (landscape)' },
    { width: 2736, height: 1260, device: '6.9" iPhone (landscape)' },
    { width: 2796, height: 1290, device: '6.7" iPhone (landscape)' },
    { width: 2778, height: 1284, device: '6.5" iPhone (landscape)' },
    { width: 2688, height: 1242, device: '6.5" iPhone (landscape)' },
    { width: 2622, height: 1206, device: '6.3" iPhone (landscape)' },
    { width: 2556, height: 1179, device: '6.1" iPhone (landscape)' },
    { width: 2532, height: 1170, device: '6.1" iPhone (landscape)' },
    { width: 2436, height: 1125, device: '6.1" iPhone (landscape)' },
    { width: 2340, height: 1080, device: '6.1" iPhone (landscape)' },
    { width: 2208, height: 1242, device: '5.5" iPhone (landscape)' },
    { width: 1334, height: 750, device: '4.7" iPhone (landscape)' },
    { width: 1136, height: 600, device: '4" iPhone (landscape without status bar)' },
    { width: 1136, height: 640, device: '4" iPhone (landscape with status bar)' },
    { width: 960, height: 600, device: '3.5" iPhone (landscape without status bar)' },
    { width: 960, height: 640, device: '3.5" iPhone (landscape with status bar)' },
    { width: 2752, height: 2064, device: '13" iPad Pro (landscape)' },
    { width: 2732, height: 2048, device: '12.9" iPad Pro (landscape)' },
    { width: 2266, height: 1488, device: '11" iPad Pro (landscape)' },
    { width: 2420, height: 1668, device: '11" iPad Pro (landscape)' },
    { width: 2388, height: 1668, device: '11" iPad Pro (landscape)' },
    { width: 2360, height: 1640, device: '11" iPad Pro (landscape)' },
    { width: 2224, height: 1668, device: '10.5" iPad Pro (landscape)' },
    { width: 2048, height: 1496, device: '9.7" iPad (landscape without status bar)' },
    { width: 2048, height: 1536, device: '9.7" iPad (landscape with status bar)' },
    { width: 1024, height: 748, device: '9.7" iPad (landscape without status bar)' },
    { width: 1024, height: 768, device: '9.7" iPad (landscape with status bar)' },
];

// === Confidence-Severity Capping ===

/**
 * Returns the maximum severity allowed for a given confidence level.
 * - confidence < 50  → 'info'     (basically guessing)
 * - 50-79            → 'warning'  (reasonably sure)
 * - 80+              → 'critical' (strong evidence)
 */
export function getMaxSeverity(confidence: number): SeverityLevel {
    if (confidence >= 80) return 'critical';
    if (confidence >= 50) return 'warning';
    return 'info';
}

const SEVERITY_RANK: Record<string, number> = {
    pass: 0,
    info: 1,
    warning: 2,
    critical: 3,
};

/**
 * Caps a check's severity based on its confidence level.
 * A check can never be more severe than its confidence allows.
 */
export function capSeverityByConfidence(check: CheckResult): CheckResult {
    const maxSev = getMaxSeverity(check.confidence);
    if (SEVERITY_RANK[check.severity] > SEVERITY_RANK[maxSev]) {
        return { ...check, severity: maxSev };
    }
    return check;
}
