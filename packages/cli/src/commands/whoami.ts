import chalk from 'chalk'
import { isLoggedIn, getConfig } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'
import { brandDim } from '../ui/theme.js'

export async function whoamiCommand() {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    const spinner = createSpinner('Fetching account info...')
    spinner.start()

    try {
        const res = await apiRequest('/api/me')
        const data = await res.json()

        spinner.stop()

        if (!res.ok) {
            error(data.message || 'Failed to fetch account info')
            process.exit(1)
        }

        console.log()
        console.log(chalk.bold('  Account'))
        console.log(`  Email:   ${brandDim(data.user.email)}`)
        console.log(`  ID:      ${chalk.dim(data.user.id)}`)
        if (data.user.credits != null) {
            console.log(`  Credits: ${chalk.green(data.user.credits)}`)
        }
        console.log()
    } catch (err) {
        spinner.stop()
        error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}
