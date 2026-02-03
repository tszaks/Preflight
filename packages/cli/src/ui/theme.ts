import chalk from 'chalk'

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

// Icons
export const icons = {
    check: ok('\u2714'),
    cross: critical('\u2716'),
    warn: warning('!'),
    info: info('i'),
    bullet: '\u25CF',
    circle: '\u25CB',
    arrow: '\u2192',
    block: '\u2588',
    blockDim: chalk.dim('\u2591'),
    file: '\uD83D\uDCC4',
    image: '\uD83D\uDDBC',
    plane: '\uD83D\uDEEB',
} as const

// Severity badge formatting
export function severityBadge(severity: string): string {
    switch (severity) {
        case 'critical':
            return criticalBold(`\uD83D\uDD34 ${severity.toUpperCase()}`)
        case 'warning':
            return warningBold(`\uD83D\uDFE1 ${severity.toUpperCase()}`)
        case 'info':
            return infoBold(`\u2139\uFE0F  ${severity.toUpperCase()}`)
        case 'pass':
            return okBold(`\uD83D\uDFE2 ${severity.toUpperCase()}`)
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
export const APP_VERSION = '0.2.13'
export const APP_NAME = 'Preflight'
export const APP_TAGLINE = 'App Store Review Scanner'

// Gold accent color (matches logo exhaust flame)
export const gold = chalk.hex('#C9A84C')

// Main PreFlight Logo (ASCII Art)
// Main PreFlight Logo (ASCII Art)
// "PREFLIGHT" in ANSI Shadow (Filled) with chunkier (7-wide), taller rocket
export function getLogo(): string[] {
    const w = chalk.white.bold
    const o = brand          // orange for rocket body
    const g = gold           // gold for flame
    const white = chalk.white // white for rocket eye

    return [
        w('                                              ') + o('      ▲      ') + w('                                     '),
        w('      ██████╗ ██████╗ ███████╗███████╗██╗     ') + o('     ▐█▌     ') + w(' ██████╗ ██╗  ██╗████████╗'),
        w('      ██╔══██╗██╔══██╗██╔════╝██╔════╝██║     ') + o('    ▐███▌    ') + w('██╔════╝ ██║  ██║╚══██╔══╝'),
        w('      ██████╔╝██████╔╝█████╗  █████╗  ██║     ') + o('    ▐█') + white('●') + o('█▌    ') + w('██║  ███╗███████║   ██║   '),
        w('      ██╔═══╝ ██╔══██╗██╔══╝  ██╔══╝  ██║     ') + o('   ▐█████▌   ') + w('██║   ██║██╔══██║   ██║   '),
        w('      ██║     ██║  ██║███████╗██║     ███████╗') + o('  ▟███████▙  ') + w('╚██████╔╝██║  ██║   ██║   '),
        w('      ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝') + o('     ▀█▀     ') + w(' ╚═════╝ ╚═╝  ╚═╝   ╚═╝   '),
        w('                                              ') + g('      ▼      ') + w('                                     '),
    ]
}
