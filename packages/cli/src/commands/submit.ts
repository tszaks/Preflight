import chalk from 'chalk'
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs'
import { basename, resolve, extname, join, dirname } from 'node:path'
import { scanProject, findFiles, getFileSize } from '../lib/scanner.js'
import { apiRequest } from '../lib/api-client.js'
import { isLoggedIn, setLastScannedPath, getAscConnected, getConfig } from '../lib/config.js'
import { loginWithBrowser } from '../lib/auth.js'
import { createSpinner } from '../ui/spinner.js'
import { renderReport } from '../ui/report.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import { promptForPath } from '../lib/file-picker.js'
import { promptLogin } from '../ui/errors.js'
import * as ui from '../ui/interactive.js'
import { brand, subtext, formatBytes, icons } from '../ui/theme.js'
import {
    collectAppDetails,
    collectCompliance,
    formatComplianceForApi,
    parseComplianceFromApi,
    formatComplianceSummary,
    type AppDetails,
    type ComplianceData,
} from '../lib/submission-questions.js'
import { formatAiContext } from '@preflight/shared/ai'
import { SubmissionFlow } from '../flows/submission/SubmissionFlow.js'
import { AscStep } from '../flows/submission/steps/AscStep.js'
import { ScreenshotsStep } from '../flows/submission/steps/ScreenshotsStep.js'
import { AppDetailsStep } from '../flows/submission/steps/AppDetailsStep.js'
import { ComplianceStep } from '../flows/submission/steps/ComplianceStep.js'
import { ReviewStep } from '../flows/submission/steps/ReviewStep.js'
import type { DraftState } from '../flows/submission/types.js'

interface SubmitOptions {
    appName?: string
    ipa?: string
    plist?: string
    manifest?: string
    screenshots?: string
    json?: boolean
    skipScreenshots?: boolean
    nonInteractive?: boolean
}

function resolveScreenshotPaths(input: string): string[] {
    const expanded = input.replace(/^~/, process.env.HOME || '')
    const resolved = resolve(expanded)

    const imageExts = new Set(['.png', '.jpg', '.jpeg'])

    // Very small glob support: allow one-segment patterns like `/path/*.png`.
    const hasGlobChars = /[*?\[]/.test(resolved)
    if (hasGlobChars) {
        const dir = dirname(resolved)
        const base = basename(resolved)

        if (!existsSync(dir)) return []

        // Convert a basic glob into a regex: `*` and `?` and character classes.
        // This intentionally avoids full glob semantics; it's enough for common `*.png` usage.
        const escapeRegex = (s: string) => s.replace(/[-/\\^$+?.()|{}]/g, '\\$&')
        let re = '^'
        let i = 0
        while (i < base.length) {
            const ch = base[i]
            if (ch === '*') {
                re += '.*'
                i++
                continue
            }
            if (ch === '?') {
                re += '.'
                i++
                continue
            }
            if (ch === '[') {
                const end = base.indexOf(']', i + 1)
                if (end !== -1) {
                    // Keep the class as-is (best effort).
                    re += base.slice(i, end + 1)
                    i = end + 1
                    continue
                }
            }
            re += escapeRegex(ch)
            i++
        }
        re += '$'

        const rx = new RegExp(re, 'i')
        return readdirSync(dir)
            .filter((f) => rx.test(f) && imageExts.has(extname(f).toLowerCase()))
            .sort()
            .map((f) => join(dir, f))
    }

    if (!existsSync(resolved)) return []

    const stats = statSync(resolved)
    if (stats.isDirectory()) {
        return findFiles(
            resolved,
            (f) => imageExts.has(extname(f).toLowerCase()),
            2
        ).sort()
    }

    return imageExts.has(extname(resolved).toLowerCase()) ? [resolved] : []
}

async function autofillDraftFromAsc(draftState: DraftState): Promise<void> {
    // Best-effort: if ASC is connected, pull metadata so direct CLI submissions
    // don't get flagged for missing required fields like description/privacy policy.
    try {
        const statusRes = await apiRequest('/api/asc/connect')
        const statusData = await statusRes.json().catch(() => null as any)

        const appId = statusData?.appId ?? statusData?.data?.appId
        if (!statusRes.ok || !appId) return

        const autoRes = await apiRequest('/api/asc/autofill', {
            method: 'POST',
            body: JSON.stringify({ appId }),
        })
        const autoData = await autoRes.json().catch(() => null as any)
        if (!autoRes.ok) return

        const d = autoData?.data || {}

        if (!draftState.description && typeof d.description === 'string') draftState.description = d.description
        if (!draftState.keywords && typeof d.keywords === 'string') draftState.keywords = d.keywords
        if (!draftState.category && typeof d.category === 'string') draftState.category = d.category
        if (!draftState.privacyPolicyUrl && typeof d.privacy_policy_url === 'string') draftState.privacyPolicyUrl = d.privacy_policy_url
        if (!draftState.termsOfUseUrl && typeof d.terms_of_use_url === 'string') draftState.termsOfUseUrl = d.terms_of_use_url
        if (!draftState.supportUrl && typeof d.support_url === 'string') draftState.supportUrl = d.support_url
        if (!draftState.marketingUrl && typeof d.marketing_url === 'string') draftState.marketingUrl = d.marketing_url
        if (!draftState.promotionalText && typeof d.promotional_text === 'string') draftState.promotionalText = d.promotional_text

        if (draftState.signInRequired === undefined && typeof d.sign_in_required === 'boolean') {
            draftState.signInRequired = d.sign_in_required
        }
        if (!draftState.demoUsername && typeof d.demo_username === 'string') draftState.demoUsername = d.demo_username
        if (!draftState.demoPassword && typeof d.demo_password === 'string') draftState.demoPassword = d.demo_password
        if (!draftState.reviewNotes && typeof d.review_notes === 'string') draftState.reviewNotes = d.review_notes
    } catch {
        // ignore
    }
}

// Open a URL in the browser with fallback to printing the URL
async function openUrl(url: string): Promise<void> {
    try {
        const open = (await import('open')).default
        await open(url)
    } catch {
        console.log(subtext(`  Visit: ${url}`))
    }
}

// ─── Draft Save Helper (Phase 4) ──────────────────────────────────────────


async function offerDraftSave(state: DraftState, skipConfirmation = false): Promise<boolean> {
    // Only offer if we have at least an app name
    if (!state.appName) return false

    if (!skipConfirmation) {
        const save = await ui.confirm('Save your progress as a draft?', true)
        if (save === null || !save) return false
    }

    const s = ui.spinner()
    s.start('Saving draft...')

    try {
        const body: Record<string, any> = { app_name: state.appName }
        if (state.description) body.description = state.description
        if (state.keywords) body.keywords = state.keywords
        if (state.category) body.category = state.category
        if (state.privacyPolicyUrl) body.privacy_policy_url = state.privacyPolicyUrl
        const termsUrl = state.termsOfUseUrl || state.compliance?.checklist?.termsOfUseUrl
        if (termsUrl) body.terms_url = termsUrl
        if (state.supportUrl) body.support_url = state.supportUrl
        if (state.promotionalText) body.promotional_text = state.promotionalText
        if (state.marketingUrl) body.marketing_url = state.marketingUrl
        if (state.signInRequired != null) body.sign_in_required = state.signInRequired
        if (state.demoUsername) body.demo_username = state.demoUsername
        if (state.demoPassword) body.demo_password = state.demoPassword
        if (state.compliance) Object.assign(body, formatComplianceForApi(state.compliance))

        // Include screenshot paths to restore them on resume
        if (state._screenshotPaths && state._screenshotPaths.length > 0) {
            body.screenshot_paths = state._screenshotPaths
        }

        // Include flow position metadata for resuming
        if (state._flowPosition) {
            body.flow_position = state._flowPosition
        }

        if (state._projectPath) {
            body.project_path = state._projectPath
        }

        const res = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(body),
        })

        s.stop(res.ok ? 'Draft saved' : 'Could not save draft')

        if (res.ok) {
            ui.log.success('Draft saved. Resume it from View Reviews anytime.')
            return true
        }
        return false
    } catch {
        s.stop('Could not save draft')
        return false
    }
}

