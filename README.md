# Preflight

Open-source App Store review readiness checks for iOS apps.

Preflight is a CLI-first tool. It runs locally on your machine and uses the
maintained rule set from this repository.

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
preflight scan ./MyApp
preflight scan ./MyApp.xcarchive
preflight scan ./MyApp.ipa
preflight update
```

## What It Checks

- iOS project metadata, URLs, keywords, and category signals
- Info.plist permissions, ATS settings, and required keys
- PrivacyInfo.xcprivacy structure and required-reason API declarations
- Screenshot file types, counts, and accepted Apple dimensions
- IPA binary signals, frameworks, entitlements, architecture, and size
- Local rejection-risk findings with fix suggestions

## Rules

The Preflight rule set is maintained in this repo and shipped through npm
package updates. CLI users are not expected to maintain the rules themselves.

Rule updates are based on official Apple sources first, then cross-verified
community rejection patterns where useful.

## Development

```bash
npm install
npm run build:shared
npm run build:cli
node packages/cli/dist/index.js scan ./MyApp
```

For website development:

```bash
npm run dev
```

## License

Preflight is licensed under AGPL-3.0-only. See [LICENSE](LICENSE).
