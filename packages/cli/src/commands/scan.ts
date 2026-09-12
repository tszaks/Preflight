import chalk from 'chalk'
import { resolve, basename } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { setLastScannedPath } from '../lib/config.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import { getImageDimensions } from '../lib/image-dimensions.js'
import {
    SCAN_SCHEMA_VERSION,
    EXIT,
    computeExitCode,
    summarize,
    toFinding,
    type CoverageEntry,
    type FailOnThreshold,
    type ScanAssumption,
    type ScanResult,
} from '../lib/scan-result.js'
import * as ui from '../ui/interactive.js'
import { ok, critical, criticalBold, warning, warningBold, info, subtext, icons, muted } from '../ui/theme.js'
import { runHardRules } from '@preflight/shared/engine/hard-rules/index'
import { autoDetect } from '@preflight/shared/engine/auto-detect/index'
import { parseApplePlist } from '@preflight/shared/engine/utils/parse-apple-plist'
import { resolveAscCredentials, ASC_NOT_CONFIGURED_REASON } from '../lib/asc-credentials.js'
import type { AscSubmissionMetadata } from '@preflight/shared/engine/app-store-connect/client'
import type { ScreenshotData, HardRulesInput, CheckResult } from '@preflight/shared/engine/types'

/** Question labels for unresolved fields */
const UNRESOLVED_QUESTIONS: Record<string, { message: string; defaultValue: boolean }> = {
    sign_in_required: { message: 'Does your app require sign-in?', defaultValue: false },
    has_subscriptions: { message: 'Does your app have subscriptions?', defaultValue: false },
    has_iap: { message: 'Does your app have in-app purchases?', defaultValue: false },
    has_account_deletion: { message: 'Does your app have an account deletion button?', defaultValue: true },
    has_restore_purchases: { message: 'Does your app have a "Restore Purchases" button?', defaultValue: true },
    subscription_terms_on_paywall: { message: 'Are subscription terms displayed on your paywall?', defaultValue: true },
    has_health_disclaimers: { message: 'Does your app include health disclaimers?', defaultValue: true },
}

export interface ScanOptions {
    /** Emit the machine-readable result on stdout and nothing else. */
    json?: boolean
    /** Accept defaults without prompting. Implied when stdin is not a TTY. */
    yes?: boolean
    failOn?: FailOnThreshold
    appName?: string
    description?: string
    privacyUrl?: string
    termsUrl?: string
    supportUrl?: string
    marketingUrl?: string
    category?: string
    /** Directory of App Store screenshots. Never inferred. */
    screenshots?: string
    /** Injected so the result can report which version produced it. */
    version?: string
    // App Store Connect, opt-in and read-only.
    ascKeyId?: string
    ascIssuerId?: string
    ascKey?: string
}

/**
 * True when we may block on a prompt.
 *
 * Piping used to leave the prompt renderer half-drawn and exit early after
 * printing "Files Found", which produced a partial scan that looked like a clean
 * one. That is the single most dangerous output a compliance tool can produce, so
 * a non-TTY run now always takes the non-interactive path instead.
 */
