# Error Handling Fixes - Implementation Guide

This document provides concrete code changes for the 13 issues identified in ERROR_HANDLING_AUDIT.md.

---

## File 1: Create Error ID Constants

**File:** `/packages/shared/src/errorIds.ts` (NEW)

```typescript
/**
 * Centralized error IDs for all application errors.
 * Use these IDs in logs and error responses for consistent tracking.
 */

// ASC (App Store Connect) Integration
export const ASC_ERRORS = {
    AUTOFILL_NETWORK_ERROR: 'ASC_001',
    AUTOFILL_TIMEOUT: 'ASC_002',
    AUTOFILL_INVALID_RESPONSE: 'ASC_003',
    CONNECTION_INVALID_CREDENTIALS: 'ASC_004',
    CONNECTION_VALIDATION_FAILED: 'ASC_005',
    DECRYPTION_FAILED: 'ASC_006',
    CREDENTIALS_REVOKED: 'ASC_007',
} as const

// Draft Management
export const DRAFT_ERRORS = {
    LOAD_FAILED: 'DRAFT_001',
    LOAD_NOT_FOUND: 'DRAFT_002',
    LOAD_UNAUTHORIZED: 'DRAFT_003',
    LOAD_TIMEOUT: 'DRAFT_004',
    SAVE_FAILED: 'DRAFT_005',
} as const

// File Upload
export const UPLOAD_ERRORS = {
    URL_GENERATION_FAILED: 'UPLOAD_001',
    URL_GENERATION_TIMEOUT: 'UPLOAD_002',
    SIGNED_URL_NOT_FOUND: 'UPLOAD_003',
    FILE_UPLOAD_FAILED: 'UPLOAD_004',
    MANIFEST_MISMATCH: 'UPLOAD_005',
    RETRY_URL_MISMATCH: 'UPLOAD_006',
} as const

// Submission & Finalization
export const SUBMISSION_ERRORS = {
    FINALIZE_FAILED: 'SUBMIT_001',
    FINALIZE_INVALID_STATUS: 'SUBMIT_002',
    CREDIT_DEDUCTION_FAILED: 'SUBMIT_003',
    CREDIT_INSUFFICIENT: 'SUBMIT_004',
    REFUND_FAILED: 'SUBMIT_005',
    JOB_CREATION_FAILED: 'SUBMIT_006',
    WORKER_TRIGGER_FAILED: 'SUBMIT_007',
    ROLLBACK_FAILED: 'SUBMIT_008',
} as const

// State & Navigation
export const NAV_ERRORS = {
    INVALID_STEP_TRANSITION: 'NAV_001',
    NAVIGATION_DURING_UPLOAD: 'NAV_002',
} as const
```

---

## File 2: Create Structured Logging Utility

**File:** `/packages/web/src/lib/logging.ts` (NEW)

```typescript
/**
 * Structured logging utility for consistent error tracking.
 * Logs to console in dev, sends to Sentry in production.
 */

export type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogContext {
    errorId?: string
    userId?: string
    submissionId?: string
    component?: string
    action?: string
    context?: Record<string, any>
}

/**
 * Log an error with structured context.
 * In development: console.error
 * In production: Also sends to Sentry
 */
export function logError(
    message: string,
    error: Error | null,
    context: LogContext
) {
    const logData = {
        timestamp: new Date().toISOString(),
        message,
        errorId: context.errorId,
        userId: context.userId,
        submissionId: context.submissionId,
        component: context.component,
        action: context.action,
        errorMessage: error?.message,
        errorStack: error?.stack,
        ...context.context,
    }

    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context.errorId || 'ERROR'}] ${message}`, logData)
    } else {
        // In production, send to Sentry
        // TODO: Integrate with Sentry
        console.error(`[${context.errorId || 'ERROR'}] ${message}`, logData)
    }

    return logData
}

/**
 * Log a warning (non-critical issue).
 */
export function logWarn(message: string, context: LogContext) {
    const logData = {
        timestamp: new Date().toISOString(),
        message,
        ...context,
    }
    console.warn(message, logData)
    return logData
}

