# Self-Hosting Preflight

Preflight does not require Tyler or Szakacs Media to run hosted infrastructure. The CLI local scan works without any backend. The web app is for teams that want to run their own backend.

## Local CLI Only

Use this when you only need static App Store readiness checks.

```bash
npm install
npm run build:cli
node packages/cli/dist/index.js scan ./MyApp
```

This mode does not need Supabase, Stripe, Anthropic, Vercel, or Railway.

## Full Web Workflow

Use this when you want account auth, uploads, stored reports, App Store Connect integration, or AI analysis.

You provide:

- A Supabase project
- An Anthropic API key
- A public base URL if you deploy outside localhost
- Optional App Store Connect API credentials

Stripe and paid credits are not used by default in the open-source branch.

## Environment

Create `packages/web/.env.local` from the template:

```bash
cp packages/web/.env.example packages/web/.env.local
```

Required for the web app:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:5173
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
WORKER_SECRET=replace-with-random-string
ASC_ENCRYPTION_KEY=64-hex-characters
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-side. Do not expose it in browser code or commit it to git.

## Database

Migrations are in `supabase/migrations`.

This repository keeps the historical credit tables and columns for compatibility, but open-source Preflight sets credit costs to zero by default. If you do not want any credit tables, remove them in your own fork after checking the API routes you use.

## Storage

The upload flow expects private Supabase Storage buckets for:

- `screenshots`
- `plists`
- `manifests`
- `ipas`

Grant access through server-generated signed upload URLs only.

## CLI Against Your Self-Hosted App

Point the CLI at your app:

```bash
export PREFLIGHT_API_URL=http://localhost:5173
export PREFLIGHT_SUPABASE_URL=https://your-project.supabase.co
export PREFLIGHT_SUPABASE_ANON_KEY=your-anon-key
```

Then use:

```bash
preflight login
preflight submit ./MyApp
```

For no-backend checks, use:

```bash
preflight scan ./MyApp
```
