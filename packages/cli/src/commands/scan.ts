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
import type { CheckResult, ScreenshotData, HardRulesInput } from '@preflight/shared/engine/types'

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

    const hasSubscriptions = await ui.confirm('Does your app have subscriptions?', false)
    const hasIap = await ui.confirm('Does your app have in-app purchases?', false)
    const signInRequired = await ui.confirm('Does your app require sign-in?', false)

    // === Run local hard rules analysis ===
    s.start('Running compliance checks...')

    // Read file contents for analysis
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

    // Build HardRulesInput with collected metadata
    const input: HardRulesInput = {
        app_name: appName,
        description: description ?? null,
        screenshot_paths: detected.screenshots,
        sign_in_required: signInRequired ?? false,
        has_iap: hasIap ?? false,
        has_subscriptions: hasSubscriptions ?? false,
    }

    // Run all hard rules through the unified engine
    const result = await runHardRules(input, {
        screenshotData: screenshotData.length > 0 ? screenshotData : undefined,
        manifestContent,
        plistContent,
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