// ─── ASC Autofill Helper (Phase 3) ────────────────────────────────────────

async function offerAscAutofill(appDetails: AppDetails): Promise<AppDetails> {
    // Check if ASC is connected
    const ascConnected = getAscConnected()
    if (!ascConnected) return appDetails

    try {
        const statusRes = await apiRequest('/api/asc/connect')
        if (!statusRes.ok) return appDetails
        const statusData = await statusRes.json()
        if (!statusData.connected || !statusData.appId) return appDetails

        const useAutofill = await ui.confirm(
            `Autofill from App Store Connect? (${statusData.appName || 'Connected app'})`,
            true,
        )
        if (useAutofill === null || !useAutofill) return appDetails

        const s = ui.spinner()
        s.start('Fetching from App Store Connect...')

        const autofillRes = await apiRequest('/api/asc/autofill', {
            method: 'POST',
            body: JSON.stringify({ appId: statusData.appId }),
        })
        const autofillData = await autofillRes.json()

        s.stop(autofillRes.ok ? 'Autofill complete' : 'Autofill failed')

        if (autofillRes.ok && autofillData) {
            // Merge ASC data into appDetails (user-entered values take precedence)
            return {
                appName: appDetails.appName || autofillData.app_name || appDetails.appName,
                description: appDetails.description || autofillData.description,
                keywords: appDetails.keywords || autofillData.keywords,
                category: appDetails.category || autofillData.category,
                privacyPolicyUrl: appDetails.privacyPolicyUrl || autofillData.privacy_policy_url,
                supportUrl: appDetails.supportUrl || autofillData.support_url,
                promotionalText: appDetails.promotionalText || autofillData.promotional_text,
                marketingUrl: appDetails.marketingUrl || autofillData.marketing_url,
                signInRequired: appDetails.signInRequired,
                demoUsername: appDetails.demoUsername,
                demoPassword: appDetails.demoPassword,
            }
        }
    } catch {
        // ASC autofill is best-effort; don't block submission
    }

    return appDetails
}


// ─── ASC Connection Step (Phase 1: New First Step) ──────────────────────────

async function offerAscConnection(draftState: DraftState): Promise<'forward' | 'skip' | 'cancel'> {
    // Check if we already fetched from ASC on this navigation pass
    if (draftState._ascConnected && draftState.appName && draftState.description) {
        // Already fetched ASC data - skip re-fetching to avoid duplicate API calls
        return 'forward'
    }

    const ascConnected = getAscConnected()

    // Check if we have manual entries that would be overwritten
    const hasManualEntries = !!(
        draftState.description ||
        draftState.keywords ||
        draftState.category ||
        draftState.supportUrl
    )

    let shouldConnect = false

    if (ascConnected) {
        try {
            const statusRes = await apiRequest('/api/asc/connect')
            if (statusRes.ok) {
                const statusData = await statusRes.json()
                if (statusData.connected && statusData.appId) {
                    // Warn if we'd overwrite manual entries
                    if (hasManualEntries) {
                        ui.log.warning('You have manually entered app details.')
                        const overwrite = await ui.confirm(
                            `Autofill from App Store Connect? This will overwrite your entries. (${statusData.appName || 'Connected app'})`,
                            false,
                        )
                        if (overwrite === null) return 'cancel'
                        shouldConnect = overwrite
                    } else {
                        const useAutofill = await ui.confirm(
                            `Autofill from App Store Connect? (${statusData.appName || 'Connected app'})`,
                            true,
                        )
                        if (useAutofill === null) return 'cancel'
                        shouldConnect = useAutofill
                    }

                    if (shouldConnect) {
                        const s = ui.spinner()
                        s.start('Fetching from App Store Connect...')

                        const autofillRes = await apiRequest('/api/asc/autofill', {
                            method: 'POST',
                            body: JSON.stringify({ appId: statusData.appId }),
                        })
                        const autofillData = await autofillRes.json()

                        s.stop(autofillRes.ok ? 'Autofill complete' : 'Autofill failed')

                        if (autofillRes.ok && autofillData) {
                            // Merge ASC data into draftState
                            draftState.appName = autofillData.app_name || draftState.appName
                            draftState.description = autofillData.description || draftState.description
                            draftState.keywords = autofillData.keywords || draftState.keywords
                            draftState.category = autofillData.category || draftState.category
                            draftState.privacyPolicyUrl = autofillData.privacy_policy_url || draftState.privacyPolicyUrl
                            draftState.termsOfUseUrl = autofillData.terms_of_use_url || draftState.termsOfUseUrl
                            draftState.supportUrl = autofillData.support_url || draftState.supportUrl
                            draftState.promotionalText =
                                autofillData.promotional_text || draftState.promotionalText
                            draftState.marketingUrl = autofillData.marketing_url || draftState.marketingUrl
                            draftState._ascConnected = true

                            ui.log.success('App details pre-filled from App Store Connect')
                        }
                    }
                }
            }
        } catch {
            // ASC is best-effort
        }
    } else {
        // Not connected - offer to connect now
        const wantsToConnect = await ui.confirm(
            'Connect to App Store Connect to auto-fill app details?',
            false,
        )
        if (wantsToConnect === null) return 'cancel'
        if (wantsToConnect) {
            ui.log.info('Opening browser to connect App Store Connect...')
            // TODO: Implement browser OAuth flow (similar to loginWithBrowser)
            // For now, just skip
            ui.log.info('ASC connection flow not yet implemented. Continuing with manual entry.')
        }
    }

    return shouldConnect || ascConnected ? 'forward' : 'skip'
}

