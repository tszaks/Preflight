import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, basename, extname, sep } from 'node:path'

export interface DetectedFiles {
    projectName: string | null
    infoPlist: string | null
    privacyManifest: string | null
    ipa: string | null
    screenshots: string[]
    /**
     * False when no screenshot directory was supplied. A local scan cannot know
     * which images were uploaded to App Store Connect, so the difference between
     * "none supplied" and "none exist" has to survive into the report.
     */
    screenshotsSupplied: boolean
    xcodeProject: string | null
    /** What we were pointed at, which changes how the rest is interpreted. */
    subjectKind: 'project' | 'ipa'
}

export interface ScanProjectOptions {
    /**
     * Directory of App Store screenshots, supplied explicitly.
     *
     * Deliberately not inferred. Preflight used to treat any image under
     * `screenshots/`, `Screenshots/`, `fastlane/screenshots/` or `marketing/` as
     * an App Store screenshot. On a real project that directory held design-review
     * and QA captures, so a scan reported 262 screenshots against Apple's maximum
     * of 10 and raised invalid-dimension findings for images that were never going
     * to be submitted. A directory named "screenshots" is not a claim that its
     * contents are store assets.
     */
    screenshotsDir?: string
}

/**
 * Directory bundles that are opaque: never look inside them for project files.
 *
 * Deliberately excludes `.app`, `.appex` and `.framework`. Those are bundles too,
 * but an `.xcarchive` keeps the real app at `Products/Applications/Foo.app`, and
 * its `Info.plist` is exactly what a scan of an archive should read. Preferring
 * the app target over an embedded extension is the scorer's job, not the walker's.
 */
const OPAQUE_BUNDLE_SUFFIXES = ['.xcodeproj', '.xcworkspace', '.xcassets']

const SKIP_DIRS = new Set(['node_modules', '.git', 'Pods', '.build', 'DerivedData', 'build'])

function isOpaqueBundle(name: string): boolean {
    return OPAQUE_BUNDLE_SUFFIXES.some((suffix) => name.endsWith(suffix))
}

/** `Info.plist`, or the `<Target>-Info.plist` that generators produce. */
function isInfoPlistName(name: string): boolean {
    return name === 'Info.plist' || /-Info\.plist$/.test(name)
}

