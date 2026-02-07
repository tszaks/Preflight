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
        // Web UI route expects a submission id. If the user provided a report id,
        // resolve it via the API and open the correct /report/<submissionId> page.
        try {
            const res = await apiRequest(`/api/reports/${id}`)
            const data = await res.json().catch(() => null)

            if (res.ok && data?.report?.submission_id) {
                await open(`${DEFAULT_API_URL}/report/${data.report.submission_id}`)
            } else {
                await open(`${DEFAULT_API_URL}/report/${id}`)
            }
        } catch {
            await open(`${DEFAULT_API_URL}/report/${id}`)
        }
        console.log(chalk.dim(`  Opened report: ${DEFAULT_API_URL}/report/${id}`))
        return
    }

    const useSpinner = !options.json
    const spinner = useSpinner ? createSpinner('Loading report...') : null
    spinner?.start()

    try {
        // Accept either report id or submission id.
        let reportRes = await apiRequest(`/api/reports/${id}`)
        let data: any = null

        if (reportRes.status === 404) {
            // Treat `id` as a submission id and look up its report_id.
            const subRes = await apiRequest(`/api/submissions/${id}`)
            const subData = await subRes.json().catch(() => null)

            const reportId = subData?.data?.report_id
            if (!subRes.ok || !reportId) {
                spinner?.stop()
                const msg = subData?.message || 'Report not found'
                if (options.json) console.error(msg)
                else error(msg)
                process.exit(1)
            }

            reportRes = await apiRequest(`/api/reports/${reportId}`)
        }

        data = await reportRes.json()

        spinner?.stop()

        if (!reportRes.ok) {
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
            const submissionId = data?.report?.submission_id || id
            console.log(chalk.dim(`  Full report: ${DEFAULT_API_URL}/report/${submissionId}`))
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
