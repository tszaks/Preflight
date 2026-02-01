import chalk from 'chalk'
import { createSpinner, success, error } from '../ui/spinner.js'
import { loginWithBrowser } from '../lib/auth.js'
import { isLoggedIn, getConfig } from '../lib/config.js'

export async function loginCommand() {
    if (isLoggedIn()) {
        const { email } = getConfig()
        console.log(chalk.dim(`  Already logged in as ${email}`))
        console.log(chalk.dim('  Run `preflight logout` first to switch accounts.'))
        return
    }

    const spinner = createSpinner('Opening browser for login...')
    spinner.start()

    try {
        const result = await loginWithBrowser()

        if (result) {
            spinner.stop()
            success(`Logged in as ${chalk.bold(result.email)}`)
        } else {
            spinner.stop()
            error('Login failed or timed out. Please try again.')
        }
    } catch (err) {
        spinner.stop()
        error(`Login error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}
