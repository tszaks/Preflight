# PreFlight App - Frontend Design Specification

## Overview

This document specifies the design system and component architecture for the PreFlight **authenticated application** (dashboard, submit flow, report, auth pages). This is NOT the marketing landing page - it is the product interface that paying users interact with after login.

**Design philosophy:** Linear.app / Mercury.com quality. Dense, purposeful, quiet confidence. Every pixel signals "this tool is precise about details" - exactly what PreFlight promises about your app review.

**Target users:** Indie iOS developers and vibe coders who appreciate clean developer tools. They are familiar with Xcode, App Store Connect, and command-line interfaces. They value clarity over decoration.

---

## Technology Stack

- **Framework:** SvelteKit 5 (Svelte 5 runes: `$state`, `$derived`, `$props`)
- **Styling:** Scoped `<style>` blocks + global `app.css` design tokens
- **Fonts:** Outfit (headings/labels), Instrument Sans (body/forms)
- **Auth:** Supabase Auth
- **Payments:** Stripe Checkout
- **Deployment:** Vercel (adapter-vercel)

---

## Design System - App Tokens

Extends the marketing site's token system but tuned for app density (tighter spacing, smaller type scale, more functional color use).

### Color Palette (App-Specific Additions)

```css
:root {
    /* === Base (inherited from marketing) === */
    --bg: #08080a;
    --bg-elevated: #0f0f12;
    --bg-subtle: #141418;
    --fg: #f4f4f5;
    --accent: #D4A853;
    --accent-hover: #E0B966;
    --accent-glow: rgba(212, 168, 83, 0.15);
    --accent-subtle: rgba(212, 168, 83, 0.08);
    --gray-100: #e8e6e3;
    --gray-300: #a8a5a0;
    --gray-500: #6b6862;
    --gray-700: #3d3a36;
    --gray-800: #1e1e22;

    /* === Semantic Status Colors === */
    --status-draft-bg: rgba(168, 165, 160, 0.08);
    --status-draft-fg: #a8a5a0;
    --status-draft-border: rgba(168, 165, 160, 0.15);

    --status-paid-bg: rgba(99, 102, 241, 0.08);
    --status-paid-fg: #818cf8;
    --status-paid-border: rgba(99, 102, 241, 0.15);

    --status-queued-bg: rgba(212, 168, 83, 0.08);
    --status-queued-fg: #D4A853;
    --status-queued-border: rgba(212, 168, 83, 0.15);

    --status-processing-bg: rgba(59, 130, 246, 0.08);
    --status-processing-fg: #60a5fa;
    --status-processing-border: rgba(59, 130, 246, 0.15);

    --status-complete-bg: rgba(34, 197, 94, 0.08);
    --status-complete-fg: #4ade80;
    --status-complete-border: rgba(34, 197, 94, 0.15);

    --status-failed-bg: rgba(239, 68, 68, 0.08);
    --status-failed-fg: #f87171;
    --status-failed-border: rgba(239, 68, 68, 0.15);

    /* === Severity Colors (Report) === */
    --severity-critical-bg: rgba(239, 68, 68, 0.08);
    --severity-critical-fg: #f87171;
    --severity-critical-icon: #ef4444;

    --severity-warning-bg: rgba(245, 158, 11, 0.08);
    --severity-warning-fg: #fbbf24;
    --severity-warning-icon: #f59e0b;

    --severity-pass-bg: rgba(34, 197, 94, 0.06);
    --severity-pass-fg: #4ade80;
    --severity-pass-icon: #22c55e;

    --severity-info-bg: rgba(99, 102, 241, 0.06);
    --severity-info-fg: #a5b4fc;
    --severity-info-icon: #6366f1;

    /* === Surface Layers (app-specific depth) === */
    --surface-0: #08080a;              /* page background */
    --surface-1: #0c0c0f;              /* nav, sidebars */
    --surface-2: #0f0f12;              /* cards, elevated containers */
    --surface-3: #141418;              /* nested cards, modals */
    --surface-4: rgba(255, 255, 255, 0.04); /* hover highlights */

    /* === Interactive States === */
    --border-default: rgba(255, 255, 255, 0.06);
    --border-hover: rgba(255, 255, 255, 0.12);
    --border-focus: rgba(212, 168, 83, 0.5);
    --border-active: var(--accent);

    /* === Score Gradients === */
    --score-excellent: #22c55e;        /* 80-100 */
    --score-good: #84cc16;             /* 60-79 */
    --score-fair: #f59e0b;             /* 40-59 */
    --score-poor: #ef4444;             /* 0-39 */
}
```

### Typography Scale (App Context - Denser)

The app uses a tighter, more functional typography scale compared to the marketing site's expressive hierarchy.

