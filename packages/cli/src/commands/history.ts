import chalk from 'chalk'
import Table from 'cli-table3'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'

interface HistoryOptions {
    json?: boolean
}

export async function historyCommand(options: HistoryOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    const spinner = createSpinner('Loading submissions...')
    spinner.start()

    try {
        const res = await apiRequest('/api/submissions')
        const data = await res.json()

        spinner.stop()

        if (!res.ok) {
            error(data.message || 'Failed to load submissions')
            process.exit(1)
        }

        if (options.json) {
            console.log(JSON.stringify(data.data, null, 2))
            return
        }

        if (!data.data || data.data.length === 0) {
            console.log(chalk.dim('  No submissions yet.'))
            return
        }

        const table = new Table({
            head: [
                chalk.bold('App'),
                chalk.bold('Status'),
                chalk.bold('Type'),
                chalk.bold('Date'),
                chalk.bold('ID'),
            ],
            style: { head: [], border: [], 'padding-left': 2 },
        })

        for (const sub of data.data) {
            const statusColor =
                sub.status === 'complete'
                    ? chalk.green
                    : sub.status === 'failed'
                        ? chalk.red
                        : sub.status === 'analyzing'
                            ? chalk.yellow
                            : chalk.dim

            table.push([
                sub.app_name || 'Unknown',
                statusColor(sub.status),
                sub.review_type || 'full',
                new Date(sub.created_at).toLocaleDateString(),
                chalk.dim(sub.id.slice(0, 8)),
            ])
        }

        console.log()
        console.log(table.toString())
        console.log()
    } catch (err) {
        spinner.stop()
        error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}
