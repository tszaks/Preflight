# Preflight - App Store Review Simulator

## What It Is
Preflight analyzes iOS app submissions BEFORE you send them to Apple. It runs the same checks Apple does (Info.plist validation, privacy manifest review, screenshot analysis) plus AI-powered guideline review using Claude.

**Primary Use Case:** Tyler wants to test Preflight by uploading Vero's files and watching it generate a real review report.

---

## Quick Commands

| Tyler Says | Claude Does |
|------------|-------------|
| "test vero" | Run Vero files through Preflight locally |
| "deploy" | Deploy to Railway |
| "check preflight" | Read this file + recent changes |

---

## Tech Stack

- **Frontend:** SvelteKit 2 + Svelte 5 (TypeScript)
- **Backend:** SvelteKit server routes + Edge Functions
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (screenshots, plists, manifests)
- **AI:** Anthropic Claude API (soft rules analysis)
- **Payments:** Stripe (bypass in test mode)
- **Hosting:** Railway (planned) or Vercel

---

## Project Structure

```
src/
├── lib/
│   ├── engine/              # Analysis engine (hard + soft rules)
│   │   ├── hard-rules/      # Deterministic checks (regex, XML parsing)
│   │   ├── soft-rules/      # AI analysis (Claude prompts)
│   │   ├── knowledge-base/  # Apple guidelines, requirements
│   │   ├── report/          # Scoring + report generation
│   │   └── index.ts         # Main orchestrator
│   └── utils/
│       └── project-scanner.ts  # Scans uploaded folders for iOS files
└── routes/
    ├── submit/              # File upload form
    ├── report/[id]/         # Report display page
    ├── dashboard/           # User submissions list
    └── api/
        ├── worker/          # Analysis job processor
        ├── checkout/        # Stripe integration
        └── webhooks/        # Stripe webhooks
```

---

## Analysis Pipeline

**Phase 1: Hard Rules (Instant, Deterministic)**
- Metadata validation (app name length, keyword count)
- Screenshot checks (format, size, count)
- Info.plist parsing (required keys, bundle ID format, version format)
- Privacy manifest validation (API types, reason codes)
- URL reachability tests

**Phase 2: Soft Rules (AI-Powered, Contextual)**
- Description analysis (misleading claims, keyword spam)
- Screenshot content review (fake UI, inappropriate content)
- Privacy policy cross-check (manifest vs policy)
- Content policy compliance (age rating, user-generated content)
- ASO suggestions (metadata optimization)

**Phase 3: Report Generation**
- Scoring algorithm (weighted by severity)
- Issue categorization
- Fix suggestions
- Overall pass/fail recommendation

---

## Test Mode Setup

### 1. Fill Required Environment Variables

```bash
# Copy from .env.example
cp .env.example .env

# Fill in these keys:
ANTHROPIC_API_KEY=sk-ant-...       # From console.anthropic.com
WORKER_SECRET=<any_random_string>   # Make one up
SUPABASE_SERVICE_ROLE_KEY=...      # From Supabase dashboard
```

### 2. Create Supabase Tables

Run the migrations in `supabase/migrations/` (if they exist) or manually create:
- `submissions` - App submission metadata
- `analysis_jobs` - Background job queue
- `reports` - Generated analysis reports
- `report_items` - Individual check results

### 3. Create Storage Buckets

In Supabase dashboard, create:
- `screenshots` (public read)
- `manifests` (private)
- `plists` (private)

### 4. Enable Test Mode

Create a test mode route or add `?test=true` param to skip Stripe.

---

## Testing Against Vero

### Vero's Files (Located at /Users/tyler/Projects/AskVero/ios/):

| File | Path |
|------|------|
| Info.plist | `Vero/Resources/Info.plist` |
| Privacy Manifest | `Vero/Resources/PrivacyInfo.xcprivacy` |
| App Metadata | `docs/APP_STORE_METADATA.md` |
| Submission Guide | `docs/APP_STORE_SUBMISSION_GUIDE.md` |

### Test Data to Upload:

```
App Name: Ask Vero
Subtitle: Your money, finally simple
Category: Finance
Age Rating: 4+
Keywords: budget,spending,expense,tracker,finance,ai,assistant,bank,cash,bills,savings,planner,manager,wallet
Privacy URL: https://askvero.app/privacy
Support URL: https://askvero.app/help
Marketing URL: https://askvero.app
```

---

## Known Issues to Fix

### 1. Build Variable Handling
**Problem:** Vero's Info.plist uses `$(PRODUCT_BUNDLE_IDENTIFIER)` - Preflight will flag this as invalid.
**Fix:** Detect Xcode build variables and treat them as valid.

### 2. UIRequiredDeviceCapabilities Not Required
**Problem:** Preflight expects this key, but modern SwiftUI apps often omit it.
**Fix:** Make this key optional, only warn if missing.

### 3. Finance Category Rules Missing
**Problem:** No specific checks for finance apps (subscription compliance, financial advice disclaimers).
**Fix:** Add finance-specific guidelines to knowledge base.

### 4. Screenshot Analysis Untested
**Problem:** Vero doesn't have screenshots yet - can't validate Claude vision analysis.
**Fix:** Wait for Vero screenshots, or test with placeholder images.

---

## Deployment

### Railway (Recommended for SvelteKit)

1. Connect GitHub repo
2. Set environment variables in Railway dashboard
3. Railway auto-detects SvelteKit and deploys

### Vercel (Alternative)

1. Install Vercel adapter: `npm i -D @sveltejs/adapter-vercel`
2. Update `svelte.config.js` to use Vercel adapter
3. Deploy via Vercel CLI or GitHub integration

---

## Development

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:5175

# Run Supabase locally (optional)
supabase start
```

---

## Roadmap

- [ ] Test mode implementation (skip Stripe)
- [ ] Fix Vero-specific validation issues
- [ ] Add finance category guidelines
- [ ] Deploy to Railway
- [ ] Custom domain setup
- [ ] Screenshot generation for Vero
- [ ] Full end-to-end test with Vero files

---

## Critical Rules

- **Simple over complex** - Don't over-engineer
- **Test with real data** - Use Vero as the benchmark
- **Apple's rules, not ours** - Only flag real rejection risks
- **No brittle regex** - Learned from Vero: use structured parsing, not NL regex
