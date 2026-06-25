# Preflight

Open-source App Store review readiness checks for iOS apps.

Preflight has two modes:

- **Local CLI scan:** runs on your machine with no account, no hosted service, and no paid infrastructure.
- **Self-hosted web workflow:** optional Next.js app for uploads, reports, App Store Connect integration, and AI analysis using your own Supabase project and Anthropic API key.

There is no official hosted Preflight Cloud service in this repository.

## Quick Start

```bash
npm install
npm run build:cli
node packages/cli/dist/index.js scan ./MyApp
```

For CLI development:

```bash
npm run build:cli
node packages/cli/dist/index.js --help
```

## Self-Hosted Web App

The web app is optional. It needs your own infrastructure:

- Supabase for auth, database, and file storage
- Anthropic API key for AI analysis
- App Store Connect API credentials if you want ASC autofill

Copy the example env file before running the web app:

```bash
cp packages/web/.env.example packages/web/.env.local
npm run dev
```

Then open `http://localhost:5173`.

More detail is in [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).

## Configuration

The CLI defaults to the local web app:

```bash
PREFLIGHT_API_URL=http://localhost:5173
```

If you use Supabase-backed CLI auth/session refresh, also set:

```bash
PREFLIGHT_SUPABASE_URL=https://your-project.supabase.co
PREFLIGHT_SUPABASE_ANON_KEY=your-anon-key
```

## License

Preflight is licensed under AGPL-3.0-only. See [LICENSE](LICENSE).
