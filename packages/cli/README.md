# Preflight CLI

Preflight checks iOS projects for App Store review risks from your terminal.

It runs locally and uses the maintained rule set published from the open-source
Preflight repo.

## Install

```bash
npm install -g preflightlaunch
```

Or run once with:

```bash
npx preflightlaunch scan ./MyApp
```

## Commands

| Command | Description |
|---------|-------------|
| `preflight scan [path]` | Scan an iOS project, archive, IPA, or folder locally |
| `preflight update` | Check for and install the latest CLI package |
| `preflight --help` | Show command help |

## Examples

```bash
preflight scan ./MyApp
preflight scan ./MyApp.xcarchive
preflight scan ./MyApp.ipa
```

## Rules

Preflight's rules are maintained in the source repository and shipped through
npm package updates. Users install the maintained package; they do not need to
maintain the rule set themselves.

## License

AGPL-3.0-only.
