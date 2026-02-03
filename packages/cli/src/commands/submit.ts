import chalk from 'chalk'
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs'
import { basename, resolve, extname, join } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { apiRequest } from '../lib/api-client.js'
import { isLoggedIn, setLastScannedPath, getAscConnected } from '../lib/config.js'
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
    formatComplianceSummary,
    type AppDetails,
    type ComplianceData,
} from '../lib/submission-questions.js'

interface SubmitOptions {
    appName?: string
    ipa?: string
    plist?: string
    manifest?: string
    screenshots?: string
    json?: boolean
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

// Fetch current credit balance
async function fetchCredits(): Promise<number | null> {
    try {
        const res = await apiRequest('/api/credits')
        if (!res.ok) return null
        const data = await res.json()
        return data.credits ?? null
    } catch {
        return null
    }
}

// Credit pre-check: ensure user has enough credits before proceeding
async function creditPreCheck(): Promise<boolean> {
    const credits = await fetchCredits()

    if (credits === null) {
        ui.log.warning('Could not verify credit balance. Proceeding anyway.')
        return true
    }

    if (credits >= 100) return true

    // Not enough credits
    ui.log.warning(`You need 100 credits for a review. You currently have ${credits}.`)
    console.log()

    const wantsBuy = await ui.confirm('Would you like to buy more credits?')
    if (wantsBuy === null || !wantsBuy) return false

    await openUrl('https://preflightlaunch.com/pricing')
    ui.log.info('Opened pricing page in browser.')
    console.log()

    // Auto-poll for credit purchase
    ui.log.info(subtext('Waiting for credits... Press Enter to check now, or Esc to cancel.'))

    let attempts = 0
    const maxAttempts = 60 // 10 minutes at 10s intervals

    while (attempts < maxAttempts) {
        // Wait 10 seconds between checks
        await new Promise(r => setTimeout(r, 10000))
        attempts++

        const newCredits = await fetchCredits()
        if (newCredits !== null && newCredits >= 100) {
            ui.log.success(`Credits updated! You now have ${newCredits} credits.`)
            return true
        }
    }

    ui.log.warning('Still waiting for credits. You can try again later.')
    return false
}

// ─── Draft Save Helper (Phase 4) ──────────────────────────────────────────

interface DraftState {
    appName?: string
    description?: string
    keywords?: string
    category?: string
    supportUrl?: string
    promotionalText?: string
    marketingUrl?: string
    signInRequired?: boolean
    demoUsername?: string
    demoPassword?: string
    compliance?: ComplianceData
    // Flow position tracking for draft resumption
    _flowPosition?: 'asc' | 'screenshots' | 'appDetails' | 'compliance' | 'confirmation'
    _ascConnected?: boolean // Track if ASC was used for autofill
    _screenshotPaths?: string[] // Track screenshot paths for reference
}

async function offerDraftSave(state: DraftState): Promise<void> {
    // Only offer if we have at least an app name
    if (!state.appName) return

    const save = await ui.confirm('Save your progress as a draft?', true)
    if (save === null || !save) return

    const s = ui.spinner()
    s.start('Saving draft...')

    try {
        const body: Record<string, any> = { app_name: state.appName }
        if (state.description) body.description = state.description
        if (state.keywords) body.keywords = state.keywords
        if (state.category) body.category = state.category
        if (state.supportUrl) body.support_url = state.supportUrl
        if (state.promotionalText) body.promotional_text = state.promotionalText
        if (state.marketingUrl) body.marketing_url = state.marketingUrl
        if (state.signInRequired != null) body.sign_in_required = state.signInRequired
        if (state.demoUsername) body.demo_username = state.demoUsername
        if (state.demoPassword) body.demo_password = state.demoPassword
        if (state.compliance) Object.assign(body, formatComplianceForApi(state.compliance))

        // Include flow position metadata for resuming
        if (state._flowPosition) {
            body._flowPosition = state._flowPosition
        }

        const res = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(body),
        })

        s.stop(res.ok ? 'Draft saved' : 'Could not save draft')

