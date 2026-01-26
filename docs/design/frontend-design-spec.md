# PreFlight Landing Page - Frontend Design Specification

## Project Overview

A premium, visually stunning landing page for PreFlight - an AI-powered App Store pre-submission review tool. The page must convert nervous indie iOS developers by communicating trust, precision, and premium quality. Currently in waitlist mode.

**Domain:** mypreflight.app
**Tagline:** "Know what Apple will say before you submit."
**Status:** Waitlist (pre-launch)

## Technology Stack

- **Framework:** SvelteKit (Svelte 5 with runes)
- **Styling:** Scoped Svelte `<style>` blocks + global `app.css`
- **Fonts:** Google Fonts (Outfit headings, Instrument Sans body)
- **Deployment:** Vercel (adapter-vercel)
- **Backend:** Supabase (auth + waitlist), Stripe (future payments)
- **Animations:** CSS transitions + Svelte transitions/actions for scroll-triggered reveals

---

## Design System Foundation

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#08080a` | Page background (near-black with slight warmth) |
| `--bg-elevated` | `#0f0f12` | Cards, elevated surfaces |
| `--bg-subtle` | `#141418` | Section alternation, secondary surfaces |
| `--fg` | `#f4f4f5` | Primary text (white-ish) |
| `--accent` | `#D4A853` | Gold accent - CTAs, highlights, borders |
| `--accent-hover` | `#E0B966` | Gold lighter on hover |
| `--accent-glow` | `rgba(212, 168, 83, 0.15)` | Glow effects around gold elements |
| `--accent-subtle` | `rgba(212, 168, 83, 0.08)` | Very subtle gold tinting |
| `--gray-100` | `#e8e6e3` | Secondary text, subheadings |
| `--gray-300` | `#a8a5a0` | Body text, descriptions |
| `--gray-500` | `#6b6862` | Muted text, placeholders |
| `--gray-700` | `#3d3a36` | Borders, dividers |
| `--gray-800` | `#1e1e22` | Card borders, subtle lines |
| `--success` | `#22c55e` | Passing checks |
| `--warning` | `#f59e0b` | Warnings |
| `--error` | `#ef4444` | Failures, rejections |
| `--gradient-gold` | `linear-gradient(135deg, #D4A853 0%, #E8C97A 50%, #D4A853 100%)` | Premium gold gradient |
| `--gradient-dark` | `linear-gradient(180deg, #08080a 0%, #0f0f14 100%)` | Section depth |
| `--gradient-radial` | `radial-gradient(ellipse at 50% 0%, rgba(212, 168, 83, 0.06) 0%, transparent 70%)` | Hero ambient glow |

### Typography Scale

| Element | Font | Weight | Size (Desktop) | Size (Mobile) | Line Height | Letter Spacing |
|---------|------|--------|-----------------|---------------|-------------|----------------|
| H1 (Hero) | Outfit | 800 | 72px / 4.5rem | 44px / 2.75rem | 1.05 | -0.04em |
| H2 (Section) | Outfit | 700 | 48px / 3rem | 32px / 2rem | 1.1 | -0.03em |
| H3 (Card title) | Outfit | 600 | 24px / 1.5rem | 20px / 1.25rem | 1.2 | -0.02em |
| Body Large | Instrument Sans | 400 | 20px / 1.25rem | 18px / 1.125rem | 1.6 | 0 |
| Body | Instrument Sans | 400 | 16px / 1rem | 16px / 1rem | 1.6 | 0 |
| Body Small | Instrument Sans | 400 | 14px / 0.875rem | 14px / 0.875rem | 1.5 | 0 |
| Label/Overline | Outfit | 600 | 13px / 0.8125rem | 12px / 0.75rem | 1.3 | 0.08em |
| Caption | Instrument Sans | 500 | 12px / 0.75rem | 12px / 0.75rem | 1.4 | 0.02em |

