# 🚨 CRITICAL ERROR HANDLING AUDIT: Backward Navigation & Submission Flow

**Audit Date:** 2025-02-03
**Scope:** Backward navigation implementation, draft state management, ASC autofill, file upload, submission finalization
**Severity Assessment:** 4 CRITICAL, 6 HIGH, 3 MEDIUM issues identified

---

## EXECUTIVE SUMMARY

The backward navigation implementation contains **critical silent failures** that can leave submissions in corrupted states, expose API errors without logging, and fail to recover from network issues. Users navigating backward after partial uploads face **data loss** and **state inconsistency**. No telemetry is in place to detect these failures.

---

# CRITICAL ISSUES (Silent Failures & State Corruption)

## 1. CRITICAL: ASC Autofill Network Failures Are Silently Swallowed

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 130-146)

**Severity:** CRITICAL

**Issue Description:**
The `handleRefresh()` function calls `/api/asc/autofill` to pull metadata from App Store Connect. Network failures, timeouts, and API errors are caught but **completely ignored**. The user sees no error message, no retry option, no indication that the refresh failed.

```typescript
// Line 130-146: Silent failure on network error
const handleRefresh = async () => {
    if (!ascAppId) return
    setRefreshing(true)
    try {
        const res = await fetch('/api/asc/autofill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId: ascAppId })
        })
        const { data } = await res.json()  // ❌ PROBLEM 1: No check if res.ok
        handleAutofill(data)                // ❌ PROBLEM 2: No error handling on res.json()
    } catch (err) {
        console.error("Failed to refresh ASC data", err)  // ❌ PROBLEM 3: Only console.error, user sees nothing
    } finally {
        setRefreshing(false)  // ❌ PROBLEM 4: Flag set to false even on failure
    }
}
```

**Hidden Errors:**
- Network timeout (>30s)
- ASC API rate limiting (429 Too Many Requests)
- Invalid ASC credentials (401 Unauthorized from ASC)
- Server-side decryption failures in `/api/asc/autofill`
- Malformed JSON response from ASC
- Missing `data` field in response

**User Impact:**
User clicks "Refresh" expecting app metadata to populate. Nothing happens visibly. The refresh button goes back to normal state. User assumes it worked but fields remain unchanged. If form is incomplete and user navigates back/forward, they lose unsaved data.

**Recommendation:**

1. Check `response.ok` before parsing JSON
2. Add specific error states to UI (show error message in toast/banner)
3. Disable autofill features if ASC fetch fails
4. Log errors with structured format (include error ID from future errorIds.ts)
5. Provide retry mechanism with exponential backoff

**Example Fix:**

```typescript
const handleRefresh = async () => {
    if (!ascAppId) return
    setRefreshing(true)
    setAscError(null)  // Clear previous errors
    try {
        const res = await fetch('/api/asc/autofill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appId: ascAppId })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || `ASC autofill failed with status ${res.status}`)
        }

        const { data } = await res.json()
        if (!data) throw new Error('No data returned from ASC')
        handleAutofill(data)
    } catch (err: any) {
        console.error("Failed to refresh ASC data", err)
        setAscError(err.message || 'Failed to refresh metadata from App Store Connect')
    } finally {
        setRefreshing(false)
    }
}
```

---

## 2. CRITICAL: Draft Loading Silently Fails Without User Notification

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 84-110)

**Severity:** CRITICAL

**Issue Description:**
When a user loads a saved draft via URL parameter (e.g., `/submit?draft=submission-123`), the `loadDraft()` function silently fails if the API returns an error. No error is shown to the user, no fallback is triggered, the form simply remains empty.

```typescript
// Line 84-110: Silent failure on draft load
const loadDraft = async (submissionId: string) => {
    try {
        const res = await fetch(`/api/submissions/${submissionId}`)
        if (!res.ok) return  // ❌ PROBLEM 1: Silent return on 404/500

        const { data } = await res.json()
        if (!data) return  // ❌ PROBLEM 2: Silent return on missing data

        // Populate form fields from saved data
        setActiveSubmissionId(data.id)
        if (data.app_name) setAppName(data.app_name)
        // ... more fields ...
    } catch (err) {
        console.error('Failed to load draft:', err)  // ❌ PROBLEM 3: User never sees this
    }
}
```