| Element | Font | Weight | Size | Line Height | Letter Spacing | Usage |
|---------|------|--------|------|-------------|----------------|-------|
| Page Title | Outfit | 700 | 28px / 1.75rem | 1.15 | -0.03em | "Your Reviews", "New Review" |
| Section Title | Outfit | 600 | 18px / 1.125rem | 1.25 | -0.02em | Category headers in report |
| Card Title | Outfit | 600 | 15px / 0.9375rem | 1.3 | -0.01em | App name in submission cards |
| Body | Instrument Sans | 400 | 14px / 0.875rem | 1.55 | 0 | Descriptions, form help text |
| Body Small | Instrument Sans | 400 | 13px / 0.8125rem | 1.5 | 0 | Secondary info, dates |
| Label | Outfit | 500 | 13px / 0.8125rem | 1.3 | 0 | Form labels |
| Overline | Outfit | 600 | 11px / 0.6875rem | 1.3 | 0.06em | Section overlines, step labels |
| Badge | Outfit | 600 | 11px / 0.6875rem | 1 | 0.02em | Status badges |
| Score Large | Outfit | 800 | 48px / 3rem | 1 | -0.04em | Overall score number |
| Score Small | Outfit | 700 | 20px / 1.25rem | 1 | -0.02em | Category scores |
| Price | Outfit | 700 | 24px / 1.5rem | 1 | -0.02em | $29, $49 in step 3 |

### Spacing System (App)

More compact than marketing. Uses a 4px base with intentional breaks.

| Token | Value | Usage |
|-------|-------|-------|
| `--app-space-1` | 4px | Icon-to-text gaps, badge padding-y |
| `--app-space-2` | 8px | Tight element gaps, badge padding-x |
| `--app-space-3` | 12px | Form input internal padding, card gap |
| `--app-space-4` | 16px | Standard card padding, form group gap |
| `--app-space-5` | 20px | Card padding (compact) |
| `--app-space-6` | 24px | Card padding (standard), section header gaps |
| `--app-space-8` | 32px | Between major sections on page |
| `--app-space-10` | 40px | Page top padding (below nav) |
| `--app-space-12` | 48px | Between page sections |
| `--app-space-16` | 64px | Page bottom padding |

### Animation Tokens

```css
:root {
    --ease: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --duration-instant: 100ms;
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;
}
```

---

## Global Layout Shell

### Navigation Bar (App)

The app nav is **distinct from the marketing nav**. It signals "you are in the product now."

