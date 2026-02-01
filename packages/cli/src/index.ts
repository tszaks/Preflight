import { Command } from 'commander'
import { loginCommand } from './commands/login.js'
import { logoutCommand } from './commands/logout.js'
import { whoamiCommand } from './commands/whoami.js'
import { creditsCommand } from './commands/credits.js'
import { scanCommand } from './commands/scan.js'
import { submitCommand } from './commands/submit.js'
import { statusCommand } from './commands/status.js'
import { reportCommand } from './commands/report.js'
import { historyCommand } from './commands/history.js'
import { setupCommand } from './commands/setup.js'
import { runOnboarding } from './commands/onboarding.js'
import { handleUnknownCommand } from './ui/errors.js'
import { isLoggedIn, hasRunBefore } from './lib/config.js'
import * as ui from './ui/interactive.js'
import { brand } from './ui/theme.js'

const program = new Command()

program
    .name('preflight')
    .description('Preflight - App Store Review Scanner')
    .version('0.1.0')

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

// Handle unknown commands with fuzzy matching
program.on('command:*', (operands) => {
    handleUnknownCommand(operands[0])
    process.exitCode = 1
})

// Interactive welcome menu when run with no arguments
async function interactiveMenu() {
    // First-run onboarding
    if (!hasRunBefore()) {
        await runOnboarding()
        return
    }

    ui.intro()
    ui.showTagline()

    const loggedIn = isLoggedIn()

    const options = loggedIn
        ? [
              { value: 'scan' as const, label: 'Scan my app', hint: 'Free preview' },
              { value: 'submit' as const, label: 'Submit for full AI analysis', hint: 'Uses 1 credit' },
              { value: 'history' as const, label: 'View my reports', hint: 'Past submissions' },
              { value: 'account' as const, label: 'Check account & credits', hint: '' },
              { value: 'help' as const, label: 'Help - show all commands', hint: '' },
          ]
        : [
              { value: 'scan' as const, label: 'Scan my app', hint: 'Free, no login needed' },
              { value: 'login' as const, label: 'Log in to your account', hint: 'Opens browser' },
              { value: 'help' as const, label: 'Help - show all commands', hint: '' },
          ]

    const choice = await ui.select({
        message: 'What would you like to do?',
        options,
    })

    if (choice === null) return

    switch (choice) {
        case 'scan':
            await scanCommand()
            break
        case 'submit':
            await submitCommand()
            break
        case 'login':
            await loginCommand()
            break
        case 'history':
            await historyCommand({})
            break
        case 'account':
            await whoamiCommand()
            break
        case 'help':
            program.outputHelp()
            break
    }
}

// If no args provided (just `preflight`), show interactive menu
if (process.argv.length <= 2) {
    interactiveMenu().catch((err) => {
        console.error(err)
        process.exit(1)
    })
} else {
    program.parse()
}
