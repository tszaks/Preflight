import chalk from 'chalk'
import Table from 'cli-table3'
import { isLoggedIn } from '../lib/config.js'
import { apiRequest } from '../lib/api-client.js'
import { createSpinner, error } from '../ui/spinner.js'
import { renderReport } from '../ui/report.js'
import { subtext, brand } from '../ui/theme.js'
import * as ui from '../ui/interactive.js'
import { resumeSubmitCommand } from './submit.js'

interface HistoryOptions {
    json?: boolean
}

// Direct CLI command (prints table)
export async function historyCommand(options: HistoryOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    const useSpinner = !options.json
    const spinner = useSpinner ? createSpinner('Loading submissions...') : null
    spinner?.start()

    try {
        const res = await apiRequest('/api/submissions')
        const data = await res.json()

        spinner?.stop()

        if (!res.ok) {
            const msg = data?.message || 'Failed to load submissions'
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

// Interactive version for full-screen menu
export async function interactiveHistory(): Promise<void> {
    const s = ui.spinner()
    s.start('Loading your reviews...')

    try {
        const res = await apiRequest('/api/submissions')
        const data = await res.json()

        // Debug logging to diagnose issues
        if (process.env.DEBUG) {
            console.log('🐛 DEBUG: API Response:', {
                ok: res.ok,
                status: res.status,
                hasData: !!data.data,
                dataLength: data.data?.length,
                keys: Object.keys(data),
            })
        }

        s.stop('Reviews loaded')

        // Validate response structure first
        if (!data || typeof data !== 'object') {
            s.stop('Invalid response')
            ui.log.error('Server returned invalid data format')
            console.log()
            await ui.confirm('Press Enter to return to menu', true)
            return
        }

        // Check if API call failed FIRST (before validating success structure)
        if (!res.ok) {
            s.stop('Failed to load reviews')
            ui.log.error(data.message || `Server returned error (HTTP ${res.status})`)
            console.log()
            await ui.confirm('Press Enter to return to menu', true)
            return
        }

        // Only check for data field if response was successful
        if (!('data' in data)) {
            s.stop('Invalid response')
            ui.log.error('Server response missing expected data field')
            if (process.env.DEBUG) {
                console.log('Response keys:', Object.keys(data))
            }
            console.log()
            await ui.confirm('Press Enter to return to menu', true)
            return
        }

        if (!data.data || data.data.length === 0) {
            ui.log.info('No reviews found in your history.')
            console.log()
            ui.log.step('Start your first review from the main menu!')
            console.log()
            await ui.confirm('Press Enter to return to menu', true)
            return
        }

        // Build selectable list
        const submissions = data.data as Array<{
            id: string
            app_name: string
            status: string
            created_at: string
            report_id?: string
        }>

        while (true) {
            const options = submissions.map((sub) => {
                const date = new Date(sub.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })
                const statusLabel =
                    sub.status === 'complete' ? 'Ready'
                        : sub.status === 'failed' ? 'Failed'
                            : sub.status === 'analyzing' ? 'Analyzing...'
                                : sub.status === 'draft' ? 'Draft'
                                    : sub.status
                const hint =
                    sub.status === 'complete' ? 'View report'
                        : sub.status === 'draft' ? 'Resume draft'
                            : ''
                return {
                    value: sub.id,
                    label: `${sub.app_name || 'Unknown'} - ${statusLabel} (${date})`,
                    hint,
                }
            })

            options.push({
                value: '__back__',
                label: 'Back to menu',
                hint: '',
            })

            const selected = await ui.select<string>({
                message: 'Your Reviews',
                options,
            })

            if (selected === null || selected === '__back__') return

            // Find the selected submission
            const sub = submissions.find(s => s.id === selected)
            if (!sub) return

            // Handle draft submissions — offer to resume
            if (sub.status === 'draft') {
                const draftAction = await ui.select<'resume' | 'back'>({
                    message: `Draft: ${sub.app_name || 'Unknown'}`,
                    options: [
                        { value: 'resume', label: 'Resume Draft', hint: 'Continue where you left off' },
                        { value: 'back', label: 'Back to list' },
                    ],
                })

                if (draftAction === null || draftAction === 'back') continue

                // Fetch full draft data
                const draftSpinner = ui.spinner()
                draftSpinner.start('Loading draft...')

                try {
                    const draftRes = await apiRequest(`/api/submissions/${sub.id}`)
                    const draftData = await draftRes.json()

                    draftSpinner.stop('Draft loaded')

                    if (draftRes.ok && draftData.data) {
                        try {
                            await resumeSubmitCommand(draftData.data)
                            return // SUCCESS: Return to main menu
                        } catch (err) {
                            ui.log.error(`Failed to resume draft: ${err instanceof Error ? err.message : 'Unknown error'}`)
                            console.log()
                            await ui.confirm('Press Enter to return to list', true)
                        }
                    } else {
                        ui.log.error('Could not load this draft.')
                    }
                } catch (err) {
                    draftSpinner.stop('Failed to load draft')
                    ui.log.error(`Network error loading draft: ${err instanceof Error ? err.message : 'Unknown error'}`)
                }
                continue
            }

            if (sub.status !== 'complete' || !sub.report_id) {
                if (sub.status === 'analyzing') {
                    ui.log.info('This review is still being analyzed. Check back in a few minutes.')
                } else if (sub.status === 'failed') {
                    ui.log.warning('This review failed. Try submitting again.')
                } else {
                    ui.log.info(`Status: ${sub.status}`)
                }
                console.log()
                continue
            }

            // Fetch and show report
            const reportSpinner = ui.spinner()
            reportSpinner.start('Loading report...')

            try {
                const reportRes = await apiRequest(`/api/reports/${sub.report_id}`)
                const reportData = await reportRes.json()

                reportSpinner.stop('Report loaded')

                if (reportRes.ok) {
                    renderReport(reportData.report, reportData.items)
                    console.log(subtext(`  Full report: https://preflightlaunch.com/report/${sub.report_id}`))
                    console.log()
                } else {
                    ui.log.error('Could not load this report.')
                }
            } catch {
                reportSpinner.stop('Failed to load report')
            }

            // Offer actions after viewing report
            const { reportRejection } = await import('./rejection.js')
            const action = await ui.select<'rejection' | 'back'>(
                {
                    message: 'What would you like to do?',
                    options: [
                        {
                            value: 'rejection',
                            label: 'Report Apple rejection',
                            hint: 'Get 100 credits refunded',
                        },
                        { value: 'back', label: 'Back to list', hint: '' },
                    ],
                }
            )

            if (action === 'rejection') {
                await reportRejection(sub.id)
            }
            // After action or back, loop back to list
        }
    } catch (err) {
        s.stop('Failed to load reviews')
        ui.log.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.log()
        await ui.confirm('Press Enter to return to menu', true)
        return
    }
}