**Specifications:**
- Height: 56px (slightly shorter than marketing's 64px - denser, more tool-like)
- Position: `fixed`, top: 0, full width, z-index: 100
- Background: `rgba(8, 8, 10, 0.92)` (slightly more opaque than marketing)
- Backdrop filter: `blur(20px) saturate(1.2)`
- Border bottom: `1px solid var(--border-default)`
- Container: max-width 1000px centered

**Layout:**
```
 [Logo: "PreFlight." (gold dot)]          [Dashboard]  [Avatar/Initial]  [Logout]
```

**Logo treatment:**
- "PreFlight" in Outfit 600, 16px, white
- The period/dot: `color: var(--accent)`, `font-weight: 800`
- On hover: the gold dot pulses once (`scale(1.3)` then back, 400ms, ease-spring)
- Links to `/dashboard`

**Nav links:**
- Font: Instrument Sans 500, 13px
- Color: `var(--gray-300)`, hover: `var(--fg)`
- Transition: `color var(--duration-fast) var(--ease-out)`
- Active page: `color: var(--fg)`, subtle underline via `border-bottom: 2px solid var(--accent)` offset 4px below text

**Avatar/Initial:**
- 28px circle
- Background: `var(--accent-subtle)` with `border: 1px solid var(--accent-glow)`
- Text: First letter of email, Outfit 600, 12px, gold
- On hover: `border-color: var(--accent)`
- Future: dropdown menu (not needed for v1)

**Logout:**
- Text button (no background)
- Font: Instrument Sans 400, 13px, `var(--gray-500)`
- Hover: `var(--gray-300)`
- No button styling - just a text link

**Scroll behavior:**
- After 20px scroll: add `box-shadow: 0 1px 0 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)`
- Transition: `box-shadow var(--duration-normal) var(--ease-out)`

**Mobile (below 640px):**
- Logo stays left
- Only avatar shown (acts as menu trigger for future mobile menu)
- Dashboard link hidden (user is already navigating via pages)

---

## Page 1: Dashboard

### Header

**Layout:** Flex, space-between, align-items center
- Left: Page title "Your Reviews" (Outfit 700, 28px, `letter-spacing: -0.03em`)
- Right: "New Review" button (primary CTA)

**"New Review" button:**
- Pill shaped: `border-radius: var(--radius-full)` (9999px)
- Background: `var(--accent)`
- Color: `#0a0a0a`
- Padding: `10px 20px`
- Font: Outfit 600, 13px
- Icon: `+` sign, 14px, before text, 6px gap
- Hover: `translateY(-1px)`, `box-shadow: 0 4px 16px rgba(212, 168, 83, 0.25)`
- Active: `translateY(0)`, `scale(0.97)`

### Empty State

When no submissions exist. Centered vertically in remaining viewport.

**Layout:**
- Max-width: 320px, centered
- Text-align: center
- Padding: 48px 32px

**Content:**
```
[SVG Icon: Stylized document with magnifying glass, 64px, stroke-only, gold]

"No reviews yet"
(Outfit 600, 18px, white)

"Submit your first app and get a detailed
compliance report in under 5 minutes."
(Instrument Sans 400, 14px, gray-300, line-height 1.6)

[CTA: "Start Your First Review" - primary button, pill shape]
```

**The icon:**
- NOT a generic empty-box icon
- Custom SVG: a simplified app icon shape (rounded square) with a small magnifying glass overlapping the bottom-right corner
- Stroke style: 1.5px, rounded caps/joins
- Color: `var(--accent)` at 60% opacity for the app shape, full opacity for the magnifying glass
- Size: 56px

**Subtle treatment:**
- The whole empty state has a very faint radial gradient behind it: `radial-gradient(ellipse at 50% 40%, rgba(212, 168, 83, 0.03) 0%, transparent 60%)`
- The icon has a slow float animation: `translateY(-4px)` over 3s, ease-in-out, infinite alternate

### Submissions List

Vertical stack of submission cards with 12px gap between them.

**Submission Card:**
- Background: `var(--surface-2)`
- Border: `1px solid var(--border-default)`
- Border-radius: 12px
- Padding: 16px 20px
- Display: flex, align-items center, justify-content space-between
- Transition: `border-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)`

**Card content (left side):**
```
[App Name]                    (Outfit 600, 15px, white)
[Review Type Badge] [Date]    (inline, 13px, gray-500)
```

**Review type badge (inline with date):**
- "Full" or "Quick" text
- Font: Outfit 600, 11px, uppercase
- Background: `rgba(212, 168, 83, 0.08)`
- Color: `var(--accent)` for Full, `var(--gray-300)` for Quick
- Padding: 2px 6px
- Border-radius: 4px
- Margin-right: 8px before the date

**Card content (right side):**
- Status badge (see badge specs below)

**Hover state (clickable - complete status only):**
- `border-color: var(--border-hover)`
- `transform: translateX(2px)` (subtle rightward shift, implies "go to report")
- Cursor: pointer
- The app name color: stays white (no color change needed)

**Non-clickable cards (processing/queued/draft):**
- Same visual but no hover transform
- Cursor: default
- Slightly lower opacity on the status badge area: 0.85

**Status Badges:**

Each badge is a pill with background tint and colored text.

| Status | Background | Text Color | Label | Icon |
|--------|-----------|------------|-------|------|
| draft | `var(--status-draft-bg)` | `var(--status-draft-fg)` | "Draft" | -- |
| paid | `var(--status-paid-bg)` | `var(--status-paid-fg)` | "Paid" | -- |
| queued | `var(--status-queued-bg)` | `var(--status-queued-fg)` | "Queued" | animated dots |
| processing | `var(--status-processing-bg)` | `var(--status-processing-fg)` | "Analyzing" | spinner |
| complete | `var(--status-complete-bg)` | `var(--status-complete-fg)` | "Complete" | checkmark |
| failed | `var(--status-failed-bg)` | `var(--status-failed-fg)` | "Failed" | x-mark |

**Badge styling:**
- Padding: 4px 10px
- Border-radius: `var(--radius-full)`
- Font: Outfit 600, 11px
- Letter-spacing: 0.02em
- Display: inline-flex, align-items center, gap 5px
- Icon size: 10px (SVG, same color as text)

**Animated dots (queued):**
Three dots that pulse in sequence. CSS-only animation:
```css
.badge-dots span {
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    animation: dot-pulse 1.4s infinite;
}
.badge-dots span:nth-child(2) { animation-delay: 0.2s; }
.badge-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
}
```

**Spinner (processing):**
- 10px circle, 1.5px border
- `border-color: currentColor`
- `border-top-color: transparent`
- `animation: spin 0.8s linear infinite`

---

## Page 2: Submit Form (Multi-Step)

### Page Structure

```
[Header: "New Review" + step indicator]
[Progress track]
[Step content area]
[Footer actions: Back / Continue]
```

### Step Indicator

NOT a generic progress bar. A segmented track showing 3 labeled steps.

**Layout:**
- Horizontal, centered above form content
- Max-width: 400px
- Margin-bottom: 32px

**Structure:**
```
  (1)-----(2)-----(3)
 Details  Files  Review
```

**Step circles:**
- Size: 28px
- Inactive: `background: var(--surface-3)`, `border: 1px solid var(--border-default)`, number in `var(--gray-500)`
- Active: `background: var(--accent)`, no border, number in `#0a0a0a`, `box-shadow: 0 0 0 4px rgba(212, 168, 83, 0.15)`
- Completed: `background: var(--accent)`, checkmark icon instead of number
- Number font: Outfit 600, 11px
- Transition: `all var(--duration-normal) var(--ease)`

**Connecting lines:**
- Height: 2px
- Inactive: `var(--border-default)`
- Active (passed): `var(--accent)`
- Transition: `background var(--duration-slow) var(--ease)`
- Lines animate fill left-to-right when step advances

**Step labels:**
- Below circles, centered
- Font: Outfit 500, 11px, `letter-spacing: 0.02em`
- Inactive: `var(--gray-500)`
- Active: `var(--fg)`
- Transition: `color var(--duration-fast)`

### Step 1: App Metadata

**Section title:** "App Details" (Outfit 600, 18px)
**Section subtitle:** "Enter the information from your App Store listing" (Instrument Sans 400, 14px, gray-300)

**Form layout:** Single column, max-width 560px, left-aligned

**Form fields:**

1. **App Name** (required)
   - Full width
   - Placeholder: "My Awesome App"

2. **Subtitle**
   - Full width
   - Placeholder: "A brief tagline for your app"

3. **Description** (required)
   - Textarea, 5 rows minimum
   - Auto-grows to content (CSS: `field-sizing: content` with fallback)
   - Character count in bottom-right corner (gray-500, 12px)
   - Placeholder: "Describe what your app does..."

4. **Keywords**
   - Full width
   - Placeholder: "keyword1, keyword2, keyword3"
   - Helper text below: "Comma-separated. 100 character limit." (12px, gray-500)

5. **Category + Age Rating** (side by side, 2-column grid on desktop)
   - Category: select dropdown
   - Age Rating: select dropdown (4+, 9+, 12+, 17+)

6. **Privacy Policy URL**
   - Full width
   - Input type: url
   - Placeholder: "https://example.com/privacy"

**Form Input Styling (global):**

```css
.input {
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-default);
    border-radius: 10px;   /* NOT pill - slightly rounded rect for inputs */
    padding: 12px 16px;
    color: var(--fg);
    font-family: 'Instrument Sans', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    outline: none;
    transition:
        border-color var(--duration-fast) var(--ease-out),
        box-shadow var(--duration-fast) var(--ease-out),
        background var(--duration-fast) var(--ease-out);
}

.input:hover {
    border-color: var(--border-hover);
    background: rgba(255, 255, 255, 0.04);
}

.input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.1);
    background: rgba(255, 255, 255, 0.04);
}

.input::placeholder {
    color: var(--gray-500);
}

.input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

**Form label styling:**
```css
.form-label {
    display: block;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--gray-100);
    margin-bottom: 6px;
}

