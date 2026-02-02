import chalk from 'chalk'
import { resolve } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { setLastScannedPath } from '../lib/config.js'
import { interactiveProjectSelect } from '../lib/project-finder.js'
import * as ui from '../ui/interactive.js'
import { ok, critical, warning, subtext, brand, icons } from '../ui/theme.js'

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

    // Quick check summary
    const issues: string[] = []
    const warnings_list: string[] = []
    const passed: string[] = []

    if (detected.infoPlist) passed.push('Info.plist present')
    else issues.push('Missing Info.plist')

    if (detected.privacyManifest) passed.push('PrivacyInfo.xcprivacy present')
    else issues.push('Missing PrivacyInfo.xcprivacy')

    if (detected.xcodeProject) passed.push('Xcode project detected')
    else warnings_list.push('No Xcode project found')

    if (detected.screenshots.length > 0) passed.push(`${detected.screenshots.length} screenshots found`)

    const summaryLines: string[] = [chalk.bold('Quick Check')]

    if (passed.length > 0) {
        summaryLines.push(`  ${ok(`${passed.length} item${passed.length === 1 ? '' : 's'} look${passed.length === 1 ? 's' : ''} good`)}`)
    }
    if (warnings_list.length > 0) {
        summaryLines.push(`  ${warning(`${warnings_list.length} warning${warnings_list.length === 1 ? '' : 's'}`)} ${subtext('- ' + warnings_list.join(', '))}`)
    }
    if (issues.length > 0) {
        summaryLines.push(`  ${critical(`${issues.length} issue${issues.length === 1 ? '' : 's'}`)} ${subtext('- ' + issues.join(', '))}`)
    }

    ui.log.message(summaryLines.join('\n'))

    // Upsell + what next
    ui.log.info('This is a free preview. For detailed fix\ninstructions, submit for full AI analysis.')

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
        ui.tip(`Run ${brand('preflight submit')} anytime to get AI-powered fix instructions.`)
    }
}
