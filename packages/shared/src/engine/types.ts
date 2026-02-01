import type { Database } from '../types/database';

// Re-export DB types for convenience
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportItem = Database['public']['Tables']['report_items']['Row'];
export type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row'];

export type CheckCategory = Database['public']['Enums']['check_category'];
export type SeverityLevel = Database['public']['Enums']['severity_level'];
export type ReviewType = Database['public']['Enums']['review_type'];

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
    support_url?: string | null;
    marketing_url?: string | null;
    screenshot_paths: string[];
    manifest_path?: string | null;
    plist_path?: string | null;
    ipa_path?: string | null;
    // Form-field based checks (for conditional warnings)
    sign_in_required?: boolean;
    has_iap?: boolean;
    has_subscriptions?: boolean;
    has_third_party_login?: boolean;
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
 * Parses raw data_collection JSON from the database into a flat DataCollectionDeclaration.
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

export interface SoftRulesInput extends HardRulesInput {
    review_type: ReviewType;
    // File contents (fetched from storage)
    screenshots_data?: ScreenshotData[];
    manifest_content?: string;
    plist_content?: string;
    privacy_policy_text?: string;
    /** IPA binary as ArrayBuffer (fetched from storage) */
    ipa_buffer?: ArrayBuffer;
}

export interface ScreenshotData {
    path: string;
    base64: string;
    mime_type: 'image/jpeg' | 'image/png';
    width?: number;
    height?: number;
    size_bytes: number;
}

/**
 * Evidence extracted from screenshot AI analysis.
 * Used to cross-reference conditional warnings — if the AI sees a feature
 * in a screenshot, we can resolve the corresponding warning.
 */
export interface ScreenshotEvidence {
    account_deletion_seen: boolean;
    restore_purchases_seen: boolean;
    subscription_terms_seen: boolean;
    sign_in_with_apple_seen: boolean;
    /** Maps evidence key to screenshot indices (0-based) where the feature was observed */
    evidence_locations: Record<string, number[]>;
}

export interface EngineResult {
    checks: CheckResult[];
    hard_rules_completed: boolean;
    soft_rules_completed: boolean;
}

export interface ScoreResult {
    score_metadata: number;
    score_screenshots: number | null;
    score_privacy: number | null;
    score_plist: number | null;
    score_urls: number;
    score_content: number;
    score_ipa_binary: number | null;
    score_overall: number;
}

// ASO (App Store Optimization) Analysis Types
export interface CharacterOptimization {
    field: string;
    current: number;
    max: number;
    tip: string;
}

export interface ASOAnalysisResult {
    optimized_description: string;
    suggested_keywords: string[];
    character_optimization: CharacterOptimization[];
    positioning_statement: string;
}

// Valid screenshot dimensions (points × scale factor)
export const VALID_SCREENSHOT_DIMENSIONS: Array<{ width: number; height: number; device: string }> = [
    // iPhone 6.7" (iPhone 15 Pro Max, 14 Pro Max)
    { width: 1290, height: 2796, device: '6.7" iPhone' },
    // iPhone 6.1" (iPhone 15 Pro, 14 Pro)
    { width: 1179, height: 2556, device: '6.1" iPhone' },
    // iPhone 5.5" (iPhone 8 Plus - still accepted)
    { width: 1242, height: 2208, device: '5.5" iPhone' },
    // iPad Pro 12.9"
    { width: 2048, height: 2732, device: '12.9" iPad Pro' },
    // iPad Pro 11"
    { width: 1668, height: 2388, device: '11" iPad Pro' },
    // Also allow landscape (swapped)
    { width: 2796, height: 1290, device: '6.7" iPhone (landscape)' },
    { width: 2556, height: 1179, device: '6.1" iPhone (landscape)' },
    { width: 2208, height: 1242, device: '5.5" iPhone (landscape)' },
    { width: 2732, height: 2048, device: '12.9" iPad Pro (landscape)' },
    { width: 2388, height: 1668, device: '11" iPad Pro (landscape)' },
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