.form-label .required {
    color: var(--accent);
    margin-left: 2px;
}
```

**Select dropdown styling:**
- Same as input but with custom chevron
- Chevron: SVG arrow (gold on focus, gray-500 default)
- Background-position: right 14px center
- `appearance: none`

### Step 2: Files

**Section title:** "Screenshots & Files"
**Section subtitle:** "Upload your App Store assets for analysis"

**File Upload Zones:**

Three distinct upload areas, stacked vertically with 16px gap.

**Upload zone (default state):**
```css
.upload-zone {
    border: 1.5px dashed var(--border-hover);
    border-radius: 12px;
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    position: relative;
    transition:
        border-color var(--duration-fast) var(--ease-out),
        background var(--duration-fast) var(--ease-out);
    background: transparent;
}
```

**Upload zone (hover):**
```css
.upload-zone:hover {
    border-color: var(--accent);
    background: rgba(212, 168, 83, 0.02);
}
```

**Upload zone (drag-over):**
```css
.upload-zone.drag-over {
    border-color: var(--accent);
    border-style: solid;
    background: rgba(212, 168, 83, 0.04);
    transform: scale(1.01);
}
```

**Upload zone (has files):**
```css
.upload-zone.has-files {
    border-style: solid;
    border-color: var(--status-complete-border);
    background: var(--status-complete-bg);
}
```

**Upload zone content (empty):**
```
[Upload icon: cloud with arrow, 24px, gray-500]
"Drop files here or click to browse"
(Instrument Sans 400, 14px, gray-300)
"PNG, JPG up to 10 files"
(Instrument Sans 400, 12px, gray-500)
```

**Screenshots file list (when files are added):**
- Horizontal scrollable row of thumbnail previews
- Each thumbnail: 48px x 80px (portrait aspect ratio matching phone screens)
- Border-radius: 6px
- Border: `1px solid var(--border-default)`
- Remove button: 16px circle, positioned top-right, `-4px` offset
  - Background: `var(--surface-2)`
  - Border: `1px solid var(--border-default)`
  - X icon: 8px, gray-300
  - On hover: border-color red, X turns red

**Privacy Manifest & Info.plist zones:**
- Same upload zone style but smaller padding (24px 20px)
- When file is uploaded: show filename with file icon + size + remove button
- File icon: small document SVG, 16px, gray-300

### Step 3: Review Type & Summary

**Section title:** "Choose Your Review"
**Section subtitle:** "Select the depth of analysis for your submission"

**Review Type Cards (side by side on desktop, stacked on mobile):**

Two cards in a 2-column grid with 16px gap.

**Quick Review Card ($29):**
```
[Card, border: 1px solid var(--border-default)]