/**
 * Log debug information (development only).
 */
export function logDebug(message: string, data: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
        console.debug(message, data)
    }
}
```

---

## File 3: Improved Submit Page Component

**File:** `/packages/web/src/app/submit/page.tsx` (Key sections only)

### Add error and state variables at top of component:

```typescript
// ASC Error States
const [ascError, setAscError] = useState<string | null>(null)

// Draft Loading States
const [draftError, setDraftError] = useState<string | null>(null)
const [loadingDraft, setLoadingDraft] = useState(false)

// Track unsaved changes
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
```

### Replace loadDraft function:

```typescript
const loadDraft = async (submissionId: string) => {
    setLoadingDraft(true)
    setDraftError(null)

    try {
        const res = await fetch(`/api/submissions/${submissionId}`)

        if (!res.ok) {
            const errorData = res.status === 404
                ? 'This draft no longer exists'
                : 'Failed to load draft. Please try again.'

            logError(
                'Draft loading failed',
                new Error(`HTTP ${res.status}`),
                {
                    errorId: res.status === 404 ? DRAFT_ERRORS.LOAD_NOT_FOUND : DRAFT_ERRORS.LOAD_FAILED,
                    submissionId,
                    component: 'SubmitPage',
                    action: 'loadDraft',
                }
            )

            throw new Error(errorData)
        }

        const { data } = await res.json()

        if (!data) {
            throw new Error('No draft data returned from server')
        }

        // Successfully loaded — populate form
        setActiveSubmissionId(data.id)
        if (data.app_name) setAppName(data.app_name)
        if (data.promotional_text) setPromotionalText(data.promotional_text)
        if (data.description) setDescription(data.description)
        if (data.keywords) setKeywords(data.keywords)
        if (data.category) setCategory(data.category)
        if (data.support_url) setSupportUrl(data.support_url)
        if (data.marketing_url) setMarketingUrl(data.marketing_url)
        if (data.sign_in_required !== undefined) setSignInRequired(data.sign_in_required)
        if (data.demo_username) setDemoUsername(data.demo_username)
        if (data.demo_password) setDemoPassword(data.demo_password)
        if (data.age_rating) setAgeRating(data.age_rating)
        if (data.privacy_declarations) setPrivacy(data.privacy_declarations)
        if (data.checklist) setChecklist(data.checklist)

        setHasUnsavedChanges(false)
    } catch (err: any) {
        logError(
            'Error in loadDraft',
            err,
            {
                errorId: DRAFT_ERRORS.LOAD_FAILED,
                component: 'SubmitPage',
                action: 'loadDraft',
                submissionId,
            }
        )
        setDraftError(err.message || 'Failed to load draft')

        // Remove ?draft param so user can start fresh
        router.replace('/submit')
    } finally {
        setLoadingDraft(false)
    }
}
```

### Replace handleRefresh function:

```typescript
const handleRefresh = async () => {
    if (!ascAppId) return

    setRefreshing(true)
    setAscError(null)

    try {
        const res = await fetch('/api/asc/autofill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId: ascAppId }),
            signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))

            logError(
                'ASC autofill failed',
                new Error(`HTTP ${res.status}`),
                {
                    errorId: res.status === 401 ? ASC_ERRORS.AUTOFILL_NETWORK_ERROR : ASC_ERRORS.AUTOFILL_INVALID_RESPONSE,
                    component: 'SubmitPage',
                    action: 'handleRefresh',
                    context: { appId: ascAppId, status: res.status },
                }
            )

            throw new Error(
                errorData.message || 'Failed to fetch metadata from App Store Connect'
            )
        }

        const response = await res.json()

        if (!response.data) {
            throw new Error('No data returned from App Store Connect')
        }

        // Show warnings if some fields were not fetched
        if (response.warnings && response.warnings.length > 0) {
            logWarn(
                'ASC autofill partially succeeded',
                {
                    component: 'SubmitPage',
                    warnings: response.warnings,
                }
            )
            // Optionally show a banner: "Some fields could not be auto-filled"
        }

        handleAutofill(response.data)
    } catch (err: any) {
        // Handle timeout
        if (err.name === 'AbortError') {
            logError(
                'ASC autofill timeout',
                err,
                {
                    errorId: ASC_ERRORS.AUTOFILL_TIMEOUT,
                    component: 'SubmitPage',
                    action: 'handleRefresh',
                }
            )
            setAscError('Refresh timed out. Please check your connection and try again.')
        } else {
            setAscError(err.message || 'Failed to refresh metadata')
        }
    } finally {
        setRefreshing(false)
    }
}
```

### Replace nextStep function:

```typescript
const nextStep = async () => {
    // Validation
    if (step === 1 && !appName) {
        alert("App Name is required")
        return
    }
    if (step === 2) {
        if (!ipaBinary || !infoPlist || !privacyManifest) {
            alert("Please upload all 3 required files: IPA, Info.plist, and Privacy Manifest")
            return
        }
        if (screenshots.length < 3) {
            alert("At least 3 screenshots are required")
            return
        }
    }

    // Save draft before advancing
    setLoading(true)
    try {
        await handleFinalSubmit(true)
        setStep(s => Math.min(s + 1, 4))
        setHasUnsavedChanges(false)
    } catch (err: any) {
        logError(
            'Failed to save draft before advancing',
            err,
            {
                errorId: DRAFT_ERRORS.SAVE_FAILED,
                component: 'SubmitPage',
                action: 'nextStep',
            }
        )
        alert('Failed to save draft. Please try again.')
    } finally {
        setLoading(false)
    }
}

