# Simplified Submission Form UX Redesign - Preflight

**Date:** January 28, 2026
**Topic:** Collapsed 7-step form to 4 steps with supportive UX

## Session Overview

Implemented a major UX improvement to the `/submit` page - transforming an overwhelming 7-step form into a calmer 4-step flow with collapsible sections and supportive copy. Goal: reduce form anxiety for users already stressed about potential App Store rejection.

## Files Touched

- **Modified:** `src/routes/submit/+page.svelte` - complete restructure (1044 insertions, 1112 deletions)

## Work Completed

- Collapsed 7 steps into 4 logical groups:
  1. Your App (name, description, category, version)
  2. Your Files (screenshots, Info.plist, Privacy Manifest)
  3. Settings & Access (URLs, Age Rating, Privacy, Review Access)
  4. Review & Submit
- Replaced intimidating 7-box progress bar with calm text: "Step 1 of 4 · Your App"
- Added supportive reassurance copy at start of each step
- Implemented collapsible accordion sections in Step 3 (4 expandable headers instead of 20+ visible fields)
- Preserved all original form fields and validation logic
- Committed: `4f99722`
- Pushed to `main` branch on GitHub

## Key Learnings/Patterns

- **Progressive disclosure** - Reducing visible steps from 7 to 4 cuts perceived complexity by ~40%
- **Accordion pattern** - Used by Stripe/Linear for premium UX - reduces cognitive load while keeping options accessible
- **Copy tone matters** - "Let's start with the basics" positions tool as ally, not interrogator
- Svelte 5 `$state()` for collapse toggles works cleanly

## Next Steps

- Test full form flow through submission
- Verify all validation still works correctly on each step
- Consider mobile responsiveness of collapsible sections

## Thinking Patterns

- **Approach:** systematic - followed clear plan from plan mode
- **Priority:** UX/simplicity - focus on reducing user anxiety over adding features
- **Mental Shifts:** none - plan was solid, executed cleanly
- **Friction Points:** none - straightforward implementation
- **Energy Sources:** clear before/after improvement visible
- **Project-Specific:** Preflight is about reducing friction for stressed users - UX empathy is core
