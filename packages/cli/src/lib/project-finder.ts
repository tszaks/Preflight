import { existsSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, basename, dirname, resolve } from 'node:path'
import { homedir, platform } from 'node:os'
import { getLastScannedPath } from './config.js'
import * as ui from '../ui/interactive.js'

export interface FoundProject {
    name: string
    path: string
    type: 'xcodeproj' | 'xcworkspace'
    fullPath: string
    modifiedAt?: number
}

const SEARCH_DIRS = [
    'Desktop',
    'Documents',
    'Projects',
    'Developer',
    'Code',
    'code',
    'dev',
]

// Paths to filter out of Spotlight results (noise directories)
const NOISE_PATTERNS = [
    '/Pods/',
    '/DerivedData/',
    '/Carthage/',
    '/build/',
    '/.build/',
    '/SourcePackages/',
    '/Library/Developer/',
    '/.Trash/',
]

// Search for Xcode projects using macOS Spotlight (instant, searches entire Mac)
export function spotlightSearch(): FoundProject[] {
    if (platform() !== 'darwin') return []

    try {
        const output = execFileSync('mdfind', [
            'kMDItemFSName == "*.xcodeproj" || kMDItemFSName == "*.xcworkspace"',
        ], { encoding: 'utf-8', timeout: 5000 })

        const lines = output.trim().split('\n').filter(Boolean)
        const seen = new Set<string>()
        const projects: FoundProject[] = []

        for (const fullPath of lines) {
            // Filter out noise directories
            if (NOISE_PATTERNS.some(pattern => fullPath.includes(pattern))) continue

            const projectDir = dirname(fullPath)
            if (seen.has(projectDir)) continue
            seen.add(projectDir)

            const type = fullPath.endsWith('.xcworkspace') ? 'xcworkspace' as const : 'xcodeproj' as const
            const name = basename(fullPath).replace(/\.(xcodeproj|xcworkspace)$/, '')

            let modifiedAt: number | undefined
            try {
                modifiedAt = statSync(fullPath).mtimeMs
            } catch {
                // skip if can't stat
            }

            projects.push({ name, path: projectDir, type, fullPath, modifiedAt })
        }

        // Sort by most recently modified first
        projects.sort((a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0))

        return projects
    } catch {
        // Spotlight unavailable or timed out -- fall back to directory scanning
        return []
    }
}

// Finds Xcode projects in common locations (fast, 1 level deep) -- fallback for non-macOS
export function findXcodeProjects(extraDirs: string[] = []): FoundProject[] {
    const home = homedir()
    const projects: FoundProject[] = []
    const seen = new Set<string>()

    const dirsToSearch = [
        ...SEARCH_DIRS.map((d) => join(home, d)),
        ...extraDirs,
    ]

    for (const dir of dirsToSearch) {
        if (!existsSync(dir)) continue
        try {
            const entries = readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                const entryPath = join(dir, entry.name)

                // Check inside this directory for .xcodeproj / .xcworkspace
                try {
                    const innerEntries = readdirSync(entryPath)
                    for (const inner of innerEntries) {
                        if (inner.endsWith('.xcworkspace') || inner.endsWith('.xcodeproj')) {
                            const key = entryPath
                            if (seen.has(key)) continue
                            seen.add(key)

                            const type = inner.endsWith('.xcworkspace') ? 'xcworkspace' as const : 'xcodeproj' as const
                            const name = basename(inner).replace(/\.(xcodeproj|xcworkspace)$/, '')
                            projects.push({
                                name,
                                path: entryPath,
                                type,
                                fullPath: join(entryPath, inner),
                            })
                            break // one per directory is enough
                        }
                    }
                } catch {
                    // permission error, skip
                }
            }
        } catch {
            // directory doesn't exist or no permission
        }
    }

    return projects
}