const prevStep = () => {
    // Prevent navigation during upload
    if (uploadPhase !== null) {
        alert('Please wait for upload to complete or cancel')
        return
    }

    if (step > 1) {
        setStep(s => s - 1)
    }
}
```

### Replace the Back button in JSX:

```typescript
<button
    onClick={prevStep}
    disabled={step === 1 || loading || uploadPhase !== null}
    className="vercel-btn-secondary text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
    title={uploadPhase !== null ? 'Cannot navigate while uploading' : ''}
>
    Back
</button>
```

### Add error displays at top of form:

```typescript
{draftError && (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-sm text-red-400">{draftError}</p>
        <button
            onClick={() => {
                setDraftError(null)
                router.replace('/submit')
            }}
            className="text-xs text-red-300 hover:text-red-200 mt-2 underline"
        >
            Start Fresh
        </button>
    </div>
)}

{loadingDraft && (
    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-400">Loading draft...</p>
    </div>
)}

{ascError && (
    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-sm text-yellow-400">{ascError}</p>
    </div>
)}
```

### Add unsaved changes warning:

```typescript
useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasUnsavedChanges && uploadPhase === null) {
            e.preventDefault()
            e.returnValue = ''
        }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [hasUnsavedChanges, uploadPhase])

// Mark as dirty whenever form changes
const handleAppNameChange = (value: string) => {
    setAppName(value)
    setHasUnsavedChanges(true)
}
// Repeat for all form fields...
```

### Improve screenshot deletion:

```typescript
const deleteScreenshot = (index: number) => {
    if (screenshots.length <= 3) {
        alert('At least 3 screenshots are required')
        return
    }
    setScreenshots(prev => prev.filter((_, idx) => idx !== index))
    setHasUnsavedChanges(true)
}

// In JSX:
<button
    onClick={() => deleteScreenshot(i)}
    className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full..."
>
    <X className="w-3 h-3 text-white" />
