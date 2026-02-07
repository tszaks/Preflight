import chalk from 'chalk'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error, success } from '../ui/spinner.js'

interface StatusOptions {
    watch?: boolean
    json?: boolean
}

export async function statusCommand(id: string, options: StatusOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    if (!id) {
        error('Please provide a submission ID. Run `preflight history` to find one.')
        process.exitCode = 1
        return
    }

    if (options.watch) {
        return watchStatus(id)
    }

    const useSpinner = !options.json
    const spinner = useSpinner ? createSpinner('Checking status...') : null
    spinner?.start()

    try {
        const res = await apiRequest(`/api/submissions/${id}`)
        const data = await res.json()

        spinner?.stop()

        if (!res.ok) {
            const msg = data?.message || 'Submission not found'
            if (options.json) {
                console.error(msg)
            } else {
                error(msg)
            }
            process.exit(1)
        }

        if (options.json) {
            console.log(JSON.stringify(data.data, null, 2))
            return
        }

        const sub = data.data
        console.log()
        console.log(chalk.bold(`  ${sub.app_name || 'Unknown App'}`))
        console.log(`  Status: ${formatStatus(sub.status)}`)
        console.log(`  Type:   ${sub.review_type || 'full'}`)
        console.log(`  ID:     ${chalk.dim(sub.id)}`)
        console.log()
    } catch (err) {
        spinner?.stop()
        const msg = `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        if (options.json) {
            console.error(msg)
        } else {
            error(msg)
        }
        process.exit(1)
    }
}

async function watchStatus(id: string) {
    const spinner = createSpinner('Watching for completion...')
    spinner.start()

    for (let i = 0; i < 120; i++) {
        const res = await apiRequest(`/api/submissions/${id}`)
        const data = await res.json()

        if (!res.ok) {
            spinner.stop()
            error('Submission not found')
            process.exit(1)
        }

        const status = data.data?.status
        spinner.text = `Status: ${status}... (${i * 5}s elapsed)`

        if (status === 'complete') {
            spinner.stop()
            success('Analysis complete!')
            console.log(chalk.dim(`  View report: preflight report ${id}`))
            return
        }

        if (status === 'failed') {
            spinner.stop()
            error('Analysis failed.')
            return
        }

        await new Promise((r) => setTimeout(r, 5000))
    }

    spinner.stop()
    error('Timed out waiting for completion.')
}

function formatStatus(status: string): string {
    switch (status) {
        case 'draft':
            return chalk.dim('Draft')
        case 'analyzing':
            return chalk.yellow('Analyzing...')
        case 'complete':
            return chalk.green('Complete')
        case 'failed':
            return chalk.red('Failed')
        default:
            return chalk.dim(status)
    }
}