### Spacing System (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Inline spacing |
| `--space-3` | 12px | Small gaps |
| `--space-4` | 16px | Component padding |
| `--space-5` | 24px | Card padding |
| `--space-6` | 32px | Section gaps |
| `--space-8` | 48px | Between components |
| `--space-10` | 64px | Between sections (mobile) |
| `--space-12` | 80px | Between sections (tablet) |
| `--space-16` | 120px | Between sections (desktop) |
| `--space-20` | 160px | Hero vertical padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements, badges |
| `--radius-md` | 10px | Buttons, inputs |
| `--radius-lg` | 16px | Cards |
| `--radius-xl` | 24px | Large cards, hero elements |
| `--radius-full` | 9999px | Pills, circular elements |

### Shadows & Effects

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);
--shadow-gold: 0 8px 32px rgba(212, 168, 83, 0.2);
--shadow-gold-lg: 0 16px 48px rgba(212, 168, 83, 0.25);

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.06);
--glass-blur: blur(16px);

/* Noise texture overlay (applied via ::after pseudo) */
--noise: url("data:image/svg+xml,..."); /* See implementation */
```

### Animations & Easings

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary easing for entrances |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Hover transitions |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy micro-interactions |
| `--duration-fast` | `150ms` | Hover color changes |
| `--duration-normal` | `300ms` | Standard transitions |
| `--duration-slow` | `600ms` | Element entrances |
| `--duration-slower` | `1000ms` | Hero fade-in |

### Responsive Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| `sm` | 480px | Small phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktop |
| `2xl` | 1440px | Wide screens |

---

## Component Architecture

### 1. Navigation Bar (`Nav`)

**Purpose:** Fixed top navigation with glassmorphism backdrop.

**Visual Specs:**
- Height: 64px
- Background: `rgba(8, 8, 10, 0.85)` with `backdrop-filter: blur(16px)`
- Border-bottom: `1px solid rgba(255, 255, 255, 0.04)`
- Logo: "PreFlight" in Outfit 700, with a subtle gold dot after the "t" (like a status indicator)
- Container: max-width 1200px, centered

**States:**
- Scrolled > 50px: Add `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4)`
- Transition: `box-shadow 0.3s ease`

**Layout:**
```
[Logo: "PreFlight"]                           [Waitlist CTA btn-sm]
```

**Mobile:** Same layout, CTA button slightly smaller

---

### 2. Hero Section

**Purpose:** Immediate emotional impact. Communicate value in 3 seconds.

**Visual Specs:**
- Full viewport height (min-height: 100vh, display: flex, align: center)
- Subtle radial gradient glow from top center (gold, very low opacity ~4%)
- Floating ambient particles (optional, SVG-based, very subtle)
- Noise texture overlay at 2% opacity

**Content Hierarchy:**

```
[Overline badge: "For indie iOS developers" - pill shape, gold border]

[H1: "Know what Apple"]
[H1: "will say—before"]
[H1: "you submit."]

[Subhead: "PreFlight scans your app metadata, screenshots, privacy manifest,"]
[Subhead: "and more. Catch rejections before they cost you a week."]

[Waitlist Form: email input + gold CTA button]

[Trust line: "Join 200+ developers on the waitlist" with small avatars]
```

**H1 Treatment:**
- Font: Outfit 800, 72px desktop / 44px mobile
- Color: `var(--fg)` with the word "before" having a gold gradient text fill
- Subtle text-shadow: `0 0 80px rgba(212, 168, 83, 0.1)`

**Waitlist Form:**
- Container: max-width 460px, centered
- Layout: Horizontal on desktop (input + button), stacked on mobile
- Input: `height: 54px`, dark glass background, gold focus ring
- Button: Gold fill, dark text, `height: 54px`, min-width 160px
- Button hover: Lift + gold glow shadow
- Button text: "Join the Waitlist" with arrow icon

**Trust Line:**
- 4-5 overlapping avatar circles (placeholder photos or initials)
- Text: "Join 200+ developers on the waitlist"
- Color: `var(--gray-500)`
- Size: 13px

**Entrance Animations (staggered):**
1. Overline badge: fade-up, 0ms delay
2. H1 lines: fade-up, 150ms stagger between lines
3. Subhead: fade-up, 600ms delay
4. Form: fade-up, 800ms delay
5. Trust line: fade-in, 1000ms delay

---

### 3. Social Proof / Logo Bar

**Purpose:** Build trust even pre-launch. Show developer credibility signals.

**Visual Specs:**
- Background: Slight elevation change (subtle gradient border top/bottom)
- Padding: 48px vertical
- Content centered

**Content:**
```
"Trusted by developers shipping to the App Store"