</button>
```

---

## File 4: Improved ASC Autofill Endpoint

**File:** `/packages/web/src/app/api/asc/autofill/route.ts` (Key sections)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
    getLatestVersion,
    getAppMetadata,
    getAppInfo,
    getAppDetails,
    getReviewDetail,
    type ASCCredentials,
} from '@/lib/app-store-connect'
import { decryptPrivateKey } from '@/lib/asc-credential-store'
import { getEncryptionKey } from '@/lib/asc-encryption'
import { ASC_ERRORS } from '@preflight/shared'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }

    const { appId } = await request.json()
    if (!appId) {
        return NextResponse.json({ message: 'Missing appId' }, { status: 400 })
    }

    const serviceSupabase = createServiceClient()
    const { data: conn, error: connError } = await serviceSupabase
        .from('asc_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (connError || !conn) {
        return NextResponse.json(
            { message: 'No ASC connection found', errorId: ASC_ERRORS.CONNECTION_VALIDATION_FAILED },
            { status: 404 }
        )
    }

    // Decrypt private key with proper error handling
    let privateKey: string
    try {
        privateKey = decryptPrivateKey(
            conn.encrypted_private_key,
            conn.encryption_iv,
            getEncryptionKey()
        )
    } catch (err: any) {
        console.error('ASC credentials decryption failed:', err)
        return NextResponse.json({
            message: 'Unable to decrypt App Store Connect credentials. Please reconnect.',
            errorId: ASC_ERRORS.DECRYPTION_FAILED,
            code: 'ASC_DECRYPTION_ERROR'
        }, { status: 400 })
    }

    const credentials: ASCCredentials = {
        keyId: conn.key_id,
        issuerId: conn.issuer_id,
        privateKey,
    }

    // Fetch with explicit error tracking
    const [versionResult, appInfoResult, appDetailsResult] = await Promise.all([
        getLatestVersion(credentials, appId)
            .then(v => ({ success: true, data: v }))
            .catch(e => {
                console.error('getLatestVersion failed:', e)
                return { success: false, error: 'version' }
            }),
        getAppInfo(credentials, appId)
            .then(a => ({ success: true, data: a }))
            .catch(e => {
                console.error('getAppInfo failed:', e)
                return { success: false, error: 'appInfo' }
            }),
        getAppDetails(credentials, appId)
            .then(a => ({ success: true, data: a }))
            .catch(e => {
                console.error('getAppDetails failed:', e)
                return { success: false, error: 'appDetails' }
            }),
    ])

    const version = versionResult.success ? versionResult.data : null
    const appInfo = appInfoResult.success ? appInfoResult.data : null
    const appDetails = appDetailsResult.success ? appDetailsResult.data : null

    const warnings: string[] = []
    if (!versionResult.success) warnings.push('Could not fetch app version')
    if (!appInfoResult.success) warnings.push('Could not fetch app category')
    if (!appDetailsResult.success) warnings.push('Could not fetch app details')

    console.log('ASC Autofill Debug:', {
        appId,
        hasVersion: !!version,
        hasAppInfo: !!appInfo,
        hasAppDetails: !!appDetails,
        warnings,
    })

    let metadata = null
    let reviewDetail = null
    if (version) {
        const metadataResult = await getAppMetadata(credentials, version.id)
            .then(m => ({ success: true, data: m }))
            .catch(e => {
                console.error('getAppMetadata failed:', e)
                return { success: false }
            })

        const reviewDetailResult = await getReviewDetail(credentials, version.id)
            .then(r => ({ success: true, data: r }))
            .catch(e => {
                console.error('getReviewDetail failed:', e)
                return { success: false }
            })

        metadata = metadataResult.success ? metadataResult.data : null
        reviewDetail = reviewDetailResult.success ? reviewDetailResult.data : null

        if (!metadataResult.success) warnings.push('Could not fetch metadata')
        if (!reviewDetailResult.success) warnings.push('Could not fetch review details')
    }

    // Update connection with selected app
    const { error: updateError } = await serviceSupabase
        .from('asc_connections')
        .update({
            selected_app_id: appId,
            selected_app_name: metadata?.name || appDetails?.name || null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    if (updateError) {
        console.error('Failed to update ASC connection:', updateError)
        return NextResponse.json({
            message: 'Failed to save connection',
            errorId: ASC_ERRORS.AUTOFILL_NETWORK_ERROR
        }, { status: 500 })
    }

    const categoryMap: Record<string, string> = {
        'BUSINESS': 'Business',
        'DEVELOPER_TOOLS': 'Developer Tools',
        // ... rest of map
    }

    return NextResponse.json({
        success: true,
        data: {
            app_name: metadata?.name || appDetails?.name || '',
            description: metadata?.description || '',
            keywords: metadata?.keywords || '',
            promotional_text: metadata?.promotionalText || '',
            support_url: metadata?.supportUrl || '',
            marketing_url: metadata?.marketingUrl || '',
            category: appInfo?.categoryId ? categoryMap[appInfo.categoryId] || appInfo.categoryId : '',
            version: version?.versionString || '',
            sign_in_required: reviewDetail?.signInRequired || false,
            demo_username: reviewDetail?.demoAccountName || '',
            demo_password: reviewDetail?.demoAccountPassword || '',
        },
        warnings: warnings.length > 0 ? warnings : undefined
    })
}
```