        if (res.ok) {
            ui.log.success('Draft saved. Resume it from View Reviews anytime.')
        }
    } catch {
        s.stop('Could not save draft')
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

async function collectScreenshotsWithNav(
    filesToUpload: Array<{ type: string; index?: number; filename: string; path: string }>,
    draftState: DraftState,
): Promise<'forward' | 'back' | 'cancel'> {
    // Helper to load screenshots from a path
    const loadScreenshotsFromPath = (pathStr: string): number => {
        try {
            const resolved = resolve(pathStr.replace(/^\~/, process.env.HOME || ''))
            const stats = statSync(resolved)

            if (stats.isDirectory()) {
                // Handle as folder
                const imageExts = ['.png', '.jpg', '.jpeg']
                const foundFiles = readdirSync(resolved)
                    .filter((f) => imageExts.includes(extname(f).toLowerCase()))
                    .map((f) => join(resolved, f))

                // Remove existing screenshots
                const screenshotIndices = filesToUpload
                    .map((f, i) => (f.type === 'screenshot' ? i : -1))
                    .filter((i) => i !== -1)
                    .reverse()
                for (const idx of screenshotIndices) {
                    filesToUpload.splice(idx, 1)
                }

                for (let i = 0; i < Math.min(foundFiles.length, 10); i++) {
                    filesToUpload.push({
                        type: 'screenshot',
                        index: i,
                        filename: basename(foundFiles[i]),
                        path: foundFiles[i],
                    })
                }

                // Track screenshot paths in draft state
                draftState._screenshotPaths = filesToUpload
                    .filter((f) => f.type === 'screenshot')
                    .map((f) => f.path)

                return foundFiles.length
            } else {
                // Handle as single file
                if (['.png', '.jpg', '.jpeg'].includes(extname(resolved).toLowerCase())) {
                    // Remove existing screenshots
                    const screenshotIndices = filesToUpload
                        .map((f, i) => (f.type === 'screenshot' ? i : -1))
                        .filter((i) => i !== -1)
                        .reverse()
                    for (const idx of screenshotIndices) {
                        filesToUpload.splice(idx, 1)
                    }

                    filesToUpload.push({
                        type: 'screenshot',
                        index: 0,
                        filename: basename(resolved),
                        path: resolved,
                    })

                    // Track screenshot path in draft state
                    draftState._screenshotPaths = [resolved]

                    return 1
                }
            }
        } catch {
            return 0
        }
        return 0
    }

    let continuingFlow = false

    while (true) {
        const screenshotCount = filesToUpload.filter((f) => f.type === 'screenshot').length

        if (continuingFlow && screenshotCount > 0) {
            // Show navigation menu after initial load
            const action = await ui.select<'continue' | 'change' | 'back'>({
                message: `Screenshots (${screenshotCount} added)`,
                options: [
                    { value: 'continue', label: 'Continue', hint: 'Proceed to app details' },
                    { value: 'change', label: 'Change screenshots', hint: 'Select different screenshots' },
                    { value: 'back', label: 'Back', hint: 'Return to previous step' },
                ],
            })

            if (action === null) return 'cancel'
            if (action === 'back') return 'back'
            if (action === 'continue') return 'forward'
            // else action === 'change', continue loop to re-select
        }

        // Screenshot selection menu
        const screenshotChoice = await ui.select<'manual' | 'browse' | 'skip' | 'none'>({
            message: continuingFlow ? 'Select screenshots' : 'How do you want to provide screenshots?',
            options: [
                { value: 'manual', label: 'Enter path manually', hint: 'Type or paste file/folder path' },
                { value: 'browse', label: 'Browse with Finder...', hint: 'Choose files or folder' },
                { value: 'skip', label: 'Skip', hint: 'Continue without screenshots' },
            ],
        })

        if (screenshotChoice === null) return 'cancel'

        if (screenshotChoice === 'skip') {
            if (continuingFlow && screenshotCount > 0) {
                // Already have screenshots, don't skip
                continue
            }
            return 'forward'
        }

        if (screenshotChoice === 'manual') {
            const manualPath = await ui.text({
                message: 'Enter screenshot path (file or folder)',
                placeholder: '/path/to/screenshots',
                validate: (val) => {
                    if (!val?.trim()) return 'Path is required'
                    const resolved = resolve(val.replace(/^~/, process.env.HOME || ''))
                    if (!existsSync(resolved)) return 'Path does not exist'
                    return true
                },
            })

            if (manualPath === null) return 'cancel'

            const count = loadScreenshotsFromPath(manualPath)
            if (count > 0) {
                ui.log.success(`Found ${count} screenshot${count === 1 ? '' : 's'}`)
                continuingFlow = true
            } else {
                ui.log.warning('No images found. Try another path.')
            }
        } else if (screenshotChoice === 'browse') {
            // Browse sub-menu
            const browseChoice = await ui.select<'files' | 'folder' | 'back'>({
                message: 'Browse for screenshots',
                options: [
                    { value: 'files', label: 'Select files...', hint: 'Pick specific screenshots' },
                    { value: 'folder', label: 'Select folder...', hint: 'All images in a folder' },
                    { value: 'back', label: 'Back', hint: 'Return to previous menu' },
                ],
            })

            if (browseChoice === null || browseChoice === 'back') {
                // Continue to next iteration of outer loop
                continue
            } else if (browseChoice === 'folder') {
                const folderPath = await promptForPath({
                    message: 'Select folder containing screenshots',
                    type: 'folder',
                    allowSkip: false,
                })

                if (folderPath && typeof folderPath === 'string') {
                    const count = loadScreenshotsFromPath(folderPath)
                    if (count > 0) {
                        ui.log.success(`Found ${count} screenshot${count === 1 ? '' : 's'}`)
                        continuingFlow = true
                    } else {
                        ui.log.warning('No images found in that folder.')
                    }
                }
            } else {
                // File selection mode
                const screenshotPath = await promptForPath({
                    message: 'Select screenshot files',
                    type: 'files',
                    fileTypes: ['public.png', 'public.jpeg'],
                    allowSkip: false,
                })

                if (screenshotPath && Array.isArray(screenshotPath)) {
                    // Remove existing screenshots
                    const screenshotIndices = filesToUpload
                        .map((f, i) => (f.type === 'screenshot' ? i : -1))
                        .filter((i) => i !== -1)
                        .reverse()
                    for (const idx of screenshotIndices) {
                        filesToUpload.splice(idx, 1)
                    }

                    for (let i = 0; i < Math.min(screenshotPath.length, 10); i++) {
                        filesToUpload.push({
                            type: 'screenshot',
                            index: i,
                            filename: basename(screenshotPath[i]),
                            path: screenshotPath[i],
                        })
                    }

                    // Track screenshot paths in draft state
                    draftState._screenshotPaths = screenshotPath.slice(0, 10)

                    ui.log.success(`Found ${screenshotPath.length} screenshot${screenshotPath.length === 1 ? '' : 's'}`)
                    continuingFlow = true
                }
            }
        }
    }
}

// ─── App Details Collection with Navigation (Phase 3) ──────────────────────

async function collectAppDetailsWithNav(
    projectName: string,
    draftState: DraftState,
): Promise<AppDetails | 'back' | 'cancel'> {
    const defaults: Partial<AppDetails> = {
        appName: draftState.appName,
        description: draftState.description,
        keywords: draftState.keywords,
        category: draftState.category,
        supportUrl: draftState.supportUrl,
        promotionalText: draftState.promotionalText,
        marketingUrl: draftState.marketingUrl,
        signInRequired: draftState.signInRequired,
        demoUsername: draftState.demoUsername,
        demoPassword: draftState.demoPassword,
    }

    const appDetails = await collectAppDetails(projectName, defaults)

    if (appDetails === null) {
        // User pressed Escape - ask what they want to do
        const action = await ui.select<'back' | 'cancel'>({
            message: 'App details cancelled',
            options: [
                { value: 'back', label: 'Go back', hint: 'Return to previous step' },
                { value: 'cancel', label: 'Save draft & exit', hint: 'Save progress and exit' },
            ],
        })

        if (action === null || action === 'cancel') return 'cancel'
        return 'back'
    }

    // Merge into draftState
    draftState.appName = appDetails.appName
    draftState.description = appDetails.description
    draftState.keywords = appDetails.keywords
    draftState.category = appDetails.category
    draftState.supportUrl = appDetails.supportUrl
    draftState.promotionalText = appDetails.promotionalText
    draftState.marketingUrl = appDetails.marketingUrl
    draftState.signInRequired = appDetails.signInRequired
    draftState.demoUsername = appDetails.demoUsername
    draftState.demoPassword = appDetails.demoPassword

    return appDetails
}

// ─── Compliance Collection with Navigation (Phase 4) ──────────────────────

async function collectComplianceWithNav(draftState: DraftState): Promise<ComplianceData | 'back' | 'cancel'> {
    const defaults: Partial<ComplianceData> | undefined = draftState.compliance

    const compliance = await collectCompliance(defaults)

    if (compliance === null) {
        // User chose "Back" in compliance menu
        return 'back'
    }

    // Merge into draftState
    draftState.compliance = compliance

    return compliance
}

export async function submitCommand(path?: string, options: SubmitOptions = {}, fromMenu = false) {
    // Track draft state for auto-save on cancel (Phase 4)
    const draftState: DraftState = {}

    // Auth check with friendly prompt
    if (!isLoggedIn()) {
        if (fromMenu) {
            // Should not happen -- menu checks auth first
            ui.log.error('Not logged in.')
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
            ui.log.warning('Login required for submissions. Scan is free without login!')
            ui.tip(`Run ${brand('preflight scan')} for a free preview.`)
            return
        }
    }

    // Credit pre-check (before any project selection or file work)
    if (fromMenu) {
        const hasCredits = await creditPreCheck()
        if (!hasCredits) return
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
    const projectName = detected.projectName || 'Unknown App'
    let appName = options.appName || projectName
    draftState.appName = appName

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

    // If no screenshots found, ask user to choose how to provide them
    if (detected.screenshots.length === 0 && fromMenu) {
        const screenshotChoice = await ui.select<'manual' | 'browse' | 'skip'>({
            message: 'How do you want to provide screenshots?',
            options: [
                { value: 'manual', label: 'Enter path manually', hint: 'Type or paste file/folder path' },
                { value: 'browse', label: 'Browse with Finder...', hint: 'Choose files or folder' },
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
                    return true
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
                    { value: 'files', label: 'Select files...', hint: 'Pick specific screenshots' },
                    { value: 'folder', label: 'Select folder...', hint: 'All images in a folder' },
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
                })

                if (folderPath && typeof folderPath === 'string') {
                    const resolved = resolve(folderPath.replace(/^~/, process.env.HOME || ''))
                    if (existsSync(resolved)) {
                        const imageExts = ['.png', '.jpg', '.jpeg']
                        try {
                            const foundFiles = readdirSync(resolved)
                                .filter(f => imageExts.includes(extname(f).toLowerCase()))
                                .map(f => join(resolved, f))

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

    if (filesToUpload.length === 0) {
        ui.log.warning('No files to upload. Make sure you\'re pointing to an Xcode project directory.')
        if (fromMenu) return
        ui.log.info(subtext('Use --plist, --manifest, --ipa, or --screenshots flags to specify files manually.'))
        return
    }

    // ─── Navigation Loop for Submission Flow (Phase 5) ─────────────────────
    // Implements backward navigation while preserving data in DraftState

    let appDetails: AppDetails | null = null
    let compliance: ComplianceData | null = null

    if (fromMenu) {
        type Step = 'asc' | 'screenshots' | 'appDetails' | 'compliance' | 'review'
        const steps: Step[] = ['asc', 'screenshots', 'appDetails', 'compliance', 'review']
        let currentStepIndex = 0

        while (currentStepIndex < steps.length) {
            const step = steps[currentStepIndex]

            console.log()
            ui.log.step(`Step ${currentStepIndex + 1} of ${steps.length}: ${step}`)
            console.log()

            if (step === 'asc') {
                const result = await offerAscConnection(draftState)
                if (result === 'cancel') {
                    await offerDraftSave(draftState)
                    return
                }
                // No "back" option on first step
                draftState._flowPosition = 'asc'  // Track position before advancing
                currentStepIndex++
            } else if (step === 'screenshots') {
                const result = await collectScreenshotsWithNav(filesToUpload, draftState)
                if (result === 'cancel') {
                    draftState._flowPosition = 'screenshots'  // Save position before exiting
                    await offerDraftSave(draftState)
                    return
                } else if (result === 'back') {
                    currentStepIndex--
                } else {
                    draftState._flowPosition = 'screenshots'  // Track position before advancing
                    currentStepIndex++
                }
            } else if (step === 'appDetails') {
                const result = await collectAppDetailsWithNav(projectName, draftState)
                if (result === 'cancel') {
                    draftState._flowPosition = 'appDetails'  // Save position before exiting
                    await offerDraftSave(draftState)
                    return
                } else if (result === 'back') {
                    currentStepIndex--
                } else {
                    appDetails = result
                    appName = appDetails.appName
                    draftState._flowPosition = 'appDetails'  // Track position before advancing
                    currentStepIndex++
                }
            } else if (step === 'compliance') {
                const result = await collectComplianceWithNav(draftState)
                if (result === 'cancel') {
                    draftState._flowPosition = 'compliance'  // Save position before exiting
                    await offerDraftSave(draftState)
                    return
                } else if (result === 'back') {
                    currentStepIndex--
                } else {
                    compliance = result
                    draftState._flowPosition = 'compliance'  // Track position before advancing
                    currentStepIndex++
                }
            } else if (step === 'review') {
                console.log()
                ui.note(buildSummary(appName, dir, filesToUpload, compliance), 'Review Summary')
                console.log()

                const action = await ui.select<'submit' | 'back' | 'cancel'>({
                    message: `Submit review? (100 credits)`,
                    options: [
                        { value: 'submit', label: 'Submit review', hint: '100 credits will be deducted' },
                        { value: 'back', label: 'Go back to edit', hint: 'Change app details or compliance' },
                        { value: 'cancel', label: 'Save draft & exit', hint: 'Save progress and exit' },
                    ],
                })

                if (action === null || action === 'cancel') {
                    draftState._flowPosition = 'review'  // Save position before exiting
                    await offerDraftSave(draftState)
                    return
                } else if (action === 'back') {
                    currentStepIndex--
                } else {
                    // Proceed to submission
                    draftState._flowPosition = 'confirmation'  // Mark as moving to submission
                    currentStepIndex++
                }
            }
        }
    }

    // Summary confirmation (only in direct CLI mode - fromMenu already showed it in navigation loop)
    if (!fromMenu) {
        ui.intro(`Submit ${appName} for analysis`)

        const fileLines = filesToUpload.map((f) => {
            const size = getFileSize(f.path)
            const icon = f.type === 'screenshot' ? icons.image : icons.file
            return `  ${icon} ${f.filename} ${subtext(`(${formatBytes(size)})`)}`
        })

        ui.log.message(chalk.bold('Files to upload:') + '\n' + fileLines.join('\n'))

        const shouldContinue = await ui.confirm('This will use 100 credits. Continue?')
        if (shouldContinue === null || !shouldContinue) {
            ui.outro('Submission cancelled.')
            return
        }
    }

    // ─── Upload & Analyze ────────────────────────────────────────────────

    ui.log.info(subtext('Reviews usually take 1-3 minutes.'))
    console.log()

    const spinner = createSpinner('Creating submission...')
    spinner.start()
    let activeSpinner = spinner

    try {
        // Build submission body
        const submissionBody: Record<string, any> = { app_name: appName }

        if (appDetails) {
            if (appDetails.description) submissionBody.description = appDetails.description
            if (appDetails.keywords) submissionBody.keywords = appDetails.keywords
            if (appDetails.category) submissionBody.category = appDetails.category
            if (appDetails.supportUrl) submissionBody.support_url = appDetails.supportUrl
            if (appDetails.promotionalText) submissionBody.promotional_text = appDetails.promotionalText
            if (appDetails.marketingUrl) submissionBody.marketing_url = appDetails.marketingUrl
            submissionBody.sign_in_required = appDetails.signInRequired
            if (appDetails.demoUsername) submissionBody.demo_username = appDetails.demoUsername
            if (appDetails.demoPassword) submissionBody.demo_password = appDetails.demoPassword
        }

        if (compliance) {
            Object.assign(submissionBody, formatComplianceForApi(compliance))
        }

        const createRes = await apiRequest('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionBody),
        })
        const createData = await createRes.json()

        if (!createRes.ok) {
            spinner.stop()
            ui.log.error(createData.message || 'Failed to create submission')
            if (!fromMenu) process.exitCode = 1
            return
        }

        const submissionId = createData.submissionId
        spinner.succeed('Submission created')

        // 3. Get signed upload URLs
        const uploadSpinner = createSpinner('Getting upload URLs...')
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
            ui.log.error(urlsData.message || 'Failed to get upload URLs')
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
                ui.log.error(`Failed to upload ${fileInfo.filename}: HTTP ${uploadRes.status} ${uploadRes.statusText}`)
                if (!fromMenu) process.exitCode = 1
                return
            }
        }
        uploadSpinner.succeed('Files uploaded')

        // 5. Finalize (with 402 retry)
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
            const finalizeRes = await apiRequest(`/api/submissions/${submissionId}/finalize`, {
                method: 'POST',
                body: JSON.stringify(finalizePayload),
            })
            const finalizeData = await finalizeRes.json()

            if (finalizeRes.ok) {
                finalizeSuccess = true
            } else if (finalizeRes.status === 402) {
                analyzeSpinner.stop()

                ui.log.warning(`Not enough credits. Need ${finalizeData.required ?? 100}, have ${finalizeData.credits ?? 0}.`)
                console.log()

                const wantsBuy = await ui.confirm('Would you like to buy more credits?')
                if (wantsBuy === null || !wantsBuy) return

                await openUrl('https://preflightlaunch.com/pricing')
                ui.log.info('Opened pricing page. Press Enter when you\'ve purchased credits.')

                // Wait for user to come back
                const ready = await ui.confirm('Ready to continue?')
                if (ready === null || !ready) return

                // Brief delay to allow API to update
                await new Promise(r => setTimeout(r, 3000))

                analyzeSpinner.start()
                activeSpinner = analyzeSpinner
                analyzeSpinner.text = 'Retrying analysis...'
                maxFinalizeRetries--
            } else {
                analyzeSpinner.stop()
                ui.log.error(finalizeData.message || 'Failed to finalize submission')
                if (!fromMenu) process.exitCode = 1
                return
            }
        }

        if (!finalizeSuccess) {
            analyzeSpinner.stop()
            ui.log.error('Could not finalize after multiple attempts. Your files are saved -- try again later.')
            return
        }

        analyzeSpinner.text = 'AI review in progress... (press Esc to stop waiting)'

        // 6. Poll for completion (honest stages, no fake percentages)
        const reportData = await pollForReport(submissionId, analyzeSpinner)

        if (reportData.status === 'cancelled') {
            analyzeSpinner.stop()
            ui.log.info('Analysis continues in the background.')
            console.log(subtext(`  Check status with ${brand(`preflight status ${submissionId}`)} or from View Reviews.`))
            console.log()
            return
        }

        analyzeSpinner.succeed('Analysis complete!')

        if (reportData.status === 'complete' && reportData.data) {
            if (options.json) {
                console.log(JSON.stringify(reportData.data, null, 2))
            } else {
                renderReport(reportData.data.report, reportData.data.items)
                console.log(subtext(`  Full report: https://preflightlaunch.com/report/${reportData.data.report.id}`))
                console.log()

                // In menu mode, we just return to menu. In direct mode, offer options.
                if (!fromMenu) {
                    const next = await ui.select<'open' | 'done'>({
                        message: 'What next?',
                        options: [
                            { value: 'open', label: 'Open full report in browser' },
                            { value: 'done', label: 'Done' },
                        ],
                    })

                    if (next === 'open') {
                        await openUrl(`https://preflightlaunch.com/report/${reportData.data.report.id}`)
                    }
                }
            }
        } else if (reportData.status === 'failed') {
            ui.log.error('Analysis failed. Please try submitting again or contact support.')
            if (!fromMenu) process.exitCode = 1
        } else {
            ui.log.warning('Analysis is still running. Check status with:')
            console.log(subtext(`  preflight status ${submissionId}`))
        }
    } catch (err) {
        activeSpinner.stop()
        ui.log.error(`Submit failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        if (!fromMenu) process.exitCode = 1
    }
}

// ─── Resume Draft Command (Phase 2) ────────────────────────────────────────

export async function resumeSubmitCommand(draft: Record<string, any>) {
    const submissionId = draft.id

    ui.log.step(`Resuming draft: ${draft.app_name || 'Unknown'}`)
    console.log()

    // Re-run project scan (files may have changed since draft was saved)
    const lastPath = draft.project_path
    let path: string | undefined

    if (lastPath) {
        const useLast = await ui.confirm(`Use previous project path? (${lastPath})`, true)
        if (useLast === null) return
        if (useLast) path = lastPath
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
    for (let i = 0; i < Math.min(detected.screenshots.length, 10); i++) {
        filesToUpload.push({
            type: 'screenshot',
            index: i,
            filename: basename(detected.screenshots[i]),
            path: detected.screenshots[i],
        })
    }

    if (filesToUpload.length === 0) {
        ui.log.warning('No files found. Make sure you\'re pointing to an Xcode project directory.')
        return
    }

    // Pre-fill app details from draft
    const draftDefaults: Partial<AppDetails> = {
        appName: draft.app_name || projectName,
        description: draft.description,
        keywords: draft.keywords,
        category: draft.category,
        supportUrl: draft.support_url,
        promotionalText: draft.promotional_text,
        marketingUrl: draft.marketing_url,
        signInRequired: draft.sign_in_required ?? false,
        demoUsername: draft.demo_username,
        demoPassword: draft.demo_password,
    }

    const draftState: DraftState = {
        appName: draft.app_name,
        description: draft.description,
        keywords: draft.keywords,
        category: draft.category,
        supportUrl: draft.support_url,
        promotionalText: draft.promotional_text,
        marketingUrl: draft.marketing_url,
        signInRequired: draft.sign_in_required ?? false,
        demoUsername: draft.demo_username,
        demoPassword: draft.demo_password,
        _flowPosition: draft._flowPosition,
    }

    let appDetails: AppDetails
    let appName: string
    let compliance: ComplianceData

    // Determine resume point based on flow position
    const flowPosition = draft._flowPosition || 'appDetails'

    if (flowPosition === 'asc' || flowPosition === 'screenshots') {
        // User was in early steps - resume from app details (screenshots are auto-detected)
        ui.log.step(`Resuming from app details...`)
        console.log()

        const collectedDetails = await collectAppDetailsWithNav(projectName, draftState)
        if (collectedDetails === 'cancel' || collectedDetails === 'back') {
            await offerDraftSave(draftState)
            return
        }
        appDetails = collectedDetails
        appName = collectedDetails.appName

        // Collect compliance
        const collectedCompliance = await collectComplianceWithNav(draftState)
        if (collectedCompliance === 'cancel' || collectedCompliance === 'back') {
            await offerDraftSave(draftState)
            return
        }
        compliance = collectedCompliance
    } else if (flowPosition === 'appDetails') {
        // User was in app details - resume from app details
        ui.log.step(`Resuming from app details...`)
        console.log()

        const collectedDetails = await collectAppDetailsWithNav(projectName, draftState)
        if (collectedDetails === 'cancel' || collectedDetails === 'back') {
            await offerDraftSave(draftState)
            return
        }
        appDetails = collectedDetails
        appName = collectedDetails.appName

        // Collect compliance
        const collectedCompliance = await collectComplianceWithNav(draftState)
        if (collectedCompliance === 'cancel' || collectedCompliance === 'back') {
            await offerDraftSave(draftState)
            return
        }
        compliance = collectedCompliance
    } else if (flowPosition === 'compliance') {
        // Jump directly to compliance, skipping app details
        ui.log.step('Resuming from compliance section...')
        console.log()

        appDetails = draftDefaults as AppDetails
        appName = appDetails.appName

        const collectedCompliance = await collectComplianceWithNav(draftState)
        if (collectedCompliance === 'cancel' || collectedCompliance === 'back') {
            await offerDraftSave(draftState)
            return
        }
        compliance = collectedCompliance
    } else if (flowPosition === 'review' || flowPosition === 'confirmation') {
        // User was at review/final step - use saved details and show review
        ui.log.step('Resuming from review step...')
        console.log()

        appDetails = draftDefaults as AppDetails
        appName = appDetails.appName
        compliance = draftState.compliance || null
    } else {
        // Fallback to app details for any unknown position
        ui.log.step(`Resuming from app details...`)
        console.log()

        const collectedDetails = await collectAppDetailsWithNav(projectName, draftState)
        if (collectedDetails === 'cancel' || collectedDetails === 'back') {
            await offerDraftSave(draftState)
            return
        }
        appDetails = collectedDetails
        appName = collectedDetails.appName

        const collectedCompliance = await collectComplianceWithNav(draftState)
        if (collectedCompliance === 'cancel' || collectedCompliance === 'back') {
            await offerDraftSave(draftState)
            return
        }
        compliance = collectedCompliance
    }

    // Summary confirmation
    console.log()
    ui.note(buildSummary(appName, dir, filesToUpload, compliance), 'Review Summary')

    const action = await ui.select<'submit' | 'cancel'>({
        message: `Submit review? (100 credits)`,
        options: [
            { value: 'submit', label: 'Submit review', hint: '100 credits will be deducted' },
            { value: 'cancel', label: 'Cancel', hint: 'Back to menu' },
        ],
    })

    if (action === null || action === 'cancel') return

    // ─── Upload & Finalize (reuse existing submission ID) ──────────────

    ui.log.info(subtext('Reviews usually take 1-3 minutes.'))
    console.log()

    const spinner = createSpinner('Updating submission...')
    spinner.start()
    let activeSpinner = spinner

    try {
        // Update existing submission with new data
        const submissionBody: Record<string, any> = {
            submission_id: submissionId,
            app_name: appName,
        }

        if (appDetails.description) submissionBody.description = appDetails.description
        if (appDetails.keywords) submissionBody.keywords = appDetails.keywords
        if (appDetails.category) submissionBody.category = appDetails.category
        if (appDetails.supportUrl) submissionBody.support_url = appDetails.supportUrl
        if (appDetails.promotionalText) submissionBody.promotional_text = appDetails.promotionalText
        if (appDetails.marketingUrl) submissionBody.marketing_url = appDetails.marketingUrl
        submissionBody.sign_in_required = appDetails.signInRequired
        if (appDetails.demoUsername) submissionBody.demo_username = appDetails.demoUsername
        if (appDetails.demoPassword) submissionBody.demo_password = appDetails.demoPassword

        if (compliance) {
            Object.assign(submissionBody, formatComplianceForApi(compliance))
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

        // Finalize
        const analyzeSpinner = createSpinner('Starting analysis...')
        analyzeSpinner.start()
        activeSpinner = analyzeSpinner

        const finalizeRes = await apiRequest(`/api/submissions/${finalId}/finalize`, {
            method: 'POST',
            body: JSON.stringify({
                files: filesToUpload.map((f) => ({ type: f.type, index: f.index })),
            }),
        })
        const finalizeData = await finalizeRes.json()

        if (!finalizeRes.ok) {
            analyzeSpinner.stop()
            ui.log.error(finalizeData.message || 'Failed to start analysis')
            return
        }

        analyzeSpinner.text = 'AI review in progress... (press Esc to stop waiting)'

        const reportData = await pollForReport(finalId, analyzeSpinner)

        if (reportData.status === 'cancelled') {
            analyzeSpinner.stop()
            ui.log.info('Analysis continues in the background.')
            console.log(subtext(`  Check status with ${brand(`preflight status ${finalId}`)} or from View Reviews.`))
            console.log()
            return
        }

        analyzeSpinner.succeed('Analysis complete!')

        if (reportData.status === 'complete' && reportData.data) {
            renderReport(reportData.data.report, reportData.data.items)
            console.log(subtext(`  Full report: https://preflightlaunch.com/report/${reportData.data.report.id}`))
            console.log()
        } else if (reportData.status === 'failed') {
            ui.log.error('Analysis failed. Please try submitting again or contact support.')
        } else {
            ui.log.warning('Analysis is still running. Check status with:')
            console.log(subtext(`  preflight status ${finalId}`))
        }
    } catch (err) {
        activeSpinner.stop()
        ui.log.error(`Resume failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function buildSummary(
    appName: string,
    dir: string,
    files: Array<{ type: string; filename: string }>,
    compliance: ComplianceData | null,
): string {
    const home = require('node:os').homedir()
    const shortDir = dir.startsWith(home) ? '~' + dir.slice(home.length) : dir

    const fileTypes = files.map(f => f.filename).join(', ')
    const screenshotCount = files.filter(f => f.type === 'screenshot').length

    let summary = `App:        ${appName}\n`
    summary += `Project:    ${shortDir}\n`
    summary += `Files:      ${fileTypes}${screenshotCount > 0 ? ` (${screenshotCount} screenshots)` : ''}\n`

    if (compliance) {
        const complianceLines = formatComplianceSummary(compliance)
        summary += complianceLines.map(l => l.trim()).join('\n')
    }

    return summary
}

function getFileSize(filePath: string): number {
    try {
        return statSync(filePath).size
    } catch {
        return 0
    }
}

// ─── Polling (Phase 5: Cancel Support) ──────────────────────────────────

interface PollResult {
    status: 'complete' | 'failed' | 'timeout' | 'cancelled'
    data?: { report: any; items: any[] }
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
                return { status: 'failed' }
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
