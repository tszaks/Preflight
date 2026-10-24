# Contributing to Preflight

Thanks for helping. Preflight is a local scanner, so the bar for changes is: is it **correct, sourced, and honest about what it did not check**? A confidently wrong rule in a compliance scanner is worse than a missing one.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- For bugs and false positives, open an issue with the template. The finding text and the relevant part of your project (redacted) help most.
- For new rules, open an issue first with the source (an Apple page, a regulation, or evidence from real rejections).
- Small fixes (typos, clear bugs) can go straight to a pull request.
- Security problems go through [SECURITY.md](SECURITY.md), not a public issue.

## Setup

You need Node.js 20 and npm (CI uses Node 20).

```sh
git clone https://github.com/tszaks/Preflight.git
cd Preflight
npm install
npm run build:shared
npm run build:cli
node packages/cli/dist/index.js scan ./test-fixtures
```

## Run the tests

```sh
npm run typecheck:all   # builds shared, then typechecks the CLI
npm test                # unit and regression tests
npm run selftest        # bundles the engine and runs it end to end
npm run lint            # lints the web package
```

Run these before you open a pull request. CI runs typecheck, lint, tests, and the web and CLI builds.

## Rules and provenance

The rule set lives in `packages/shared/src/engine/knowledge-base`. Every rule needs a provenance:

| Kind | Requirement |
| --- | --- |
| `apple` | One Apple URL and a verified date |
| `regulatory` | One official URL and a verified date |
| `third-party` | Three independent corroborating sources |
| `heuristic` | A rationale, no source implied |

CI fails if a rule has no provenance, an Apple rule has no source, a third-party claim has fewer than three sources, or a cited guideline number does not exist in the snapshot in `apple-sections.ts`. Do not label your own inference as Apple's rule. Mark it `heuristic`.

A change to a rule needs a regression test, and a false-positive fix needs a test that fails without the fix.

## Code style

- **Match the surrounding code.** Same naming, same comment density, same idiom as the file you are editing.
- TypeScript, ES modules. Comments explain *why*, not *what*.
- No new dependencies without discussion.
- Do not make the scan send data off the machine. The only network calls are URL reachability checks and the optional read-only App Store Connect lookup.

## Pull request checklist

- [ ] `npm run typecheck:all`, `npm test` and `npm run selftest` pass locally.
- [ ] New or changed rules have a provenance and a test.
- [ ] The change is small and focused. Unrelated cleanups go in their own pull request.
- [ ] The code matches the surrounding style and adds no dependency.
- [ ] Docs updated if a command, flag, exit code or the JSON output changed.
- [ ] A line added under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for anything a user would notice.
- [ ] No App Store Connect keys, tokens or private project details in the diff.

## Using AI agents to contribute

Fine, as long as you read and understand what you submit and the checklist above is true. [AGENTS.md](AGENTS.md) tells coding agents how this repository works.

## License

Preflight is licensed under [AGPL-3.0-only](LICENSE). By contributing you agree that your contribution is licensed under the same terms.