// ─── Screenshot Collection with Navigation (Phase 2) ──────────────────────

// collectScreenshotsWithNav moved to ScreenshotsStep.ts

// ─── App Details Collection with Navigation (Phase 3) ──────────────────────

// collectAppDetailsWithNav moved to AppDetailsStep.ts

// ─── Compliance Collection with Navigation (Phase 4) ──────────────────────

// collectComplianceWithNav moved to ComplianceStep.ts

export async function submitCommand(path?: string, options: SubmitOptions = {}, fromMenu = false) {
    const { apiUrl } = getConfig()
    const jsonMode = options.json === true
    const nonInteractive = options.nonInteractive === true
    // jsonMode must never prompt and must keep stdout clean for machine parsing.
    const noPrompts = jsonMode || nonInteractive
    const spinnerEnabled = !noPrompts && process.stdout.isTTY && process.stderr.isTTY

    const log = {
        info: (msg: string) => { if (!jsonMode) ui.log.info(msg) },
        success: (msg: string) => { if (!jsonMode) ui.log.success(msg) },
        warning: (msg: string) => { if (!jsonMode) ui.log.warning(msg) },
        error: (msg: string) => { if (!jsonMode) ui.log.error(msg) },
        message: (msg: string) => { if (!jsonMode) ui.log.message(msg) },
    }

    const fail = (msg: string, code = 1): never => {
        // In json mode, stdout must remain parseable JSON only.
        console.error(msg)
        process.exit(code)
    }

    // Track draft state for auto-save on cancel (Phase 4)
    const draftState: DraftState = {}

    // Auth check with friendly prompt
    if (!isLoggedIn()) {
        if (noPrompts) fail('Not logged in. Run `preflight login` first.', 1)
        if (fromMenu) {
            // Should not happen -- menu checks auth first
            log.error('Not logged in.')
            return
        }
        const wantsLogin = await promptLogin()
        if (wantsLogin) {
            const s = ui.spinner()
            s.start('Opening browser...')
            const result = await loginWithBrowser('login')
            if (result) {
                s.stop(`Logged in as ${result.email}`)
            } else {
                s.stop('Login failed or cancelled')
                return
            }
        } else {
            log.warning('Login required for submissions. Scan is free without login!')
            if (!jsonMode) ui.tip(`Run ${brand('preflight scan')} for a free preview.`)
            return
        }
    }

    // Interactive mode: no path provided
    if (!path) {
        if (noPrompts) fail('Missing path. Pass a project path in --non-interactive/--json mode.', 2)
        const resolvedPath = await interactiveProjectSelect()
        if (!resolvedPath) return
        path = resolvedPath
    }

    const dir = resolve(path)
    setLastScannedPath(dir)
    draftState._projectPath = dir

    // 1. Detect files
    const detected = scanProject(dir)
    const projectName = detected.projectName || 'Unknown App'
    let appName = options.appName || projectName
    draftState.appName = appName

    // Apply overrides
    if (options.plist) detected.infoPlist = resolve(options.plist)
    if (options.manifest) detected.privacyManifest = resolve(options.manifest)
    if (options.ipa) detected.ipa = resolve(options.ipa)
    if (options.screenshots) detected.screenshots = resolveScreenshotPaths(options.screenshots)

    // In non-interactive mode, don't silently "guess" about screenshots.
    // Either we detect them automatically, the user provides them explicitly, or they opt out.
    if (!fromMenu && nonInteractive) {
        const screenshotsExplicitlyProvided = typeof options.screenshots === 'string'
        if (screenshotsExplicitlyProvided && detected.screenshots.length === 0) {
            fail(`No screenshots matched ${options.screenshots}. Provide a valid --screenshots glob/path or pass --skip-screenshots.`, 2)
        }
        if (!screenshotsExplicitlyProvided && detected.screenshots.length === 0 && options.skipScreenshots !== true) {
            fail('No screenshots detected. Pass --screenshots <glob/path> or --skip-screenshots in --non-interactive mode.', 2)
        }
    }

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

    // If no screenshots found and NOT from menu, ask user to choose how to provide them
    // When fromMenu is true, ScreenshotsStep will handle this interactively
    if (detected.screenshots.length === 0 && !fromMenu) {
        if (options.skipScreenshots || noPrompts) {
            // Continue without screenshots
        } else {
        const screenshotChoice = await ui.select<'manual' | 'browse' | 'skip'>({
            message: 'How do you want to provide screenshots?',
            options: [
                { value: 'browse', label: 'Browse with Finder', hint: 'Select files or a folder' },
                { value: 'manual', label: 'Enter path manually', hint: 'Type or paste file/folder path' },
                { value: 'skip', label: 'Skip', hint: 'Continue without screenshots' },
            ],
        })

        if (screenshotChoice === null || screenshotChoice === 'skip') {
            if (screenshotChoice === null) {
                await offerDraftSave(draftState)
                return
            }
            // Skip mode - continue without screenshots
        } else if (screenshotChoice === 'manual') {
            // Manual path entry
            const manualPath = await ui.text({
                message: 'Enter screenshot path (file or folder)',
                placeholder: '/path/to/screenshots',
                validate: (val) => {
                    if (!val?.trim()) return 'Path is required'
                    const resolved = resolve(val.replace(/^~/, process.env.HOME || ''))
                    if (!existsSync(resolved)) return 'Path does not exist'
                },
            })

            if (manualPath === null) {
                await offerDraftSave(draftState)
                return
            }

            const resolved = resolve(manualPath.replace(/^~/, process.env.HOME || ''))
            const stats = statSync(resolved)

            if (stats.isDirectory()) {
                // Handle as folder
                const imageExts = ['.png', '.jpg', '.jpeg']
                const foundFiles = readdirSync(resolved)
                    .filter(f => imageExts.includes(extname(f).toLowerCase()))
                    .map(f => join(resolved, f))

                for (let i = 0; i < Math.min(foundFiles.length, 10); i++) {
                    filesToUpload.push({
                        type: 'screenshot',
                        index: i,
                        filename: basename(foundFiles[i]),
                        path: foundFiles[i],
                    })
                }

                if (foundFiles.length > 0) {
                    ui.log.success(`Found ${foundFiles.length} screenshot${foundFiles.length === 1 ? '' : 's'}`)
                } else {
                    ui.log.warning('No images found in that folder.')
                }
            } else {
                // Handle as single file
                if (['.png', '.jpg', '.jpeg'].includes(extname(resolved).toLowerCase())) {
                    filesToUpload.push({
                        type: 'screenshot',
                        index: 0,
                        filename: basename(resolved),
                        path: resolved,
                    })
                    ui.log.success('Added 1 screenshot')
                } else {
                    ui.log.warning('File is not an image (must be PNG/JPEG)')
                }
            }
        } else if (screenshotChoice === 'browse') {
            // Browse sub-menu
            const browseChoice = await ui.select<'files' | 'folder' | 'back'>({
                message: 'Browse for screenshots',
                options: [
                    { value: 'files', label: 'Select files', hint: 'Pick specific images' },
                    { value: 'folder', label: 'Select folder', hint: 'All images in a directory' },
                    { value: 'back', label: 'Back', hint: 'Return to main menu' },
                ],
            })

            if (browseChoice === null || browseChoice === 'back') {
                // User cancelled or went back - fall through to empty check
            } else if (browseChoice === 'folder') {
                // Folder selection mode
                const folderPath = await promptForPath({
                    message: 'Select folder containing screenshots',
                    type: 'folder',
                    allowSkip: false,
                    mode: 'browse',
                })

                if (folderPath && typeof folderPath === 'string') {
                    const resolved = resolve(folderPath.replace(/^~/, process.env.HOME || ''))
                    if (existsSync(resolved)) {
                        const imageExts = ['.png', '.jpg', '.jpeg']
                        try {
                            const foundFiles = findFiles(resolved, (f) =>
                                imageExts.includes(extname(f).toLowerCase()), 2)

                            // Add files to upload (max 10)
                            for (let i = 0; i < Math.min(foundFiles.length, 10); i++) {
                                filesToUpload.push({
                                    type: 'screenshot',
                                    index: i,
                                    filename: basename(foundFiles[i]),
                                    path: foundFiles[i],
                                })
                            }
                            if (foundFiles.length > 0) {
                                ui.log.success(`Found ${foundFiles.length} screenshot${foundFiles.length === 1 ? '' : 's'}`)
                            } else {
                                ui.log.warning('No images found in that folder.')
                            }
                        } catch {
                            ui.log.warning('Could not read that folder.')
                        }
                    } else {
                        ui.log.warning('Folder not found.')
                    }
                }
            } else {
                // File selection mode
                const screenshotPath = await promptForPath({
                    message: 'Select screenshot files',
                    type: 'files',
                    fileTypes: ['public.png', 'public.jpeg'],
                    allowSkip: false,
                    mode: 'browse',
                })

                if (screenshotPath && Array.isArray(screenshotPath)) {
                    // Add files to upload (max 10)
                    for (let i = 0; i < Math.min(screenshotPath.length, 10); i++) {
                        filesToUpload.push({
                            type: 'screenshot',
                            index: i,
                            filename: basename(screenshotPath[i]),
                            path: screenshotPath[i],
                        })
                    }
                    ui.log.success(`Found ${screenshotPath.length} screenshot${screenshotPath.length === 1 ? '' : 's'}`)
                }
            }
        }
        }
    }

    if (filesToUpload.length === 0) {
        log.warning('No files to upload. Make sure you\'re pointing to an Xcode project directory.')
        if (fromMenu) return
        log.info(subtext('Use --plist, --manifest, --ipa, or --screenshots flags to specify files manually.'))
        return
    }

    // ─── Navigation Loop for Submission Flow (Phase 5) ─────────────────────
    // Implements backward navigation while preserving data in DraftState

    // Store detected files in state for display in steps
    draftState._files = filesToUpload

    if (fromMenu) {
        const { SubmissionFlow } = await import('../flows/submission/SubmissionFlow.js')
        const { AscStep } = await import('../flows/submission/steps/AscStep.js')
        const { ScreenshotsStep } = await import('../flows/submission/steps/ScreenshotsStep.js')
        const { AppDetailsStep } = await import('../flows/submission/steps/AppDetailsStep.js')
        const { ComplianceStep } = await import('../flows/submission/steps/ComplianceStep.js')
        const { ReviewStep } = await import('../flows/submission/steps/ReviewStep.js')

        // Check ASC connection for dashboard display
        let ascEmail: string | undefined
        let userCredits: number | undefined
        try {
            const ascRes = await apiRequest('/api/asc/connect')
            if (ascRes.ok) {
                const ascData = await ascRes.json()
                if (ascData.connected && ascData.email) {
                    ascEmail = ascData.email
                }
            }
        } catch { /* ignore */ }

        // Fetch legacy quota for dashboard display if the backend still exposes it.
        try {
            const creditsRes = await apiRequest('/api/credits')
            if (creditsRes.ok) {
                const creditsData = await creditsRes.json()
                userCredits = creditsData.credits
            }
        } catch { /* ignore */ }

        const flow = new SubmissionFlow(draftState, filesToUpload, projectName, ascEmail, userCredits, offerDraftSave, getConfig().email)

        flow.addStep('asc', new AscStep())
        flow.addStep('screenshots', new ScreenshotsStep(filesToUpload))
        flow.addStep('appDetails', new AppDetailsStep(projectName))
        flow.addStep('compliance', new ComplianceStep())
        flow.addStep('review', new ReviewStep(appName, dir, filesToUpload))

        const result = await flow.start()

        if (result === 'cancelled') {
            return
        }

        // If completed, we proceed to specific logic below which handles the actual API submission
    } else {
        // Non-interactive mode (from flags), ensure data is prepared
        // Logic for this falls through to below
    }

    // In direct CLI mode, ASC autofill helps avoid "missing required metadata" false alarms.
    if (!fromMenu) {
        await autofillDraftFromAsc(draftState)
    }

    // Summary confirmation (only in direct CLI mode - fromMenu already showed it in navigation loop via ReviewStep)
    if (!fromMenu) {
        if (!noPrompts) {
        ui.intro(`Submit ${appName} for analysis`)

        const fileLines = filesToUpload.map((f) => {
            const size = getFileSize(f.path)
            const icon = f.type === 'screenshot' ? icons.image : icons.file
            return `  ${icon} ${f.filename} ${subtext(`(${formatBytes(size)})`)}`
        })

        ui.log.message(chalk.bold('Files to upload:') + '\n' + fileLines.join('\n'))

        const shouldContinue = await ui.confirm('This will upload files to your configured Preflight backend. Continue?')
        if (shouldContinue === null || !shouldContinue) {
            ui.outro('Submission cancelled.')
            return
        }
        }
    }

    // ─── Upload & Analyze ────────────────────────────────────────────────

    if (!jsonMode) {
        log.info(subtext('Reviews usually take 1-3 minutes.'))
        console.log()
    }

    const spinner = createSpinner('Creating submission...', { enabled: spinnerEnabled })
    spinner.start()
    let activeSpinner = spinner

    try {
        // Build submission body
        const submissionBody: Record<string, any> = { app_name: draftState.appName }

        if (draftState.description) submissionBody.description = draftState.description
        if (draftState.keywords) submissionBody.keywords = draftState.keywords
        if (draftState.category) submissionBody.category = draftState.category
        if (draftState.privacyPolicyUrl) submissionBody.privacy_policy_url = draftState.privacyPolicyUrl
        const termsUrl = draftState.termsOfUseUrl || draftState.compliance?.checklist?.termsOfUseUrl
        if (termsUrl) submissionBody.terms_url = termsUrl
        if (draftState.supportUrl) submissionBody.support_url = draftState.supportUrl
        if (draftState.promotionalText) submissionBody.promotional_text = draftState.promotionalText
        if (draftState.marketingUrl) submissionBody.marketing_url = draftState.marketingUrl
        submissionBody.sign_in_required = draftState.signInRequired
        if (draftState.demoUsername) submissionBody.demo_username = draftState.demoUsername
        if (draftState.demoPassword) submissionBody.demo_password = draftState.demoPassword

        if (draftState.compliance) {
            Object.assign(submissionBody, formatComplianceForApi(draftState.compliance))
        }

        if (draftState._projectPath) {
            submissionBody.project_path = draftState._projectPath
        }

        const createRes = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionBody),
        })
        const createData = await createRes.json()

        if (!createRes.ok) {
            spinner.stop()
            if (jsonMode) fail(createData.message || 'Failed to create submission', 1)
            log.error(createData.message || 'Failed to create submission')
            if (!fromMenu) process.exitCode = 1
            return
        }

        const submissionId = createData.submissionId
        spinner.succeed('Submission created')

        // 3. Get signed upload URLs
        const uploadSpinner = createSpinner('Getting upload URLs...', { enabled: spinnerEnabled })
        uploadSpinner.start()
        activeSpinner = uploadSpinner

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
            if (jsonMode) fail(urlsData.message || 'Failed to get upload URLs', 1)
            log.error(urlsData.message || 'Failed to get upload URLs')
            if (!fromMenu) process.exitCode = 1
            return
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
                if (jsonMode) fail(`Failed to upload ${fileInfo.filename}: HTTP ${uploadRes.status} ${uploadRes.statusText}`, 1)
                log.error(`Failed to upload ${fileInfo.filename}: HTTP ${uploadRes.status} ${uploadRes.statusText}`)
                if (!fromMenu) process.exitCode = 1
                return
            }
        }
        uploadSpinner.succeed('Files uploaded')

        // 5. Finalize (with 402 retry)
        const analyzeSpinner = createSpinner('Starting analysis...', { enabled: spinnerEnabled })
        analyzeSpinner.start()
        activeSpinner = analyzeSpinner

        const finalizePayload = {
            files: filesToUpload.map((f) => ({
                type: f.type,
                index: f.index,
            })),
        }

        let finalizeSuccess = false

        let maxFinalizeRetries = 3

        while (!finalizeSuccess && maxFinalizeRetries > 0) {
            const finalizeRes = await apiRequest(`/api/submissions/${submissionId}/finalize`, {
                method: 'POST',
                body: JSON.stringify(finalizePayload),
            })
            const finalizeData = await finalizeRes.json()

            if (finalizeRes.ok) {
                finalizeSuccess = true
            } else if (finalizeRes.status === 402) {
                analyzeSpinner.stop()

                if (!jsonMode) {
                    log.warning(finalizeData.message || 'The configured backend rejected this analysis request.')
                    console.log()
                }

                if (noPrompts) fail(finalizeData.message || 'Backend rejected this analysis request.', 1)
                return
            } else {
                analyzeSpinner.stop()
                if (jsonMode) fail(finalizeData.message || 'Failed to finalize submission', 1)
                log.error(finalizeData.message || 'Failed to finalize submission')
                if (!fromMenu) process.exitCode = 1
                return
            }
        }

        if (!finalizeSuccess) {
            analyzeSpinner.stop()
            if (jsonMode) fail('Could not finalize after multiple attempts. Your files are saved -- try again later.', 1)
            log.error('Could not finalize after multiple attempts. Your files are saved -- try again later.')
            return
        }

        analyzeSpinner.text = 'AI review in progress... (press Esc to stop waiting)'

        // 6. Poll for completion (honest stages, no fake percentages)
        const reportData = await pollForReport(submissionId, analyzeSpinner)

        if (reportData.status === 'cancelled') {
            analyzeSpinner.stop()
            if (!jsonMode) {
                log.info('Analysis continues in the background.')
                console.log(subtext(`  Check status with ${brand(`preflight status ${submissionId}`)} or from View Reviews.`))
                console.log()
            }
            return
        }

        if (reportData.status === 'complete' && reportData.data) {
            analyzeSpinner.succeed('Analysis complete!')
            if (jsonMode) {
                console.log(JSON.stringify(reportData.data, null, 2))
            } else {
                renderReport(reportData.data.report, reportData.data.items)
                console.log(subtext(`  Full report: ${apiUrl}/report/${submissionId}`))
                console.log()

                let copyMessage = ''

                // Loop until user chooses to be done
                while (true) {
                    if (noPrompts) break
                    const next = await ui.select<'open' | 'copy' | 'done'>({
                        message: copyMessage ? `What next? ${chalk.green(copyMessage)}` : 'What next?',
                        options: [
                            { value: 'open', label: 'Open full report in browser' },
                            { value: 'copy', label: 'Copy for AI context', hint: 'Optimized for Claude/ChatGPT' },
                            { value: 'done', label: fromMenu ? 'Return to main menu' : 'Done' },
                        ],
                    })

                    // Reset message for next loop
                    copyMessage = ''

                    if (next === 'open') {
                        await openUrl(`${apiUrl}/report/${submissionId}`)
                    } else if (next === 'copy') {
                        try {
                            const aiText = formatForAi(reportData.data.report, reportData.data.items, submissionId, draftState, filesToUpload.map(f => f.type))
                            // Use pbcopy on Mac
                            const { execSync } = await import('child_process')
                            execSync('pbcopy', { input: aiText })
                            copyMessage = '(Copied!)'
                        } catch (err) {
                            ui.log.error('Failed to copy to clipboard (pbcopy not available?)')
                        }
                    } else {
                        break
                    }
                }
            }
        } else if (reportData.status === 'failed') {
            analyzeSpinner.stop()
            if (jsonMode) fail(reportData.error ? `Analysis failed: ${reportData.error}` : 'Analysis failed. Please try submitting again or contact support.', 1)
            log.error(reportData.error ? `Analysis failed: ${reportData.error}` : 'Analysis failed. Please try submitting again or contact support.')
            if (!fromMenu) process.exitCode = 1
        } else {
            analyzeSpinner.stop()
            if (jsonMode) fail(`Analysis still running. Check status with: preflight status ${submissionId}`, 1)
            log.warning('Analysis is still running. Check status with:')
            console.log(subtext(`  preflight status ${submissionId}`))
        }
    } catch (err) {
        activeSpinner.stop()
        if (jsonMode) fail(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 1)
        log.error(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        if (!fromMenu) process.exitCode = 1
    }
}