[Logo placeholders: "As seen in" or dev community logos]
-- OR --
[Stats row: "6 Categories Checked" | "< 5 Min Review" | "AI-Powered Analysis"]
```

**Stats Row (recommended for pre-launch):**
- 3 columns on desktop, stacked on mobile
- Each stat: Large number (Outfit 700, 32px, gold) + label below (gray-300)
- Dividers between stats (subtle vertical lines on desktop)

**Stats:**
| Stat | Label |
|------|-------|
| `6` | Categories Checked |
| `< 5 min` | Average Review Time |
| `89%` | Rejection Prevention Rate |

---

### 4. How It Works Section

**Purpose:** Demystify the process. Show simplicity.

**Visual Specs:**
- Section padding: 120px vertical
- Max-width: 1000px
- Background: `var(--bg-subtle)` or subtle gradient

**Section Header:**
- Overline: "HOW IT WORKS" (uppercase, 13px, gold, letter-spacing: 0.08em)
- H2: "Three steps to confidence" (Outfit 700, 48px)
- Subhead: "Upload your app package. Get your review. Fix issues before Apple sees them."

**3-Step Flow:**

Each step is a card with an icon, number, title, and description.

```
[1]                     [2]                     [3]
Upload                  Analyze                 Fix
Your .ipa or           Our AI simulates        Get a detailed
app metadata           Apple's review          report with
                       process                 actionable fixes
