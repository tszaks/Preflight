import * as p from '@clack/prompts'
import { brand, subtext, APP_VERSION, APP_NAME, APP_TAGLINE } from './theme.js'

// Branded intro header — used at start of interactive flows
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

// First-run animated brand splash (plays once)
export function brandSplash() {
    console.log()
    console.log(brand(`  ${APP_NAME.split('').join(' ')}`))
    console.log()
    console.log(subtext(`  ${APP_TAGLINE}`))
    console.log(subtext(`  v${APP_VERSION}`))
    console.log()
}

// Outro with optional next-step hint
export function outro(message?: string) {
    p.outro(message || 'Done!')
}

// Contextual tip shown after commands
export function tip(message: string) {
    console.log()
    console.log(subtext(`  \uD83D\uDCA1 Tip: ${message}`))
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
        p.cancel('Cancelled.')
        return null
    }
    return result as T
}

// Confirm prompt with cancel detection
export async function confirm(message: string, initialValue = true): Promise<boolean | null> {
    const result = await p.confirm({ message, initialValue })
    if (p.isCancel(result)) {
        p.cancel('Cancelled.')
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
        p.cancel('Cancelled.')
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

// Check if user cancelled
export { isCancel } from '@clack/prompts'
