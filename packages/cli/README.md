# Preflight CLI

Preflight checks iOS projects for App Store review risks from your terminal.

It runs locally, uses the maintained rule set published from the open-source
Preflight repo, and sends nothing about your project anywhere. The only network
calls are reachability checks on URLs your app already publishes, and the
optional App Store Connect lookup you have to configure yourself.

## Install

```bash
mkdir -p "$HOME/.local/bin"
curl -L https://github.com/tszaks/Preflight/releases/latest/download/preflight \
  -o "$HOME/.local/bin/preflight"
chmod +x "$HOME/.local/bin/preflight"
```

Make sure `$HOME/.local/bin` is on your `PATH`, then verify the install:

```bash
preflight --version
```

## Commands

| Command | Description |
|---------|-------------|
| `preflight scan [path]` | Scan an iOS project, archive, or IPA locally |
| `preflight mcp` | Run as an MCP server, for coding agents |
| `preflight update` | Check for and install the latest CLI package |
| `preflight --help` | Show command help |

## Examples

```bash
preflight scan ./MyApp
preflight scan ./MyApp.xcarchive
preflight scan ./MyApp.ipa
```

Scanning a built `.ipa` checks strictly more than scanning the project
directory, because the archive carries the Info.plist and privacy manifest
Apple actually receives.

## Scripts, CI, and agents

```bash
preflight scan ./MyApp --json             # machine-readable result on stdout
preflight scan ./MyApp --fail-on warning  # exit non-zero at this severity
```

Preflight never prompts when stdout is not a terminal. Anything it would have
asked for can be passed as a flag: `--app-name`, `--description`,
`--privacy-url`, `--terms-url`, `--support-url`, `--marketing-url`,
`--category`, `--screenshots <dir>`.

| Exit code | Meaning |
| --- | --- |
| 0 | Nothing at or above `--fail-on` (default `critical`) |
| 1 | Findings at or above that severity |
| 2 | The scan could not run |

`2` is deliberately separate from `0`. "We found nothing wrong" and "we never
looked" are the same exit status in most tools, and conflating them is how a
broken scan in CI reads as a passing one.

Every finding carries a `status`:

- `checked` — the rule ran. Act on it.
- `not_checked` — the input was never supplied. A coverage gap, not a
  violation. Only `checked` findings affect the exit code.
- `inconclusive` — the input existed but could not be read.

A clean result only covers what was checked.

## MCP server

```bash
preflight mcp
```

Exposes one tool, `preflight_scan`, so an agent can audit an app while building
it. It is a thin wrapper over the same code path as the CLI.

## App Store Connect (optional, read-only)

Most of what gets a first submission rejected is not in the project. Review
notes, the privacy label, and the IDFA answer live in App Store Connect.

```bash
export ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_PRIVATE_KEY_PATH=./AuthKey_XXX.p8
preflight scan ./MyApp.ipa
```

Preflight never writes to your submission. Without credentials those checks
report `not_checked` rather than silently passing.

## Rules

Every rule carries a provenance, and reports say which kind it is:

| Kind | Requirement |
| --- | --- |
| Apple | One Apple URL and a verified date |
| Regulatory | One official URL and a verified date |
| Third-party | Three independent corroborating sources |
| Heuristic | Preflight's own inference, labelled as such |

CI fails if a rule has no provenance, if an Apple rule has no source, or if a
third-party claim has fewer than three sources. A separate gate checks every
cited guideline number against the sections Apple's page actually contains.

Preflight reduces the odds of a surprise rejection. It does not guarantee
approval, and it cannot see everything a human reviewer will.

## License

AGPL-3.0-only.