```

**Step Card Design:**
- Width: Equal thirds with 24px gap
- Background: `var(--glass-bg)` with glass border
- Border: `1px solid var(--glass-border)`, hover: gold border
- Padding: 32px
- Border-radius: 16px
- Step number: Circle (40px), gold border, gold text, positioned top-left
- Icon: 48px, line-style, gold stroke (SVG)
- Title: Outfit 600, 20px, white
- Description: Instrument Sans 400, 15px, gray-300
- Connecting line between steps (dashed, gold at 20% opacity, desktop only)

**Hover State:**
- Card lifts: `transform: translateY(-4px)`
- Border transitions to gold
- Subtle gold glow appears: `box-shadow: 0 8px 32px rgba(212, 168, 83, 0.08)`
- Duration: 300ms, ease-out-quart

**Mobile Layout:**
- Stack vertically
- Connecting line becomes vertical dashes
- Cards full-width

**Scroll Animation:**
- Each card fades up with 200ms stagger
- Connecting line draws itself (stroke-dashoffset animation)

---

### 5. What We Check Section

**Purpose:** Show comprehensive coverage. Build confidence.

**Visual Specs:**
- Section padding: 120px vertical
- 2-column grid (3x2) on desktop, single column on mobile

**Section Header:**
- Overline: "COMPREHENSIVE COVERAGE" (gold, uppercase)
- H2: "Everything Apple checks. We check first."
- Max-width: 700px

**6 Category Cards:**

| Category | Icon Concept | Description |
|----------|-------------|-------------|
| Metadata & Keywords | Tag/label icon | App name, subtitle, keywords, description length, special character violations |
| Screenshots & Previews | Image stack icon | Resolution, device frames, text overlay compliance, preview video requirements |
| Privacy Manifest | Shield/lock icon | Required API declarations, privacy nutrition labels, third-party SDK disclosures |
| Info.plist | Code/config icon | Required keys, permissions strings, capability declarations, version formatting |
| URL Reachability | Link/chain icon | Privacy policy URL, support URL, marketing URL — all verified accessible |
| Content Policy | Checkmark/document icon | Age rating accuracy, objectionable content flags, gambling/health disclaimers |

**Card Design:**
- Height: Auto (content-driven), min-height: 200px
- Background: `var(--bg-elevated)` with noise texture at 1%
- Border: `1px solid var(--gray-800)`
- Border-radius: 16px
- Padding: 28px
- Icon: 40px, contained in a 56px circle with `var(--accent-subtle)` background
- Title: Outfit 600, 18px, white, margin-top: 16px
- Description: Instrument Sans 400, 14px, gray-300, margin-top: 8px
- Bottom detail: "12 checks" or similar (caption size, gray-500)

**Hover State:**
- Top border glow: `border-top-color: var(--accent)` with gradient fade
- Icon circle: background becomes slightly more gold
- Subtle lift: `translateY(-2px)`

**Special Treatment: Animated Score Mockup**
- Below the grid, show a "preview" of what a report looks like
- Circular progress indicator (SVG) filling to "87/100" in gold
- Animated on scroll entry (counter counts up, circle fills)
- Caption: "Example PreFlight Score"
- Surrounding mini-cards showing "Pass" / "Warning" / "Fail" indicators

---

### 6. Pricing Section

**Purpose:** Clear, simple pricing. No confusion. Emphasis on Full Review.

**Visual Specs:**
- Section padding: 120px vertical
- Cards centered, max-width: 800px
- Background: subtle radial gradient behind cards (dark center, even darker edges)

**Section Header:**
- Overline: "SIMPLE PRICING" (gold, uppercase)
- H2: "Pay per review. No subscription."
- Subhead: "One-time payment for each app submission review."

**Two Pricing Cards (side by side):**

#### Quick Review ($29)
- Border: `1px solid var(--gray-800)`
- Background: `var(--bg-elevated)`
- Padding: 40px 32px
- Border-radius: 20px
- Header: "Quick Review" (Outfit 600, 16px, gray-300)
- Price: "$29" (Outfit 800, 48px, white)
- Per: "per review" (14px, gray-500)
- Divider: `1px solid var(--gray-800)`, margin 24px 0
- Features list with checkmarks (green):
  - Metadata validation
  - Screenshot compliance
  - URL reachability
  - Basic Info.plist check
- CTA: Ghost button "Coming Soon" (disabled state)

#### Full Review ($49) - FEATURED
- Border: `1px solid var(--accent)` with subtle gradient
- Background: gradient from `rgba(212, 168, 83, 0.04)` to transparent
- "RECOMMENDED" badge: top-right, gold pill
- Price: "$49" (Outfit 800, 48px, gold gradient text)
- All Quick Review features PLUS:
  - Privacy manifest deep analysis
  - Content policy review
  - Detailed fix instructions
  - Priority processing
- CTA: Gold filled button "Coming Soon" (disabled but styled premium)
- Subtle animated border (gradient rotation, very slow 8s, barely perceptible)

**Mobile:** Stack vertically, Full Review first (featured on top)

---

### 7. FAQ Section

**Purpose:** Address objections. Reduce friction.

**Visual Specs:**
- Section padding: 120px vertical
- Max-width: 700px, centered
- Accordion style

**Section Header:**
- Overline: "FAQ" (gold, uppercase)
- H2: "Questions? Answered."

**FAQ Items:**

| Question | Answer |
|----------|--------|
| How does PreFlight work? | Upload your app's metadata (or .ipa file for Full Review). Our AI simulates Apple's review guidelines against your submission, checking 50+ potential rejection reasons. You get a detailed report in under 5 minutes. |
| Is this guaranteed to prevent rejection? | No tool can guarantee approval - Apple's review is ultimately human. But PreFlight catches the most common rejection reasons (metadata issues, missing privacy declarations, screenshot violations) that account for ~70% of first-time rejections. |
| What's the difference between Quick and Full? | Quick Review checks your metadata, screenshots, and URLs. Full Review adds deep privacy manifest analysis, content policy checking, and provides specific fix instructions for every issue found. |
| Do you store my app data? | Your submission data is encrypted in transit and at rest. We retain it only for the duration of the review (typically under 5 minutes) and delete it within 24 hours. We never share your data. |
| Can I use this for app updates too? | Absolutely. Many developers run PreFlight before every update, not just initial submissions. The guidelines change frequently, and PreFlight stays current. |
| When does PreFlight launch? | We're currently in private beta. Join the waitlist to get early access and a launch discount. |

**Accordion Design:**
- Each item: full-width, border-bottom `1px solid var(--gray-800)`
- Question row: flex, space-between, padding 24px 0
- Question text: Outfit 500, 17px, white
- Chevron icon: right side, rotates 180deg on open
- Answer: Instrument Sans 400, 15px, gray-300, padding-bottom 24px
- Open/close: Svelte slide transition (300ms, ease-out-expo)
- Only one open at a time

---

### 8. Final CTA / Waitlist Repeat

**Purpose:** Catch visitors who scrolled through everything. Last chance conversion.

**Visual Specs:**
- Padding: 160px vertical
- Centered text
- Background: Radial gradient glow (gold, very subtle, from center)

**Content:**
```
[H2: "Ready to stop guessing?"]
[Subhead: "Join the waitlist. Be first to know when PreFlight launches."]
[Waitlist form - same as hero]
```

---

### 9. Footer

**Purpose:** Navigation, legal, brand presence.

**Visual Specs:**
- Padding: 48px vertical
- Border-top: `1px solid var(--gray-800)`
- Background: `var(--bg)`

**Layout (desktop):**
```
PreFlight                                    Product  |  Company  |  Legal
"Your pre-submission                         How it   |  About    |  Privacy
 copilot."                                   Works    |  Contact  |  Terms
                                             Pricing  |  Blog     |
                                             FAQ      |           |
