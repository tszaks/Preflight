import type { Database } from '$lib/types/database';

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
}

export interface SoftRulesInput extends HardRulesInput {
    review_type: ReviewType;
    // File contents (fetched from storage)
    screenshots_data?: ScreenshotData[];
    manifest_content?: string;
    plist_content?: string;
    privacy_policy_text?: string;
}

export interface ScreenshotData {
    path: string;
    base64: string;
    mime_type: 'image/jpeg' | 'image/png';
    width?: number;
    height?: number;
    size_bytes: number;
}

export interface EngineResult {
    checks: CheckResult[];
    hard_rules_completed: boolean;
    soft_rules_completed: boolean;
}

export interface ScoreResult {
    score_metadata: number;
    score_screenshots: number;
    score_privacy: number;
    score_plist: number;
    score_urls: number;
    score_content: number;
    score_overall: number;
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