"Quick Review"               (Outfit 600, 13px, gray-300, uppercase, tracking 0.04em)
"$29"                        (Outfit 700, 24px, white)
"per review"                 (Instrument Sans 400, 12px, gray-500)

--- divider (1px solid var(--border-default), 16px margin) ---

[check] Metadata validation
[check] Screenshot compliance
[check] URL reachability
[check] Basic plist checks

(Each: Instrument Sans 400, 13px, gray-100, with green check icon 12px)
```

**Full Review Card ($49) - RECOMMENDED:**
```
[Card, border: 1px solid var(--accent), background: rgba(212, 168, 83, 0.03)]

[RECOMMENDED badge: top-right corner, inside card padding]
"Recommended" (Outfit 600, 10px, gold, pill with gold-subtle bg)

"Full Review"                (Outfit 600, 13px, gold, uppercase, tracking 0.04em)
"$49"                        (Outfit 700, 24px, gold)
"per review"                 (Instrument Sans 400, 12px, gray-500)

--- divider ---

[check] Everything in Quick, plus:
[check] Privacy manifest deep analysis
[check] Content policy review
[check] Detailed fix instructions
[check] Priority processing
```

**Selected state:**
- Radio input hidden
- Selected card: `border-color: var(--accent)`, `box-shadow: 0 0 0 2px rgba(212, 168, 83, 0.15)`
- Unselected card: default border
- Transition: `all var(--duration-fast) var(--ease-out)`

**Summary Card (below review type):**
```css
.summary-card {
    background: var(--surface-2);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    padding: 20px;
    margin-top: 24px;
}
```

**Summary rows:**
- Flex, space-between
- Font: Instrument Sans 400, 14px
- Left label: gray-300
- Right value: white
- Separated by `border-bottom: 1px solid rgba(255,255,255,0.04)` with 12px padding
- Total row: Outfit 600, 16px, no border, gold color for price

### Step Navigation (All Steps)

**Footer bar:**
- `margin-top: 32px`
- `padding-top: 24px`
- `border-top: 1px solid var(--border-default)`
- Flex, space-between

**Back button:**
- Ghost style: transparent bg, `1px solid var(--gray-700)`, gray-300 text
- Pill shape
- Hover: border-color gold, text white

**Continue / Submit button:**
- Primary gold style
- Pill shape
- Disabled: `opacity: 0.4`, no hover effects
- Loading state: text replaced with "Processing..." + subtle spinner

---

## Page 3: Report (The Deliverable)

This is the most important page - it is what users pay for. It must feel substantial, authoritative, and worth the price.

### Page Width

- Max-width: 760px (narrower than dashboard - optimized for reading)
- Centered

### Report Header

```
[App name]                                [Back to Dashboard]
(Outfit 700, 28px)                        (ghost btn, small)

[Review type badge] [Date completed]
(inline, 13px, gray-300)
```

### Overall Score Section

The hero moment of the report. Prominently displayed.

**Layout:** Flex row (column on mobile), 24px gap, centered vertically

**Score Circle (left):**
- Size: 140px x 140px
- SVG-based circular progress
- Track: `stroke: var(--gray-800)`, `stroke-width: 6`
- Progress arc: `stroke: [color based on score]`, `stroke-width: 6`, `stroke-linecap: round`
- Center number: Outfit 800, 48px, same color as arc
- Below number: "/ 100" (Outfit 400, 14px, gray-500)
- Rotation: starts from 12-o-clock (`transform: rotate(-90deg)`)
- Entry animation: `stroke-dashoffset` animates from full to target over 800ms, ease-out-expo
- Number: counts up from 0 to score over 600ms

**Score color mapping:**
```
90-100: #22c55e (green - excellent)
70-89:  #84cc16 (lime - good)
50-69:  #f59e0b (amber - fair)
0-49:   #ef4444 (red - poor)
```

**Score Summary (right):**
- Summary text: Instrument Sans 400, 15px, gray-100, line-height 1.6
- Below: stat pills showing critical/warning/info counts
  - Each: inline-flex pill with colored dot (6px circle) + count + label
  - Gap: 12px between pills
  - Font: Instrument Sans 500, 13px

### Category Breakdown

**Section overline:** "BREAKDOWN" (Outfit 600, 11px, gray-500, uppercase, tracking 0.06em)

**Grid:** 3 columns on desktop, 2 on tablet, 1 on mobile. Gap: 12px.

**Category Score Card:**
```css
.category-card {
    background: var(--surface-2);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 16px 18px;
    transition: border-color var(--duration-fast) var(--ease-out);
}
.category-card:hover {
    border-color: var(--border-hover);
}
```

**Card content:**
```
[Category icon, 16px, gray-300]  [Category Name]     [Score: 85]
                                  (13px, gray-300)    (Outfit 700, 20px, colored)