function canPrompt(options: ScanOptions): boolean {
    if (options.json || options.yes) return false
    return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

type Spinner = { start: (m?: string) => void; stop: (m?: string) => void }

function nullSpinner(): Spinner {
    return { start: () => {}, stop: () => {} }
}

/**
 * Run a scan and return the machine-readable result, rendering nothing.
 *
 * Kept separate from `scanCommand` so the MCP server and any future integration
 * share exactly one implementation. If the two ever disagree, that is a bug.
 */
export async function runScan(path: string, options: ScanOptions = {}): Promise<ScanResult> {
    const interactive = canPrompt(options)
    const quiet = Boolean(options.json)
    const dir = resolve(path)
    const s: Spinner = quiet ? nullSpinner() : ui.spinner()
    const coverage: CoverageEntry[] = []
    const assumptions: ScanAssumption[] = []

    s.start('Looking for App Store files...')
    const detected = scanProject(dir, { screenshotsDir: options.screenshots })
    s.stop('Scan complete')

    if (!quiet) {
        ui.log.step(chalk.bold(options.appName || detected.projectName || 'Unknown Project'))
        ui.log.message(renderFilesFound(detected))
    }

    // === Read file contents for analysis & auto-detection ===
    let plistContent: Buffer | undefined
    let plistSource: string | null = detected.infoPlist
    if (detected.infoPlist) {
        try {
            plistContent = readFileSync(detected.infoPlist)
        } catch {
            coverage.push({ area: 'info_plist', status: 'inconclusive', reason: 'Info.plist could not be read' })
        }
    }

    let manifestContent: string | undefined
    let manifestSource: string | null = detected.privacyManifest
    if (detected.privacyManifest) {
        try {
            manifestContent = readFileSync(detected.privacyManifest, 'utf-8')
        } catch {
            coverage.push({ area: 'privacy_manifest', status: 'inconclusive', reason: 'Privacy manifest could not be read' })
        }
    }

    // === Extract IPA data (if IPA found) ===
    let ipaBuffer: ArrayBuffer | undefined
    let ipaFrameworks: string[] = []
    let ipaEntitlements: string | undefined
    let ipaImportedSymbols: string[] | undefined
    let machoStatus: 'checked' | 'not_checked' | 'inconclusive' = 'not_checked'
    let machoReason: string | undefined = 'No IPA supplied'

    if (detected.ipa) {
        s.start('Analyzing IPA binary...')
        try {
            const ipaData = readFileSync(detected.ipa)
            if (ipaData.byteLength > 500 * 1024 * 1024) {
                machoStatus = 'inconclusive'
                machoReason = 'IPA larger than 500 MB, binary analysis skipped'
                s.stop('IPA too large for analysis (>500 MB), skipping binary detection')
            } else {
                ipaBuffer = ipaData.buffer.slice(ipaData.byteOffset, ipaData.byteOffset + ipaData.byteLength)
                const { extractIPA } = await import('@preflight/shared/engine/ipa-scanner/extract')
                const extracted = await extractIPA(ipaBuffer)
                ipaFrameworks = extracted.frameworks
                ipaEntitlements = extracted.entitlements

                // The archive carries the real Info.plist and PrivacyInfo.xcprivacy
                // at Payload/<App>.app/, and extractIPA already returns both. They
                // used to be discarded here, so scanning a shipped .ipa reported
                // "No Info.plist found" and "No PrivacyInfo.xcprivacy found" for an
                // app that contained both. These are also the *app bundle's* copies
                // rather than an embedded extension's, which is what we want.
                if (extracted.infoPlist && !plistContent) {
                    plistContent = extracted.infoPlist
                    plistSource = `${detected.ipa}!/Payload/${extracted.bundleName}/Info.plist`
                }
                if (extracted.privacyManifest && !manifestContent) {
                    manifestContent = extracted.privacyManifest
                    manifestSource = `${detected.ipa}!/Payload/${extracted.bundleName}/PrivacyInfo.xcprivacy`
                }

                if (extracted.zip && extracted.appDir && extracted.bundleName) {
                    try {
                        const { analyzeMachOFromIPA } = await import('@preflight/shared/engine/ipa-scanner/macho/index')
                        const machoResult = await analyzeMachOFromIPA(
                            extracted.zip, extracted.appDir, extracted.bundleName
                        )
                        ipaImportedSymbols = machoResult.metadata.importedSymbols
                        machoStatus = 'checked'
                        machoReason = undefined
                    } catch (err) {
                        // Previously a bare `catch {}`: the private-API check
                        // silently never ran and the report still looked clean.
                        machoStatus = 'inconclusive'
                        machoReason = `Mach-O analysis failed: ${err instanceof Error ? err.message : 'unknown error'}`
                    }
                } else {
                    machoStatus = 'inconclusive'
                    machoReason = 'App binary could not be located inside the IPA'
                }

                s.stop(`IPA analyzed: ${ipaFrameworks.length} frameworks detected`)
            }
        } catch {
            machoStatus = 'inconclusive'
            machoReason = 'IPA could not be read'
            s.stop('Could not read IPA file')
        }
    }

    // === Run auto-detection ===
    const detectResult = autoDetect({
        ipa: (ipaFrameworks.length > 0 || ipaEntitlements) ? {
            frameworks: ipaFrameworks,
            entitlements: ipaEntitlements,
            importedSymbols: ipaImportedSymbols,
        } : undefined,
        plistContent,
    })

    if (!quiet) {
        const displayable = detectResult.detections.filter(
            d => typeof d.value === 'boolean' ? d.value === true : true
        )
        if (displayable.length > 0) {
            const autoLines = [chalk.bold('Auto-detected')]
            for (const d of displayable) {
                autoLines.push(`  ${ok(icons.check)} ${d.evidence} ${subtext(`(${formatSourceLabel(d.source)})`)}`)
            }
            ui.log.message(autoLines.join('\n'))
        }
    }

    // === Metadata: flags first, prompts only when we may prompt ===
    // For an .ipa the filename is a build artifact name ("Payday-1.0-9112029"),
    // not the app's name, so read the real one out of the bundle. Metadata rules
    // check the name, so feeding them the artifact name checks the wrong string.
    const bundleName = plistContent ? readAppNameFromPlist(plistContent) : null
    const detectedName = options.appName || bundleName || detected.projectName || basename(dir)
    let appName = detectedName
    let description = options.description

    if (interactive) {
        const appNameResult = await ui.text({
            message: 'App name',
            placeholder: detectedName,
            defaultValue: detectedName,
        })
        appName = appNameResult || detectedName

        if (description === undefined) {
            const descriptionResult = await ui.text({
                message: 'Brief description (optional, press Enter to skip)',
                placeholder: 'e.g. A fitness tracking app',
            })
            description = descriptionResult || undefined
        }
    }

    // === Unresolved fields ===
    const userAnswers: Record<string, boolean> = {}

    const coreFields = detectResult.unresolved.filter(
        f => ['sign_in_required', 'has_subscriptions', 'has_iap'].includes(f)
    )
    const initialFollowUps = detectResult.unresolved.filter(
        f => !['sign_in_required', 'has_subscriptions', 'has_iap'].includes(f)
    )

    if (interactive && (coreFields.length > 0 || initialFollowUps.length > 0)) {
        ui.log.message(chalk.bold('Confirming a few things'))
    }

    for (const field of coreFields) {
        userAnswers[field] = await resolveField(field, interactive, assumptions)
    }

    const resolvedSignIn = detectResult.fields.sign_in_required ?? userAnswers.sign_in_required ?? false
    const resolvedSubscriptions = detectResult.fields.has_subscriptions ?? userAnswers.has_subscriptions ?? false
    const resolvedIAP = detectResult.fields.has_iap ?? userAnswers.has_iap ?? false
    const resolvedHealthKit = detectResult.fields.detected_healthkit ?? false

    const followUpFields: string[] = [...initialFollowUps]
    if (resolvedSignIn && !followUpFields.includes('has_account_deletion')) {
        followUpFields.push('has_account_deletion')
    }
    if ((resolvedIAP || resolvedSubscriptions) && !followUpFields.includes('has_restore_purchases')) {
        followUpFields.push('has_restore_purchases')
    }
    if (resolvedSubscriptions && !followUpFields.includes('subscription_terms_on_paywall')) {
        followUpFields.push('subscription_terms_on_paywall')
    }
    if (resolvedHealthKit && !followUpFields.includes('has_health_disclaimers')) {
        followUpFields.push('has_health_disclaimers')
    }

    for (const field of followUpFields) {
        userAnswers[field] = await resolveField(field, interactive, assumptions)
    }

    // === App Store Connect (opt-in, read-only) ===
    // This is the surface a local scan is structurally blind to, and in practice
    // it is where first submissions die: review notes, the privacy label, and the
    // IDFA answer all live here and none of them exist on disk.
    const ascCredentials = resolveAscCredentials(options)
    let ascChecks: CheckResult[] = []
    let ascMetadata: AscSubmissionMetadata | null = null
    const bundleId = plistContent ? readBundleIdFromPlist(plistContent) : null

    if (!ascCredentials) {
        coverage.push({ area: 'app_store_connect', status: 'not_checked', reason: ASC_NOT_CONFIGURED_REASON })
        // The label reminder does not need credentials: everything it compares
        // against comes from the binary. Emitting it unconditionally is
        // deliberate, because a stale App Privacy label is invisible, common,
        // and was a real near-rejection.
        if (manifestContent) {
            const { checkPrivacyLabelReminder } = await import('@preflight/shared/engine/app-store-connect/rules')
            ascChecks = checkPrivacyLabelReminder(readDeclaredDataTypes(manifestContent))
        }
    } else if (!bundleId) {
        coverage.push({
            area: 'app_store_connect',
            status: 'not_checked',
            reason: 'Could not determine the bundle identifier, so the app could not be looked up. Scan a built .ipa, or pass --app-name with a project whose plist has a literal CFBundleIdentifier.',
        })
    } else {
        s.start('Reading App Store Connect metadata...')
        try {
            const { createAscToken, fetchSubmissionMetadata } = await import('@preflight/shared/engine/app-store-connect/client')
            const { checkAppStoreConnect } = await import('@preflight/shared/engine/app-store-connect/rules')
            const token = createAscToken(ascCredentials)
            ascMetadata = await fetchSubmissionMetadata(bundleId, { token })

            if (!ascMetadata) {
                coverage.push({
                    area: 'app_store_connect',
                    status: 'not_checked',
                    reason: `No app with bundle ID ${bundleId} is visible to these credentials.`,
                })
                s.stop('App Store Connect: app not found')
            } else {
                ascChecks = checkAppStoreConnect(ascMetadata, {
                    signInWithApple: detectResult.fields.detected_sign_in_with_apple === true
                        || ipaFrameworks.some((f) => /AuthenticationServices/i.test(f)),
                    signInRequired: resolvedSignInForAsc(detectResult.fields.sign_in_required, userAnswers.sign_in_required),
                    declaredDataTypes: manifestContent ? readDeclaredDataTypes(manifestContent) : [],
                })
                coverage.push({ area: 'app_store_connect', status: 'checked' })
                s.stop(`App Store Connect: read ${ascMetadata.appName} ${ascMetadata.versionString ?? ''}`.trim())
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            coverage.push({ area: 'app_store_connect', status: 'inconclusive', reason: message })
            s.stop('App Store Connect: could not read metadata')
        }
    }

    // === Run local hard rules analysis ===
    s.start('Running compliance checks...')

    const screenshotData: ScreenshotData[] = []
    for (const screenshotPath of detected.screenshots) {
        try {
            const stat = statSync(screenshotPath)
            const ext = extname(screenshotPath).toLowerCase()
            const dimensions = getImageDimensions(screenshotPath)
            screenshotData.push({
                path: screenshotPath,
                base64: '',
                mime_type: ext === '.png' ? 'image/png' : 'image/jpeg',
                size_bytes: stat.size,
                ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
            })
        } catch { /* skip unreadable files */ }
    }

    const input: HardRulesInput = {
        app_name: appName,
        screenshot_paths: detected.screenshots,
        // App Store Connect first, so the metadata rules check the values Apple
        // actually holds rather than nothing at all. This is what finally lets
        // the URL reachability and description rules run on a real submission.
        ...(ascMetadata?.description !== undefined && { description: ascMetadata.description }),
        ...(ascMetadata?.keywords !== undefined && { keywords: ascMetadata.keywords }),
        ...(ascMetadata?.privacyPolicyUrl !== undefined && { privacy_url: ascMetadata.privacyPolicyUrl }),
        ...(ascMetadata?.supportUrl !== undefined && { support_url: ascMetadata.supportUrl }),
        ...(ascMetadata?.marketingUrl !== undefined && { marketing_url: ascMetadata.marketingUrl }),
        // Explicit flags win: someone passing a value is stating intent, and may
        // be checking a URL before putting it into App Store Connect.
        // `undefined` still means "nobody told us", which the rules report as not
        // checked rather than as a violation.
        // Deliberately omitted rather than nulled when absent. `null` means "we
        // looked and there is none", which is a violation; `undefined` means
        // nobody supplied it, which is a coverage gap.
        ...(description !== undefined && description !== '' && { description }),
        ...(options.privacyUrl !== undefined && { privacy_url: options.privacyUrl }),
        ...(options.termsUrl !== undefined && { terms_url: options.termsUrl }),
        ...(options.supportUrl !== undefined && { support_url: options.supportUrl }),
        ...(options.marketingUrl !== undefined && { marketing_url: options.marketingUrl }),
        ...(options.category !== undefined && { category: options.category }),
        ...detectResult.fields,
        ...(userAnswers.sign_in_required !== undefined && { sign_in_required: userAnswers.sign_in_required }),
        ...(userAnswers.has_subscriptions !== undefined && { has_subscriptions: userAnswers.has_subscriptions }),
        ...(userAnswers.has_iap !== undefined && { has_iap: userAnswers.has_iap }),
        ...(userAnswers.has_account_deletion !== undefined && { has_account_deletion: userAnswers.has_account_deletion }),
        ...(userAnswers.has_restore_purchases !== undefined && { has_restore_purchases: userAnswers.has_restore_purchases }),
        ...(userAnswers.subscription_terms_on_paywall !== undefined && { subscription_terms_on_paywall: userAnswers.subscription_terms_on_paywall }),
        ...(userAnswers.has_health_disclaimers !== undefined && { has_health_disclaimers: userAnswers.has_health_disclaimers }),
    }

    const result = await runHardRules(input, {
        screenshotData: screenshotData.length > 0 ? screenshotData : undefined,
        manifestContent,
        plistContent,
        ipaBuffer,
    })

    const [{ runBehavioralHeuristics }, { matchRejectionPatterns }] = await Promise.all([
        import('@preflight/shared/engine/behavioral-heuristics/index'),
        import('@preflight/shared/engine/historical-patterns/index'),
    ])
    const [behavioralChecks, historicalChecks] = await Promise.all([
        runBehavioralHeuristics(input),
        matchRejectionPatterns(input),
    ])

    const allChecks: CheckResult[] = [
        ...result.checks,
        ...behavioralChecks,
        ...historicalChecks,
        ...ascChecks,
    ]

    s.stop('Compliance checks complete')

    // === Coverage ===
    coverage.push({ area: 'metadata', status: 'checked' })
    coverage.push(
        detected.screenshotsSupplied
            ? { area: 'screenshots', status: 'checked' }
            : { area: 'screenshots', status: 'not_checked', reason: 'No screenshot directory supplied. Pass --screenshots <dir>.' }
    )
    coverage.push(
        plistContent
            ? { area: 'info_plist', status: 'checked' }
            : { area: 'info_plist', status: 'not_checked', reason: 'No Info.plist found' }
    )
    coverage.push(
        manifestContent
            ? { area: 'privacy_manifest', status: 'checked' }
            : { area: 'privacy_manifest', status: 'not_checked', reason: 'No PrivacyInfo.xcprivacy found' }
    )
    coverage.push({ area: 'macho_private_api', status: machoStatus, ...(machoReason ? { reason: machoReason } : {}) })
    coverage.push(
        options.privacyUrl
            ? { area: 'url_reachability', status: 'checked' }
            : { area: 'url_reachability', status: 'not_checked', reason: 'No URLs supplied. Pass --privacy-url / --support-url.' }
    )

    const findings = allChecks.map(toFinding)
    const failOn: FailOnThreshold = options.failOn ?? 'critical'

    return {
        schemaVersion: SCAN_SCHEMA_VERSION,
        preflightVersion: options.version ?? '0.0.0',
        scannedAt: new Date().toISOString(),
        subject: { path: dir, kind: detected.subjectKind, appName },
        inputs: {
            xcodeProject: detected.xcodeProject,
            infoPlist: plistSource,
            privacyManifest: manifestSource,
            ipa: detected.ipa,
            screenshotCount: detected.screenshots.length,
            screenshotsSupplied: detected.screenshotsSupplied,
        },
        coverage,
        assumptions,
        findings,
        summary: summarize(findings),
        exitCode: computeExitCode(findings, failOn),
    }
}

/**
 * Resolve an unresolved boolean field.
 *
 * Non-interactive runs cannot ask, so they take the documented default and
 * record that they did. An unrecorded assumption is indistinguishable from
 * evidence, which is how a scan ends up claiming a clean bill of health it never
 * earned.
 */
async function resolveField(
    field: string,
    interactive: boolean,
    assumptions: ScanAssumption[]
): Promise<boolean> {
    const question = UNRESOLVED_QUESTIONS[field]
    if (!question) return false

    if (interactive) {
        const answer = await ui.confirm(question.message, question.defaultValue)
        return answer ?? question.defaultValue
    }

    assumptions.push({
        field,
        assumed: question.defaultValue,
        reason: 'Not supplied and not interactive; used the default. Pass the value explicitly to check it properly.',
    })
    return question.defaultValue
}

export async function scanCommand(path?: string, options: ScanOptions = {}): Promise<number> {
    const quiet = Boolean(options.json)

    if (!path) {
        if (!canPrompt(options)) {
            // Refuse rather than scan the wrong thing. Guessing the subject in a
            // scripted context is how a green run ends up meaning nothing.
            const message = 'No path given. Pass a project directory or .ipa, e.g. `preflight scan .`'
            if (quiet) {
                process.stdout.write(JSON.stringify({ error: message, exitCode: EXIT.COULD_NOT_RUN }, null, 2) + '\n')
            } else {
                console.error(message)
            }
            return EXIT.COULD_NOT_RUN
        }
        ui.intro('Scan your app')
        const resolvedPath = await interactiveProjectSelect()
        if (!resolvedPath) return EXIT.COULD_NOT_RUN
        path = resolvedPath
    } else if (!quiet) {
        ui.intro('Scanning project')
    }

    const dir = resolve(path)
    setLastScannedPath(dir)

    let scan: ScanResult
    try {
        scan = await runScan(dir, options)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (quiet) {
            process.stdout.write(JSON.stringify({ error: message, exitCode: EXIT.COULD_NOT_RUN }, null, 2) + '\n')
        } else {
            console.error(`Scan failed: ${message}`)
        }
        return EXIT.COULD_NOT_RUN
    }

    if (quiet) {
        // stdout carries the contract and nothing else.
        process.stdout.write(JSON.stringify(scan, null, 2) + '\n')
        return scan.exitCode
    }

    renderHuman(scan)
    return scan.exitCode
}

function renderFilesFound(detected: ReturnType<typeof scanProject>): string {
    const lines: string[] = [chalk.bold('Files Found')]

    lines.push(detected.xcodeProject
        ? `  ${icons.check} Xcode project ${subtext('(' + detected.xcodeProject + ')')}`
        : `  ${icons.cross} No .xcodeproj or .xcworkspace found`)

    if (detected.subjectKind === 'ipa') {
        lines.push(`  ${icons.check} IPA file ${subtext('(reading Info.plist and privacy manifest from the bundle)')}`)
    } else {
        lines.push(detected.infoPlist ? `  ${icons.check} Info.plist` : `  ${icons.cross} No Info.plist found`)
        lines.push(detected.privacyManifest ? `  ${icons.check} PrivacyInfo.xcprivacy` : `  ${icons.cross} No PrivacyInfo.xcprivacy found`)
        lines.push(detected.ipa ? `  ${icons.check} IPA file` : `  ${chalk.dim('-')} No IPA found ${subtext('(optional)')}`)
    }

    lines.push(detected.screenshotsSupplied
        ? `  ${icons.check} ${detected.screenshots.length} screenshot${detected.screenshots.length === 1 ? '' : 's'}`
        : `  ${chalk.dim('-')} Screenshots ${subtext('(not checked; pass --screenshots <dir>)')}`)

    return lines.join('\n')
}

function renderHuman(scan: ScanResult): void {
    // === What We Checked ===
    const checkedLines: string[] = [chalk.bold('What We Checked')]
    for (const entry of scan.coverage) {
        const label = COVERAGE_LABELS[entry.area] ?? entry.area
        if (entry.status === 'checked') {
            checkedLines.push(`  ${icons.check} ${label}`)
        } else if (entry.status === 'inconclusive') {
            checkedLines.push(`  ${warningBold('?')} ${label} ${subtext(`(inconclusive: ${entry.reason ?? 'unknown'})`)}`)
        } else {
            checkedLines.push(`  ${chalk.dim('-')} ${label} ${subtext(`(not checked: ${entry.reason ?? 'not supplied'})`)}`)
        }
    }
    ui.log.message(checkedLines.join('\n'))

    if (scan.assumptions.length > 0) {
        const lines = [chalk.bold('Assumed')]
        for (const a of scan.assumptions) {
            lines.push(`  ${chalk.dim('-')} ${a.field} = ${a.assumed} ${subtext('(not supplied)')}`)
        }
        ui.log.message(lines.join('\n'))
    }

    // === Findings ===
    const actionable = scan.findings.filter(f => f.status === 'checked')
    const criticals = actionable.filter(f => f.severity === 'critical')
    const warnings = actionable.filter(f => f.severity === 'warning')
    const infos = actionable.filter(f => f.severity === 'info')
    const gaps = scan.findings.filter(f => f.status !== 'checked')

    if (criticals.length > 0 || warnings.length > 0 || infos.length > 0) {
        const findingsLines: string[] = [chalk.bold('Compliance Findings')]

        for (const check of criticals) {
            findingsLines.push(`  ${criticalBold('CRITICAL')} ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            if (check.fix) findingsLines.push(`  ${muted('Fix:')} ${check.fix}`)
            findingsLines.push('')
        }
        for (const check of warnings) {
            findingsLines.push(`  ${warningBold('WARNING')}  ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            if (check.fix) findingsLines.push(`  ${muted('Fix:')} ${check.fix}`)
            findingsLines.push('')
        }
        for (const check of infos) {
            findingsLines.push(`  ${info('INFO')}     ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            findingsLines.push('')
        }

        ui.log.message(findingsLines.join('\n'))
    }

    if (gaps.length > 0) {
        const gapLines = [chalk.bold('Not Checked')]
        for (const gap of gaps) {
            gapLines.push(`  ${chalk.dim('-')} ${gap.title}`)
            if (gap.fix) gapLines.push(`    ${muted(gap.fix)}`)
        }
        ui.log.message(gapLines.join('\n'))
    }

    // === Summary ===
    const summaryLines: string[] = [chalk.bold('Summary')]
    if (scan.summary.pass > 0) summaryLines.push(`  ${ok(`${scan.summary.pass} check${scan.summary.pass === 1 ? '' : 's'} passed`)}`)
    if (scan.summary.critical > 0) summaryLines.push(`  ${critical(`${scan.summary.critical} critical issue${scan.summary.critical === 1 ? '' : 's'}`)}`)
    if (scan.summary.warning > 0) summaryLines.push(`  ${warning(`${scan.summary.warning} warning${scan.summary.warning === 1 ? '' : 's'}`)}`)
    if (scan.summary.info > 0) summaryLines.push(`  ${subtext(`${scan.summary.info} info`)}`)
    if (scan.summary.notChecked > 0) summaryLines.push(`  ${subtext(`${scan.summary.notChecked} not checked`)}`)
    if (scan.summary.inconclusive > 0) summaryLines.push(`  ${subtext(`${scan.summary.inconclusive} inconclusive`)}`)
    ui.log.message(summaryLines.join('\n'))

    const nextStepsLines: string[] = [chalk.bold('Next Steps')]
    if (scan.summary.critical > 0) {
        nextStepsLines.push(`  ${icons.arrow} Fix critical issues first. These are the highest rejection-risk items.`)
    }
    if (scan.summary.warning > 0) {
        nextStepsLines.push(`  ${icons.arrow} Review warnings before submitting to Apple.`)
    }
    if (scan.summary.critical === 0 && scan.summary.warning === 0) {
        nextStepsLines.push(`  ${icons.arrow} No critical or warning findings from the checks that ran.`)
    }
    if (scan.summary.notChecked > 0 || scan.summary.inconclusive > 0) {
        nextStepsLines.push(`  ${icons.arrow} Some checks did not run. A clean result only covers what was checked.`)
    }
    nextStepsLines.push(`  ${icons.arrow} Re-run ${info('preflight scan')} after changes.`)
    ui.log.message(nextStepsLines.join('\n'))
}

const COVERAGE_LABELS: Record<string, string> = {
    metadata: 'App metadata (name, description, keywords)',
    screenshots: 'Screenshots (dimensions, file size)',
    info_plist: 'Info.plist (permissions, build settings, usage descriptions)',
    privacy_manifest: 'PrivacyInfo.xcprivacy (privacy manifest, API declarations)',
    macho_private_api: 'IPA binary (frameworks, entitlements, Mach-O symbols)',
    url_reachability: 'URL reachability (privacy policy, support, marketing)',
    app_store_connect: 'App Store Connect metadata (review notes, privacy label, IDFA)',
}

/**
 * Read the user-visible app name out of an Info.plist.
 *
 * Prefers CFBundleDisplayName, which is what appears under the icon, and falls
 * back to CFBundleName. Xcode build variables like `$(PRODUCT_NAME)` are
 * rejected: a source-level plist often contains those rather than a literal, and
 * "$(PRODUCT_NAME)" is not an app name.
 */
function readAppNameFromPlist(plistContent: Buffer): string | null {
    const parsed = parseApplePlist(plistContent)
    if (!parsed) return null

    for (const key of ['CFBundleDisplayName', 'CFBundleName']) {
        const value = parsed[key]
        if (typeof value === 'string' && value.length > 0 && !value.includes('$(') && !value.includes('${')) {
            return value
        }
    }
    return null
}

/** Read CFBundleIdentifier, rejecting unexpanded build variables. */
function readBundleIdFromPlist(plistContent: Buffer): string | null {
    const parsed = parseApplePlist(plistContent)
    const value = parsed?.CFBundleIdentifier
    if (typeof value !== 'string' || value.length === 0) return null
    // A source plist often holds `$(PRODUCT_BUNDLE_IDENTIFIER)`, which is not an
    // identifier and would look up nothing.
    if (value.includes('$(') || value.includes('${')) return null
    return value
}

/** Collected data types declared in the binary's privacy manifest. */
function readDeclaredDataTypes(manifestContent: string): string[] {
    const parsed = parseApplePlist(manifestContent)
    const declared = parsed?.NSPrivacyCollectedDataTypes
    if (!Array.isArray(declared)) return []
    return declared
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null
            const type = (entry as Record<string, unknown>).NSPrivacyCollectedDataType
            return typeof type === 'string' ? type : null
        })
        .filter((t): t is string => t !== null)
}

/** Sign-in state for the App Store Connect cross-checks. */
function resolvedSignInForAsc(detected: boolean | undefined, answered: boolean | undefined): boolean {
    return detected ?? answered ?? false
}

/** Format detection source for display */
function formatSourceLabel(source: string): string {
    switch (source) {
        case 'ipa_framework': return 'Binary'
        case 'ipa_entitlement': return 'Entitlement'
        case 'ipa_symbol': return 'Binary'
        case 'plist': return 'Info.plist'
        default: return source
    }
}
