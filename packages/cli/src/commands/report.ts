import chalk from 'chalk'
import open from 'open'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'
import { renderReport, renderReportJson } from '../ui/report.js'
import { DEFAULT_API_URL } from '../lib/constants.js'

interface ReportOptions {
    json?: boolean
    open?: boolean
    showInfo?: boolean
    showAll?: boolean
}

export async function reportCommand(id: string, options: ReportOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    if (!id) {
        error('Please provide a submission or report ID. Run `preflight history` to find one.')
        process.exitCode = 1
        return
    }

    if (options.open) {
        await open(`${DEFAULT_API_URL}/report/${id}`)
        console.log(chalk.dim('  Opened report in browser'))
        return
    }

    const useSpinner = !options.json
    const spinner = useSpinner ? createSpinner('Loading report...') : null
    spinner?.start()

    try {
        const res = await apiRequest(`/api/reports/${id}`)
        const data = await res.json()

        spinner?.stop()

        if (!res.ok) {
            const msg = data?.message || 'Report not found'
            if (options.json) {
                console.error(msg)
            } else {
                error(msg)
            }
            process.exit(1)
        }

        if (options.json) {
            renderReportJson(data.report, data.items)
        } else {
            renderReport(data.report, data.items, { showInfo: options.showInfo === true, showAll: options.showAll === true })
            console.log(chalk.dim(`  Full report: ${DEFAULT_API_URL}/report/${id}`))
            console.log()
        }
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