[Progress bar: 3px height, full width, colored fill]
```

**Progress bar:**
- Track: `var(--gray-800)`, height 3px, border-radius 2px
- Fill: same color as score, animated width on mount (400ms, ease-out, staggered 100ms per card)

**Category icons (16px, stroke-only, 1.5px):**
- Metadata: tag/label
- Screenshots: image stack
- Privacy: shield
- Plist: gear with brackets
- URLs: link/chain
- Content: document with checkmark

### Detailed Results (Checklist)

The core value. Grouped by category, each item expandable.

**Category Group:**
```css
.category-group {
    margin-bottom: 24px;
}
.category-group h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-100);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
}
```

**Report Item (expandable):**

Default (collapsed):
```
[Severity dot, 8px] [Title]                    [Guideline ref] [Chevron]
```

Expanded:
```
[Severity dot, 8px] [Title]                    [Guideline ref] [Chevron rotated]
                    [Description paragraph]
                    [Fix suggestion box]
```

**Item card:**
```css
.item-card {
    background: var(--surface-2);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    margin-bottom: 8px;
    overflow: hidden;
    transition: border-color var(--duration-fast) var(--ease-out);
}
.item-card:hover {
    border-color: var(--border-hover);
}
.item-card[open] {
    border-color: var(--border-hover);
}
```

**Severity indicators (dots, not emojis in final design):**
- Critical: 8px circle, `var(--severity-critical-icon)`, with subtle pulse animation
- Warning: 8px circle, `var(--severity-warning-icon)`
- Pass: 8px circle, `var(--severity-pass-icon)`
- Info: 8px circle, `var(--severity-info-icon)`

**Item title:** Instrument Sans 500, 14px, white
**Guideline ref:** Instrument Sans 400, 12px, gray-500, monospace-ish feel

**Expanded body:**
- Padding: 0 16px 16px 28px (indented past the severity dot)
- Description: Instrument Sans 400, 13px, gray-300, line-height 1.6

**Fix suggestion box:**
```css
.fix-box {
    margin-top: 12px;
    padding: 12px 14px;
    background: rgba(212, 168, 83, 0.04);
    border: 1px solid rgba(212, 168, 83, 0.12);
    border-left: 3px solid var(--accent);
    border-radius: 0 8px 8px 0;
    font-size: 13px;
    color: var(--gray-100);
    line-height: 1.55;
}
.fix-box strong {
    color: var(--accent);
    font-weight: 600;
}
```

**Chevron (expand/collapse):**
- 12px, stroke 1.5px, gray-500
- Rotates 180deg when open
- Transition: `transform var(--duration-normal) var(--ease)`

**Expand/collapse animation:**
- Height animation using Svelte `slide` transition (250ms, ease-out-expo)
- Content fades in slightly: opacity 0 -> 1 over 150ms

### Report Footer

```
--- divider (1px solid var(--border-default)) ---

[centered]
"Submit Another Review"
(primary button, pill shape)
```

---

## Page 4: Auth Pages (Login / Signup)

### Layout

Both pages share identical layout:
- Full viewport height, flex centered (both axes)
- No nav visible (clean, focused)
- Background: `var(--bg)` with very subtle radial gradient at center: `radial-gradient(ellipse at 50% 45%, rgba(212, 168, 83, 0.02) 0%, transparent 50%)`

### Auth Container

```css
.auth-container {
    width: 100%;
    max-width: 340px;
    padding: 0 24px;
}
```

**No card wrapper.** The form floats directly on the dark background. This is more Linear/Mercury than wrapping everything in a bordered card. The lack of container makes it feel more native and less "SaaS template."

### Content Structure

```
[Logo: "PreFlight." centered, 18px, with gold dot]

[gap: 32px]

[Title: "Log in" or "Create account"]        (Outfit 700, 24px, centered)
[Subtitle: "Welcome back" or blank]          (Instrument Sans 400, 14px, gray-300, centered)

[gap: 24px]

[Error message, if any]

[Email field]
[Password field]

[gap: 8px]

[Submit button: full width, pill, primary gold]

[gap: 24px]

