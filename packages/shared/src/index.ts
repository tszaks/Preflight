// @preflight/shared - Shared analysis engine, types, and constants
// Used by both @preflight/web and @preflight/cli

// Engine
export { runAnalysis, fetchSubmissionFiles } from './engine/index'

// Engine types
export type {
    CheckResult,
    HardRulesInput,
    SoftRulesInput,
    ScreenshotData,
    ScreenshotEvidence,
    EngineResult,
    ScoreResult,
    CheckCategory,
    SeverityLevel,
    ReviewType,
    DataCollectionDeclaration,
    Submission,
    Report,
    ReportItem,
    AnalysisJob,
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

// Constants
export { CREDIT_COSTS, CREDIT_AMOUNTS } from './constants'

// Database types
export type { Database } from './types/database'
