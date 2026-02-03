# QC Review + npm Publish v0.2.0 - Preflight CLI

**Date:** February 1, 2026
**Topic:** Completed QC review of Premium UX Overhaul, applied fixes, published v0.2.0 to npm

## Session Overview

Continued from previous session where the Premium UX Overhaul was implemented (interactive flows, onboarding, rich output). This session completed the 3-agent QC review, applied all fixes, bumped version to 0.2.0, published to npm, and pushed to GitHub.

## Files Touched

- `packages/cli/src/commands/scan.ts` - edited (optional path param, removed duplicate interactiveProjectSelect)
- `packages/cli/src/commands/submit.ts` - edited (optional path param, fix double cancel msg, getFileSize to statSync, removed duplicate interactiveProjectSelect, better error msg for missing report_id)
- `packages/cli/src/commands/onboarding.ts` - edited (homedir() instead of process.env.HOME)
- `packages/cli/src/index.ts` - edited (removed `as unknown as string` casts, version bump to 0.2.0)
- `packages/cli/src/lib/project-finder.ts` - edited (extracted shared interactiveProjectSelect + promptForManualPath, removed dead statSync import)
- `packages/cli/src/ui/interactive.ts` - edited (replaced 7 passthrough wrappers with `export const log = p.log`, removed dead chalk import)
- `packages/cli/src/ui/report.ts` - edited (extracted `filled` variable for minibar calc)
- `packages/cli/src/ui/theme.ts` - edited (if/else instead of nested ternaries in scoreBar, version bump to 0.2.0)
- `packages/cli/package.json` - edited (version 0.1.0 -> 0.2.0)

## Work Completed

- **QC Review (3 agents):**
  - Code Reviewer: 8 issues found (4 fixed, 4 deferred)
  - Silent Failure Hunter: 17 issues found (2 fixed, rest deferred as defensive hardening)
  - Code Simplifier: 6 files cleaned, -100 lines / +60 lines (DRY, dead code removal)
- **Quick-win fixes applied:**
  - Made `path` params optional (removed unsafe `as unknown as string` casts)
  - Fixed double cancel message (explicit null check before false check)
  - Used `homedir()` instead of `process.env.HOME`
  - Better error message when report_id missing on complete status
- **Simplifier auto-fixes:**
  - Extracted shared `interactiveProjectSelect` to project-finder.ts (was duplicated in scan + submit)
  - Fixed `getFileSize` from `readFileSync().length` to `statSync().size` (avoid loading 500MB IPAs into memory)
  - Removed dead imports and passthrough wrappers
  - Replaced nested ternaries with if/else
- **Published to npm:** `preflightlaunch@0.2.0` live on registry
- **Pushed to GitHub:** 3 commits pushed to main

## Key Commits

1. `5c86169` feat: premium UX overhaul (from previous session)
2. `95cfd38` fix: QC review - DRY shared code, type safety, UX polish
3. `2f4ff0b` chore: bump CLI version to 0.2.0

## Deferred to v0.2.x / v0.3.0

- TTY detection before interactive prompts (medium effort, 4+ files)
- Spinner cleanup before process.exit (ora handles it, low real risk)
- Empty catch blocks - should check err.code for EACCES/ENOENT specifically
- Better network error messages (translate AbortError to user-friendly)
- Directory validation before scanning
- program.parse() error handler for async exceptions
- Global error boundary (process.on uncaughtException)

## Key Learnings

- `statSync().size` vs `readFileSync().length` matters hugely for large files (IPA binaries = 100-500MB)
- npm tokens now expire after 90 days + require 2FA (new npm security policy)
- `npm publish -w packages/cli` only works from monorepo root, not from `~`
- npm 404 errors can actually be auth failures in disguise ("Access token expired")
- Version must be in 3 places: package.json, theme.ts (APP_VERSION), index.ts (.version())

## Next Steps

- Update Homebrew tap formula for v0.2.0
- Consider automating version sync (single source of truth)
- Address deferred QC items in v0.3.0
- Security review still pending (was started but cancelled)

## Thinking Patterns

- **Approach:** systematic - QC review with 3 parallel agents, then triage by severity
- **Priority:** shipping - wanted to get v0.2.0 published, deferred non-blocking items
- **Friction Points:** npm auth expired, workspace flag confusion when not in project dir
- **Energy Sources:** seeing the publish succeed, clean QC report
- **Project-Specific:** Preflight is in "ship fast, polish later" mode - accepts reasonable tech debt