**Hidden Errors:**
- Submission not found (404) — user doesn't know why form is empty
- Database error (500) — user doesn't know to try again
- User is not authorized to access submission (ownership mismatch)
- Network timeout — user doesn't know to refresh page
- Malformed response body — `data` could be `null` from API

**User Impact:**
User receives link to continue draft (e.g., from email). They click it, land on `/submit?draft=abc123`, see an empty form. They have no idea:
1. Is the draft lost?
2. Is the link broken?
3. Should they retry?
4. Should they start fresh?

They may start entering data again, losing the draft. If they navigate back mid-form and try to resume, they've now lost BOTH the original draft AND the work they just did.

**Recommendation:**

1. Show a "Loading draft..." state while fetching
2. Show error banner if load fails (e.g., "Draft not found" or "Failed to load draft")
3. Provide "Start Fresh" button as fallback
4. Remove `?draft=` param from URL if load fails
5. Log failures with unique error ID for support

**Example Fix:**

```typescript
const [draftError, setDraftError] = useState<string | null>(null)
const [loadingDraft, setLoadingDraft] = useState(false)

const loadDraft = async (submissionId: string) => {
    setLoadingDraft(true)
    setDraftError(null)
    try {
        const res = await fetch(`/api/submissions/${submissionId}`)

        if (!res.ok) {
            const statusText = res.status === 404 ? 'Draft not found' : 'Failed to load draft'
            throw new Error(statusText)
        }

        const { data } = await res.json()
        if (!data) {
            throw new Error('No draft data returned')
        }

        // Successfully loaded
        setActiveSubmissionId(data.id)
        if (data.app_name) setAppName(data.app_name)
        // ... populate fields ...
    } catch (err: any) {
        console.error('Failed to load draft:', err)
        setDraftError(err.message)
        // Optionally remove draft param from URL
    } finally {
        setLoadingDraft(false)
    }
}

// In JSX:
{loadingDraft && <div>Loading draft...</div>}
{draftError && <div className="error">{draftError} <button onClick={() => router.replace('/submit')}>Start Fresh</button></div>}
```

---

## 3. CRITICAL: Backward Navigation Corrupts Upload State During Active Upload

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 196-217, 688-693)

**Severity:** CRITICAL

**Issue Description:**
While files are uploading (`uploadPhase === 'uploading'`), the user can click the "Back" button. This calls `prevStep()` which unceremoniously changes `step` state. However, the upload continues in the background. This creates a **race condition** where:

1. User is on upload progress overlay (Step 4)
2. User clicks "Back" (exits overlay view)
3. Upload continues in background, calling `setUploadProgress()`
4. If step goes back to step 3, the overlay disappears but upload refs are not cleared
5. User navigates forward again, seeing stale upload progress
6. Files might complete uploading but state is inconsistent

```typescript
// Line 217: No guard against navigating during upload
const prevStep = () => setStep(s => Math.max(s - 1, 1))

// Line 688-693: Back button disabled only on 'loading', not on uploadPhase
<button
    onClick={prevStep}
    disabled={step === 1 || loading}  // ❌ PROBLEM: Doesn't check uploadPhase
    className="vercel-btn-secondary text-[10px] disabled:opacity-0"
>
    Back
</button>
```

**Hidden Errors:**
- Refs continue to be updated even when step changes: `uploadedFilesRef.current.push(...)`
- `setUploadProgress()` updates state that may not render anymore
- `submittingRef.current` flag stays true, blocking future submissions
- User closes tab mid-upload: cleanup never runs, refs leak
- User goes back/forward/back: state becomes incoherent

**User Impact:**
User navigates during upload expecting to "go back and edit". Upload continues silently. User comes back to the form, tries to re-submit, gets blocked by `submittingRef.current` check on line 814. They're stuck unable to submit again because the internal flag is still true.

**Recommendation:**

1. Disable "Back" button when `uploadPhase` is set
2. Prevent step navigation during upload
3. Add cancel button to upload overlay
4. Clear refs properly on cancel
5. Implement cleanup on component unmount (useEffect cleanup)

**Example Fix:**

