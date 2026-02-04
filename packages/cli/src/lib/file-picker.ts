import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir, platform } from 'node:os'
import * as ui from '../ui/interactive.js'

/**
 * Check if native file picker is available (macOS only)
 */
export function isPickerAvailable(): boolean {
    return platform() === 'darwin'
}

/**
 * Open native macOS Finder folder picker
 * Returns null if user cancels or picker unavailable
 */
export function browseForFolder(prompt = 'Select a folder'): string | null {
    if (!isPickerAvailable()) return null

    try {
        const result = execFileSync('osascript', [
            '-e', `POSIX path of (choose folder with prompt "${escapeAppleScript(prompt)}")`,
        ], { encoding: 'utf-8', timeout: 120000 })

        const path = result.trim()
        // Remove trailing slash if present
        return path.endsWith('/') ? path.slice(0, -1) : path
    } catch {
        // User cancelled or osascript failed
        return null
    }
}

/**
 * Open native macOS Finder file picker for single file
 * Optionally filter by file types (macOS UTI identifiers)
 * Returns null if user cancels or picker unavailable
 */
export function browseForFile(
    prompt = 'Select a file',
    fileTypes?: string[]
): string | null {
    if (!isPickerAvailable()) return null

    try {
        let command = `POSIX path of (choose file with prompt "${escapeAppleScript(prompt)}"`

        if (fileTypes && fileTypes.length > 0) {
            const typeList = fileTypes.map(t => `"${t}"`).join(', ')
            command += ` of type {${typeList}}`
        }

        command += ')'

        const result = execFileSync('osascript', ['-e', command], {
            encoding: 'utf-8',
            timeout: 120000,
        })

        return result.trim()
    } catch {
        // User cancelled or osascript failed
        return null
    }
}

/**
 * Open native macOS Finder file picker for multiple files
 * Returns null if user cancels or picker unavailable
 */
export function browseForFiles(
    prompt = 'Select files',
    fileTypes?: string[]
): string[] | null {
    if (!isPickerAvailable()) return null

    try {
        // Build AppleScript with proper list iteration
        let command = `set theFiles to (choose file with prompt "${escapeAppleScript(prompt)}" with multiple selections allowed`

        if (fileTypes && fileTypes.length > 0) {
            const typeList = fileTypes.map(t => `"${t}"`).join(', ')
            command += ` of type {${typeList}}`
        }

        command += `)\n`
        command += `set theResult to {}\n`
        command += `repeat with aFile in theFiles\n`
        command += `    set end of theResult to POSIX path of aFile\n`
        command += `end repeat\n`
        command += `set AppleScript's text item delimiters to linefeed\n`
        command += `theResult as text`

        const result = execFileSync('osascript', ['-e', command], {
            encoding: 'utf-8',
            timeout: 120000,
        })

        // Split by newlines instead of commas
        return result.trim().split('\n').filter(line => line.length > 0)
    } catch {
        // User cancelled or osascript failed
        return null
    }
}

/**
 * Shorten path for display (replace home directory with ~)
 */
export function shortenPath(p: string): string {
    const home = homedir()
    if (p.startsWith(home)) {
        return '~' + p.slice(home.length)
    }
    return p
}

/**
 * Escape special characters for AppleScript string literals
 */
function escapeAppleScript(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * High-level path input prompt
 * Shows "Browse with Finder" or "Enter manually" options on macOS
 * Falls back to text input on other platforms
 */
export async function promptForPath(opts: {
    message: string
    type: 'folder' | 'file' | 'files'
    fileTypes?: string[]
    allowSkip?: boolean
    placeholder?: string
    validate?: (value: string | undefined) => string | Error | undefined
    mode?: 'browse' | 'manual'
}): Promise<string | string[] | null> {
    const canBrowse = isPickerAvailable()

    // If browsing not available, go straight to text input
    if (!canBrowse) {
        return ui.text({
            message: opts.message,
            placeholder: opts.placeholder,
            validate: opts.validate,
        })
    }

    let action: 'browse' | 'manual' | 'skip' | null = opts.mode || null

    if (!action) {
        const browseLabel = 'Browse with Finder'

        const selectOptions: Array<{ value: 'browse' | 'manual' | 'skip'; label: string; hint?: string }> = [
            {
                value: 'browse',
                label: browseLabel,
                hint: 'Use native macOS file picker',
            },
            {
                value: 'manual',
                label: 'Enter path manually',
                hint: 'Type or paste the path',
            },
        ]

        if (opts.allowSkip) {
            selectOptions.push({
                value: 'skip',
                label: 'Skip',
                hint: 'Continue without this',
            })
        }

        action = await ui.select<'browse' | 'manual' | 'skip'>({
            message: opts.message,
            options: selectOptions,
        })
    }

    if (action === null) return null

    if (action === 'skip') {
        return null
    }

    if (action === 'browse') {
        let result: string | string[] | null = null

        if (opts.type === 'folder') {
            result = browseForFolder(opts.message)
        } else if (opts.type === 'file') {
            result = browseForFile(opts.message, opts.fileTypes)
        } else {
            result = browseForFiles(opts.message, opts.fileTypes)
        }

        // If user cancelled the picker, show the menu again
        if (!result) {
            return promptForPath(opts)
        }

        // Validate if validator provided
        if (opts.validate && typeof result === 'string') {
            const validationError = opts.validate(result)
            if (validationError) {
                if (validationError instanceof Error) {
                    ui.log.error(validationError.message)
                } else {
                    ui.log.error(validationError)
                }
                // Show the menu again for retry
                return promptForPath(opts)
            }
        }

        return result
    }

    // Manual entry
    const manualResult = await ui.text({
        message: `Enter ${opts.type} path:`,
        placeholder: opts.placeholder,
        validate: opts.validate,
    })

    if (manualResult === null) {
        // User cancelled text input, show menu again
        return promptForPath(opts)
    }

    return manualResult
}
