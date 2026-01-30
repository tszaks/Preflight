# Preflight Testing Philosophy

## Core Principle

**Preflight is the standard. The app being tested is the subject.**

We never bend Preflight to make an app's report look better. We validate Preflight's accuracy by cross-referencing its output against reality. If a warning is wrong, that's a Preflight bug. If a warning is right, that's the app's problem to fix.

## The Vero Advantage

We have full visibility into both codebases:
- **Preflight** (`/Users/tyler/Projects/Preflight/`) — the reviewer
- **Vero** (`/Users/tyler/Projects/AskVero/ios/`) — the test subject

This gives us ground truth. For every warning Preflight generates, we can check Vero's actual code and determine:

| Outcome | Meaning | Action |
|---------|---------|--------|
| Warning is accurate, app has the issue | Preflight is working correctly | Fix the app |
| Warning is a false positive | Preflight has a bug | Fix Preflight |
| Warning is right but poorly explained | Preflight UX issue | Improve the message |
| Real issue exists but Preflight missed it | Preflight has a gap | Add the check |

## What "Gold Standard" Means

1. **Zero false positives** — Every warning maps to a real Apple rejection risk
2. **Zero false negatives** — Every real rejection risk is caught
3. **Accurate severity** — Criticals are actually critical, warnings are real warnings
4. **Actionable output** — Every finding tells you exactly what to fix
5. **No noise** — Tips are relevant, not generic boilerplate

## How to Validate

For each warning/tip in a report:
1. Look at the actual app code — is the issue real?
2. Look at Apple's actual guideline — does Preflight interpret it correctly?
3. Look at Preflight's detection logic — is it catching the right signal?
4. Cross-reference both sides before changing either side

## Anti-Patterns (Don't Do This)

- Don't filter out warnings because the test app triggers too many
- Don't lower confidence thresholds because a specific app's tips feel noisy
- Don't skip checks because the test app doesn't have that feature
- Don't assume the app is right and Preflight is wrong (or vice versa)

## The Goal

Preflight should be so accurate that when it says "you'll get rejected for X," you can trust it completely. And when it says "you're good," you can submit with confidence. Vero is the proving ground — not the customer we're optimizing for.
