import { type AppDetails, type ComplianceData } from '../../lib/submission-questions.js'

export type { AppDetails, ComplianceData }

export interface SubmitOptions {
    appName?: string
    ipa?: string
    plist?: string
    manifest?: string
    screenshots?: string
    json?: boolean
}

export interface DraftState {
    appName?: string
    description?: string
    keywords?: string
    category?: string
    supportUrl?: string
    promotionalText?: string
    marketingUrl?: string
    signInRequired?: boolean
    demoUsername?: string
    demoPassword?: string
    compliance?: ComplianceData
    // Flow position tracking for draft resumption
    _flowPosition?: 'asc' | 'screenshots' | 'appDetails' | 'compliance' | 'confirmation'
    _reviewCompleted?: boolean // Track if the final review step was viewed
    _ascConnected?: boolean // Track if ASC was used for autofill
    _screenshotPaths?: string[] // Track screenshot paths for reference
    _projectPath?: string // Track the Xcode project path for resumption
}

export interface FileToUpload {
    type: string
    index?: number
    filename: string
    path: string
}