```typescript
// Disable back button during any upload/submit phase
<button
    onClick={prevStep}
    disabled={step === 1 || loading || uploadPhase !== null}  // ✅ Block navigation during upload
    className="vercel-btn-secondary text-[10px] disabled:opacity-0"
>
    Back
</button>

// In upload error handling:
{uploadPhase === 'error' && (
    <div className="text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Upload Failed</h3>
        {/* ... error display ... */}
        <div className="flex gap-3 justify-center pt-2">
            <button
                onClick={() => {
                    setUploadPhase(null)
                    setLoading(false)
                    submittingRef.current = false  // ✅ Explicitly reset
                    prevStep()  // ✅ Now user can navigate back
                }}
                className="vercel-btn-secondary text-xs"
            >
                Go Back and Edit
            </button>
            {/* ... retry button ... */}
        </div>
    </div>
)}

// Add cleanup on unmount:
useEffect(() => {
    return () => {
        // If component unmounts during upload, reset state
        if (uploadPhase) {
            submittingRef.current = false
            // Could also trigger cancel on Supabase storage
        }
    }
}, [uploadPhase])
```

---

## 4. CRITICAL: Upload-URLs API Errors Don't Prevent Corruption

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/api/submissions/[id]/upload-urls/route.ts` (lines 43-90)

**Severity:** CRITICAL

**Issue Description:**
The upload-urls endpoint can fail for several reasons (validation errors, storage errors, etc.), but the client's `getSignedUploadUrls()` function doesn't distinguish between "one file failed" vs "all files failed" vs "critical error". The response could be a 500 error that throws, but there's no retry mechanism and state is left partially initialized.

```typescript
// Line 60-78 in upload.ts: Minimal error handling
export async function getSignedUploadUrls(
    submissionId: string,
    manifest: FileManifestItem[]
): Promise<SignedUrlResponse[]> {
    const response = await fetch(`/api/submissions/${submissionId}/upload-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: manifest.map(item => ({
                type: item.type,
                index: item.index,
                filename: item.file.name,
            }))
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get upload URLs')  // ❌ PROBLEM: Loses specific file error info
    }

    const { urls } = await response.json()
    return urls  // ❌ PROBLEM: No validation that urls is an array
}
```

**Hidden Errors:**
- File validation error in upload-urls (invalid index, wrong extension) — not propagated to client
- Storage bucket unavailable (500) — error thrown but refs already partially initialized
- Concurrent request to same submission — race condition between URL generation and removal
- response.json() parsing fails — error lost to catch
- urls array is empty or undefined — silently returns incomplete manifest

**User Impact:**
User clicks "Continue" to upload files. Submission is created, refs are initialized. Then upload-urls fails (e.g., 500 error from Supabase). Error is thrown, caught in handleFinalSubmit, sets upload error state. But submission ID is already saved to `activeSubmissionId`. User clicks "Retry", but now there's a partial submission in the database with no files. State is corrupted.

**Recommendation:**

1. Validate response.urls is an array before using
2. Log specific file errors in upload-urls endpoint
3. Return detailed error response including which files failed validation
4. Implement atomic submission creation (create submission only after URLs are confirmed)
5. Add validation checks before starting upload

---

# HIGH SEVERITY ISSUES

## 5. HIGH: ASC Connection Validation Errors Not Surfaced to User

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/api/asc/connect/route.ts` (lines 26-29)

**Severity:** HIGH

**Issue Description:**
When ASC credentials are invalid, the API returns a 400 error, but the client doesn't show a user-friendly message about what went wrong or how to fix it.

```typescript
const validation = await validateCredentials({ keyId, issuerId, privateKey })
if (!validation.valid) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })  // ❌ Generic error
}
```

The client's ASCConnectModal gets this error but doesn't display it in the UI.

**Recommendation:**
Return more specific error messages (e.g., "Key ID format invalid", "Issuer ID not found", "Private key format incorrect") and ensure client displays them.

---

## 6. HIGH: ASC Autofill Partial Data Silently Accepted

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/api/asc/autofill/route.ts` (lines 51-73)

**Severity:** HIGH

**Issue Description:**
The endpoint calls multiple ASC API methods in parallel with `.catch(() => null)`. If some fail and return null, they're silently ignored. The response includes empty fields, but the client has no way to know which fields are actually from ASC vs which are missing.

