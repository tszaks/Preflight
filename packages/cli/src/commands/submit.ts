import chalk from 'chalk'
import { resolve } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { apiRequest } from '../lib/api-client.js'
import { isLoggedIn } from '../lib/config.js'
import { createSpinner, success, error, warn, header } from '../ui/spinner.js'
import { renderReport } from '../ui/report.js'

interface SubmitOptions {
    appName?: string
    ipa?: string
    plist?: string
    manifest?: string
    screenshots?: string
    json?: boolean
}

export async function submitCommand(path: string, options: SubmitOptions) {
    if (!isLoggedIn()) {
        error('Not logged in. Run `preflight login` first.')
        process.exit(1)
    }

    const dir = resolve(path || '.')
    header('Submitting for analysis')

    // 1. Detect files
    const detected = scanProject(dir)
    const appName = options.appName || detected.projectName || 'Unknown App'

    // Apply overrides
    if (options.plist) detected.infoPlist = resolve(options.plist)
    if (options.manifest) detected.privacyManifest = resolve(options.manifest)
    if (options.ipa) detected.ipa = resolve(options.ipa)

    console.log(chalk.bold(`  App: ${appName}`))

    const foundFiles: string[] = []
    if (detected.infoPlist) foundFiles.push('Info.plist')
    if (detected.privacyManifest) foundFiles.push('PrivacyInfo.xcprivacy')
    if (detected.ipa) foundFiles.push('IPA')
    if (detected.screenshots.length > 0) foundFiles.push(`${detected.screenshots.length} screenshots`)

    console.log(`  Found: ${foundFiles.join(', ') || 'no files'}`)
    console.log()

    // 2. Create draft submission
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
            error(createData.message || 'Failed to create submission')
            process.exit(1)
        }

        const submissionId = createData.submissionId
        spinner.text = 'Getting upload URLs...'

        // 3. Build file list for upload
        const files: Array<{ type: string; index?: number; filename: string; path: string }> = []

        if (detected.infoPlist) {
            files.push({ type: 'plist', filename: 'Info.plist', path: detected.infoPlist })
        }
        if (detected.privacyManifest) {
            files.push({ type: 'manifest', filename: 'PrivacyInfo.xcprivacy', path: detected.privacyManifest })
        }
        if (detected.ipa) {
            files.push({ type: 'ipa', filename: basename(detected.ipa), path: detected.ipa })
        }
        for (let i = 0; i < Math.min(detected.screenshots.length, 10); i++) {
            files.push({
                type: 'screenshot',
                index: i,
                filename: basename(detected.screenshots[i]),
                path: detected.screenshots[i],
            })
        }

        if (files.length === 0) {
            spinner.stop()
            warn('No files to upload. Use --plist, --manifest, --ipa, or --screenshots flags.')
            process.exit(1)
        }

        // 4. Get signed upload URLs
        const urlsRes = await apiRequest(`/api/submissions/${submissionId}/upload-urls`, {
            method: 'POST',
            body: JSON.stringify({
                files: files.map((f) => ({
                    type: f.type,
                    index: f.index,
                    filename: f.filename,
                })),
            }),
        })
        const urlsData = await urlsRes.json()

        if (!urlsRes.ok) {
            spinner.stop()
            error(urlsData.message || 'Failed to get upload URLs')
            process.exit(1)
        }

        // 5. Upload files
        spinner.text = 'Uploading files...'
        for (let i = 0; i < urlsData.urls.length; i++) {
            const urlInfo = urlsData.urls[i]
            const fileInfo = files[i]
            const fileBuffer = readFileSync(fileInfo.path)
            const fileSize = statSync(fileInfo.path).size

            spinner.text = `Uploading ${fileInfo.filename} (${formatBytes(fileSize)})...`

            await fetch(urlInfo.signedUrl, {
                method: 'PUT',
                body: fileBuffer,
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            })
        }

        // 6. Finalize and trigger analysis
        spinner.text = 'Finalizing submission...'

        const finalizeRes = await apiRequest(`/api/submissions/${submissionId}/finalize`, {
            method: 'POST',
            body: JSON.stringify({
                files: files.map((f) => ({
                    type: f.type,
                    index: f.index,
                })),
            }),
        })
        const finalizeData = await finalizeRes.json()

        if (!finalizeRes.ok) {
            spinner.stop()
            if (finalizeRes.status === 402) {
                error(`Insufficient credits. Need ${finalizeData.required}, have ${finalizeData.credits}.`)
                console.log(chalk.dim('  Purchase credits at https://preflight.dev/pricing'))
            } else {
                error(finalizeData.message || 'Failed to finalize submission')
            }
            process.exit(1)
        }

        spinner.text = 'Analysis started! Waiting for results...'

        // 7. Poll for completion
        const reportData = await pollForReport(submissionId, spinner)

        spinner.stop()

        if (reportData) {
            if (options.json) {
                console.log(JSON.stringify(reportData, null, 2))
            } else {
                renderReport(reportData.report, reportData.items)
                console.log(chalk.dim(`  Full report: https://preflight.dev/report/${reportData.report.id}`))
                console.log()
            }
        } else {
            warn('Analysis is still running. Check status with:')
            console.log(chalk.dim(`  preflight status ${submissionId}`))
        }
    } catch (err) {
        spinner.stop()
        error(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        process.exit(1)
    }
}

async function pollForReport(
    submissionId: string,
    spinner: { text: string },
    maxAttempts = 60,
    interval = 5000
): Promise<{ report: any; items: any[] } | null> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, interval))

        const res = await apiRequest(`/api/submissions/${submissionId}`)
        const data = await res.json()

        if (!res.ok) continue

        const submission = data.data
        spinner.text = `Analysis in progress... (${Math.min((i + 1) * 3, 95)}%)`

        if (submission.status === 'complete') {
            // Fetch the report
            const reportsRes = await apiRequest(`/api/submissions/${submissionId}`)
            const reportsData = await reportsRes.json()

            if (reportsData.data?.report_id) {
                const reportRes = await apiRequest(`/api/reports/${reportsData.data.report_id}`)
                const reportData = await reportRes.json()
                return reportData
            }
            return null
        }

        if (submission.status === 'failed') {
            return null
        }
    }

    return null
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