// Check current directory for Xcode project
export function findProjectInDir(dir: string): FoundProject | null {
    if (!existsSync(dir)) return null
    try {
        const entries = readdirSync(dir)
        for (const entry of entries) {
            if (entry.endsWith('.xcworkspace') || entry.endsWith('.xcodeproj')) {
                const type = entry.endsWith('.xcworkspace') ? 'xcworkspace' as const : 'xcodeproj' as const
                const name = basename(entry).replace(/\.(xcodeproj|xcworkspace)$/, '')
                return {
                    name,
                    path: dir,
                    type,
                    fullPath: join(dir, entry),
                }
            }
        }
    } catch {
        // ignore
    }
    return null
}

// Open native macOS Finder folder picker
export function browseWithFinder(): string | null {
    if (platform() !== 'darwin') return null

    try {
        const result = execFileSync('osascript', [
            '-e', 'POSIX path of (choose folder with prompt "Select your Xcode project folder")',
        ], { encoding: 'utf-8', timeout: 120000 })

        const path = result.trim()
        // Remove trailing slash if present
        return path.endsWith('/') ? path.slice(0, -1) : path
    } catch {
        // User cancelled or osascript failed
        return null
    }
}

// Build a list of project choices for interactive selection
export function buildProjectChoices(
    lastScannedPath?: string
): Array<{ value: string; label: string; hint?: string }> {
    const choices: Array<{ value: string; label: string; hint?: string }> = []
    const cwd = process.cwd()
    const addedPaths = new Set<string>()

    // Last scanned project (if exists and has Xcode project)
    if (lastScannedPath && existsSync(lastScannedPath)) {
        const proj = findProjectInDir(lastScannedPath)
        if (proj) {
            choices.push({
                value: lastScannedPath,
                label: `${proj.name} (last scanned)`,
                hint: shortenPath(lastScannedPath),
            })
            addedPaths.add(lastScannedPath)
        }
    }

    // Current directory
    const cwdProj = findProjectInDir(cwd)
    if (cwdProj && !addedPaths.has(cwd)) {
        choices.push({
            value: cwd,
            label: cwdProj.name,
            hint: `Current directory`,
        })
        addedPaths.add(cwd)
    }

    // Try Spotlight first, fall back to directory scanning
    let found = spotlightSearch()
    if (found.length === 0) {
        found = findXcodeProjects()
    }

    for (const proj of found.slice(0, 8)) {
        if (addedPaths.has(proj.path)) continue
        choices.push({
            value: proj.path,
            label: proj.name,
            hint: shortenPath(proj.path),
        })
        addedPaths.add(proj.path)
    }

    // Finder picker (macOS only)
    if (platform() === 'darwin') {
        choices.push({
            value: '__finder__',
            label: 'Open Finder to pick a folder',
            hint: 'Browse with macOS file picker',
        })
    }

    // Manual path entry option
    choices.push({
        value: '__manual__',
        label: 'Type a path manually',
        hint: 'Enter a custom directory path',
    })

    return choices
}

// Prompt user to select a project interactively
export async function interactiveProjectSelect(): Promise<string | null> {
    const choices = buildProjectChoices(getLastScannedPath())

    // If no real projects found (only __finder__ and __manual__)
    const realProjects = choices.filter(c => !c.value.startsWith('__'))
    if (realProjects.length === 0) {
        ui.log.info('No Xcode projects found on your Mac.')
    }

    const selected = await ui.select<string>({
        message: 'Where\'s your Xcode project?',
        options: choices,
    })

    if (selected === null) return null

    if (selected === '__finder__') {
        const finderPath = browseWithFinder()
        if (!finderPath) return null
        return finderPath
    }

    if (selected === '__manual__') return promptForManualPath()

    return selected
}

async function promptForManualPath(): Promise<string | null> {
    return ui.text({
        message: 'Enter the path to your project:',
        placeholder: './MyApp',
        validate: (val) => {
            if (!val?.trim()) return 'Path is required'
            const resolved = resolve(val.trim())
            if (!existsSync(resolved)) return 'Directory not found'
        },
    })
}

// Shorten path for display (replace home dir with ~)
function shortenPath(p: string): string {
    const home = homedir()
    if (p.startsWith(home)) {
        return '~' + p.slice(home.length)
    }
    return p
}
