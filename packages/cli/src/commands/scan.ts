import chalk from 'chalk'
import { resolve } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { setLastScannedPath } from '../lib/config.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import * as ui from '../ui/interactive.js'
import { ok, okBold, critical, criticalBold, warning, warningBold, info, subtext, brand, icons, muted } from '../ui/theme.js'
import { checkInfoPlist } from '@preflight/shared/engine/hard-rules/info-plist'
import { checkPrivacyManifest } from '@preflight/shared/engine/hard-rules/privacy-manifest'
import { checkScreenshots } from '@preflight/shared/engine/hard-rules/screenshots'
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

    // === Run local hard rules analysis ===
    s.start('Running compliance checks...')

    const allChecks: CheckResult[] = []

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

    // Build screenshot data from local files
    const screenshotData: ScreenshotData[] = []
    for (const screenshotPath of detected.screenshots) {
        try {
            const stat = statSync(screenshotPath)
            const ext = extname(screenshotPath).toLowerCase()
            screenshotData.push({
                path: screenshotPath,
                base64: '', // Not needed for dimension/size checks
                mime_type: ext === '.png' ? 'image/png' : 'image/jpeg',
                size_bytes: stat.size,
            })
        } catch { /* skip */ }
    }

    // Run checks
    const plistChecks = checkInfoPlist(plistContent)
    allChecks.push(...plistChecks)

    const manifestChecks = checkPrivacyManifest(manifestContent)
    allChecks.push(...manifestChecks)

    const screenshotInput: HardRulesInput = {
        app_name: detected.projectName || '',
        screenshot_paths: detected.screenshots,
    }
    const screenshotChecks = checkScreenshots(screenshotInput, screenshotData.length > 0 ? screenshotData : undefined)
    allChecks.push(...screenshotChecks)

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
