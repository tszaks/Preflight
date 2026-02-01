# Tech Debt Audit: Preflight
**Date:** January 31, 2026
**Scope:** Full codebase
**Branch:** `main`
**Stack:** Next.js 16 + TypeScript 5 + Supabase + React 19

---

## Executive Summary

| Category | Findings | P0 | P1 | P2 | P3 |
|----------|----------|----|----|----|----|
| Code Markers | 3 | 0 | 1 | 1 | 1 |
| Dead Code | 5 | 1 | 1 | 2 | 1 |
| Complexity | 12 | 2 | 3 | 4 | 3 |
| Duplication | 12 | 2 | 3 | 4 | 3 |
| Dependencies | 3 | 0 | 1 | 1 | 1 |
| Test Gaps | 5 | 2 | 2 | 1 | 0 |
| **TOTAL** | **40** | **7** | **11** | **13** | **9** |

**This is the first audit — establishes the baseline.**
**Estimated P0+P1 Fix Effort:** ~3-4 days focused work

---

## P0 Fixes Completed (This Session)

### 1. ✅ Deleted dead `/research/` directory
- **Commit:** `ba1fd2e` — 170 lines removed
- claim-extractor.ts and web-checker.ts were never imported

### 2. ✅ Consolidated credit constants
- **Commit:** `208fffc` — Created `src/lib/constants.ts`
- CREDIT_COSTS and CREDIT_AMOUNTS now shared, not duplicated

### 3. ✅ Extracted shared encryption utility
- **Commit:** `34e6385` — Created `src/lib/asc-encryption.ts`
- getEncryptionKey() was duplicated in asc/connect and asc/autofill

### 4. ✅ Removed dead CSS + unused utility
- **Commit:** `e0a4672` — 102 lines removed
- Unused keyframes: pulse-slow, orbit, glint, float, scan-horizontal
- Unused formatPath() from project-scanner.ts

### 5. ✅ npm prune (already clean)

---

## P0 Remaining (Still To Do)

### Zero test coverage on Stripe webhook
**Location:** `src/app/api/webhooks/stripe/route.ts`
**Risk:** Revenue-impacting bugs. Uses `apiVersion as any`.
**Fix:** Add Vitest + test webhook signature validation, credit math, idempotency

### Zero test coverage on auth flows
**Location:** `src/app/auth/actions.ts`, `src/middleware.ts`
**Risk:** Login/signup/reset untested. `as string` casts without validation.
**Fix:** Add tests for auth actions + middleware session refresh

### Replace all alert() calls with toast system
**Location:** `src/app/submit/page.tsx` (11), credits (1), ArchiveButton (1)
**Risk:** Blocks UI, terrible UX
**Fix:** Add sonner/react-hot-toast, replace 13 alert() calls

### Create API error response utilities
**Location:** 25+ instances across all API routes
**Risk:** Inconsistent error messages
**Fix:** Create `src/lib/api-errors.ts` with standardized responses

### Extract auth middleware helper
**Location:** 13 instances across API routes + server actions
**Fix:** Create `requireAuth()` per context type

---

## P1 — Fix This Sprint

1. **Split submit/page.tsx** (927 lines, 40+ useState hooks) → 5 child components
2. **Split ReportClient.tsx** (533 lines, 7 useEffects) → 3-4 components + hook
3. **Extract engine phases** from monolithic index.ts (516 lines)
4. **Fix 12+ `as any` type safety bypasses**
5. **Submission ownership query** (3 exact copies) → shared utility
6. **Duplicate encryption key** function (now fixed ✅)

---

## P2 — Fix When Nearby

- Move rules.ts (577 lines) and patterns-enhanced.ts (574 lines) data to DB
- Extract AgeRating.tsx boolean cascades into named predicates
- Extract worker/route.ts data transformation
- Add Error Boundaries around submit + report components
- Consolidate SQL migrations with duplicate ALTER TABLE
- Fix babel-plugin-react-compiler pinned version → use ^1.0.0
- Create fetchJson() wrapper for component API calls
- Create useSupabaseChannel() hook for realtime subscriptions
- Move review-timeline.ts (831 lines) to database

---

## P3 — Track

- @types/node version gap (20 vs 25)
- React patch behind (19.2.3 vs 19.2.4)
- ASC Review History stub (blocked by external API)

---

## Debt Hotspots

| File | Categories Hit | Total Findings |
|------|---------------|----------------|
| submit/page.tsx | complexity, markers, duplication | 14 |
| ReportClient.tsx | complexity, dead code, type safety | 6 |
| engine/index.ts | complexity, duplication | 5 |
| finalize/route.ts | complexity, duplication, tests | 5 |
| worker/route.ts | complexity, type safety, tests | 4 |

---

## Dependency Health: ✅ HEALTHY

- 10 production deps, 8 dev deps — all actively used
- Zero duplicate functionality
- Zero unused dependencies
- Clean Svelte→Next.js migration (no leftover packages)

---

## Test Coverage: 🔴 ZERO

- No test framework installed (no jest, vitest, playwright)
- No test files in entire codebase
- 0 tests / 105 source files = 0% coverage
- Priority: Stripe webhook → Auth → Engine → E2E

---

## Files Modified This Session

| File | Action |
|------|--------|
| `src/lib/engine/research/claim-extractor.ts` | DELETED |
| `src/lib/engine/research/web-checker.ts` | DELETED |
| `src/lib/constants.ts` | CREATED |
| `src/lib/asc-encryption.ts` | CREATED |
| `src/app/api/submissions/[id]/finalize/route.ts` | MODIFIED (import constants) |
| `src/app/pricing/actions.ts` | MODIFIED (import constants) |
| `src/app/api/asc/connect/route.ts` | MODIFIED (import encryption) |
| `src/app/api/asc/autofill/route.ts` | MODIFIED (import encryption) |
| `src/app/globals.css` | MODIFIED (removed ~60 lines dead CSS) |
| `src/lib/project-scanner.ts` | MODIFIED (removed formatPath) |

---

## Next Steps

1. Install Vitest and write first tests (Stripe webhook + auth)
2. Add toast notification system, replace alert() calls
3. Create api-errors.ts + requireAuth() utilities
4. Begin splitting submit/page.tsx into child components
