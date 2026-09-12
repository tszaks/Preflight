# Preflight

Open-source App Store review readiness checks for iOS apps.

Preflight is a CLI-first tool. It runs locally on your machine and uses the
maintained rule set from this repository. Nothing about your project leaves
your machine except the URL reachability checks, which fetch only the
privacy policy, support, and marketing URLs your project already publishes.

## Install

```bash
npm install -g preflightlaunch
```

You can also run it without a global install:

```bash
npx preflightlaunch scan ./MyApp
```

## Usage

```bash
preflight scan ./MyApp            # project directory
preflight scan ./MyApp.xcarchive  # archive: Info.plist and privacy manifest
preflight scan ./MyApp.ipa        # built binary: frameworks and entitlements
preflight update
```

`scan` is interactive when a terminal is attached. It reads what it can from
the project, then asks you to confirm the few things it cannot detect:
whether the app requires sign-in, sells subscriptions, offers in-app
purchases, and the follow-ups those answers imply. Answer for the build you
are about to submit, not for the roadmap, because App Review checks these
against real behavior.

### For scripts, CI, and agents

```bash
preflight scan ./MyApp --json            # machine-readable result on stdout
preflight scan ./MyApp --json | jq .
preflight scan ./MyApp --fail-on warning # exit non-zero at this severity
```

When stdout is not a terminal, Preflight never prompts. Pass any answer it
would have asked for as a flag: `--app-name`, `--description`,
`--privacy-url`, `--terms-url`, `--support-url`, `--marketing-url`,
`--category`, `--screenshots <dir>`.

Exit codes, so a release script can gate on a scan:

| Code | Meaning |
| --- | --- |
| 0 | Nothing at or above `--fail-on` (default `critical`) |
| 1 | Findings at or above that severity |
| 2 | The scan could not run |

`2` is deliberately distinct. "We found nothing wrong" and "we never looked"
are the same exit status in most tools, and conflating them is how a broken
scan in CI reads as a passing one.

Every finding carries a `status`:

- `checked` — the rule ran. Act on it.
- `not_checked` — the input was never supplied. A coverage gap, not a
  violation. Only `checked` findings affect the exit code.
- `inconclusive` — the input existed but could not be read.

A clean result only covers what was checked.

### As an MCP server

```bash
preflight mcp
```

Exposes one tool, `preflight_scan`, so a coding agent can audit an app while
building it. It is a thin wrapper over the same code path as the CLI; if the
two ever disagree for the same subject, that is a bug.

### App Store Connect (optional, read-only)

Most of what gets a first submission rejected is not in the project. Review
notes, the privacy label, and the IDFA answer live in App Store Connect, and
a local scan cannot see any of them.

```bash
export ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_PRIVATE_KEY_PATH=./AuthKey_XXX.p8
preflight scan ./MyApp.ipa
```

Read-only: Preflight never writes to your submission. Without credentials
those checks report `not_checked` rather than silently passing. It adds
cross-checks that neither side reveals alone, such as review notes claiming
no sign-in for a binary that links Sign in with Apple.

One gap worth knowing: Apple exposes no API for the App Privacy answers, so
the nutrition label cannot be verified automatically. Preflight instead
prints exactly what your binary's privacy manifest declares, with a link to
the label, so the comparison takes a minute rather than going unnoticed.

Pointing at a directory gives the most complete scan, because that is the
only form where the project file, Info.plist, privacy manifest, screenshots,
and a built `.ipa` can all be found together. An `.xcarchive` carries the
Info.plist and privacy manifest but no `.ipa`, so binary analysis is skipped.

## What It Checks

- iOS project metadata, URLs, keywords, and category signals
- Info.plist permissions, ATS settings, and required keys
- PrivacyInfo.xcprivacy structure and required-reason API declarations
- Screenshot file types, counts, and accepted Apple dimensions
- IPA binary signals, frameworks, entitlements, architecture, and size
- Account requirements: deletion, sign-in gating, and restore purchases
- Subscription and in-app purchase configuration and paywall disclosure
- Age rating and regional age-assurance obligations
- Alternative payments and external purchase links, by storefront
- Local rejection-risk findings with fix suggestions

## Rules

The Preflight rule set is maintained in this repo and shipped through npm
package updates. CLI users are not expected to maintain the rules
themselves.

Every rule carries a provenance, and the kind of provenance decides what is
required of it:

| Kind | Requirement | Shown as |
| --- | --- | --- |
| `apple` | One Apple URL and a verified date | Apple documentation |
| `regulatory` | One official URL and a verified date | Regulatory requirement |
| `third-party` | Three independent corroborating sources | Third-party |
| `heuristic` | A rationale, no source implied | Preflight heuristic, not an Apple rule |

CI fails if any rule lacks a provenance, if an Apple rule lacks a source, or
if a third-party claim has fewer than three sources. A separate gate checks
every cited guideline number against a snapshot of the sections Apple's page
actually contains, so a rule can never cite one that does not exist.

This matters because a confidently wrong rule in a compliance scanner is
worse than a missing one. Preflight's own inferences used to render in the
same voice as Apple's text; they are now labelled in the output so you can
tell a quoted requirement from a guess.

**Rules verified against Apple's live pages on September 12, 2026.**
Coverage highlights:

- EU unified business terms and Attachment 14, effective October 1, 2026,
  including the Core Technology Commission replacing the Core Technology Fee
- The social media capability declaration, required for submission since
  September 2026
- Regional age assurance for Texas, Utah, Louisiana, Australia, Brazil, and
  Singapore
- Alternative payments for Japan and Brazil
- The June 8, 2026 guideline revisions: 4.3(b) saturated categories, 4.5.3
  Live Activities, and 1.2 covering random and anonymous chat
- Vietnam, Korea, and Australia regional age ratings
- The Xcode 26 / iOS 26 SDK floor in effect since April 28, 2026

Preflight reduces the odds of a surprise rejection. It does not guarantee
approval, and it cannot see everything a human reviewer will.

## Development

```bash
npm install
npm run build:shared
npm run build:cli
node packages/cli/dist/index.js scan ./MyApp
```

Checks:

```bash
npm run typecheck:all   # builds shared, then typechecks the CLI
npm test                # unit and regression tests
npm run selftest        # bundles the engine and runs it end to end
```

The rule set lives in `packages/shared/src/engine/knowledge-base`:
`guidelines.ts` for what Apple requires, `rejection-patterns.ts` for the
trigger-and-fix pairs the scanner reports, `requirements.ts` for hard
numbers, `categories/` for category-specific rules, `provenance.ts` for
where each rule comes from, and `apple-sections.ts` for the snapshot of real
Apple guideline numbers.

A `packages/web` workspace exists and backs the project site
(`npm run dev`), but the tool itself is CLI-only; the website is not
required to build or run a scan.

## License

Preflight is licensed under AGPL-3.0-only. See [LICENSE](LICENSE).
