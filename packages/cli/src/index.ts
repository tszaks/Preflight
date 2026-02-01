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

program.parse()