export function scanProject(dir: string, options: ScanProjectOptions = {}): DetectedFiles {
    const absDir = resolve(dir)
    const result: DetectedFiles = {
        projectName: null,
        infoPlist: null,
        privacyManifest: null,
        ipa: null,
        screenshots: [],
        screenshotsSupplied: false,
        xcodeProject: null,
        subjectKind: 'project',
    }

    // Pointed straight at an .ipa. The README documents this, and it is the
    // natural thing to try with a build artifact.
    //
    // The Info.plist and PrivacyInfo.xcprivacy live inside the archive, at
    // Payload/<App>.app/, so there is nothing on disk for the directory walks
    // below to find. Reporting them as "not found" was a false negative on the
    // most important file in the scan. The caller reads them out of the archive
    // instead (see extractIPA, which already returns both), which is also how
    // the app bundle's own manifest gets used rather than an extension's.
    if (existsSync(absDir) && statSync(absDir).isFile() && extname(absDir) === '.ipa') {
        result.ipa = absDir
        result.subjectKind = 'ipa'
        result.projectName = basename(absDir).replace(/\.ipa$/, '')
        result.screenshots = collectScreenshots(options.screenshotsDir)
        result.screenshotsSupplied = Boolean(options.screenshotsDir)
        return result
    }

    // Find the Xcode project.
    //
    // `.xcodeproj` is itself a directory containing `project.xcworkspace`, and the
    // old walk descended into it and returned that inner workspace first, so the
    // app name rendered as the literal string "project" on every real project.
    // Treat bundles as opaque and prefer a real sibling workspace.
    const xcodeProjects = findFiles(absDir, (f) =>
        f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'), 2)
    const chosenProject = pickXcodeProject(xcodeProjects)
    if (chosenProject) {
        result.xcodeProject = chosenProject
        result.projectName = basename(chosenProject).replace(/\.(xcodeproj|xcworkspace)$/, '')
    }

    // Find Info.plist, preferring the app target's.
    //
    // Also matches `<Target>-Info.plist`, which is what XcodeGen and several
    // generator-based setups emit. Matching only the literal name meant those
    // projects scanned with no Info.plist at all, so every plist rule silently
    // did nothing.
    const plists = findFiles(absDir, (f) => isInfoPlistName(basename(f)), 4)
    result.infoPlist = pickAppTargetFile(plists, result.projectName)

    // Find PrivacyInfo.xcprivacy, preferring the app target's over an extension's.
    // A widget's manifest legitimately declares no collected data, so choosing it
    // for the app made a data-collecting app look like it collected nothing.
    const manifests = findFiles(absDir, (f) => basename(f) === 'PrivacyInfo.xcprivacy', 4)
    result.privacyManifest = pickAppTargetFile(manifests, result.projectName)

    // Find IPA - search deeper since users may have IPAs in various nested
    // locations. An .xcarchive never contains one (it holds a .app), so
    // archive scans correctly report no binary to analyze.
    const ipas = findFiles(absDir, (f) => f.endsWith('.ipa'), 10)
    const sortedIPAs = ipas.sort((a, b) => {
        try {
            return statSync(b).mtimeMs - statSync(a).mtimeMs
        } catch {
            return 0
        }
    })
    result.ipa = sortedIPAs[0] || null

    result.screenshots = collectScreenshots(options.screenshotsDir)
    result.screenshotsSupplied = Boolean(options.screenshotsDir)

    // Derive project name from directory if not found
    if (!result.projectName) {
        result.projectName = basename(absDir)
    }

    return result
}

/**
 * Prefer a standalone `.xcworkspace`, then a `.xcodeproj`, and never something
 * found inside another bundle.
 */
function pickXcodeProject(candidates: string[]): string | null {
    const topLevel = candidates.filter((p) => !isInsideBundle(p))
    if (topLevel.length === 0) return null

    const byDepth = (a: string, b: string) => a.split(sep).length - b.split(sep).length
    const workspaces = topLevel.filter((p) => p.endsWith('.xcworkspace')).sort(byDepth)
    if (workspaces.length > 0) return workspaces[0]

    return topLevel.filter((p) => p.endsWith('.xcodeproj')).sort(byDepth)[0] ?? null
}

/** True when the path sits inside an opaque bundle rather than beside it. */
function isInsideBundle(path: string): boolean {
    const parts = path.split(sep)
    // The last component is the candidate itself; anything above it that is a
    // bundle means this was found by descending into one.
    return parts.slice(0, -1).some((part) => isOpaqueBundle(part))
}

/**
 * Choose the file belonging to the app target.
 *
 * Test bundles ship their own near-empty `Info.plist`, and picking one produced
 * a run of CRITICAL "missing required key" findings for keys the real app plist
 * had all along. Rank candidates instead of taking whichever the directory walk
 * happened to yield first.
 */
function pickAppTargetFile(candidates: string[], projectName: string | null): string | null {
    const usable = candidates.filter((p) => !isGeneratedOrVendored(p) && !isTestTarget(p))
    const pool = usable.length > 0 ? usable : candidates.filter((p) => !isGeneratedOrVendored(p))
    if (pool.length === 0) return candidates[0] ?? null

    const scored = pool.map((path) => {
        const dir = basename(path.split(sep).slice(0, -1).join(sep))
        let score = 0
        // A directory matching the project name is almost always the app target.
        if (projectName && dir.toLowerCase() === projectName.toLowerCase()) score -= 100
        // Embedded bundles carry their own Info.plist and PrivacyInfo.xcprivacy.
        // A widget that only reads a shared container legitimately declares no
        // collected data, so choosing its manifest for the app reports a
        // data-collecting app as collecting nothing.
        if (/[\/\\](PlugIns|Frameworks)[\/\\]/i.test(path)) score += 100
        if (/\.(appex|framework)[\/\\]/i.test(path)) score += 100
        if (/widget|extension|clip|watch|intents|notificationservice|shareextension/i.test(path)) score += 50
        // Shallower paths are more likely to be the primary target.
        score += path.split(sep).length
        return { path, score }
    })

    scored.sort((a, b) => a.score - b.score)
    return scored[0].path
}

function isTestTarget(path: string): boolean {
    return /(^|[\/\\])[^\/\\]*(Tests|UITests|TestPlan)([\/\\]|$)/i.test(path)
}

function isGeneratedOrVendored(path: string): boolean {
    return (
        path.includes(`${sep}Pods${sep}`) ||
        path.includes(`${sep}DerivedData${sep}`) ||
        path.includes(`${sep}build${sep}`) ||
        path.includes(`${sep}node_modules${sep}`)
    )
}

/** Collect screenshots from an explicitly supplied directory, and nowhere else. */
function collectScreenshots(screenshotsDir?: string): string[] {
    if (!screenshotsDir) return []

    const abs = resolve(screenshotsDir)
    if (!existsSync(abs)) return []

    const imageExtensions = ['.png', '.jpg', '.jpeg']
    if (statSync(abs).isFile()) {
        return imageExtensions.includes(extname(abs).toLowerCase()) ? [abs] : []
    }

    return findFiles(abs, (f) => imageExtensions.includes(extname(f).toLowerCase()), 2)
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

            // Check the entry itself before deciding whether to descend, so a
            // matching bundle is reported as the bundle rather than as whatever
            // happens to sit inside it.
            if (matcher(fullPath) || matcher(entry.name)) {
                results.push(fullPath)
            }

            if (entry.isDirectory()) {
                if (SKIP_DIRS.has(entry.name)) continue
                // Bundles are opaque. Descending into `Foo.xcodeproj` is what
                // surfaced its internal `project.xcworkspace` as the project.
                if (isOpaqueBundle(entry.name)) continue
                results.push(...findFiles(fullPath, matcher, maxDepth, currentDepth + 1))
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
