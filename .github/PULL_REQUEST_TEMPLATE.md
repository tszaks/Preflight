## What and why

<!-- What does this change, and why? Link the issue if there is one. -->

## Checklist

- [ ] `npm run typecheck:all`, `npm test` and `npm run selftest` pass
- [ ] New or changed rules have a provenance (`apple`, `regulatory`, `third-party` or `heuristic`) and a test
- [ ] A false-positive fix has a test that fails without the fix
- [ ] The scan still makes no network calls beyond URL reachability and the optional App Store Connect lookup
- [ ] User-visible change: added a line under `[Unreleased]` in CHANGELOG.md
- [ ] Docs updated if a command, flag, exit code or the JSON output changed
- [ ] No App Store Connect keys or private project details in the diff
