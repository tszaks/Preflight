import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { scanCommand } from './commands/scan.js'
import { updateCommand } from './commands/update.js'
import { handleUnknownCommand } from './ui/errors.js'
import { applyThemePatch } from './ui/theme.js'

applyThemePatch()

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

const program = new Command()

program
    .name('preflight')
    .description('Preflight - local App Store review scanner')
    .version(pkg.version)

program
    .command('scan [path]')
    .description('Scan an iOS project locally for App Store review risks')
    .option('--json', 'Emit machine-readable JSON on stdout and nothing else')
    .option('-y, --yes', 'Accept defaults without prompting (implied when not a TTY)')
    .option('--fail-on <level>', 'Exit non-zero at this severity or above: critical, warning, info', 'critical')
    .option('--app-name <name>', 'App name (defaults to the detected app target)')
    .option('--description <text>', 'App Store description text to check')
    .option('--privacy-url <url>', 'Privacy policy URL to validate and reach')
    .option('--terms-url <url>', 'Terms of Use (EULA) URL to validate and reach')
    .option('--support-url <url>', 'Support URL to validate and reach')
    .option('--marketing-url <url>', 'Marketing URL to validate and reach')
    .option('--category <category>', 'App Store category, for category-specific rules')
    .option('--screenshots <dir>', 'Directory of App Store screenshots (never inferred)')
    .action(async (path: string | undefined, opts: Record<string, unknown>) => {
        const failOn = opts.failOn as 'critical' | 'warning' | 'info'
        if (!['critical', 'warning', 'info'].includes(failOn)) {
            console.error(`Invalid --fail-on value "${failOn}". Use critical, warning, or info.`)
            process.exitCode = 2
            return
        }
        process.exitCode = await scanCommand(path, {
            json: Boolean(opts.json),
            yes: Boolean(opts.yes),
            failOn,
            appName: opts.appName as string | undefined,
            description: opts.description as string | undefined,
            privacyUrl: opts.privacyUrl as string | undefined,
            termsUrl: opts.termsUrl as string | undefined,
            supportUrl: opts.supportUrl as string | undefined,
            marketingUrl: opts.marketingUrl as string | undefined,
            category: opts.category as string | undefined,
            screenshots: opts.screenshots as string | undefined,
            version: pkg.version,
        })
    })

program
    .command('update')
    .description('Update Preflight to the latest npm version')
    .action(() => updateCommand(pkg.version))

program.on('command:*', (operands) => {
    handleUnknownCommand(operands[0])
    process.exitCode = 1
})

if (process.argv.length <= 2) {
    // Bare `preflight`. Interactive when a human is present; when piped or run in
    // CI this refuses with a usage message rather than guessing a subject, since
    // scanning the wrong thing and exiting 0 is indistinguishable from success.
    scanCommand(undefined, { version: pkg.version })
        .then((code) => { process.exitCode = code })
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
} else {
    program.parse()
}
