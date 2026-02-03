# Preflight Project Overview

## Project Purpose
Preflight is an iOS app review analysis tool that:
- Accepts iOS app submissions (IPA files + metadata)
- Analyzes apps against Apple App Store guidelines
- Generates detailed reports with rejection risks
- Uses a credit system (100 credits per review)
- Allows users to report Apple rejections to improve pattern confidence

## Tech Stack
- **Frontend:** Next.js (TypeScript) at `packages/web`
- **CLI:** Node.js CLI tool at `packages/cli`
- **Shared:** TypeScript types/utils at `packages/shared`
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Payments:** Stripe (via webhook)

## Key Database Tables
- `submissions` - App submissions with metadata, status (draft/paid/queued/analyzing/complete/failed)
- `reports` - Analysis results with scores and summary
- `report_items` - Individual findings (critical/warning/info/pass) with pattern_id links
- `rejection_patterns` - Pattern library with base_confidence and calibrated_confidence
- `profiles` - User accounts with credits balance
- `pattern_feedback` - User feedback on pattern helpfulness
- `analysis_jobs` - Background job tracking

## Code Style & Conventions
- **Naming:** camelCase for variables/functions, PascalCase for types/classes
- **Types:** Full TypeScript, generated DB types from Supabase
- **Error Handling:** Try-catch with graceful error messages
- **UI:** Interactive prompts via `packages/cli/src/ui/interactive.ts`
- **API:** RESTful endpoints in `packages/web/src/app/api`
- **Async:** Spinners for long operations

## Current CLI Structure
- Commands in `packages/cli/src/commands/`
- History command shows submission list, can view reports
- Interactive mode uses `ui.select()`, `ui.confirm()`, etc.
- API calls via `apiRequest()` function
- Reports rendered with `renderReport()` function

## Critical Task: NPM Publishing
After ANY CLI code changes:
1. Update version in: package.json, src/index.ts (.version()), ui/theme.ts (APP_VERSION)
2. Commit and push to main
3. Run `npm publish --access public` from `packages/cli` directory (requires biometric auth from terminal)

## Build & Test Commands
- `npm run build` - Full monorepo build
- `npm run build:shared`, `:web`, `:cli` - Individual builds
- `npm run dev` - Run web dev server
- `npm run dev submit` - Test CLI submit interactively
- `npm run lint` - Lint web code