// ─── Resume Draft Command (Phase 2) ────────────────────────────────────────

export async function resumeSubmitCommand(draft: Record<string, any>) {
    const { apiUrl } = getConfig()
    const submissionId = draft.id

    ui.log.step(`Resuming draft: ${draft.app_name || 'Unknown'}`)
    console.log()

    // Re-run project scan (files may have changed since draft was saved)
    const lastPath = draft.project_path
    let path: string | undefined

    if (lastPath) {
        if (existsSync(lastPath)) {
            path = lastPath
            ui.log.success(`Using project path from draft: ${path}`)
        } else {
            // Path no longer exists, ask for a new one
            ui.log.warning(`Previous project path no longer exists: ${lastPath}`)
        }
    }

    if (!path) {
        const resolvedPath = await interactiveProjectSelect()
        if (!resolvedPath) return
        path = resolvedPath
    }

    const dir = resolve(path)
    setLastScannedPath(dir)

    const detected = scanProject(dir)
    const projectName = detected.projectName || 'Unknown App'

    // Build file list
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

    // Attempt to recover screenshot paths from draft or re-scan
    if (draft._screenshotPaths && Array.isArray(draft._screenshotPaths)) {
        for (let i = 0; i < Math.min(draft._screenshotPaths.length, 10); i++) {
            const p = draft._screenshotPaths[i]
            if (existsSync(p)) {
                filesToUpload.push({
                    type: 'screenshot',
                    index: i,
                    filename: basename(p),
                    path: p,
                })
            }
        }
    } else {
        // Fallback to auto-detect
        for (let i = 0; i < Math.min(detected.screenshots.length, 10); i++) {
            filesToUpload.push({
                type: 'screenshot',
                index: i,
                filename: basename(detected.screenshots[i]),
                path: detected.screenshots[i],
            })
        }
    }

    // Initialize DraftState
    const draftState: DraftState = {
        appName: draft.app_name,
        description: draft.description,
        keywords: draft.keywords,
        category: draft.category,
        supportUrl: draft.support_url,
        termsOfUseUrl: draft.terms_url,
        promotionalText: draft.promotional_text,
        marketingUrl: draft.marketing_url,
        signInRequired: draft.sign_in_required,
        demoUsername: draft.demo_username,
        demoPassword: draft.demo_password,
        compliance: parseComplianceFromApi(draft),
        _flowPosition: draft.flow_position,
        _screenshotPaths: draft.screenshot_paths || filesToUpload.filter(f => f.type === 'screenshot').map(f => f.path),
        _projectPath: dir
    }

    if (!draftState.termsOfUseUrl && draftState.compliance?.checklist?.termsOfUseUrl) {
        draftState.termsOfUseUrl = draftState.compliance.checklist.termsOfUseUrl
    }



    // Check ASC connection for dashboard display
    let ascEmail: string | undefined
    let userCredits: number | undefined
    try {
        const ascRes = await apiRequest('/api/asc/connect')
        if (ascRes.ok) {
            const ascData = await ascRes.json()
            if (ascData.connected && ascData.email) {
                ascEmail = ascData.email
            }
        }
    } catch { /* ignore */ }

        // Fetch legacy quota for dashboard display if the backend still exposes it.
    try {
        const creditsRes = await apiRequest('/api/credits')
        if (creditsRes.ok) {
            const creditsData = await creditsRes.json()
            userCredits = creditsData.credits
        }
    } catch { /* ignore */ }

    const flow = new SubmissionFlow(draftState, filesToUpload, projectName, ascEmail, userCredits, offerDraftSave, getConfig().email)

    flow.addStep('asc', new AscStep())
    flow.addStep('screenshots', new ScreenshotsStep(filesToUpload))
    flow.addStep('appDetails', new AppDetailsStep(projectName))
    flow.addStep('compliance', new ComplianceStep())
    flow.addStep('review', new ReviewStep(draftState.appName || projectName, dir, filesToUpload))

    const result = await flow.start()

    if (result === 'cancelled') return

    // Proceed to UPDATE submission
    ui.log.info(subtext('Reviews usually take 1-3 minutes.'))
    console.log()

    const spinner = createSpinner('Updating submission...')
    spinner.start()
    let activeSpinner = spinner

    try {
        const submissionBody: Record<string, any> = {
            submission_id: submissionId,
            app_name: draftState.appName,
        }

        if (draftState.description) submissionBody.description = draftState.description
        if (draftState.keywords) submissionBody.keywords = draftState.keywords
        if (draftState.category) submissionBody.category = draftState.category
        if (draftState.privacyPolicyUrl) submissionBody.privacy_policy_url = draftState.privacyPolicyUrl
        const updateTermsUrl = draftState.termsOfUseUrl || draftState.compliance?.checklist?.termsOfUseUrl
        if (updateTermsUrl) submissionBody.terms_url = updateTermsUrl
        if (draftState.supportUrl) submissionBody.support_url = draftState.supportUrl
        if (draftState.promotionalText) submissionBody.promotional_text = draftState.promotionalText
        if (draftState.marketingUrl) submissionBody.marketing_url = draftState.marketingUrl
        submissionBody.sign_in_required = draftState.signInRequired
        if (draftState.demoUsername) submissionBody.demo_username = draftState.demoUsername
        if (draftState.demoPassword) submissionBody.demo_password = draftState.demoPassword

        if (draftState.compliance) {
            Object.assign(submissionBody, formatComplianceForApi(draftState.compliance))
        }

        if (draftState._projectPath) {
            submissionBody.project_path = draftState._projectPath
        }

        const createRes = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionBody),
        })
        const createData = await createRes.json()

        if (!createRes.ok) {
            spinner.stop()
            ui.log.error(createData.message || 'Failed to update submission')
            return
        }

        const finalId = createData.submissionId || submissionId
        spinner.succeed('Submission updated')

        // Get signed upload URLs
        const uploadSpinner = createSpinner('Getting upload URLs...')
        uploadSpinner.start()
        activeSpinner = uploadSpinner

        const urlsRes = await apiRequest(`/api/submissions/${finalId}/upload-urls`, {
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
            return
        }

        // Upload files
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
                return
            }
        }
        uploadSpinner.succeed('Files uploaded')

        // Finalize logic (with Retry)
        const analyzeSpinner = createSpinner('Starting analysis...')
        analyzeSpinner.start()
        activeSpinner = analyzeSpinner

        const finalizePayload = {
            files: filesToUpload.map((f) => ({
                type: f.type,
                index: f.index,
            })),
        }

        let finalizeSuccess = false
        let maxFinalizeRetries = 3

        while (!finalizeSuccess && maxFinalizeRetries > 0) {
            const finalizeRes = await apiRequest(`/api/submissions/${finalId}/finalize`, {
                method: 'POST',
                body: JSON.stringify(finalizePayload),
            })
            const finalizeData = await finalizeRes.json()

            if (finalizeRes.ok) {
                finalizeSuccess = true
            } else if (finalizeRes.status === 402) {
                analyzeSpinner.stop()
                ui.log.warning(finalizeData.message || 'The configured backend rejected this analysis request.')
                return
            } else {
                analyzeSpinner.stop()
                ui.log.error(finalizeData.message || 'Failed to finalize')
                return
            }
        }

        if (!finalizeSuccess) {
            analyzeSpinner.stop()
            ui.log.error('Could not finalize after multiple attempts.')
            return
        }

        analyzeSpinner.text = 'AI review in progress...'
        const reportData = await pollForReport(finalId, analyzeSpinner)

        if (reportData.status === 'cancelled') {
            analyzeSpinner.stop()
            ui.log.info('Analysis continues in background.')
            return
        }

        analyzeSpinner.succeed('Analysis complete!')

        if (reportData.status === 'complete' && reportData.data) {
            renderReport(reportData.data.report, reportData.data.items)
            console.log(subtext(`  Full report: ${apiUrl}/report/${finalId}`))


            // Loop until user chooses to be done
            while (true) {
                const next = await ui.select<'open' | 'copy' | 'done'>({
                    message: 'What next?',
                    options: [
                        { value: 'open', label: 'Open full report in browser' },
                        { value: 'copy', label: 'Copy for AI context', hint: 'Optimized for Claude/ChatGPT' },
                        { value: 'done', label: 'Done' },
                    ],
                })

                if (next === 'open') {
                    await openUrl(`${apiUrl}/report/${finalId}`)
                } else if (next === 'copy') {
                    try {
                        const aiText = formatForAi(reportData.data.report, reportData.data.items, submissionId, draft, filesToUpload.map(f => f.type))
                        const { execSync } = await import('child_process')
                        execSync('pbcopy', { input: aiText })
                        ui.log.success('Copied to clipboard!')
                    } catch (err) {
                        ui.log.error('Failed to copy to clipboard')
                    }
                } else {
                    break
                }
            }
        } else {
            ui.log.error(reportData.status === 'failed' && reportData.error ? `Analysis failed: ${reportData.error}` : 'Analysis failed.')
        }

    } catch (err) {
        activeSpinner.stop()
        ui.log.error(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}




// ─── Polling (Phase 5: Cancel Support) ──────────────────────────────────

interface PollResult {
    status: 'complete' | 'failed' | 'timeout' | 'cancelled'
    data?: { report: any; items: any[] }
    error?: string
}

async function pollForReport(
    submissionId: string,
    spinner: { text: string; stop?: () => void },
    maxAttempts = 60,
    interval = 5000
): Promise<PollResult> {
    let consecutiveFailures = 0
    const startTime = Date.now()
    let cancelled = false

    // Listen for Esc/Ctrl+C during polling
    const onKeypress = (data: Buffer) => {
        // Esc key = 0x1b, Ctrl+C = 0x03
        if (data[0] === 0x1b || data[0] === 0x03) {
            cancelled = true
        }
    }

    try {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
            process.stdin.resume()
            process.stdin.on('data', onKeypress)
        }
        for (let i = 0; i < maxAttempts; i++) {
            // Cancellable sleep: check every 500ms
            for (let w = 0; w < interval / 500; w++) {
                if (cancelled) return { status: 'cancelled' }
                await new Promise((r) => setTimeout(r, 500))
            }

            if (cancelled) return { status: 'cancelled' }

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

            // Honest elapsed time display
            const elapsed = Math.round((Date.now() - startTime) / 1000)
            spinner.text = `AI review in progress... (${elapsed}s elapsed, press Esc to stop waiting)`

            if (submission.status === 'complete') {
                if (submission.report_id) {
                    const reportRes = await apiRequest(`/api/reports/${submission.report_id}`)
                    const reportData = await reportRes.json()
                    return { status: 'complete', data: reportData }
                }
                return { status: 'failed' as const }
            }

            if (submission.status === 'failed') {
                const job = Array.isArray(submission.analysis_jobs) ? submission.analysis_jobs[0] : submission.analysis_jobs
                return { status: 'failed', error: job?.error_message }
            }
        }

        return { status: 'timeout' }
    } finally {
        // Clean up keypress listener
        if (process.stdin.isTTY) {
            process.stdin.removeListener('data', onKeypress)
            process.stdin.setRawMode(false)
            process.stdin.pause()
        }
    }
}

