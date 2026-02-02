import { Command } from 'commander'
import { loginCommand } from './commands/login.js'
import { logoutCommand } from './commands/logout.js'
import { whoamiCommand } from './commands/whoami.js'
import { creditsCommand } from './commands/credits.js'
import { scanCommand } from './commands/scan.js'
import { submitCommand } from './commands/submit.js'
import { statusCommand } from './commands/status.js'
import { reportCommand } from './commands/report.js'
import { historyCommand, interactiveHistory } from './commands/history.js'
import { setupCommand } from './commands/setup.js'
import { showWelcomeScreen, showAuthScreen } from './commands/onboarding.js'
import { ascConnectCommand, ascStatusCommand, ascDisconnectCommand, ascRefreshCommand, ascInteractiveMenu } from './commands/asc.js'
import { updateCommand } from './commands/update.js'
import { handleUnknownCommand } from './ui/errors.js'
import { isLoggedIn, hasRunBefore, getConfig, setUser } from './lib/config.js'
import { clearAuth } from './lib/config.js'
import { apiRequest } from './lib/api-client.js'
import * as ui from './ui/interactive.js'
import { subtext } from './ui/theme.js'

const program = new Command()

program
    .name('preflight')
    .description('Preflight - App Store Review Scanner')
    .version('0.2.5')

// Auth commands
program
    .command('login')
    .description('Log in to Preflight (opens browser)')
    .action(loginCommand)

program
    .command('logout')
    .description('Log out and clear stored credentials')
    .action(logoutCommand)

program
    .command('whoami')
    .description('Show current user and credit balance')
    .action(whoamiCommand)

// Analysis commands
program
    .command('scan [path]')
    .description('Scan project directory for App Store files (dry run)')
    .action(scanCommand)

program
    .command('submit [path]')
    .description('Submit app for full App Store review analysis')
    .option('-n, --app-name <name>', 'App name (auto-detected if omitted)')
    .option('--ipa <path>', 'Path to IPA file')
    .option('--plist <path>', 'Path to Info.plist')
    .option('--manifest <path>', 'Path to PrivacyInfo.xcprivacy')
    .option('--screenshots <glob>', 'Screenshot paths (glob pattern)')
    .option('--json', 'Output results as JSON')
    .action(submitCommand)

program
    .command('status [id]')
    .description('Check analysis status')
    .option('-w, --watch', 'Poll until complete')
    .option('--json', 'Output as JSON')
    .action(statusCommand)

program
    .command('report [id]')
    .description('View full analysis report')
    .option('--json', 'Output raw JSON')
    .option('--open', 'Open report in browser')
    .action(reportCommand)

// Utility commands
program
    .command('history')
    .description('List past submissions')
    .option('--json', 'Output as JSON')
    .action(historyCommand)

program
    .command('credits')
    .description('Show credit balance')
    .action(creditsCommand)

program
    .command('setup')
    .description('Run guided setup (can be re-run anytime)')
    .action(setupCommand)

program
    .command('update')
    .description('Update Preflight to the latest version')
    .action(updateCommand)

// App Store Connect commands
const ascCmd = program
    .command('asc')
    .description('App Store Connect integration')

ascCmd
    .command('connect')
    .description('Connect your App Store Connect account')
    .action(ascConnectCommand)

ascCmd
    .command('status')
    .description('Check App Store Connect connection status')
    .action(ascStatusCommand)

ascCmd
    .command('refresh')
    .description('Pull latest metadata from App Store Connect')
    .action(ascRefreshCommand)

ascCmd
    .command('disconnect')
    .description('Disconnect from App Store Connect')
    .action(ascDisconnectCommand)

// Handle unknown commands with fuzzy matching
program.on('command:*', (operands) => {
    handleUnknownCommand(operands[0])
    process.exitCode = 1
})

// ─── Full-Screen Interactive App ─────────────────────────────────────────

// Fetch credit balance (cached between menu renders)
async function fetchCredits(): Promise<number | undefined> {
    try {
        const res = await apiRequest('/api/credits')
        if (!res.ok) return undefined
        const data = await res.json()
        return data.credits ?? undefined
    } catch {
        return undefined
    }
}

// Open URL with fallback
async function openUrl(url: string): Promise<void> {
    try {
        const open = (await import('open')).default
        await open(url)
    } catch {
        console.log(subtext(`  Visit: ${url}`))
    }
}

async function interactiveMenu() {
    // Screen 0: Welcome (first run only)
    if (!hasRunBefore()) {
        const welcomed = await showWelcomeScreen()
        if (!welcomed) return
    }

    // Screen 1: Auth (if not logged in)
    if (!isLoggedIn()) {
        const authenticated = await showAuthScreen()
        if (!authenticated) return
    }

    // Backfill email if missing (users who logged in with older CLI versions)
    if (!getConfig().email) {
        try {
            const res = await apiRequest('/api/me')
            if (res.ok) {
                const data = await res.json()
                if (data.user?.email) {
                    setUser(data.user.id, data.user.email)
                }
            }
        } catch {}
    }

    // Screen 2: Main Menu (loops until Esc or Log Out)
    let cachedCredits: number | undefined

    // Initial credit fetch
    cachedCredits = await fetchCredits()

    while (true) {
        const { email } = getConfig()
        ui.renderHeader(email, cachedCredits)

        const choice = await ui.select<'review' | 'history' | 'buy' | 'asc' | 'logout'>({
            message: 'What would you like to do?',
            options: [
                { value: 'review', label: 'New Review', hint: 'Scan your app for App Store issues' },
                { value: 'history', label: 'View Reviews', hint: 'See your past review reports' },
                { value: 'buy', label: 'Buy Credits', hint: 'Get more credits at preflightlaunch.com' },
                { value: 'asc', label: 'App Store Connect', hint: 'Connect your ASC account for autofill' },
                { value: 'logout', label: 'Log Out' },
            ],
        })

        if (choice === null) {
            // Esc pressed -- quit
            console.log()
            console.log(subtext('  See you next time!'))
            console.log()
            return
        }

        switch (choice) {
            case 'review':
                await submitCommand(undefined, {}, true)
                // Refresh credits after submission (may have been spent)
                cachedCredits = await fetchCredits()
                break

            case 'history':
                await interactiveHistory()
                break

            case 'buy':
                await openUrl('https://preflightlaunch.com/pricing')
                ui.log.info('Opened pricing page in browser.')
                // Refresh credits (user may have purchased)
                await new Promise(r => setTimeout(r, 2000))
                cachedCredits = await fetchCredits()
                break

            case 'asc':
                await ascInteractiveMenu()
                break

            case 'logout':
                clearAuth()
                // Show auth screen again
                const authenticated = await showAuthScreen()
                if (!authenticated) return
                // Refresh credits for new user
                cachedCredits = await fetchCredits()
                break
        }
    }
}

// ─── Entry Point ─────────────────────────────────────────────────────────

// If no args provided (just `preflight`), show full-screen interactive app
if (process.argv.length <= 2) {
    interactiveMenu().catch((err) => {
        console.error(err)
        process.exit(1)
    })
} else {
    program.parse()
}
