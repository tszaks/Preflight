import chalk from 'chalk'
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename, extname, join } from 'node:path'

// Read version from package.json dynamically
const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = existsSync(resolve(__dirname, '..', 'package.json'))
    ? resolve(__dirname, '..', 'package.json')
    : resolve(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

// Brand colors — consistent visual language across all output
export const brand = chalk.bold.hex('#E8700A')
export const brandDim = chalk.hex('#E8700A')
export const heading = chalk.bold.white
export const subtext = chalk.dim
export const muted = chalk.gray

// Status colors
export const ok = chalk.green
export const okBold = chalk.bold.green
export const warning = chalk.yellow
export const warningBold = chalk.bold.yellow
export const critical = chalk.red
export const criticalBold = chalk.bold.red
export const info = chalk.hex('#E8700A')
export const infoBold = chalk.bold.hex('#E8700A')

// Icons - Restored circles per user preference, but kept emoji-free
export const icons = {
    bullet: '●',
    circle: '○',
    arrow: '->',
    block: '#',
    blockDim: chalk.dim('.'),
    file: '',
    image: '',
    plane: '',
} as const

// Severity badge formatting - No emojis
export function severityBadge(severity: string): string {
    switch (severity) {
        case 'critical':
            return criticalBold(`CRITICAL`)
        case 'warning':
            return warningBold(`WARNING`)
        case 'info':
            return infoBold(`INFO`)
        case 'pass':
            return okBold(`PASSED`)
        default:
            return severity.toUpperCase()
    }
}

// Score bar (used in reports)
export function scoreBar(score: number, width = 20): string {
    const filled = Math.round((score / 100) * width)
    const empty = width - filled

    let color: typeof ok
    let label: string
    if (score >= 80) {
        color = ok
        label = 'READY'
    } else if (score >= 60) {
        color = warning
        label = 'NEEDS ATTENTION'
    } else {
        color = critical
        label = 'AT RISK'
    }

    return `${score}/100  ${color(icons.block.repeat(filled))}${icons.blockDim.repeat(empty)}  ${color(label)}`
}

// File size formatter
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// App version string
export const APP_VERSION = pkg.version
export const APP_NAME = 'Preflight'
export const APP_TAGLINE = 'App Store Review Scanner'

// Gold accent color (matches logo exhaust flame)
export const gold = chalk.hex('#C9A84C')

// Main PreFlight Logo (ASCII Art)
export function getLogo(): string[] {
    const w = chalk.white // Face color
    const o = brand       // Outline/Rocket color
    const g = gold        // Exhaust

    // Rocket parts (Orange with Gold exhaust)
    const rocket = [
        o('      ▲      '),
        o('     ▐█▌     '),
        o('    ▐███▌    '),
        o('    ▐█') + chalk.white('●') + o('█▌    '),
        o('   ▐█████▌   '),
        o('  ▟███████▙  '),
        o('     ▀█▀     '),
        g('      ▼      '),
    ]

    // Raw text strings (ANSI Shadow font)
    const textLines = [
        '██████╗ ██████╗ ███████╗███████╗██╗     ██╗ ██████╗ ██╗  ██╗████████╗',
        '██╔══██╗██╔══██╗██╔════╝██╔════╝██║     ██║██╔════╝ ██║  ██║╚══██╔══╝',
        '██████╔╝██████╔╝█████╗  █████╗  ██║     ██║██║  ███╗███████║   ██║   ',
        '██╔═══╝ ██╔══██╗██╔══╝  ██╔══╝  ██║     ██║██║   ██║██╔══██║   ██║   ',
        '██║     ██║  ██║███████╗██║     ███████╗██║╚██████╔╝██║  ██║   ██║   ',
        '╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ',
    ]

    // Colorize text: White face (█), Orange outline (others)
    const coloredText = textLines.map(line => {
        return line.split('').map(char => {
            if (char === '█') return w(char)
            if (char === ' ') return ' '
            return o(char)
        }).join('')
    })

    // Combine: Rocket on left, Text centered vertically (padded with 1 line top/bottom)
    return [
        rocket[0] + '  ',
        rocket[1] + '  ' + coloredText[0],
        rocket[2] + '  ' + coloredText[1],
        rocket[3] + '  ' + coloredText[2],
        rocket[4] + '  ' + coloredText[3],
        rocket[5] + '  ' + coloredText[4],
        rocket[6] + '  ' + coloredText[5],
        rocket[7] + '  ',
    ]
}
