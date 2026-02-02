import * as p from '@clack/prompts'
import chalk from 'chalk'
import { brand, subtext, APP_VERSION, APP_NAME, APP_TAGLINE, getLogo } from './theme.js'

// Branded intro header -- used at start of interactive flows
export function intro(title?: string) {
    p.intro(brand(`${APP_NAME} v${APP_VERSION}`))
    if (title) {
        p.log.info(title)
    }
}

// Show the tagline beneath the intro
export function showTagline() {
    p.log.message(`${APP_TAGLINE}\nCatch rejection reasons before Apple does.`)
}

// Outro with optional next-step hint
export function outro(message?: string) {
    p.outro(message || 'Done!')
}

// Contextual tip shown after commands
export function tip(message: string) {
    console.log()
    console.log(subtext(`  Tip: ${message}`))
    console.log()
}

// Full-screen branded header for the interactive app
export function renderHeader(email?: string, credits?: number) {
    clearScreen()
    console.log()

    // Rocket logo

    // Main Logo
    for (const line of getLogo()) {
        console.log(line)
    }
    console.log()
    console.log()


    // Info bar: email · credits · version
    const creditDisplay = credits !== undefined
        ? (credits < 100 ? chalk.yellow(`${credits} credits`) : `${credits} credits`)
        : ''
    const infoParts = [email, creditDisplay, `v${APP_VERSION}`].filter(Boolean)
    if (infoParts.length > 0) {
        console.log(subtext(`       ${infoParts.join(' · ')}`))
    } else {
        console.log(subtext(`       ${APP_TAGLINE}`))
    }
    console.log()
}

// Keyboard hint footer -- dimmed text at bottom of screens
export function keyboardHints(hints: string) {
    console.log()
    console.log(subtext(`    ${hints}`))
    console.log()
}

// Select menu with cancel detection
export async function select<T extends string>(opts: {
    message: string
    options: Array<{ value: T; label: string; hint?: string }>
}): Promise<T | null> {
    const result = await p.select({
        message: opts.message,
        options: opts.options as Array<{ value: string; label?: string; hint?: string }>,
    })
    if (p.isCancel(result)) {
        return null
    }
    return result as T
}

// Multiselect with cancel detection
export async function multiselect<T extends string>(opts: {
    message: string
    options: Array<{ value: T; label: string; hint?: string }>
    required?: boolean
}): Promise<T[] | null> {
    const result = await p.multiselect({
        message: opts.message,
        options: opts.options as Array<{ value: string; label?: string; hint?: string }>,
        required: opts.required ?? false,
    })
    if (p.isCancel(result)) {
        return null
    }
    return result as T[]
}

// Confirm prompt with cancel detection
export async function confirm(message: string, initialValue = true): Promise<boolean | null> {
    const result = await p.confirm({ message, initialValue })
    if (p.isCancel(result)) {
        return null
    }
    return result
}

// Text input with cancel detection
export async function text(opts: {
    message: string
    placeholder?: string
    defaultValue?: string
    validate?: (value: string | undefined) => string | Error | undefined
}): Promise<string | null> {
    const result = await p.text(opts)
    if (p.isCancel(result)) {
        return null
    }
    return result as string
}

// Password input with cancel detection
export async function password(opts: {
    message: string
    validate?: (value: string | undefined) => string | Error | undefined
}): Promise<string | null> {
    const result = await p.password({ message: opts.message, validate: opts.validate })
    if (p.isCancel(result)) {
        return null
    }
    return result as string
}

// Spinner wrapper
export function spinner() {
    return p.spinner()
}

// Re-export @clack's log helpers directly
export const log = p.log

// Clear the terminal screen (interactive mode only)
export function clearScreen() {
    if (process.stdout.isTTY) {
        process.stdout.write('\x1B[2J\x1B[3J\x1B[H')
    }
}

// Note display helper (for inline notes/messages in the flow)
export function note(message: string, title?: string) {
    p.note(message, title)
}

// Check if user cancelled
export { isCancel } from '@clack/prompts'
