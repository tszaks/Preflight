# Mobile-Optimize Terminal Install Banner

**Date:** 2026-02-02
**Project:** Preflight (packages/web)

---

## Summary

Simplified the floating terminal install banner on mobile viewports (< 768px) so it shows a clean, tappable pill instead of cramming both install commands, copy buttons, and dividers into a narrow space.

## Files Modified

- `packages/web/src/components/TerminalBanner.tsx` - Mobile-responsive overhaul of the home page banner

## What Changed

| Change | Detail |
|--------|--------|
| Added `ChevronRight` icon | Mobile-only tap indicator (hidden on desktop) |
| `whitespace-nowrap` on label | Prevents "Install the CLI" from wrapping |
| `hidden md:flex` on commands div | Hides both install commands + copy buttons on mobile |
| `hidden md:block` on divider | Hides vertical divider bar on mobile |
| Responsive spacing | Tighter padding on mobile (`px-3`, `gap-2`), original on desktop |
| Larger touch target | `py-2.5` on mobile for better tap ergonomics |

## Result

- **Mobile:** `[terminal icon] Install the CLI [>]` - clean pill linking to #install
- **Desktop:** Unchanged - full commands with copy buttons

## Decisions

- Non-home-page bottom-left banner was left untouched (already simple enough)
- Mobile banner acts as a teaser linking to the full `CLIInstallSection` at #install
- Used Tailwind responsive prefixes (`md:`) for a pure CSS approach, no JS breakpoint logic

## Next Steps

- Visually verify on a real device or DevTools at 375px width
- Confirm the bottom-left banner on non-home pages still renders correctly on mobile
