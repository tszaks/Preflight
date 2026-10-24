# Changelog

All notable changes to Preflight are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are the GitHub Releases of this repository; the CLI version is `packages/cli/package.json`. The rule set is also updated continuously between releases (commits starting with `knowledge:`).

## [Unreleased]

## [1.1.2] - 2026-09-12

### Fixed
- False subscription warnings caused by partial keyword matches in App Store metadata. Terms such as "projection" no longer match "pro", and ordinary planning language no longer implies a subscription plan.

## [1.1.1] - 2026-09-12

### Fixed
- The standalone GitHub release is self-contained: it embeds version metadata and runs without a source checkout or npm installation.

## [1.1.0] - 2026-09-12

### Added
- Non-interactive JSON output (`--json`), reliable exit codes (`0` clean, `1` findings, `2` could not scan) and `--fail-on`.
- An MCP server (`preflight mcp`) with a `preflight_scan` tool.
- Read-only App Store Connect cross-checks.
- Typed provenance for every rule, with CI validation of the rule set.
- Finding status (`checked`, `not_checked`, `inconclusive`) so coverage gaps are never reported as passes.

### Fixed
- Plist parsing, project-file selection, IPA handling, and six classes of false positives.

### Changed
- Install is documented from GitHub Releases. The npm package is published separately.
- CI: lint is no longer allowed to fail, the web build no longer needs placeholder secrets, and `npm test` gates.
