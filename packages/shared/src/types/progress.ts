/**
 * Progress event types for local scanner callbacks.
 */

export type ProgressPhase = 'hard_rules';

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
    METADATA: 'metadata',
    SCREENSHOTS: 'screenshots',
    PRIVACY_MANIFEST: 'privacy_manifest',
    INFO_PLIST: 'info_plist',
    URLS: 'urls',
    IPA_SCAN: 'ipa_scan',
} as const;

/**
 * Progress percentage ranges for each phase
 */
export const PROGRESS_RANGES = {
    hard_rules: { start: 0, end: 100 },
} as const;

/**
 * Human-readable messages for each check
 */
export const PROGRESS_MESSAGES: Record<string, string> = {
    [PROGRESS_CHECKS.METADATA]: 'Validating app name and keywords...',
    [PROGRESS_CHECKS.SCREENSHOTS]: 'Checking screenshots...',
    [PROGRESS_CHECKS.PRIVACY_MANIFEST]: 'Analyzing privacy manifest...',
    [PROGRESS_CHECKS.INFO_PLIST]: 'Parsing Info.plist configuration...',
    [PROGRESS_CHECKS.URLS]: 'Testing URL reachability...',
    [PROGRESS_CHECKS.IPA_SCAN]: 'Scanning IPA binary...',
};
