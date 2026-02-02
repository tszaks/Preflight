import * as p from '@clack/prompts'
import chalk from 'chalk'
import { brand, brandDim } from './theme.js'

// Known commands for fuzzy matching
const KNOWN_COMMANDS = [
    { name: 'scan', description: 'Scan your app (free preview)' },
    { name: 'submit', description: 'Submit for full AI analysis' },
    { name: 'login', description: 'Log in to your account' },
    { name: 'logout', description: 'Log out and clear credentials' },
    { name: 'whoami', description: 'Show current user info' },
    { name: 'credits', description: 'Check credit balance' },
    { name: 'status', description: 'Check analysis status' },
    { name: 'report', description: 'View analysis report' },
    { name: 'history', description: 'List past submissions' },
    { name: 'setup', description: 'Run guided setup' },
    { name: 'asc', description: 'App Store Connect integration' },
    { name: 'update', description: 'Update to the latest version' },
]

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) matrix[i] = [i]
    for (let j = 0; j <= a.length; j++) matrix[0]![j] = j

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i]![j] = matrix[i - 1]![j - 1]!
            } else {
                matrix[i]![j] = Math.min(
                    matrix[i - 1]![j - 1]! + 1,
                    matrix[i]![j]! + 1,
                    matrix[i]![j - 1]! + 1
                )
            }
        }
    }
    return matrix[b.length]![a.length]!
}

// Find similar commands
export function findSimilarCommands(input: string, maxSuggestions = 3): typeof KNOWN_COMMANDS {
    const scored = KNOWN_COMMANDS
        .map((cmd) => ({
            ...cmd,
            distance: levenshtein(input.toLowerCase(), cmd.name),
            isSubstring: cmd.name.includes(input.toLowerCase()) || input.toLowerCase().includes(cmd.name),
        }))
        .filter((cmd) => cmd.distance <= 3 || cmd.isSubstring)
        .sort((a, b) => {
            // Substring matches first, then by distance
            if (a.isSubstring && !b.isSubstring) return -1
            if (!a.isSubstring && b.isSubstring) return 1
            return a.distance - b.distance
        })

    return scored.slice(0, maxSuggestions)
}

// Handle unknown commands with friendly suggestions
export function handleUnknownCommand(cmdName: string) {
    const suggestions = findSimilarCommands(cmdName)

    console.log()
    p.log.error(`"${cmdName}" isn't a command.`)

    if (suggestions.length > 0) {
        console.log()
        console.log(chalk.dim('  Did you mean:'))
        for (const s of suggestions) {
            console.log(`    ${brandDim('\u2192')} ${brand(`preflight ${s.name}`)}    ${chalk.dim(s.description)}`)
        }
    }

    console.log()
    console.log(chalk.dim('  Run ') + brand('preflight') + chalk.dim(' for the interactive menu.'))
    console.log()
}

// Friendly "not logged in" prompt — returns true if user wants to login
export async function promptLogin(): Promise<boolean> {
    const result = await p.select({
        message: "You're not logged in yet.",
        options: [
            { value: 'login', label: 'Log in now', hint: 'Opens browser' },
            { value: 'skip', label: 'Continue without login', hint: 'Scan still works' },
        ],
    })

    if (p.isCancel(result)) {
        p.cancel('Cancelled.')
        return false
    }
    return result === 'login'
}

// Friendly error with optional action
export function friendlyError(title: string, suggestion?: string) {
    console.log()
    p.log.error(title)
    if (suggestion) {
        console.log(chalk.dim(`  ${suggestion}`))
    }
    console.log()
}
