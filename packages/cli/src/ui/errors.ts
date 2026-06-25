import * as p from '@clack/prompts'
import chalk from 'chalk'
import { brand, brandDim } from './theme.js'

const KNOWN_COMMANDS = [
    { name: 'scan', description: 'Scan an iOS project locally' },
    { name: 'update', description: 'Update to the latest npm version' },
]

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

export function findSimilarCommands(input: string, maxSuggestions = 3): typeof KNOWN_COMMANDS {
    const scored = KNOWN_COMMANDS
        .map((cmd) => ({
            ...cmd,
            distance: levenshtein(input.toLowerCase(), cmd.name),
            isSubstring: cmd.name.includes(input.toLowerCase()) || input.toLowerCase().includes(cmd.name),
        }))
        .filter((cmd) => cmd.distance <= 3 || cmd.isSubstring)
        .sort((a, b) => {
            if (a.isSubstring && !b.isSubstring) return -1
            if (!a.isSubstring && b.isSubstring) return 1
            return a.distance - b.distance
        })

    return scored.slice(0, maxSuggestions)
}

export function handleUnknownCommand(cmdName: string) {
    const suggestions = findSimilarCommands(cmdName)

    console.log()
    p.log.error(`"${cmdName}" isn't a command.`)

    if (suggestions.length > 0) {
        console.log()
        console.log(chalk.dim('  Did you mean:'))
        for (const s of suggestions) {
            console.log(`    ${brandDim('->')} ${brand(`preflight ${s.name}`)}    ${chalk.dim(s.description)}`)
        }
    }

    console.log()
    console.log(chalk.dim('  Run ') + brand('preflight scan <path>') + chalk.dim(' or ') + brand('preflight --help') + chalk.dim('.'))
    console.log()
}

export function friendlyError(title: string, suggestion?: string) {
    console.log()
    p.log.error(title)
    if (suggestion) {
        console.log(chalk.dim(`  ${suggestion}`))
    }
    console.log()
}
