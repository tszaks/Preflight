# Preflight Marketing Site (Astro)

This is the **marketing site** for Preflight - built with Astro for fast, SEO-friendly static pages.

## What This Is

- **Public marketing pages**: Landing page, pricing, privacy policy, terms
- **Built with**: Astro + Svelte components
- **Deployment**: Static site on Railway
- **Links to**: SvelteKit app (on same domain)

---

## Architecture

```
https://mypreflight.com/           → This Astro site (marketing)
https://mypreflight.com/dashboard  → SvelteKit app (authenticated pages)
https://mypreflight.com/submit     → SvelteKit app
https://mypreflight.com/api/*      → SvelteKit API routes
```

**How it works:**
- Astro handles all **public marketing pages** (/, /pricing, /privacy, /terms)
- SvelteKit handles all **app functionality** (/dashboard, /submit, /report/*, /api/*)
- Both are deployed separately but share a domain via Railway routing

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deployment to Railway

The marketing site is configured for Railway deployment:

1. **Build command**: `npm run build`
2. **Start command**: `node server.js`
3. **Port**: Uses `PORT` environment variable
4. **Static files**: Served from `dist/` folder

The `server.js` is a simple Node HTTP server that:
- Serves static files from `dist/`
- Handles clean URLs (e.g., `/privacy` → `/privacy/index.html`)
- Sets correct MIME types for all assets

---

## Pages

### Home (`/`)
- Hero with CTA to app signup
- "How It Works" section
- Pricing overview
- FAQ
- Final CTA

### Pricing (`/pricing`)
Shows 4 credit packages:
- **Starter**: 100 credits - $49 (1 app review)
- **Pro**: 350 credits - $129 (3 apps)
- **Team**: 750 credits - $249 (7 apps)
- **Agency**: 1500 credits - $449 (15 apps)

All buttons link to: `https://preflight-production-998a.up.railway.app/pricing`

### Privacy (`/privacy`)
Privacy policy page

### Terms (`/terms`)
Terms of service page

---

## Updating Content

**To change pricing:**
Edit: `src/components/Pricing.svelte`

**To change hero:**
Edit: `src/components/Hero.svelte`

**To change navigation:**
Edit: `src/components/Nav.svelte`

**To change footer:**
Edit: `src/components/Footer.svelte`

---

## Important Notes

- All "Get Started" / "Buy Credits" buttons point to the **SvelteKit app** (not this site)
- This site is **static** - no authentication, no database, no server-side logic
- The SvelteKit app handles all dynamic functionality
- Railway routing ensures both sites work on the same domain

---

## Tech Stack

- **Astro 5**: Static site generator
- **Svelte 5**: Component framework (for interactive elements)
- **TypeScript**: Type safety
- **Custom animations**: Using CSS `$effect()` and reveal actions
- **Responsive design**: Mobile-first approach

---

## Environment

No environment variables needed - this is a static site.

App URL is hardcoded to: `https://preflight-production-998a.up.railway.app`
(Will be updated to custom domain later)
