# Preflight CLI

Preflight CLI checks iOS projects for App Store review risks from your terminal.

## Install

```bash
npm install -g preflightlaunch
```

## Local Scan

```bash
preflight scan ./MyApp
```

Local scans do not need an account, backend, or hosted Preflight service.

## Self-Hosted Full Analysis

If you run the optional Preflight web app yourself, point the CLI at it:

```bash
export PREFLIGHT_API_URL=http://localhost:5173
export PREFLIGHT_SUPABASE_URL=https://your-project.supabase.co
export PREFLIGHT_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```bash
preflight login
preflight submit ./MyApp --app-name "My App"
preflight report <submission-id>
```

## Commands

| Command | Description |
|---------|-------------|
| `preflight scan [path]` | Local scan of iOS project files |
| `preflight login` | Authenticate with your configured self-hosted web app |
| `preflight logout` | Clear stored credentials |
| `preflight submit [path]` | Submit project to your configured backend for full analysis |
| `preflight status [id]` | Check submission status |
| `preflight report [id]` | View analysis results |
| `preflight history` | List past submissions from your configured backend |
| `preflight credits` | Show legacy backend quota if your fork keeps credits enabled |

## License

AGPL-3.0-only.
