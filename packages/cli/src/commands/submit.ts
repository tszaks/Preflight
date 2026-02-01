import chalk from 'chalk'
import { readFileSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { apiRequest } from '../lib/api-client.js'
import { isLoggedIn, setLastScannedPath } from '../lib/config.js'
import { loginWithBrowser } from '../lib/auth.js'
import { createSpinner } from '../ui/spinner.js'
import { renderReport } from '../ui/report.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import { promptLogin } from '../ui/errors.js'
import * as ui from '../ui/interactive.js'
import { brand, subtext, formatBytes, icons } from '../ui/theme.js'

interface SubmitOptions {
    appName?: string
    ipa?: string
    plist?: string
    manifest?: string
    screenshots?: string
    json?: boolean
}

export async function submitCommand(path?: string, options: SubmitOptions = {}) {
    // Auth check with friendly prompt
    if (!isLoggedIn()) {
        const wantsLogin = await promptLogin()
        if (wantsLogin) {
            const s = ui.spinner()
            s.start('Opening browser...')
            const result = await loginWithBrowser()
            if (result) {
                s.stop(`Logged in as ${result.email}`)
            } else {
                s.stop('Login failed or cancelled')
                return
            }
        } else {
            ui.log.warning('Login required for submissions. Scan is free without login!')
            ui.tip(`Run ${brand('preflight scan')} for a free preview.`)
            return
        }
    }

    // Interactive mode: no path provided
    if (!path) {
        const resolvedPath = await interactiveProjectSelect()
        if (!resolvedPath) return
        path = resolvedPath
    }

    const dir = resolve(path)
    setLastScannedPath(dir)

    // 1. Detect files
    const detected = scanProject(dir)
    const appName = options.appName || detected.projectName || 'Unknown App'

    // Apply overrides
    if (options.plist) detected.infoPlist = resolve(options.plist)
    if (options.manifest) detected.privacyManifest = resolve(options.manifest)
    if (options.ipa) detected.ipa = resolve(options.ipa)

    // Build file list for display
    const filesToUpload: Array<{ type: string; index?: number; filename: string; path: string }> = []

    if (detected.infoPlist) {
        filesToUpload.push({ type: 'plist', filename: 'Info.plist', path: detected.infoPlist })
    }
    if (detected.privacyManifest) {
        filesToUpload.push({ type: 'manifest', filename: 'PrivacyInfo.xcprivacy', path: detected.privacyManifest })
    }
    if (detected.ipa) {
        filesToUpload.push({ type: 'ipa', filename: basename(detected.ipa), path: detected.ipa })
    }
    for (let i = 0; i < Math.min(detected.screenshots.length, 10); i++) {
        filesToUpload.push({
            type: 'screenshot',
            index: i,
            filename: basename(detected.screenshots[i]),
            path: detected.screenshots[i],
        })
    }

    if (filesToUpload.length === 0) {
        ui.log.warning('No files to upload. Use --plist, --manifest, --ipa, or --screenshots flags.')
        return
    }

    // Show confirmation with file listing
    ui.intro(`Submit ${appName} for analysis`)

    const fileLines = filesToUpload.map((f) => {
        const size = getFileSize(f.path)
        const icon = f.type === 'screenshot' ? icons.image : icons.file
        return `  ${icon} ${f.filename} ${subtext(`(${formatBytes(size)})`)}`
    })

    ui.log.message(chalk.bold('Files to upload:') + '\n' + fileLines.join('\n'))

    const shouldContinue = await ui.confirm('This will use 1 credit. Continue?')
    if (shouldContinue === null) return // User pressed Ctrl+C, @clack already showed cancel message
    if (!shouldContinue) {
        ui.outro('Submission cancelled.')
        return
    }

    // 2. Create submission + upload + analyze
    const spinner = createSpinner('Creating submission...')
    spinner.start()

    try {
        const createRes = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify({ app_name: appName }),
        })
        const createData = await createRes.json()

        if (!createRes.ok) {
            spinner.stop()
            ui.log.error(createData.message || 'Failed to create submission')
            process.exit(1)
        }

        const submissionId = createData.submissionId
        spinner.succeed('Submission created')

        // 3. Get signed upload URLs
        const uploadSpinner = createSpinner('Getting upload URLs...')
        uploadSpinner.start()

        const urlsRes = await apiRequest(`/api/submissions/${submissionId}/upload-urls`, {
            method: 'POST',
            body: JSON.stringify({
                files: filesToUpload.map((f) => ({
                    type: f.type,
                    index: f.index,
                    filename: f.filename,
                })),
            }),
        })
        const urlsData = await urlsRes.json()

        if (!urlsRes.ok) {
            uploadSpinner.stop()
            ui.log.error(urlsData.message || 'Failed to get upload URLs')
            process.exit(1)
        }

        // 4. Upload files
        for (let i = 0; i < urlsData.urls.length; i++) {
            const urlInfo = urlsData.urls[i]
            const fileInfo = filesToUpload[i]
            const fileBuffer = readFileSync(fileInfo.path)
            const fileSize = fileBuffer.length

            uploadSpinner.text = `Uploading ${fileInfo.filename} (${formatBytes(fileSize)})...`

            const uploadRes = await fetch(urlInfo.signedUrl, {
                method: 'PUT',
                body: fileBuffer,
                headers: { 'Content-Type': 'application/octet-stream' },
            })

            if (!uploadRes.ok) {
                uploadSpinner.stop()
                ui.log.error(`Failed to upload ${fileInfo.filename}: HTTP ${uploadRes.status} ${uploadRes.statusText}`)
                process.exit(1)
            }
        }
        uploadSpinner.succeed('Files uploaded')

        // 5. Finalize
        const analyzeSpinner = createSpinner('Starting analysis...')
        analyzeSpinner.start()

        const finalizeRes = await apiRequest(`/api/submissions/${submissionId}/finalize`, {
            method: 'POST',
            body: JSON.stringify({
                files: filesToUpload.map((f) => ({
                    type: f.type,
                    index: f.index,
                })),
            }),
        })
        const finalizeData = await finalizeRes.json()

        if (!finalizeRes.ok) {
            analyzeSpinner.stop()
            if (finalizeRes.status === 402) {
                ui.log.error(`Insufficient credits. Need ${finalizeData.required}, have ${finalizeData.credits}.`)
                console.log(subtext('  Purchase credits at https://preflightlaunch.com/pricing'))
            } else {
                ui.log.error(finalizeData.message || 'Failed to finalize submission')
            }
            process.exit(1)
        }

        analyzeSpinner.text = 'AI review in progress...'

        // 6. Poll for completion
        const reportData = await pollForReport(submissionId, analyzeSpinner)

        analyzeSpinner.stop()

        if (reportData.status === 'complete' && reportData.data) {
            if (options.json) {
                console.log(JSON.stringify(reportData.data, null, 2))
            } else {
                renderReport(reportData.data.report, reportData.data.items)
                console.log(subtext(`  Full report: https://preflightlaunch.com/report/${reportData.data.report.id}`))
                console.log()

                // What next?
                const next = await ui.select<'open' | 'another' | 'done'>({
                    message: 'What next?',
                    options: [
                        { value: 'open', label: 'Open full report in browser' },
                        { value: 'another', label: 'Submit a different app' },
                        { value: 'done', label: 'Done' },
                    ],
                })

                if (next === 'open') {
                    const open = (await import('open')).default
                    await open(`https://preflightlaunch.com/report/${reportData.data.report.id}`)
                } else if (next === 'another') {
                    await submitCommand()
                }
            }
        } else if (reportData.status === 'failed') {
            ui.log.error('Analysis failed. Please try submitting again or contact support.')
            process.exit(1)
        } else {
            ui.log.warning('Analysis is still running. Check status with:')
            console.log(subtext(`  preflight status ${submissionId}`))
        }
    } catch (err) {
        spinner.stop()
        ui.log.error(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}

function getFileSize(filePath: string): number {
    try {
        return statSync(filePath).size
    } catch {
        return 0
    }
}

interface PollResult {
    status: 'complete' | 'failed' | 'timeout'
    data?: { report: any; items: any[] }
}

async function pollForReport(
    submissionId: string,
    spinner: { text: string },
    maxAttempts = 60,
    interval = 5000
): Promise<PollResult> {
    let consecutiveFailures = 0

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, interval))

        const res = await apiRequest(`/api/submissions/${submissionId}`)

        if (!res.ok) {
            consecutiveFailures++
            if (res.status === 401) {
                throw new Error('Session expired. Please run `preflight login` to re-authenticate.')
            }
            if (consecutiveFailures >= 3) {
                throw new Error(`Polling failed after 3 consecutive errors (last status: HTTP ${res.status})`)
            }
            continue
        }

        consecutiveFailures = 0
        const data = await res.json()
        const submission = data.data

        const stages = ['Files uploaded', 'Metadata validated', 'AI review in progress...', 'Generating report']
        const stageIdx = Math.min(Math.floor(((i + 1) / maxAttempts) * stages.length), stages.length - 1)
        spinner.text = `${stages[stageIdx]} (${Math.min((i + 1) * 3, 95)}%)`

        if (submission.status === 'complete') {
            if (submission.report_id) {
                const reportRes = await apiRequest(`/api/reports/${submission.report_id}`)
                const reportData = await reportRes.json()
                return { status: 'complete', data: reportData }
            }
            // Server marked complete but no report was generated
            return { status: 'failed' as const }
        }

        if (submission.status === 'failed') {
            return { status: 'failed' }
        }
    }

    return { status: 'timeout' }
}
