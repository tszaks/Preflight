# Terminal-Style Analyzing View Replacement - Preflight

**Date:** February 2, 2026
**Topic:** Replace sci-fi analyzing overlay with macOS Terminal.app-style interface

## Session Overview

Implemented the planned terminal emulator UI for the analyzing/in-progress view in ReportClient.tsx. Replaced the matrix animations, scanlines, hex codes, SVG circular progress, and fake telemetry with a clean CLI terminal that shows real analysis progress. Built, verified, committed, pushed, and confirmed Railway deployment succeeded.

## Files Touched

- `packages/web/src/components/report/ReportClient.tsx` - **rewritten** (full analyzing view replaced, ~190 lines of old JSX swapped for terminal UI)
- `packages/web/src/app/globals.css` - **edited** (added `terminal-line-in` keyframe animation)
- `packages/shared/src/types/progress.ts` - **read** (reference for PROGRESS_MESSAGES, PROGRESS_CHECKS)
- `packages/web/src/components/CLIInstallSection.tsx` - **read** (reference for terminal chrome pattern)

## Work Completed

- Added `TerminalLine` interface and `AnalysisPhase` type for phase-driven state machine
- Created check arrays (`HARD_CHECKS`, `SOFT_CHECKS`, `REPORT_CHECKS`) sourced from `PROGRESS_MESSAGES`
- Built `asciiProgressBar()` helper using Unicode block/shade characters
- Replaced old state (`currentLogIndex`, `logs`, `logHexCodes`, `dataStreams`, `ioBuffer`) with terminal state (`terminalLines`, `currentPhase`, `terminalRef`, `phaseCheckIndex`)
- Implemented phase-driven effects: init, phase transitions with fast-forward, report completion, trickle checks (2s interval)
- Built full terminal JSX: macOS title bar (traffic lights), scrollable log body, ASCII status table with box-drawing chars, blinking cursor, footer with stop button
- Fixed bug where `asciiProgressBar(0)` would show 1 filled block
- Build passed (`next build` - 0 errors, 27 pages generated)
- Committed as `3d5c07a` and pushed to `origin/main`
- Railway deployment `ed9527ac` succeeded (BUILDING -> DEPLOYING -> SUCCESS)

## Removed

- Matrix data stream background animation
- Scanline overlay effect
- Corner telemetry accents (BRIDGE_SYNC_ACTIVE, coordinates, IO buffer)
- SVG circular progress indicators
- Shield/FileText/Zap icon status cards
- "NEURAL_AUDIT_ACTIVE" label
- All fake hex codes and data streams

## Key Design Decisions

- Forward-only state machine (`init -> hard -> soft -> report -> done | failed`) handles both real-time and mid-analysis page loads
- Progress derived from counting `TerminalLine` entries per phase (single source of truth)
- `useRef` for `phaseCheckIndex` avoids re-renders from trickle interval
- Red traffic light dot doubles as the Stop Review button (macOS convention)
- No component extraction needed - kept inline in ReportClient (KISS)

## Next Steps

- Test with a live analysis submission to verify real-time phase transitions
- Check mobile responsiveness of the ASCII table (may need font-size adjustments)
- The commit also included CLI changes from a prior session (they were already staged) - verify those are fine

## Thinking Patterns

- **Approach:** systematic - followed a pre-made plan step by step across 5 tracked tasks
- **Priority:** quality + fidelity - wanted a real terminal feel, not another styled div
- **Mental Shifts:** none - plan was clear from the start, execution was linear
- **Energy Sources:** the terminal aesthetic, making the UI feel like real CLI output
- **Project-Specific:** Preflight's web frontend is the polish layer - this was about UX credibility
