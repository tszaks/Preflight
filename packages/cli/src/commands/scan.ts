import chalk from 'chalk'
import { resolve } from 'node:path'
import { scanProject } from '../lib/scanner.js'
import { success, warn, info, header } from '../ui/spinner.js'

export async function scanCommand(path: string) {
    const dir = resolve(path || '.')

    header('Scanning project')

    const detected = scanProject(dir)

    console.log(chalk.bold(`  Project: ${detected.projectName || 'Unknown'}`))
    console.log()

    // Xcode project
    if (detected.xcodeProject) {
        success(`Xcode project: ${chalk.dim(detected.xcodeProject)}`)
    } else {
        warn('No .xcodeproj or .xcworkspace found')
    }

    // Info.plist
    if (detected.infoPlist) {
        success(`Info.plist: ${chalk.dim(detected.infoPlist)}`)
    } else {
        warn('No Info.plist found')
    }

    // Privacy manifest
    if (detected.privacyManifest) {
        success(`PrivacyInfo.xcprivacy: ${chalk.dim(detected.privacyManifest)}`)
    } else {
        warn('No PrivacyInfo.xcprivacy found')
    }

    // IPA
    if (detected.ipa) {
        success(`IPA: ${chalk.dim(detected.ipa)}`)
    } else {
        info('No .ipa found (optional - build one with Xcode Archive)')
    }

    // Screenshots
    if (detected.screenshots.length > 0) {
        success(`Screenshots: ${detected.screenshots.length} found`)
        for (const s of detected.screenshots.slice(0, 5)) {
            console.log(chalk.dim(`      ${s}`))
        }
        if (detected.screenshots.length > 5) {
            console.log(chalk.dim(`      ... and ${detected.screenshots.length - 5} more`))
        }
    } else {
        info('No screenshots found')
    }

    console.log()
}