[Toggle text: "Don't have an account? Sign up" (centered, 13px)]
```

### Form Field Specific Styling

**Email input:**
- Standard input styling (see Step 1 specs)
- `autocomplete="email"`

**Password input:**
- Standard input styling
- `autocomplete="current-password"` (login) / `autocomplete="new-password"` (signup)
- Future: show/hide toggle (eye icon, right side)

### Error Message

```css
.auth-error {
    padding: 10px 14px;
    background: var(--severity-critical-bg);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 8px;
    color: var(--severity-critical-fg);
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
}
```

### Success Message (Signup confirmation)

```css
.auth-success {
    padding: 10px 14px;
    background: var(--severity-pass-bg);
    border: 1px solid rgba(34, 197, 94, 0.15);
    border-radius: 8px;
    color: var(--severity-pass-fg);
    font-size: 13px;
    line-height: 1.4;
}
```

### Toggle Link

```
"Don't have an account? <a>Sign up</a>"
"Already have an account? <a>Log in</a>"
```
- Outer text: Instrument Sans 400, 13px, gray-500
- Link: `color: var(--accent)`, hover: underline
- Centered

### Submit Button (Auth)

- Full width
- Pill shape (`border-radius: 9999px`)
- Height: 44px
- Font: Outfit 600, 14px
- Loading state: text changes to "Logging in..." / "Creating account..."
- Disabled during loading: `opacity: 0.7`

---

## Responsive Breakpoints

| Breakpoint | Width | Key Changes |
|-----------|-------|-------------|
| Desktop | >= 1024px | Full layouts, 3-column report grid |
| Tablet | 768-1023px | 2-column grids, slightly tighter padding |
| Mobile | < 768px | Single column, stacked layouts |
| Small | < 480px | Tighter padding, smaller type adjustments |

### Responsive Details

**Dashboard:**
- Mobile: header stacks (title above button), cards remain same
- Button becomes full-width below 480px

**Submit form:**
- Mobile: step indicator circles shrink to 24px, labels hide (show on active only)
- Form rows become single column below 600px
- Review type cards stack vertically

**Report:**
- Mobile: score section stacks (circle above summary)
- Category grid: 2 columns on tablet, 1 on mobile
- Report items remain full-width (already single column)

**Auth:**
- Already centered single-column - no changes needed
- Max-width ensures it stays compact

---

## Micro-Interactions & Transitions

| Element | Trigger | Animation | Duration/Easing |
|---------|---------|-----------|-----------------|
| Nav shadow | Scroll > 20px | Shadow appears | 250ms ease-out |
| Logo dot | Hover | Scale 1.3 then 1 | 400ms ease-spring |
| Primary button | Hover | translateY(-1px) + gold shadow | 250ms ease-out |
| Primary button | Active | translateY(0) + scale(0.97) | 100ms |
| Ghost button | Hover | Border gold + bg tint | 150ms |
| Submission card | Hover | translateX(2px) + border-hover | 150ms ease-out |
| Status badge (queued) | Ambient | Dot pulse sequence | 1.4s infinite |
| Status badge (processing) | Ambient | Border spin | 0.8s linear infinite |
| Step indicator | Step change | Circle fill + line extend | 400ms ease |
| Form input | Focus | Gold border + shadow ring | 150ms |
| Upload zone | Drag over | Scale 1.01 + gold border | 150ms |
| Report score circle | Mount | Stroke draw + number count | 800ms ease-out-expo |
| Category bar | Mount | Width animate (staggered) | 400ms ease-out |
| Report item | Expand | Slide height + fade content | 250ms ease-out |
| Report item chevron | Toggle | Rotate 180deg | 250ms ease |
| Review type card | Select | Border + shadow transition | 150ms |
| Auth submit | Loading | Text swap, subtle pulse | instant |
| Page transition | Navigate | Fade opacity 0->1 | 200ms |
| Empty state icon | Ambient | Float up/down 4px | 3s ease-in-out infinite |

### Page Transitions

Use Svelte page transitions for navigation between routes:

```svelte
<!-- In +layout.svelte -->
{#key data.pathname}
    <div class="page-content" in:fade={{ duration: 200, delay: 50 }} out:fade={{ duration: 150 }}>
        {@render children()}
    </div>
{/key}
```

---

## Component File Structure

```
src/
  app.css                          (design tokens + global resets)
  routes/
    +layout.svelte                 (app shell: nav + page wrapper)
    +layout.server.ts              (auth check, user data)
    +page.svelte                   (marketing redirect or root)
    dashboard/
      +page.svelte                 (submission list + empty state)
      +page.server.ts              (fetch submissions)
    submit/
      +page.svelte                 (multi-step form)
      +page.server.ts              (create submission, upload files)
    report/[id]/
      +page.svelte                 (full report view)
      +page.server.ts              (fetch report + items)
    login/
      +page.svelte                 (login form)
      +page.server.ts              (Supabase auth)
    signup/
      +page.svelte                 (signup form)
      +page.server.ts              (Supabase auth)
  lib/
    components/
      app/
        Nav.svelte                 (app navigation)
        ScoreCircle.svelte         (SVG circular progress)
        StatusBadge.svelte         (pill badge with status colors)
        FileUpload.svelte          (drag-drop upload zone)
        StepIndicator.svelte       (3-step progress)
        CategoryCard.svelte        (score + bar for report)
        ReportItem.svelte          (expandable checklist item)
        EmptyState.svelte          (no-data illustration)
    icons/
      Logo.svelte                  (PreFlight. with gold dot)
      Upload.svelte
      Document.svelte
      Shield.svelte
      Gear.svelte
      Link.svelte
      Check.svelte
      ChevronDown.svelte
      X.svelte
      Plus.svelte
      Spinner.svelte
      AppIcon.svelte               (empty state illustration)
    actions/
      countUp.ts                   (number counter for score)
      clickOutside.ts              (for future dropdowns)
```

---

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements focusable via Tab
- Report items expandable via Enter/Space
- Step navigation via Enter on Continue/Back
- Upload zones activatable via Enter/Space
- Radio cards (review type) navigable via Arrow keys

### Focus Indicators
- All focusable elements: `box-shadow: 0 0 0 2px var(--accent)` on `:focus-visible`
- Remove default outline: `outline: none` on `:focus` (only style `:focus-visible`)
- Skip link: hidden until focused, positioned top-left

### ARIA
- Step indicator: `aria-current="step"` on active step
- Status badges: `aria-label` with full status text
- Report items: `<details>` element (native expand/collapse semantics)
- Upload zones: `aria-label="Upload screenshots"` etc.
- Score circle: `aria-label="Overall score: 87 out of 100"`
- Loading states: `aria-busy="true"` on forms during submission
- Error messages: `aria-live="assertive"` for real-time error announcements

### Color Contrast
All text/background combinations verified:
- Gold `#D4A853` on `#08080a`: 7.2:1 (AAA)
- White `#f4f4f5` on `#08080a`: 18.7:1 (AAA)
- Gray-100 `#e8e6e3` on `#0f0f12`: 13.5:1 (AAA)
- Gray-300 `#a8a5a0` on `#0f0f12`: 5.8:1 (AA)
- Gray-500 `#6b6862` on `#0f0f12`: 3.3:1 (AA for large text only - use for non-essential labels)
- Badge colors on their backgrounds: all >= 4.5:1

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
    .score-circle { stroke-dashoffset: 0 !important; }
}
```

---

## Performance Considerations

- **No external icon libraries.** All icons are inline SVG Svelte components (zero HTTP requests)
- **Font loading:** Already using `display=swap`. Consider `font-display: optional` for Outfit if hero text causes CLS
- **CSS-only animations** where possible (GPU-accelerated transforms/opacity). No JS animation libraries.
- **Details/summary** for report items: native browser expand/collapse, no JS needed for basic functionality
- **File uploads:** Client-side preview uses `URL.createObjectURL` (no base64 encoding)
- **Form state:** Svelte 5 runes (`$state`) - no external state management needed
- **Page transitions:** Minimal (200ms fade) - don't delay perceived navigation
- **Score circle:** Single SVG render, animated via CSS transition on `stroke-dashoffset`

---

## Implementation Priority

### Phase 1: Foundation (do first)
1. Update `app.css` with all app-specific tokens (colors, typography, spacing, status variables)
2. Redesign `+layout.svelte` nav to match spec (logo with dot, avatar, proper styling)
3. Restyle form inputs globally (the `.input` class)
4. Create `StatusBadge.svelte` component
5. Create `StepIndicator.svelte` component

### Phase 2: Core Pages
6. Redesign Dashboard with empty state, proper card styling, status badges
7. Redesign Submit form with step indicator, upload zones, review type cards
8. Redesign Report page with ScoreCircle, category cards, expandable items
9. Redesign Auth pages (login/signup) with floating form, no card wrapper

### Phase 3: Polish
10. Add page transitions
11. Add score circle animation (countUp + stroke draw)
12. Add category bar stagger animations
13. Add upload zone drag-over states
14. Add loading/spinner states
15. Accessibility audit (keyboard nav, screen reader testing)
16. Responsive testing across breakpoints

---

## Design Anti-Patterns to Avoid

These are explicitly called out to prevent "template drift":

1. **NO `rounded-lg` on everything** - Use specific radii: 10px for inputs, 12px for cards, pill for buttons/badges
2. **NO uniform shadows** - Most elements have NO shadow. Shadow is reserved for nav-on-scroll and gold-glow hover states only
3. **NO gradient backgrounds on cards** - Cards are flat `var(--surface-2)` with borders. Gradients are for special treatments only (featured pricing card, page background ambient)
4. **NO colored backgrounds for sections** - The app is uniformly dark. Depth comes from border + surface-level differences, not colored bands
5. **NO icon-heavy UI** - Icons are small (12-16px) and supplementary. Text labels do the heavy lifting
6. **NO animation on every hover** - Only cards that navigate somewhere get transform hovers. Static elements get border-color changes only
7. **NO heavy glass effects in the app** - Glass is for the nav only. Cards use solid elevated surfaces
8. **NO default easing** - Never use `ease` or `ease-in-out`. Always use the custom cubic-bezier tokens
9. **NO pure white (#fff)** - Text white is `#f4f4f5`. Borders are always rgba with low alpha. Nothing is pure white.
10. **NO large heading sizes in the app** - The largest text is 28px (page titles). This is a tool, not a billboard.