```

**Bottom row:**
```
(c) 2026 PreFlight. All rights reserved.              [Twitter] [GitHub]
```

**Mobile:** Stack columns, logo on top, links below, bottom row last

---

## SVG / Illustration Concepts

### Icon Set (Line style, 2px stroke, gold on dark)

All icons should be custom SVG, consistent style:
- Stroke-width: 1.5-2px
- Rounded caps and joins
- Gold stroke (`#D4A853`) or white stroke depending on context
- 24px base size, scalable

**Needed icons:**
1. **Upload** - Arrow up into a cloud/box shape
2. **Analyze** - Magnifying glass with circuit/AI nodes
3. **Fix** - Wrench with checkmark
4. **Metadata** - Tag/label with text lines
5. **Screenshots** - Stacked phone frames
6. **Privacy** - Shield with lock
7. **Info.plist** - Gear with code brackets
8. **URL** - Chain link with signal waves
9. **Content** - Document with checkmark seal
10. **Chevron** - Simple 45-degree angle
11. **Arrow right** - For CTA buttons
12. **Check** - For feature lists
13. **X** - For "what competitors miss" (if used)

### Hero Background Treatment

```
- Base: solid #08080a
- Layer 1: Radial gradient from top-center, gold at 3% opacity, radius 60%
- Layer 2: Very subtle grid pattern (1px lines, white at 2% opacity, 80px spacing)
- Layer 3: Noise texture SVG at 2% opacity, fixed position
- Layer 4 (optional): 2-3 floating orbs, gold, heavily blurred (80px blur), slowly drifting
```

### Animated Score Circle (What We Check section)

```svg
<!-- Concept: Circular progress with score -->
<svg viewBox="0 0 200 200">
  <!-- Track (gray) -->
  <circle cx="100" cy="100" r="85" fill="none" stroke="var(--gray-800)" stroke-width="8" />
  <!-- Progress (gold gradient) - animated stroke-dashoffset -->
  <circle cx="100" cy="100" r="85" fill="none"
          stroke="url(#goldGradient)" stroke-width="8"
          stroke-dasharray="534" stroke-dashoffset="70"
          stroke-linecap="round" transform="rotate(-90, 100, 100)" />
  <!-- Score text -->
  <text x="100" y="95" text-anchor="middle" font-family="Outfit" font-weight="800"
        font-size="48" fill="white">87</text>
  <text x="100" y="125" text-anchor="middle" font-family="Instrument Sans"
        font-size="14" fill="var(--gray-300)">/100</text>
</svg>
```

---

## Interaction & Animation Details

### Scroll-Triggered Reveals

**Implementation:** Svelte `use:action` directive with IntersectionObserver

```typescript
// Scroll reveal action
export function reveal(node: HTMLElement, options = {}) {
    const { threshold = 0.15, delay = 0, duration = 600 } = options;

    node.style.opacity = '0';
    node.style.transform = 'translateY(24px)';
    node.style.transition = `opacity ${duration}ms var(--ease-out-expo) ${delay}ms,
                             transform ${duration}ms var(--ease-out-expo) ${delay}ms`;

    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
            observer.disconnect();
        }
    }, { threshold });

    observer.observe(node);
}
```