function formatForAi(
    report: any,
    items: any[],
    submissionId: string,
    draft?: Partial<DraftState> | Record<string, any>,
    fileTypes?: string[]
): string {
    // Build a "best available" submission object. In the CLI we always have local answers,
    // and the server also stores them on the submission row; for AI context we want them
    // explicitly present even if the report endpoint doesn't return the submission.
    const submission: Record<string, any> = { id: submissionId }

    // Include user-provided app details (draft state uses camelCase; API uses snake_case)
    if (draft) {
        submission.app_name = (draft as any).appName ?? (draft as any).app_name ?? undefined
        submission.version = (draft as any).version ?? undefined
        submission.category = (draft as any).category ?? undefined
        submission.privacy_url = (draft as any).privacyPolicyUrl ?? (draft as any).privacy_policy_url ?? (draft as any).privacy_url ?? undefined
        submission.terms_url = (draft as any).termsOfUseUrl ?? (draft as any).terms_of_use_url ?? (draft as any).terms_url ?? undefined
        submission.support_url = (draft as any).supportUrl ?? (draft as any).support_url ?? undefined
        submission.marketing_url = (draft as any).marketingUrl ?? (draft as any).marketing_url ?? undefined
        submission.sign_in_required = (draft as any).signInRequired ?? (draft as any).sign_in_required ?? undefined
        submission.demo_username = (draft as any).demoUsername ?? (draft as any).demo_username ?? undefined
        submission.demo_password = (draft as any).demoPassword ?? (draft as any).demo_password ?? undefined
    }

    const compliance: ComplianceData | undefined = (draft as any)?.compliance
    if (compliance) {
        submission.age_rating = compliance.ageRatingAnswers
        submission.privacy_declarations = {
            data: compliance.privacyDeclarations.data,
            tracking: compliance.privacyDeclarations.tracking,
        }
        submission.checklist = compliance.checklist
    }

    // Normalize report fields between legacy CLI naming and current web naming.
    const normalizedReport = report
        ? {
            score_overall: report.score_overall ?? report.score ?? null,
            score_metadata: report.score_metadata ?? null,
            score_screenshots: report.score_screenshots ?? null,
            score_privacy: report.score_privacy ?? null,
            score_plist: report.score_plist ?? null,
            score_urls: report.score_urls ?? null,
            score_content: report.score_content ?? null,
            score_ipa_binary: report.score_ipa_binary ?? null,
            summary: report.summary ?? null,
            improved_version: report.improved_version ?? null,
        }
        : null

    const normalizedItems = (Array.isArray(items) ? items : []).map((it: any) => {
        const guideline =
            it.guideline_ref ??
            (Array.isArray(it.guidelines) ? it.guidelines.join(', ') : it.guidelines) ??
            null
        return {
            ...it,
            guideline_ref: guideline,
            description: it.description ?? it.explanation ?? null,
        }
    })

    return formatAiContext({
        submission,
        report: normalizedReport,
        items: normalizedItems,
        fileTypes: fileTypes || null,
        redactSensitive: true,
    })
}
