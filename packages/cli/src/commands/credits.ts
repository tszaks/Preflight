import chalk from 'chalk'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'

export async function creditsCommand() {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    const spinner = createSpinner('Checking backend quota...')
    spinner.start()

    try {
        const res = await apiRequest('/api/credits')
        const data = await res.json()

        spinner.stop()

        if (!res.ok) {
            error(data.message || 'Failed to fetch credits')
            process.exit(1)
        }

        console.log()
        console.log(chalk.bold('  Backend Quota'))
        console.log(`  ${chalk.green.bold(data.credits)} legacy credits available`)
        console.log(chalk.dim('  Open-source Preflight is free by default. This command only applies to forks that keep credits enabled.'))
        console.log()
    } catch (err) {
        spinner.stop()
        error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}
