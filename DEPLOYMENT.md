# Preflight Deployment Guide

This guide explains how to deploy the **hybrid Astro + SvelteKit architecture** to Railway.

---

## Architecture Overview

Preflight uses a **two-service architecture**:

1. **Marketing Site (Astro)** - Static public pages
2. **App (SvelteKit)** - Dynamic authenticated pages + API

Both services share the same domain via Railway routing.

```
Domain: mypreflight.com (or preflight-production-998a.up.railway.app)

Public Routes (Astro):
  /                 → Landing page
  /pricing          → Pricing page
  /privacy          → Privacy policy
  /terms            → Terms of service

App Routes (SvelteKit):
  /auth/*           → Authentication
  /dashboard        → User dashboard
  /submit           → Submit app for review
  /report/:id       → View report
  /api/*            → API endpoints
```

---

## Railway Setup

### Service 1: Marketing Site (Astro)

**Repository**: Same repo, `marketing/` folder
**Build Command**: `npm run build`
**Start Command**: `node server.js`
**Root Directory**: `/marketing`

**Environment Variables**: None needed

**Build Settings**:
- Node version: 18+
- Package manager: npm
- Auto-deploys on push to main

---

### Service 2: App (SvelteKit)

**Repository**: Same repo, root folder
**Build Command**: `npm run build`
**Start Command**: `node build`
**Root Directory**: `/`

**Environment Variables**:
```bash
# Supabase
PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_BASE_URL=https://preflight-production-998a.up.railway.app

# Worker (internal)
WORKER_SECRET=<random_string>
```

**Build Settings**:
- Node version: 18+
- Package manager: npm
- Adapter: `@sveltejs/adapter-node`
- Auto-deploys on push to main

---

## Domain Routing (Optional)

To use a custom domain with both services:

### Option A: Path-based routing (easier)

Use Railway's built-in routing:
1. Point domain to marketing service
2. Configure app service with subdomain: `app.mypreflight.com`
3. Update marketing links to use subdomain

### Option B: Proxy routing (cleaner UX)

Use Cloudflare Workers or Nginx to route:
- `/`, `/pricing`, `/privacy`, `/terms` → Marketing service
- Everything else → App service

---

## Deployment Workflow

### 1. Deploy Marketing Site

```bash
cd marketing
npm install
npm run build
git add .
git commit -m "Update marketing site"
git push origin main
```

Railway will auto-deploy the marketing service.

### 2. Deploy App

```bash
cd ..  # Back to root
npm install
npm run build
git add .
git commit -m "Update app"
git push origin main
```

Railway will auto-deploy the app service.

### 3. Verify Both Services

**Marketing**: Visit `https://[marketing-service].up.railway.app`
- Should see landing page
- Pricing page should load
- All buttons should link to app

**App**: Visit `https://[app-service].up.railway.app`
- Should redirect to login
- Dashboard should load after auth
- Submit flow should work

---

## Testing Locally

### Test Marketing Site

```bash
cd marketing
npm install
npm run dev  # http://localhost:4321
```

### Test App

```bash
cd ..  # Back to root
npm install
npm run dev  # http://localhost:5173
```

### Test Together (Simulated)

Run both servers simultaneously:
```bash
# Terminal 1
cd marketing && npm run dev

# Terminal 2
cd .. && npm run dev
```

Then visit:
- `http://localhost:4321` for marketing
- `http://localhost:5173` for app

---

## Troubleshooting

### Marketing site not loading

1. Check Railway build logs
2. Verify `server.js` is running
3. Check `dist/` folder was created
4. Test locally with `npm run preview`

### App not loading

1. Check Railway build logs
2. Verify all environment variables are set
3. Check Supabase connection
4. Test locally with `.env` file

### Links between sites broken

1. Update hardcoded URLs in marketing components
2. Set `PUBLIC_BASE_URL` correctly in app `.env`
3. Check Railway service URLs match

---

## Post-Deployment Checklist

- [ ] Marketing site loads
- [ ] Pricing page shows credit packages
- [ ] "Get Started" button links to app signup
- [ ] App dashboard loads after login
- [ ] Submit flow works
- [ ] Stripe checkout redirects correctly
- [ ] Credits are granted after payment
- [ ] Analysis runs and generates report
- [ ] Re-review button works

---

## Future Improvements

- [ ] Custom domain setup
- [ ] CDN for marketing assets
- [ ] Split A/B testing for pricing
- [ ] Analytics integration (Plausible/Fathom)
- [ ] SEO optimization
- [ ] Open Graph images
- [ ] Blog section (optional)

---

## Support

If you run into issues:
1. Check Railway logs for both services
2. Verify environment variables
3. Test locally first
4. Check Supabase dashboard for errors
5. Review Stripe dashboard for payment issues
