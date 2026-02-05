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

// Screenshot status from ASC
export interface ScreenshotStatus {
    deviceType: string
    count: number
}

// Subscription from ASC
export interface SubscriptionInfo {
    id: string
    name: string
    productId: string
    state: string
    groupName?: string
}

// In-App Purchase from ASC
export interface InAppPurchaseInfo {
    id: string
    name: string
    productId: string
    type: string
    state: string
}

// Age rating from ASC
export interface AgeRatingInfo {
    rating: string | null
    gambling: boolean
    unrestrictedWebAccess: boolean
    kidsAgeBand: string | null
    seventeenPlus: boolean
}

// Review contact info
export interface ReviewContact {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
}

export interface DraftState {
    // Basic metadata
    appName?: string
    description?: string
    keywords?: string
    category?: string
    privacyPolicyUrl?: string
    supportUrl?: string
    promotionalText?: string
    marketingUrl?: string

    // Version info
    copyright?: string
    version?: string

    // Review/demo credentials
    signInRequired?: boolean
    demoUsername?: string
    demoPassword?: string

    // Review contact
    reviewContact?: ReviewContact
    reviewNotes?: string

    // Compliance data (collected via questionnaire)
    compliance?: ComplianceData

    // ASC-populated data for analysis
    screenshots?: ScreenshotStatus[]
    subscriptions?: SubscriptionInfo[]
    inAppPurchases?: InAppPurchaseInfo[]
    ageRating?: AgeRatingInfo

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