**Usage per section:**
- Hero: Auto on mount (no scroll trigger)
- Stats: Threshold 0.3, stagger 150ms per stat
- How It Works: Threshold 0.15, stagger 200ms per card
- What We Check: Threshold 0.15, stagger 100ms per card
- Score circle: Threshold 0.5 (start fill animation when well in view)
- Pricing: Threshold 0.2, stagger 150ms per card
- FAQ: No reveal (instant, already at natural scroll)
- Final CTA: Threshold 0.3

### Micro-Interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Gold CTA button | Hover | `translateY(-2px)`, gold glow shadow expands |
| Gold CTA button | Active | `translateY(0px)`, `scale(0.98)` |
| Ghost button | Hover | Border color to gold, subtle gold bg tint |
| Nav logo | Hover | Gold dot pulses once |
| Step cards | Hover | Lift + gold border + glow |
| Category cards | Hover | Top-border gold accent + slight lift |
| FAQ chevron | Toggle | Rotate 180deg, 300ms |
| Pricing featured card | Ambient | Border gradient slowly rotates (8s loop) |
| Score circle | Scroll-in | Counter animates 0->87, circle fills |
| Input focus | Focus | Gold ring glow (`box-shadow`) |
| Waitlist submit | Success | Form fades out, checkmark scales in with spring easing |

### Animated Gradient Border (Featured Pricing Card)

```css
.pricing-card.featured {
    position: relative;
    background: var(--bg-elevated);
    border: none;
}

.pricing-card.featured::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 1px;
    background: conic-gradient(
        from var(--angle, 0deg),
        transparent 40%,
        var(--accent) 50%,
        transparent 60%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: rotate-border 8s linear infinite;
}

@keyframes rotate-border {
    to { --angle: 360deg; }
}

/* Requires @property for custom property animation */
@property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}
```

---

## Page Layout - Section Flow

```
+--------------------------------------------------+
|  [Nav - fixed, glassmorphism]                    |
+--------------------------------------------------+
|                                                  |
|  [Hero - 100vh]                                  |
|  Gold radial glow from top                       |
|  Grid texture background                         |
|                                                  |
+--------------------------------------------------+
|  [Stats Bar - subtle divider]                    |
|  3 columns: checks, time, rate                   |
+--------------------------------------------------+
|                                                  |
|  [How It Works - alt bg]                         |
|  3 step cards with connecting line               |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [What We Check - main bg]                       |
|  6 category cards (3x2 grid)                     |
|  Score circle mockup below                       |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Pricing - subtle radial bg]                    |
|  2 cards side by side                            |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [FAQ - main bg]                                 |
|  Accordion items                                 |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [Final CTA - gold radial glow]                  |
|  Repeat waitlist form                            |
|                                                  |
+--------------------------------------------------+
|  [Footer - bordered top]                         |
|  Links, copyright, social                        |
+--------------------------------------------------+
```

---

## File Structure (Recommended)

```
src/
  routes/
    +page.svelte          (Landing page - main composition)
    +page.server.ts       (Waitlist form action)
    +layout.svelte        (Nav + global layout)
  lib/
    components/
      landing/
        Hero.svelte
        StatsBar.svelte
        HowItWorks.svelte
        WhatWeCheck.svelte
        ScoreCircle.svelte
        Pricing.svelte
        FAQ.svelte
        FinalCTA.svelte
        Footer.svelte
    actions/
      reveal.ts           (Scroll-triggered reveal action)
      countUp.ts          (Number counter animation action)
    icons/
      Upload.svelte
      Analyze.svelte
      Fix.svelte
      Metadata.svelte
      Screenshots.svelte
      Privacy.svelte
      InfoPlist.svelte
      Url.svelte
      ContentPolicy.svelte
      Check.svelte
      ChevronDown.svelte
      ArrowRight.svelte
```

---

## Responsive Behavior Summary

