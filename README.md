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

`scan` is interactive. It reads what it can from the project, then asks you
to confirm the few things it cannot detect — whether the app requires
sign-in, sells subscriptions, offers in-app purchases, and the follow-ups
those answers imply. Answer for the build you are about to submit, not for
the roadmap: App Review checks these against real behavior.

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

Rule updates are based on official Apple sources first — the App Review
Guidelines, Apple Developer news, and App Store Connect Help — then
cross-verified community rejection patterns where useful. Third-party
summaries are not treated as sources. A claim that cannot be traced to an
Apple page does not go in, because a confidently wrong rule in a compliance
scanner is worse than a missing one.

**Rules current as of September 11, 2026.** Coverage highlights:

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
npm run selftest        # bundles the engine and runs it end to end
```

The rule set lives in `packages/shared/src/engine/knowledge-base`:
`guidelines.ts` for what Apple requires, `rejection-patterns.ts` for the
trigger-and-fix pairs the scanner reports, `requirements.ts` for hard
numbers, and `categories/` for category-specific rules.

A `packages/web` workspace exists and backs the project site
(`npm run dev`), but the tool itself is CLI-only; the website is not
required to build or run a scan.

## License

Preflight is licensed under AGPL-3.0-only. See [LICENSE](LICENSE).
