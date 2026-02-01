# @preflight/cli

**Preflight** - App Store Review Scanner from your terminal. Catch rejection reasons before Apple does.

## Install

```bash
# npm
npm install -g @preflight/cli

# Homebrew
brew tap tszaks/preflight
brew install preflight
```

## Quick Start

```bash
# Log in to your Preflight account
preflight login

# Scan your iOS project (dry run - no credits used)
preflight scan ./MyApp

# Submit for full AI-powered analysis
preflight submit ./MyApp --app-name "My App"

# View your report
preflight report <submission-id>
```

## Commands

| Command | Description |
|---------|-------------|
| `preflight login` | Authenticate via browser |
| `preflight logout` | Clear stored credentials |
| `preflight whoami` | Show current user and credits |
| `preflight scan [path]` | Dry-run scan of iOS project files |
| `preflight submit [path]` | Submit project for AI analysis |
| `preflight status [id]` | Check submission status (`--watch` for live updates) |
| `preflight report [id]` | View analysis results (`--json`, `--open`) |
| `preflight history` | List past submissions |
| `preflight credits` | Show credit balance |

## What It Scans

Preflight analyzes your iOS project for common App Store rejection reasons:

- **Info.plist** - Missing keys, incorrect values, permission descriptions
- **Privacy Manifest** (`PrivacyInfo.xcprivacy`) - Required API declarations
- **Screenshots** - Resolution and format compliance
- **Entitlements** - Capability misconfigurations

## Requirements

- Node.js 18+
- A [Preflight](https://preflightlaunch.com) account

## Links

- [Website](https://preflightlaunch.com)
- [GitHub](https://github.com/tszaks/Preflight)