```typescript
const [version, appInfo, appDetails] = await Promise.all([
    getLatestVersion(credentials, appId).catch(e => { console.error('getLatestVersion failed', e); return null }),
    getAppInfo(credentials, appId).catch(e => { console.error('getAppInfo failed', e); return null }),
    getAppDetails(credentials, appId).catch(e => { console.error('getAppDetails failed', e); return null }),
])  // ❌ PROBLEM: Silently returns null, client doesn't know what failed
```

**User Impact:**
User connects ASC and clicks "Refresh". Some metadata is populated, some is not. User doesn't know if the missing fields are because they weren't set in ASC or because the fetch failed. They might think their ASC is incomplete and disconnect/reconnect.

**Recommendation:**
Return error information in response body indicating which fields failed to fetch:

```typescript
return NextResponse.json({
    success: true,
    data: { ... },
    warnings: [
        version ? null : 'Could not fetch app version',
        appInfo ? null : 'Could not fetch app category',
        appDetails ? null : 'Could not fetch app details',
    ].filter(Boolean)
})
```

---

## 7. HIGH: File Upload Manifest Mismatch Between client & server

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 860-880) & `upload.ts` (lines 99-104)

**Severity:** HIGH

**Issue Description:**
The client builds a manifest using `buildFileManifest()` which returns files in a specific order (plist, manifest, screenshots, ipa). But when retrying failed files, the client matches URLs by type and index. If a screenshot at index 2 fails and is retried, the URL lookup uses `u.index === item.index`, but the signed URL might have a different index if the manifest was rebuilt with fewer screenshots.

```typescript
// Line 99-104 in upload.ts: Fragile index matching
function findUrl(item: FileManifestItem): SignedUrlResponse | undefined {
    return signedUrls.find(u =>
        u.type === item.type &&
        (item.type !== 'screenshot' || u.index === item.index)  // ❌ PROBLEM: Index match assumes same manifest order
    )
}
```

**User Impact:**
User uploads 5 screenshots. Screenshot #2 fails. User clicks "Retry Failed Files". But if they deleted a screenshot after the first attempt, screenshot indices have changed. The retry tries to upload the wrong file to the wrong signed URL path.

**Recommendation:**
Store signed URLs with a unique identifier (hash or UUID) rather than relying on index matching. Or, regenerate the entire manifest before retry, not just failed files.

---

## 8. HIGH: Finalization Rollback Fails Silently

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/api/submissions/[id]/finalize/route.ts` (lines 147-153)

**Severity:** HIGH

**Issue Description:**
If finalization fails after credits are deducted, the endpoint attempts to rollback by calling `refund_credits`. But if that refund call also fails, the error is logged but not propagated. User lost credits with no compensation mechanism in place.

```typescript
if (jobError) {
    // Revert submission status and refund credits
    await supabase.from('submissions').update({ status: 'draft' }).eq('id', submissionId)
    await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: creditCost })  // ❌ PROBLEM: No error handling if refund fails
    return NextResponse.json({ message: 'Failed to create analysis job' }, { status: 500 })
}
```

**User Impact:**
1. User submits files
2. Credits are deducted (success)
3. Analysis job creation fails (rare but possible)
4. Refund RPC call is made, but fails (database issue)
5. User's credits are gone, submission is still in draft state, analysis never runs
6. No way to know what happened or recover

**Recommendation:**
1. Add proper error handling and user notification for rollback failures
2. Create a "credit audit log" for disputes
3. Make credit operations idempotent (if already refunded, don't refund again)
4. Return specific error to user so they can contact support

---

## 9. HIGH: ASC Autofill Doesn't Handle Decryption Failures

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/api/asc/autofill/route.ts` (lines 39-43)

**Severity:** HIGH

**Issue Description:**
If private key decryption fails (corrupted encryption_iv, wrong key, etc.), the error is thrown but no try-catch wraps it. The client gets a 500 error with a generic message.

```typescript
const privateKey = decryptPrivateKey(
    conn.encrypted_private_key,
    conn.encryption_iv,
    getEncryptionKey()
)  // ❌ PROBLEM: If decryptPrivateKey throws, endpoint crashes

const credentials: ASCCredentials = {
    keyId: conn.key_id,
    issuerId: conn.issuer_id,
    privateKey,
}
```

