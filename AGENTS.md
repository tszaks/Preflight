# Preflight

An open-source App Store review readiness scanner for iOS apps. TypeScript, npm workspaces (`packages/shared`, `packages/cli`, `packages/web`), Vitest for tests. License: AGPL-3.0-only. The CLI is published as the npm package `preflightlaunch` and as a standalone download on GitHub Releases. This file is for AI agents that work **on** Preflight's code. If you only want to scan an app, use `preflight scan --json` or `preflight mcp` (see the README).

## Build, test
- Install: `npm install` (or `npm ci`).
- Build the pieces the CLI needs: `npm run build:shared`, then `npm run build:cli`. Run it: `node packages/cli/dist/index.js scan ./test-fixtures`.
- Typecheck: `npm run typecheck:all`. Tests: `npm test`. End to end: `npm run selftest`. Lint (web only): `npm run lint`.
- Run all of these before you say something works. CI also builds `packages/web`.
- Scans never need credentials. Do not set `ASC_*` variables or pass App Store Connect keys unless asked.

## Code map
- `packages/shared/src/engine/`: the scan engine.
  - `knowledge-base/`: the rule set. `guidelines.ts` (what Apple requires), `rejection-patterns.ts` (trigger and fix pairs), `requirements.ts` (hard numbers), `categories/`, `provenance.ts` (where each rule comes from), `apple-sections.ts` (snapshot of real Apple guideline numbers).
  - `hard-rules/`, `auto-detect/`, `ipa-scanner/`, `behavioral-heuristics/`, `historical-patterns/`, `app-store-connect/`: the checks.
- `packages/cli/src/`: the command line. `commands/scan.ts`, `commands/mcp.ts`, `commands/update.ts`, plus `lib/` and `ui/`.
- `packages/web/`: the static project site. Not needed to build or run a scan.
- `scripts/selftest.mjs`: bundles the engine and runs it end to end. `test-fixtures/`: sample plist, privacy manifest and screenshot.

## Conventions
- Match the surrounding code: naming, comment density, idiom. Comments say **why**, not what.
- Every rule needs a provenance (`apple`, `regulatory`, `third-party`, `heuristic`). Never present a Preflight inference as Apple's rule. Cite only guideline numbers that exist in `apple-sections.ts`.
- Findings carry a `status`: `checked`, `not_checked`, `inconclusive`. Never report an unrun check as a pass. Exit codes: `0` clean, `1` findings at or above `--fail-on`, `2` could not scan. Keep that contract.
- The scan is local. Do not add network calls other than URL reachability checks and the optional read-only App Store Connect lookup. No analytics.
- The MCP tool and `scan --json` must return the same result for the same input.
- A rule change needs a test. A false-positive fix needs a test that fails without it.
- Do not change the license or add dependencies without asking.
- Update `README.md` and `CHANGELOG.md` when a command, flag, exit code or the JSON output changes. `packages/cli/README.md` is the npm-facing copy and must stay consistent with the root README.