| Section | Desktop (1024+) | Tablet (768-1023) | Mobile (<768) |
|---------|-----------------|-------------------|----------------|
| Hero | H1 72px, form horizontal | H1 52px, form horizontal | H1 44px, form stacked |
| Stats | 3 columns with dividers | 3 columns, no dividers | Stacked, center-aligned |
| How It Works | 3 cards in row + connecting line | 3 cards, tighter gap | Stacked, vertical line |
| What We Check | 3x2 grid | 2x3 grid | Single column |
| Score Circle | Inline with content | Below grid, centered | Below grid, smaller |
| Pricing | Side by side | Side by side | Stacked (featured first) |
| FAQ | Max-width 700px | Full container | Full container |
| Footer | 4-column | 2x2 grid | Single column |

---

## Accessibility Requirements

- All interactive elements: minimum 44x44px touch targets on mobile
- Color contrast: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- Gold `#D4A853` on `#08080a`: Contrast ratio ~7.2:1 (passes AAA)
- White `#f4f4f5` on `#08080a`: Contrast ratio ~18.7:1 (passes AAA)
- Gray-300 `#a8a5a0` on `#08080a`: Contrast ratio ~5.3:1 (passes AA)
- Focus states: Visible gold ring on all interactive elements
- Skip-to-content link (hidden, shown on focus)
- FAQ: Proper `aria-expanded`, `aria-controls`, `role="button"` on triggers
- Form: `aria-label`, `aria-describedby` for error messages
- Reduced motion: Respect `prefers-reduced-motion` (disable scroll animations, keep opacity transitions)
- Semantic HTML: Proper heading hierarchy, landmark roles, lists

---

## Performance Considerations

- **Critical CSS:** Inline above-the-fold styles for hero
- **Font Loading:** `display=swap` (already implemented)
- **Images:** None needed for landing page (all SVG/CSS)
- **Animations:** CSS-only where possible (GPU-accelerated transforms/opacity)
- **IntersectionObserver:** Disconnect after triggering (already in spec)
- **SVG Icons:** Inline Svelte components (no HTTP requests)
- **Noise texture:** Tiny inline SVG data-URI, not an image file
- **No JavaScript for layout:** All layout works without JS (progressive enhancement)

---

## Implementation Roadmap

1. [ ] Update `app.css` with expanded design tokens (colors, spacing, typography, animations)
2. [ ] Create `src/lib/actions/reveal.ts` (scroll reveal action)
3. [ ] Create `src/lib/actions/countUp.ts` (number animation action)
4. [ ] Create icon components in `src/lib/icons/`
5. [ ] Build `Hero.svelte` with waitlist form, entrance animations
6. [ ] Build `StatsBar.svelte` with counter animations
7. [ ] Build `HowItWorks.svelte` with step cards and connecting line
8. [ ] Build `WhatWeCheck.svelte` with category grid
9. [ ] Build `ScoreCircle.svelte` with animated SVG fill
10. [ ] Build `Pricing.svelte` with animated border on featured card
11. [ ] Build `FAQ.svelte` with accordion
12. [ ] Build `FinalCTA.svelte` (reuse waitlist form)
13. [ ] Build `Footer.svelte`
14. [ ] Compose all in `+page.svelte`
15. [ ] Add noise texture and background effects
16. [ ] Responsive testing across all breakpoints
17. [ ] Accessibility audit (keyboard nav, screen reader, contrast)
18. [ ] Performance audit (Lighthouse, Core Web Vitals)
19. [ ] `prefers-reduced-motion` implementation

---

## Key Design Principles

1. **Depth through layering** - Glass surfaces, gradient borders, subtle shadows create z-axis depth without heavy 3D
2. **Gold as accent only** - Never more than 15% gold on any screen. It should feel precious, not overwhelming
3. **Motion with purpose** - Every animation communicates something (reveal = content hierarchy, hover = interactivity, scroll = progress)
4. **Typography does the heavy lifting** - The Outfit/Instrument Sans pairing creates visual hierarchy without needing many decorative elements
5. **Dark != boring** - The noise texture, subtle gradients, and glass effects keep the dark background feeling alive and premium
6. **Content density** - Generous whitespace (120px between sections) gives each component room to breathe
7. **Trust through precision** - Pixel-perfect alignment, consistent spacing, and careful typography signal "we care about details" which is exactly what PreFlight promises for your app