**User Impact:**
User connects ASC once successfully. Later, something corrupts the encrypted key storage (data migration, encryption key rotation, etc.). User tries to refresh metadata and gets a 500 error. They don't know what's wrong. They disconnect and try to reconnect, starting over.

**Recommendation:**
Wrap decryption in try-catch and return a helpful error:

```typescript
let privateKey: string
try {
    privateKey = decryptPrivateKey(
        conn.encrypted_private_key,
        conn.encryption_iv,
        getEncryptionKey()
    )
} catch (err) {
    console.error('ASC credentials decryption failed:', err)
    return NextResponse.json({
        message: 'Unable to decrypt App Store Connect credentials. Please reconnect.',
        code: 'ASC_DECRYPTION_ERROR'
    }, { status: 400 })
}
```

---

## 10. HIGH: Screen Navigation Has No Warning on Unsaved Changes

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 286-292)

**Severity:** HIGH

**Issue Description:**
The form has lots of state that can be lost. There's no "beforeunload" event listener to warn users if they try to navigate away with unsaved changes. The "Save Draft" button saves, but there's no indicator of what's been saved vs what hasn't.

```typescript
<button
    onClick={() => router.push('/dashboard')}  // ❌ PROBLEM: No warning, no unsaved check
    className="flex items-center gap-2 text-gray-500 hover:text-white..."
>
    <ArrowLeft className="w-3.5 h-3.5..." />
    Back to Dashboard
</button>
```

**User Impact:**
User fills in step 1 metadata, navigates back to dashboard (clicking top button), loses all unsaved data. They might not even realize it wasn't saved because there's no visual difference between "saved" and "unsaved" state.

---

# MEDIUM SEVERITY ISSUES

## 11. MEDIUM: ASC Status Check Doesn't Validate Connection Health

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 112-128)

**Severity:** MEDIUM

**Issue Description:**
The `checkAscStatus()` function fetches `/api/asc/connect` which returns the stored connection data, but doesn't actually test if the connection is still valid. If ASC credentials have been revoked server-side, the client still shows "Connected" with stale data.

```typescript
const checkAscStatus = async () => {
    try {
        const res = await fetch('/api/asc/connect')
        const data = await res.json()  // ❌ PROBLEM: No validation that connection still works
        if (data.connected) {
            setAscConnected(true)
            setAscAppName(data.appName || "")
            setAscAppId(data.appId || "")
        }
    } catch (err) {
        console.error("Failed to check ASC status", err)  // ❌ PROBLEM: Silent fail
    }
}
```

**Recommendation:**
Periodically validate the connection by making a test API call to ASC (e.g., list apps). If it fails, mark as disconnected.

---

## 12. MEDIUM: Screenshot Deletion Doesn't Validate State

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (line 608)

**Severity:** MEDIUM

**Issue Description:**
When deleting a screenshot, the code doesn't prevent deletion below the 3-screenshot minimum. The UI will show the count as 2/10, but the validation on nextStep (line 206) will block submission. User is confused.

```typescript
<button
    onClick={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}  // ❌ PROBLEM: No minimum validation
    className="absolute top-2 right-2..."
>
    <X className="w-3 h-3 text-white" />
</button>
```

**Recommendation:**
Prevent deletion of screenshots if count would go below 3:

```typescript
<button
    onClick={() => {
        if (screenshots.length <= 3) {
            alert('At least 3 screenshots are required')
            return
        }
        setScreenshots(prev => prev.filter((_, idx) => idx !== i))
    }}
    className="absolute top-2 right-2..."
>
    <X className="w-3 h-3 text-white" />
</button>
```

---

## 13. MEDIUM: Draft Saving After Step Validation Doesn't Wait

**Location:** `/Users/tyler/Projects/Preflight/packages/web/src/app/submit/page.tsx` (lines 196-215)

**Severity:** MEDIUM

**Issue Description:**
When user clicks "Continue" to go to next step, the code calls `handleFinalSubmit(true)` to save draft before advancing. But the button immediately advances the step. If the save fails, the user is already on the next step but the draft wasn't saved.