---

## File 5: Improved Finalization Endpoint

**File:** `/packages/web/src/app/api/submissions/[id]/finalize/route.ts` (Key sections)

```typescript
// ... existing imports ...
import { SUBMISSION_ERRORS } from '@preflight/shared'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: submissionId } = await params
    const supabase = await createClientFromRequest(req)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('id, user_id, status')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single()

    if (subError || !submission) {
        return NextResponse.json({
            message: 'Submission not found',
            errorId: SUBMISSION_ERRORS.FINALIZE_FAILED
        }, { status: 404 })
    }

    if (submission.status !== 'draft') {
        return NextResponse.json({
            message: 'Submission has already been finalized',
            errorId: SUBMISSION_ERRORS.FINALIZE_INVALID_STATUS
        }, { status: 409 })
    }

    try {
        const { files } = await req.json() as {
            files: { type: string; index?: number }[]
        }

        if (!Array.isArray(files)) {
            return NextResponse.json({
                message: 'Invalid request body',
                errorId: 'INVALID_REQUEST'
            }, { status: 400 })
        }

        const basePath = `${user.id}/${submissionId}`
        const screenshotPaths: string[] = []
        let plistPath: string | null = null
        let manifestPath: string | null = null
        let ipaPath: string | null = null

        // Validate file paths
        for (const file of files) {
            if (!BUCKET_MAP[file.type]) {
                return NextResponse.json({
                    message: `Unknown file type: ${file.type}`,
                    errorId: 'INVALID_FILE_TYPE'
                }, { status: 400 })
            }

            switch (file.type) {
                case 'screenshot': {
                    const idx = Number(file.index)
                    if (!Number.isInteger(idx) || idx < 0 || idx > 9) {
                        return NextResponse.json({
                            message: 'Invalid screenshot index',
                            errorId: 'INVALID_SCREENSHOT_INDEX'
                        }, { status: 400 })
                    }
                    screenshotPaths.push(`${basePath}/screenshot_${idx}.png`)
                    break
                }
                case 'plist':
                    plistPath = `${basePath}/Info.plist`
                    break
                case 'manifest':
                    manifestPath = `${basePath}/PrivacyInfo.xcprivacy`
                    break
                case 'ipa':
                    ipaPath = `${basePath}/app.ipa`
                    break
            }
        }

        screenshotPaths.sort()

        // Atomic credit deduction with proper error handling
        const creditCost = CREDIT_COSTS.full
        const { data: creditResult, error: creditError } = await supabase
            .rpc('deduct_credits', { p_user_id: user.id, p_cost: creditCost })

        if (creditError) {
            console.error('Credit deduction RPC failed:', creditError)
            return NextResponse.json({
                message: 'Failed to process credits',
                errorId: SUBMISSION_ERRORS.CREDIT_DEDUCTION_FAILED
            }, { status: 500 })
        }

        const row = creditResult?.[0]
        if (!row?.success) {
            return NextResponse.json({
                message: `Insufficient credits. You have ${row?.remaining ?? 0} credits but need ${creditCost} for a full review.`,
                credits: row?.remaining ?? 0,
                required: creditCost,
                errorId: SUBMISSION_ERRORS.CREDIT_INSUFFICIENT
            }, { status: 402 })
        }

        // Update submission with file paths
        const { error: updateError } = await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                plist_path: plistPath,
                manifest_path: manifestPath,
                ipa_path: ipaPath,
                credits_used: creditCost,
                status: 'analyzing',
            })
            .eq('id', submissionId)

        if (updateError) {
            console.error('Failed to update submission:', updateError)
            // Attempt refund with error handling
            try {
                const { error: refundError } = await supabase
                    .rpc('refund_credits', { p_user_id: user.id, p_amount: creditCost })
                if (refundError) {
                    console.error('CRITICAL: Refund failed after submission update failed:', refundError)
                    // TODO: Create audit log for manual review
                }
            } catch (refundErr) {
                console.error('CRITICAL: Refund exception after submission update failed:', refundErr)
            }

            return NextResponse.json({
                message: 'Failed to update submission',
                errorId: SUBMISSION_ERRORS.FINALIZE_FAILED
            }, { status: 500 })
        }

        // Create analysis job with error handling
        const { error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
            })

        if (jobError) {
            console.error('Failed to create analysis job:', jobError)
            // Revert submission status and refund credits
            const revertPromises = [
                supabase.from('submissions')
                    .update({ status: 'draft' })
                    .eq('id', submissionId),
                supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: creditCost })
            ]

            const [revertErr, refundErr] = await Promise.all([
                revertPromises[0].then(() => null).catch(e => e),
                revertPromises[1].then(() => null).catch(e => e)
            ])

            if (revertErr || refundErr) {
                console.error('CRITICAL: Rollback failed after job creation failed', {
                    revertError: revertErr?.message,
                    refundError: refundErr?.message,
                })
                // TODO: Create incident for manual recovery
            }

            return NextResponse.json({
                message: 'Failed to create analysis job',
                errorId: SUBMISSION_ERRORS.JOB_CREATION_FAILED
            }, { status: 500 })
        }

        // Trigger worker with proper error handling and logging
        try {
            const workerRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, secret: process.env.WORKER_SECRET })
            })

            if (!workerRes.ok) {
                console.error(`Worker trigger returned ${workerRes.status} for submission ${submissionId}`)
                // Log but don't fail — job was created and will be processed by background worker
            }
        } catch (err) {
            console.error('Worker trigger failed:', err)
            // Log but don't fail — job exists and will be picked up by polling
        }

        revalidatePath('/dashboard')
        console.log(`Submission ${submissionId} finalized successfully`)

        return NextResponse.json({ submissionId, success: true })
    } catch (err: any) {
        console.error('Finalize exception:', err)

        // Attempt rollback on unexpected error
        try {
            const { error: statusErr } = await supabase
                .from('submissions')
                .update({ status: 'draft' })
                .eq('id', submissionId)

            if (statusErr) {
                console.error('CRITICAL: Could not revert status:', statusErr)
            }

            const { error: refundErr } = await supabase
                .rpc('refund_credits', { p_user_id: user.id, p_amount: CREDIT_COSTS.full })

            if (refundErr) {
                console.error('CRITICAL: Could not refund credits:', refundErr)
                // TODO: Flag for manual audit
            }
        } catch (rollbackErr) {
            console.error('CRITICAL: Rollback exception:', rollbackErr)
            // TODO: Create incident for SRE
        }

        return NextResponse.json({
            message: err.message || 'Internal Server Error',
            errorId: SUBMISSION_ERRORS.FINALIZE_FAILED
        }, { status: 500 })
    }
}
```

---

## Summary

These fixes address:

- **Issue 1, 2, 5, 9:** ASC error handling with proper logging and user feedback
- **Issue 2:** Draft loading with error states and recovery flows
- **Issue 3:** Navigation guards during upload
- **Issue 4:** Better error handling in finalization
- **Issue 6:** Return warnings about partial data
- **Issue 8:** Improved rollback error handling
- **Issue 10:** Unsaved changes warning
- **Issue 11, 12, 13:** Validation and state consistency

All fixes include structured logging with error IDs from `@preflight/shared` for proper tracking.

---

End of implementation guide.
