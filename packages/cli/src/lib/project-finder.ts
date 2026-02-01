import { existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import { getLastScannedPath } from './config.js'
import * as ui from '../ui/interactive.js'

export interface FoundProject {
    name: string
    path: string
    type: 'xcodeproj' | 'xcworkspace'
    fullPath: string
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

// Finds Xcode projects in common locations (fast, 1 level deep)
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

                            const type = inner.endsWith('.xcworkspace') ? 'xcworkspace' : 'xcodeproj'
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
                const type = entry.endsWith('.xcworkspace') ? 'xcworkspace' : 'xcodeproj'
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

// Build a list of project choices for interactive selection
export function buildProjectChoices(
    lastScannedPath?: string
): Array<{ value: string; label: string; hint?: string }> {
    const choices: Array<{ value: string; label: string; hint?: string }> = []
    const cwd = process.cwd()

    // Last scanned project (if exists and has Xcode project)
    if (lastScannedPath && existsSync(lastScannedPath)) {
        const proj = findProjectInDir(lastScannedPath)
        if (proj) {
            choices.push({
                value: lastScannedPath,
                label: `${proj.name} (last scanned)`,
                hint: shortenPath(lastScannedPath),
            })
        }
    }

    // Current directory
    const cwdProj = findProjectInDir(cwd)
    if (cwdProj && cwd !== lastScannedPath) {
        choices.push({
            value: cwd,
            label: cwdProj.name,
            hint: `Current directory - ${shortenPath(cwd)}`,
        })
    }

    // Discovered projects
    const found = findXcodeProjects()
    for (const proj of found.slice(0, 5)) {
        if (proj.path === lastScannedPath || proj.path === cwd) continue
        choices.push({
            value: proj.path,
            label: proj.name,
            hint: shortenPath(proj.path),
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

// Prompt user to select a project interactively, with fallback to manual path input
export async function interactiveProjectSelect(): Promise<string | null> {
    const choices = buildProjectChoices(getLastScannedPath())

    if (choices.length <= 1) {
        ui.log.info('No Xcode projects found in common locations.')
        return promptForManualPath()
    }

    const selected = await ui.select<string>({
        message: 'Where\'s your Xcode project?',
        options: choices,
    })

    if (selected === null) return null
    if (selected === '__manual__') return promptForManualPath()
    return selected
}

async function promptForManualPath(): Promise<string | null> {
    return ui.text({
        message: 'Enter the path to your project:',
        placeholder: './MyApp',
        validate: (val) => {
            if (!val?.trim()) return 'Path is required'
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
