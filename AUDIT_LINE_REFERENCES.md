# Error Handling Audit - Line References & Code Locations

Quick lookup table for all 13 issues with exact file locations and line numbers.

---

## CRITICAL ISSUES

### Issue 1: ASC Autofill Network Failures Silent
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 130-146
- **Function:** `handleRefresh()`
- **Problem:** No check for `res.ok`, no error display to user
- **Fix Priority:** IMMEDIATE

### Issue 2: Draft Loading Fails Without Notification
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 84-110
- **Function:** `loadDraft()`
- **Problem:** Silent return on 404/500, user sees empty form
- **Fix Priority:** IMMEDIATE

### Issue 3: Backward Navigation During Upload Corrupts State
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 217 (prevStep function), 688-693 (Back button)
- **Problem:** No guard against navigation during `uploadPhase`, refs left in broken state
- **Fix Priority:** IMMEDIATE

### Issue 4: Upload-URLs API Errors Don't Prevent Corruption
- **File:** `/packages/web/src/app/api/submissions/[id]/upload-urls/route.ts`
- **Lines:** 43-90
- **Function:** POST handler
- **Problem:** Partial failures not distinguished from total failures
- **Fix Priority:** HIGH

---

## HIGH SEVERITY ISSUES

### Issue 5: ASC Connection Validation Errors Not Surfaced
- **File:** `/packages/web/src/app/api/asc/connect/route.ts`
- **Lines:** 26-29
- **Problem:** Generic error message "Invalid credentials"
- **Fix Priority:** HIGH

### Issue 6: ASC Autofill Partial Data Silently Accepted
- **File:** `/packages/web/src/app/api/asc/autofill/route.ts`
- **Lines:** 51-73
- **Problem:** `.catch(() => null)` silently drops errors, client can't tell what failed
- **Fix Priority:** HIGH

### Issue 7: File Upload Manifest Mismatch in Retry Logic
- **File:** `/packages/web/src/lib/upload.ts`
- **Lines:** 99-104 (findUrl function)
- **Problem:** Index matching assumes same manifest order, breaks on retry with different screenshots
- **Fix Priority:** HIGH

### Issue 8: Finalization Rollback Fails Silently
- **File:** `/packages/web/src/app/api/submissions/[id]/finalize/route.ts`
- **Lines:** 147-153
- **Problem:** If refund RPC fails, no error propagation or user notification
- **Fix Priority:** HIGH

### Issue 9: ASC Autofill Doesn't Handle Decryption Failures
- **File:** `/packages/web/src/app/api/asc/autofill/route.ts`
- **Lines:** 39-43
- **Problem:** decryptPrivateKey() throw not caught, endpoint crashes with 500
- **Fix Priority:** HIGH

### Issue 10: No Warning on Navigation with Unsaved Changes
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 286-292
- **Problem:** "Back to Dashboard" button doesn't warn, no unsaved state tracking
- **Fix Priority:** HIGH

---

## MEDIUM SEVERITY ISSUES

### Issue 11: ASC Status Check Doesn't Validate Connection Health
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 112-128
- **Function:** `checkAscStatus()`
- **Problem:** Returns stored connection data without testing if credentials are still valid
- **Fix Priority:** MEDIUM

### Issue 12: Screenshot Deletion Below Minimum Not Prevented
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 608
- **Problem:** No check prevents deleting below 3-screenshot minimum
- **Fix Priority:** MEDIUM

### Issue 13: Draft Saving After Step Validation Doesn't Wait
- **File:** `/packages/web/src/app/submit/page.tsx`
- **Lines:** 196-215
- **Function:** `nextStep()`
- **Problem:** `await handleFinalSubmit(true)` awaited but result not checked, always advances step
- **Fix Priority:** MEDIUM

---

## NEW FILES TO CREATE

### Error ID Constants
- **File:** `/packages/shared/src/errorIds.ts`
- **Content:** Export constants for ASC_ERRORS, DRAFT_ERRORS, UPLOAD_ERRORS, SUBMISSION_ERRORS, NAV_ERRORS
- **Priority:** HIGH (needed for all logging)

### Structured Logging Utility
- **File:** `/packages/web/src/lib/logging.ts`
- **Content:** `logError()`, `logWarn()`, `logDebug()` functions with context tracking
- **Priority:** HIGH (needed for error handling improvements)

---

## MODIFIED SECTIONS IN MAIN FILE

### `/packages/web/src/app/submit/page.tsx` - All Changes

| Line | Function | Change Type | Severity |
|------|----------|-------------|----------|
| 25-52 | State declarations | ADD: error states, draft loading states | HIGH |
| 84-110 | loadDraft() | REPLACE: full rewrite with error handling | CRITICAL |
| 112-128 | checkAscStatus() | UPDATE: add validation call | MEDIUM |
| 130-146 | handleRefresh() | REPLACE: full rewrite with error states | CRITICAL |
| 196-215 | nextStep() | UPDATE: check save result before advancing | MEDIUM |
| 217 | prevStep() | ADD: guard against uploadPhase | CRITICAL |
| 286-292 | Top nav button | UPDATE: add beforeunload listener | HIGH |
| 608 | Screenshot delete button | UPDATE: add minimum validation | MEDIUM |
| 688-693 | Back button | UPDATE: disable during uploadPhase | CRITICAL |
| JSX (top) | Error displays | ADD: draftError, ascError, loadingDraft banners | CRITICAL |

---

## API ENDPOINT CHANGES

### `/packages/web/src/app/api/asc/autofill/route.ts`

| Line | Change | Type |
|------|--------|------|
| 39-43 | Add try-catch around decryption | ADD |
| 51-73 | Change .catch(() => null) to structured tracking | REPLACE |
| Response | Add warnings array to response | UPDATE |

### `/packages/web/src/app/api/asc/connect/route.ts`

| Line | Change | Type |
|------|--------|------|
| 26-29 | Add more specific error messages | UPDATE |

### `/packages/web/src/app/api/submissions/[id]/finalize/route.ts`

| Line | Change | Type |
|------|--------|------|
| 147-153 | Add proper rollback error handling | UPDATE |
| 168-177 | Add try-catch around worker trigger with logging | UPDATE |
| 184-200 | Add rollback exception handling | UPDATE |

### `/packages/web/src/app/api/submissions/[id]/upload-urls/route.ts`

| Line | Change | Type |
|------|--------|------|
| 43-90 | Improve error messages, add better validation | UPDATE |

### `/packages/web/src/lib/upload.ts`

| Line | Change | Type |
|------|--------|------|
| 56-78 | getSignedUploadUrls() - validate response.urls | UPDATE |
| 99-104 | findUrl() - add logging on mismatch | UPDATE |

---

## TESTING CHECKPOINTS

After implementing fixes, verify:

1. **ASC Autofill Failures:**
   - Network timeout (10+ seconds) shows error banner
   - 401 Unauthorized shows "reconnect" message
   - 500 error is logged and shown to user

2. **Draft Loading:**
   - Load `/submit?draft=nonexistent` → shows "Draft not found"
   - Load `/submit?draft=valid-id` → loads correctly
   - Load while offline → shows "Failed to load"

3. **Backward Navigation During Upload:**
   - Back button disabled while uploadPhase !== null
   - Click Back during error state → allowed only if error dismissed

4. **Unsaved Changes:**
   - Edit form → shows beforeunload warning if navigating away
   - Click "Save Draft" → warning disappears, can navigate freely

5. **Screenshot Minimum:**
   - Have 3 screenshots → delete button appears but message says "minimum required"
   - Try to delete 3rd screenshot → prevented with alert

---

End of line references.
