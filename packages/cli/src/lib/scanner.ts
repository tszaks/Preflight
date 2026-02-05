import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, basename, extname } from 'node:path'

export interface DetectedFiles {
    projectName: string | null
    infoPlist: string | null
    privacyManifest: string | null
    ipa: string | null
    screenshots: string[]
    xcodeProject: string | null
}

export function scanProject(dir: string): DetectedFiles {
    const absDir = resolve(dir)
    const result: DetectedFiles = {
        projectName: null,
        infoPlist: null,
        privacyManifest: null,
        ipa: null,
        screenshots: [],
        xcodeProject: null,
    }

    // Find Xcode project
    const xcodeProjects = findFiles(absDir, (f) =>
        f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'), 2)
    if (xcodeProjects.length > 0) {
        result.xcodeProject = xcodeProjects[0]
        result.projectName = basename(xcodeProjects[0]).replace(/\.(xcodeproj|xcworkspace)$/, '')
    }

    // Find Info.plist
    const plists = findFiles(absDir, (f) => basename(f) === 'Info.plist', 4)
    // Prefer one not inside Pods or build directories
    const filteredPlists = plists.filter(
        (p) => !p.includes('/Pods/') && !p.includes('/DerivedData/') && !p.includes('/build/')
    )
    result.infoPlist = filteredPlists[0] || plists[0] || null

    // Find PrivacyInfo.xcprivacy
    const manifests = findFiles(absDir, (f) => basename(f) === 'PrivacyInfo.xcprivacy', 4)
    const filteredManifests = manifests.filter(
        (p) => !p.includes('/Pods/') && !p.includes('/DerivedData/')
    )
    result.privacyManifest = filteredManifests[0] || manifests[0] || null

    // Find IPA - search deeper since users may have IPAs in various nested locations
    const ipas = findFiles(absDir, (f) => f.endsWith('.ipa'), 10)
    // Prefer recent ones in build/ or DerivedData/
    const sortedIPAs = ipas.sort((a, b) => {
        try {
            return statSync(b).mtimeMs - statSync(a).mtimeMs
        } catch {
            return 0
        }
    })
    result.ipa = sortedIPAs[0] || null

    // Find screenshots
    const screenshotPatterns = ['.png', '.jpg', '.jpeg']
    const screenshotDirs = ['screenshots', 'Screenshots', 'fastlane/screenshots', 'marketing']
    for (const screenshotDir of screenshotDirs) {
        const fullPath = join(absDir, screenshotDir)
        if (existsSync(fullPath)) {
            const files = findFiles(fullPath, (f) => {
                const ext = extname(f).toLowerCase()
                return screenshotPatterns.includes(ext)
            }, 2)
            result.screenshots.push(...files)
        }
    }

    // Also check root for screenshot-named files
    try {
        const rootFiles = readdirSync(absDir)
        for (const f of rootFiles) {
            const lower = f.toLowerCase()
            if (
                (lower.includes('screenshot') || lower.includes('screen_')) &&
                screenshotPatterns.includes(extname(f).toLowerCase())
            ) {
                result.screenshots.push(join(absDir, f))
            }
        }
    } catch {
        // ignore
    }

    // Derive project name from directory if not found
    if (!result.projectName) {
        result.projectName = basename(absDir)
    }

    return result
}

export function findFiles(
    dir: string,
    matcher: (filepath: string) => boolean,
    maxDepth: number,
    currentDepth = 0
): string[] {
    if (currentDepth > maxDepth) return []

    const results: string[] = []
    try {
        const entries = readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = join(dir, entry.name)

            // Skip common non-relevant dirs
            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'Pods', '.build'].includes(entry.name)) continue
                results.push(...findFiles(fullPath, matcher, maxDepth, currentDepth + 1))
            }

            if (matcher(fullPath) || matcher(entry.name)) {
                results.push(fullPath)
            }
        }
    } catch {
        // Permission errors, etc.
    }
    return results
}

export function getFileSize(filePath: string): number {
    try {
        return statSync(filePath).size
    } catch {
        return 0
    }
}
