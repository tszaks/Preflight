// @preflight/shared - local App Store review scanner engine, types, and constants.

// Engine types
export type {
    CheckResult,
    HardRulesInput,
    ScreenshotData,
    CheckCategory,
    SeverityLevel,
    DataCollectionDeclaration,
} from './engine/types'
export {
    parseDataCollection,
    getMaxSeverity,
    capSeverityByConfidence,
    VALID_SCREENSHOT_DIMENSIONS,
} from './engine/types'

// Progress tracking
export type {
    ProgressEvent,
    ProgressEventType,
    ProgressPhase,
    OnProgressCallback,
} from './types/progress'
export {
    createProgressEvent,
    PROGRESS_CHECKS,
    PROGRESS_MESSAGES,
    PROGRESS_RANGES,
} from './types/progress'
