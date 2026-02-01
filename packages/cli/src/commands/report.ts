import chalk from 'chalk'
import open from 'open'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'
import { renderReport, renderReportJson } from '../ui/report.js'

interface ReportOptions {
    json?: boolean
    open?: boolean
}

export async function reportCommand(id: string, options: ReportOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    if (options.open) {
        await open(`https://preflight.dev/report/${id}`)
        console.log(chalk.dim('  Opened report in browser'))
        return
    }

    const spinner = createSpinner('Loading report...')
    spinner.start()

    try {
        const res = await apiRequest(`/api/reports/${id}`)
        const data = await res.json()

        spinner.stop()

        if (!res.ok) {
            error(data.message || 'Report not found')
            process.exit(1)
        }

        if (options.json) {
            renderReportJson(data.report, data.items)
        } else {
            renderReport(data.report, data.items)
            console.log(chalk.dim(`  Full report: https://preflight.dev/report/${id}`))
            console.log()
        }
    } catch (err) {
        spinner.stop()
        error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}
