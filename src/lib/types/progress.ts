/**
 * Progress Event Types for Real-Time Analysis Streaming
 *
 * These types define the SSE (Server-Sent Events) protocol for
 * streaming analysis progress to the client.
 */

export type ProgressPhase = 'hard_rules' | 'soft_rules' | 'report_generation';

export type ProgressEventType =
    | 'phase_start'
    | 'check_start'
    | 'check_complete'
    | 'phase_complete'
    | 'error'
    | 'complete';

export interface ProgressEvent {
    type: ProgressEventType;
    phase?: ProgressPhase;
    check?: string;
    message: string;
    progress: number; // 0-100
    timestamp: number;
    data?: {
        screenshotIndex?: number;
        totalScreenshots?: number;
        reportId?: string;
        error?: string;
        checksFound?: number;
    };
}

/**
 * Progress callback type for engine functions
 */
export type OnProgressCallback = (event: ProgressEvent) => void;

/**
 * Helper to create progress events with consistent structure
 */
export function createProgressEvent(
    type: ProgressEventType,
    message: string,
    progress: number,
    extras?: Partial<Omit<ProgressEvent, 'type' | 'message' | 'progress' | 'timestamp'>>
): ProgressEvent {
    return {
        type,
        message,
        progress: Math.min(100, Math.max(0, progress)),
        timestamp: Date.now(),
        ...extras,
    };
}

/**
 * Pre-defined check identifiers for consistent progress tracking
 */
export const PROGRESS_CHECKS = {
    // Hard Rules (0-40%)
    METADATA: 'metadata',
    SCREENSHOTS: 'screenshots',
    PRIVACY_MANIFEST: 'privacy_manifest',
    INFO_PLIST: 'info_plist',
    URLS: 'urls',

    // Soft Rules (40-85%)
    DESCRIPTION: 'description',
    CONTENT_POLICY: 'content_policy',
    SCREENSHOTS_AI: 'screenshots_ai',
    PRIVACY_POLICY: 'privacy_policy',
    METADATA_QUALITY: 'metadata_quality',
    ASO_ANALYSIS: 'aso_analysis',

    // Report (85-100%)
    SCORING: 'scoring',
    SAVING: 'saving',
} as const;

/**
 * Progress percentage ranges for each phase
 */
export const PROGRESS_RANGES = {
    hard_rules: { start: 0, end: 40 },
    soft_rules: { start: 40, end: 85 },
    report_generation: { start: 85, end: 100 },
} as const;

/**
 * Human-readable messages for each check
 */
export const PROGRESS_MESSAGES: Record<string, string> = {
    // Hard rules
    [PROGRESS_CHECKS.METADATA]: 'Validating app name and keywords...',
    [PROGRESS_CHECKS.SCREENSHOTS]: 'Checking screenshots...',
    [PROGRESS_CHECKS.PRIVACY_MANIFEST]: 'Analyzing privacy manifest...',
    [PROGRESS_CHECKS.INFO_PLIST]: 'Parsing Info.plist configuration...',
    [PROGRESS_CHECKS.URLS]: 'Testing URL reachability...',

    // Soft rules
    [PROGRESS_CHECKS.DESCRIPTION]: 'AI analyzing app description...',
    [PROGRESS_CHECKS.CONTENT_POLICY]: 'Checking content guidelines...',
    [PROGRESS_CHECKS.SCREENSHOTS_AI]: 'AI reviewing screenshots...',
    [PROGRESS_CHECKS.PRIVACY_POLICY]: 'Cross-checking privacy policy...',
    [PROGRESS_CHECKS.METADATA_QUALITY]: 'Generating ASO recommendations...',
    [PROGRESS_CHECKS.ASO_ANALYSIS]: 'Running ASO analysis...',

    // Report
    [PROGRESS_CHECKS.SCORING]: 'Calculating scores...',
    [PROGRESS_CHECKS.SAVING]: 'Saving report...',
};
