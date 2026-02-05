import chalk from 'chalk'
import { resolve, basename } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { setLastScannedPath } from '../lib/config.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import { getImageDimensions } from '../lib/image-dimensions.js'
import * as ui from '../ui/interactive.js'
import { ok, okBold, critical, criticalBold, warning, warningBold, info, subtext, brand, icons, muted } from '../ui/theme.js'
import { runHardRules } from '@preflight/shared/engine/hard-rules/index'
import { autoDetect } from '@preflight/shared/engine/auto-detect/index'
import type { AutoDetectResult, DetectionSource } from '@preflight/shared/engine/auto-detect/index'
import type { CheckResult, ScreenshotData, HardRulesInput } from '@preflight/shared/engine/types'

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

export async function scanCommand(path?: string) {
    // Interactive mode: no path provided
    if (!path) {
        ui.intro('Scan your app')
        const resolvedPath = await interactiveProjectSelect()
        if (!resolvedPath) return
        path = resolvedPath
    } else {
        ui.intro('Scanning project')
    }

    const dir = resolve(path)
    setLastScannedPath(dir)

    const s = ui.spinner()
    s.start('Looking for App Store files...')

    const detected = scanProject(dir)

    s.stop('Scan complete')

    // Project name
    ui.log.step(chalk.bold(detected.projectName || 'Unknown Project'))

    // Files found section
    const lines: string[] = []
    lines.push(chalk.bold('Files Found'))

    if (detected.xcodeProject) {
        lines.push(`  ${icons.check} Xcode project ${subtext('(' + detected.xcodeProject + ')')}`)
    } else {
        lines.push(`  ${icons.cross} No .xcodeproj or .xcworkspace found`)
    }

    if (detected.infoPlist) {
        lines.push(`  ${icons.check} Info.plist`)
    } else {
        lines.push(`  ${icons.cross} No Info.plist found`)
    }

    if (detected.privacyManifest) {
        lines.push(`  ${icons.check} PrivacyInfo.xcprivacy`)
    } else {
        lines.push(`  ${icons.cross} No PrivacyInfo.xcprivacy found`)
    }

    if (detected.screenshots.length > 0) {
        lines.push(`  ${icons.check} ${detected.screenshots.length} screenshot${detected.screenshots.length === 1 ? '' : 's'}`)
    } else {
        lines.push(`  ${chalk.dim('-')} No screenshots found ${subtext('(optional)')}`)
    }

    if (detected.ipa) {
        lines.push(`  ${icons.check} IPA file`)
    } else {
        lines.push(`  ${chalk.dim('-')} No IPA found ${subtext('(optional)')}`)
    }

    ui.log.message(lines.join('\n'))

    // === Read file contents for analysis & auto-detection ===
    let plistContent: string | undefined
    if (detected.infoPlist) {
        try {
            plistContent = readFileSync(detected.infoPlist, 'utf-8')
        } catch { /* skip if unreadable */ }
    }

    let manifestContent: string | undefined
    if (detected.privacyManifest) {
        try {
            manifestContent = readFileSync(detected.privacyManifest, 'utf-8')
        } catch { /* skip if unreadable */ }
    }

    // === Extract IPA data for auto-detection (if IPA found) ===
    let ipaBuffer: ArrayBuffer | undefined
    let ipaFrameworks: string[] = []
    let ipaEntitlements: string | undefined
    let ipaImportedSymbols: string[] | undefined

    if (detected.ipa) {
        s.start('Analyzing IPA binary...')
        try {
            const ipaData = readFileSync(detected.ipa)
            // Check size guard (500 MB)
            if (ipaData.byteLength > 500 * 1024 * 1024) {
                s.stop('IPA too large for analysis (>500 MB), skipping binary detection')
            } else {
                ipaBuffer = ipaData.buffer.slice(ipaData.byteOffset, ipaData.byteOffset + ipaData.byteLength)
                // Quick extraction for auto-detection (full scan runs later in hard rules)
                const { extractIPA } = await import('@preflight/shared/engine/ipa-scanner/extract')
                const extracted = await extractIPA(ipaBuffer)
                ipaFrameworks = extracted.frameworks
                ipaEntitlements = extracted.entitlements

                // Try Mach-O for imported symbols (best-effort)
                if (extracted.zip && extracted.appDir && extracted.bundleName) {
                    try {
                        const { analyzeMachOFromIPA } = await import('@preflight/shared/engine/ipa-scanner/macho/index')
                        const machoResult = await analyzeMachOFromIPA(
                            extracted.zip, extracted.appDir, extracted.bundleName
                        )
                        ipaImportedSymbols = machoResult.metadata.importedSymbols
                    } catch { /* Mach-O analysis is optional for auto-detect */ }
                }

                s.stop(`IPA analyzed: ${ipaFrameworks.length} frameworks detected`)
            }
        } catch {
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
        // ASC data would go here when connected
    })

    // === Display auto-detected findings ===
    const displayableDetections = detectResult.detections.filter(
        d => typeof d.value === 'boolean' ? d.value === true : true
    )

    if (displayableDetections.length > 0) {
        const autoLines: string[] = []
        autoLines.push(chalk.bold('Auto-detected'))

        for (const d of displayableDetections) {
            const sourceLabel = formatSourceLabel(d.source)
            autoLines.push(`  ${ok(icons.check)} ${d.evidence} ${subtext(`(${sourceLabel})`)}`)
        }

        ui.log.message(autoLines.join('\n'))
    }

    // ASC tip if not connected
    if (!detectResult.detections.some(d => d.source === 'asc')) {
        ui.log.message(
            `  ${subtext(`Tip: Connect App Store Connect for more auto-detection (${brand('preflight asc')})`)}`
        )
    }

    // === Collect minimal metadata from user ===
    const detectedName = detected.projectName || basename(dir)

    const appNameResult = await ui.text({
        message: 'App name',
        placeholder: detectedName,
        defaultValue: detectedName,
    })
    const appName = appNameResult || detectedName

    const descriptionResult = await ui.text({
        message: 'Brief description (optional, press Enter to skip)',
        placeholder: 'e.g. A fitness tracking app',
    })
    const description = descriptionResult || undefined

    // === Two-phase questioning: core fields first, then follow-ups ===
    const userAnswers: Record<string, boolean> = {}

    // Phase 1: Ask core unresolved questions (sign-in, subscriptions, IAP)
    const coreFields = detectResult.unresolved.filter(
        f => ['sign_in_required', 'has_subscriptions', 'has_iap'].includes(f)
    )
    const initialFollowUps = detectResult.unresolved.filter(
        f => !['sign_in_required', 'has_subscriptions', 'has_iap'].includes(f)
    )

    const hasQuestions = coreFields.length > 0 || initialFollowUps.length > 0
    if (hasQuestions) {
        ui.log.message(chalk.bold('Confirming a few things'))
    }

    for (const field of coreFields) {
        const question = UNRESOLVED_QUESTIONS[field]
        if (question) {
            const answer = await ui.confirm(question.message, question.defaultValue)
            userAnswers[field] = answer ?? question.defaultValue
        }
    }

    // Phase 2: Compute follow-up questions based on combined detected + answered data
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
        const question = UNRESOLVED_QUESTIONS[field]
        if (question) {
            const answer = await ui.confirm(question.message, question.defaultValue)
            userAnswers[field] = answer ?? question.defaultValue
        }
    }

    // === Run local hard rules analysis ===
    s.start('Running compliance checks...')

    // Build screenshot data with dimensions from local files
    const screenshotData: ScreenshotData[] = []
    for (const screenshotPath of detected.screenshots) {
        try {
            const stat = statSync(screenshotPath)
            const ext = extname(screenshotPath).toLowerCase()
            const dimensions = getImageDimensions(screenshotPath)
            screenshotData.push({
                path: screenshotPath,
                base64: '', // Not needed for local checks
                mime_type: ext === '.png' ? 'image/png' : 'image/jpeg',
                size_bytes: stat.size,
                ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
            })
        } catch { /* skip unreadable files */ }
    }

    // Merge auto-detected fields + user answers into HardRulesInput
    const input: HardRulesInput = {
        app_name: appName,
        description: description ?? null,
        screenshot_paths: detected.screenshots,
        // Auto-detected fields (from binary/plist/ASC)
        ...detectResult.fields,
        // User answers override auto-detected values
        ...(userAnswers.sign_in_required !== undefined && { sign_in_required: userAnswers.sign_in_required }),
        ...(userAnswers.has_subscriptions !== undefined && { has_subscriptions: userAnswers.has_subscriptions }),
        ...(userAnswers.has_iap !== undefined && { has_iap: userAnswers.has_iap }),
        ...(userAnswers.has_account_deletion !== undefined && { has_account_deletion: userAnswers.has_account_deletion }),
        ...(userAnswers.has_restore_purchases !== undefined && { has_restore_purchases: userAnswers.has_restore_purchases }),
        ...(userAnswers.subscription_terms_on_paywall !== undefined && { subscription_terms_on_paywall: userAnswers.subscription_terms_on_paywall }),
        ...(userAnswers.has_health_disclaimers !== undefined && { has_health_disclaimers: userAnswers.has_health_disclaimers }),
    }

    // Run all hard rules through the unified engine
    const result = await runHardRules(input, {
        screenshotData: screenshotData.length > 0 ? screenshotData : undefined,
        manifestContent,
        plistContent,
        ipaBuffer,
    })

    const allChecks = result.checks

    s.stop('Compliance checks complete')

    // === Display findings by severity ===
    const criticals = allChecks.filter(c => c.severity === 'critical')
    const warnings = allChecks.filter(c => c.severity === 'warning')
    const infos = allChecks.filter(c => c.severity === 'info')
    const passes = allChecks.filter(c => c.severity === 'pass')

    // Show findings
    if (criticals.length > 0 || warnings.length > 0 || infos.length > 0) {
        const findingsLines: string[] = []
        findingsLines.push(chalk.bold('Compliance Findings'))

        for (const check of criticals) {
            findingsLines.push(`  ${criticalBold('CRITICAL')} ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            if (check.fix_suggestion) {
                findingsLines.push(`  ${muted('Fix:')} ${check.fix_suggestion}`)
            }
            findingsLines.push('')
        }

        for (const check of warnings) {
            findingsLines.push(`  ${warningBold('WARNING')}  ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            if (check.fix_suggestion) {
                findingsLines.push(`  ${muted('Fix:')} ${check.fix_suggestion}`)
            }
            findingsLines.push('')
        }

        for (const check of infos) {
            findingsLines.push(`  ${info('INFO')}     ${check.title}`)
            findingsLines.push(`  ${muted(check.description)}`)
            findingsLines.push('')
        }

        ui.log.message(findingsLines.join('\n'))
    }

    // Summary bar
    const summaryLines: string[] = [chalk.bold('Summary')]
    if (passes.length > 0) {
        summaryLines.push(`  ${ok(`${passes.length} check${passes.length === 1 ? '' : 's'} passed`)}`)
    }
    if (criticals.length > 0) {
        summaryLines.push(`  ${critical(`${criticals.length} critical issue${criticals.length === 1 ? '' : 's'}`)}`)
    }
    if (warnings.length > 0) {
        summaryLines.push(`  ${warning(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`)}`)
    }
    if (infos.length > 0) {
        summaryLines.push(`  ${subtext(`${infos.length} info`)}`)
    }

    ui.log.message(summaryLines.join('\n'))

    // Upsell for full analysis
    const upsellLines: string[] = []
    upsellLines.push(chalk.bold('Unlock Full Analysis'))
    upsellLines.push(`  ${muted('The free scan checks Info.plist, privacy manifest, and screenshots.')}`)
    upsellLines.push(`  ${muted('Full AI-powered analysis adds:')}`)
    upsellLines.push(`    ${brand(icons.arrow)} IPA binary scan ${subtext('(Mach-O, private APIs, SDK issues)')}`)
    upsellLines.push(`    ${brand(icons.arrow)} Screenshot AI review ${subtext('(UI compliance, missing elements)')}`)
    upsellLines.push(`    ${brand(icons.arrow)} Approval prediction ${subtext('(% chance of approval)')}`)
    upsellLines.push(`    ${brand(icons.arrow)} Rejection pattern matching ${subtext('(historical Apple rejections)')}`)
    upsellLines.push(`    ${brand(icons.arrow)} Detailed fix instructions ${subtext('(step-by-step remediation)')}`)

    ui.log.message(upsellLines.join('\n'))

    const next = await ui.select<'submit' | 'done'>({
        message: 'What next?',
        options: [
            { value: 'submit', label: 'Submit for full analysis', hint: '100 credits' },
            { value: 'done', label: 'Done for now' },
        ],
    })

    if (next === 'submit') {
        // Dynamic import to avoid circular dependency
        const { submitCommand } = await import('./submit.js')
        await submitCommand(dir, {})
    } else {
        ui.tip(`Run ${brand('preflight submit')} anytime for AI-powered analysis.`)
    }
}

/** Format detection source for display */
function formatSourceLabel(source: string): string {
    switch (source) {
        case 'asc': return 'App Store Connect'
        case 'ipa_framework': return 'Binary'
        case 'ipa_entitlement': return 'Entitlement'
        case 'ipa_symbol': return 'Binary'
        case 'plist': return 'Info.plist'
        default: return source
    }
}
