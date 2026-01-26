# PREFLIGHT Marketing Site Deployment

**Date:** January 26, 2026

---

## Summary

Deployed the PREFLIGHT marketing site (Astro + Svelte) to Railway and connected auth links to the backend app.

---

## Problems Solved

### 1. Marketing Site Deployment to Railway
- **Issue:** Marketing site was a separate Astro project in `/marketing/` folder, needed deployment to Railway (not Vercel)
- **Solution:**
  - Created Dockerfile with Node 22 (Astro 5.x requires Node 18.20.8+)
  - Created static file server (`server.js`) since Astro builds to static HTML
  - Used `--path-as-root` flag for monorepo subdirectory deployment
  - Deployed successfully to: https://preflight-marketing-production.up.railway.app

### 2. Branding Consistency
- **Issue:** Branding was inconsistent ("PreFlight" vs "PREFLIGHT")
- **Solution:** Updated all components to use "PREFLIGHT" (all caps)
  - Nav.svelte, Hero.svelte, Footer.svelte, FAQ.svelte, FinalCTA.svelte, WhatWeCheck.svelte, Layout.astro

### 3. Auth Links Not Connected to Backend
- **Issue:** Login/signup links pointed to relative paths (`/auth/login`) which don't exist on marketing site
- **Solution:** Updated links to point to the backend app:
  - Login: `https://preflight-production-998a.up.railway.app/auth/login`
  - Signup: `https://preflight-production-998a.up.railway.app/auth/signup`

---

## Files Modified

### New Files
| File | Purpose |
|------|---------|
| `marketing/Dockerfile` | Node 22 container for Railway deployment |
| `marketing/server.js` | Static file server for Astro dist |
| `marketing/nixpacks.toml` | Node version config (backup) |
| `marketing/railway.toml` | Railway builder config |

### Modified Files
| File | Changes |
|------|---------|
| `marketing/astro.config.mjs` | Simplified to static output (removed Vercel adapter) |
| `marketing/package.json` | Added `start` script for Railway |
| `marketing/src/components/Nav.svelte` | Branding + login link to backend |
| `marketing/src/components/Pricing.svelte` | Signup link to backend |
| `marketing/src/components/Hero.svelte` | Branding update |
| `marketing/src/components/Footer.svelte` | Branding update |
| `marketing/src/components/FAQ.svelte` | Branding update |
| `marketing/src/components/FinalCTA.svelte` | Branding update |
| `marketing/src/components/WhatWeCheck.svelte` | Branding update |
| `marketing/src/layouts/Layout.astro` | Title update |

---

## Decisions Made

1. **Railway over Vercel** - Tyler uses Railway for all deployments
2. **Dockerfile over Nixpacks** - Nixpacks was using older Node version (18.20.5), Astro 5.x needs 18.20.8+
3. **Static file server** - Astro static output needs a server to handle clean URLs (`/privacy` vs `/privacy.html`)
4. **`--path-as-root` flag** - Critical for deploying subdirectories to Railway

---

## Key Learnings (Railway Skill Created)

Created `/Users/tyler/.claude/plugins/tyler-workflows/skills/railway.md` with:
- Essential Railway CLI commands
- Monorepo deployment (`--path-as-root`)
- Dockerfile vs Nixpacks decision tree
- Static site server template
- Common troubleshooting patterns

---

## Live URLs

| Service | URL |
|---------|-----|
| Marketing Site | https://preflight-marketing-production.up.railway.app |
| Backend App | https://preflight-production-998a.up.railway.app |

---

## Next Steps

- [ ] Connect waitlist form to actual backend API
- [ ] Consider custom domain setup (preflight.app or similar)
- [ ] Add analytics tracking to marketing site