```typescript
const nextStep = async () => {
    if (step === 1 && !appName) {
        alert("App Name is required")
        return
    }
    if (step === 2) {
        if (!ipaBinary || !infoPlist || !privacyManifest) {
            alert("Please upload all 3 required files...")
            return
        }
        if (screenshots.length < 3) {
            alert("At least 3 screenshots are required")
            return
        }
    }

    // Auto-save progress before moving to next step
    await handleFinalSubmit(true)  // ❌ PROBLEM: Awaits but doesn't check result

    setStep(s => Math.min(s + 1, 4))  // ❌ PROBLEM: Always increments, even if save failed
}
```

**Recommendation:**
Check the result of handleFinalSubmit before advancing:

```typescript
const nextStep = async () => {
    // ... validation ...

    const saved = await handleFinalSubmit(true)
    if (!saved) {
        alert('Failed to save draft. Please try again.')
        return
    }
    setStep(s => Math.min(s + 1, 4))
}
```

But this requires `handleFinalSubmit` to return a boolean indicating success.

---

## SUMMARY TABLE

| Issue ID | Location | Severity | Type | Impact |
|----------|----------|----------|------|--------|
| 1 | handleRefresh (lines 130-146) | CRITICAL | Silent failure | Users unaware autofill failed |
| 2 | loadDraft (lines 84-110) | CRITICAL | Silent failure | Draft loading fails without notification |
| 3 | prevStep (lines 217, 688-693) | CRITICAL | State corruption | Upload state corrupts on backward nav |
| 4 | upload-urls endpoint | CRITICAL | State corruption | Partial submissions left in DB |
| 5 | ASC connect validation (lines 26-29) | HIGH | Poor UX | Generic error messages |
| 6 | ASC autofill parallel calls (lines 51-73) | HIGH | Missing context | Client can't tell what failed |
| 7 | Upload manifest matching (lines 99-104) | HIGH | Race condition | Retry logic matches wrong files |
| 8 | Finalization rollback (lines 147-153) | HIGH | Data loss | Refund failures unhandled |
| 9 | Decryption in autofill (lines 39-43) | HIGH | Poor error handling | Cryptic 500 error to user |
| 10 | Navigation with unsaved changes | HIGH | Data loss | No warning before leaving |
| 11 | ASC status check validation | MEDIUM | Stale state | Shows connected when revoked |
| 12 | Screenshot deletion validation | MEDIUM | UX confusion | Can delete below minimum |
| 13 | Draft save before step advance | MEDIUM | Logic error | Advances even if save fails |

---

## RECOMMENDED FIXES (Priority Order)

### Immediate (This Week)
1. Add error states & user notifications for ASC autofill failures
2. Add error state & recovery flow for draft loading failures
3. Disable "Back" button during file uploads
4. Add try-catch around decryption in autofill endpoint
5. Log all API errors with unique error IDs for debugging

### Short Term (Next Sprint)
6. Implement "beforeunload" warning for unsaved changes
7. Refactor draft saving to validate success before advancing
8. Add screenshot deletion validation
9. Improve upload-urls error responses
10. Implement ASC connection health check

### Medium Term
11. Add centralized error logging/telemetry
12. Implement structured logging with error IDs
13. Add Sentry integration for production error tracking
14. Create error recovery UI patterns (retry, reset, contact support)

---

## LOGGING & TELEMETRY GAPS

Currently, errors are logged with `console.error()` only. Recommended:

1. **Add error ID constants** in `/packages/shared/src/errorIds.ts`
2. **Structured logging function** with fields: `{ errorId, message, context, userId, submissionId, severity }`
3. **Sentry integration** for production error tracking
4. **User-facing error UI component** that displays errors with next steps
5. **Error recovery UI** (retry, cancel, go-to-dashboard buttons)

---

## FILES REQUIRING CHANGES

- `/packages/web/src/app/submit/page.tsx` — Main form component (5+ issues)
- `/packages/web/src/app/api/asc/autofill/route.ts` — ASC autofill endpoint (3+ issues)
- `/packages/web/src/app/api/submissions/[id]/upload-urls/route.ts` — URL generation (1+ issue)
- `/packages/web/src/app/api/submissions/[id]/finalize/route.ts` — Finalization (1+ issue)
- `/packages/web/src/lib/upload.ts` — Upload logic (1+ issue)
- **NEW FILE:** `/packages/shared/src/errorIds.ts` — Error ID constants
- **NEW FILE:** `/packages/web/src/lib/logging.ts` — Structured logging utility

---

End of Audit. Ready for fixes.
