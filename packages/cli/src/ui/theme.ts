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

// Monkey-patch process.stdout to theme Clack (which uses hardcoded colors)
// This applies the Preflight Orange brand to the Clack UI lines and White to diamonds
export function applyThemePatch() {
    const originalWrite = process.stdout.write.bind(process.stdout)
    // Brand Orange: #E8700A -> R=232, G=112, B=10
    const orangeOpen = '\x1b[38;2;232;112;10m'
    const whiteOpen = '\x1b[37m'
    const grayOpen = '\x1b[90m' // Clack uses 90m (bright black) for dim/lines
    const cyanOpen = '\x1b[36m' // Clack uses 36m for active elements
    const magentaOpen = '\x1b[35m' // Clack uses 35m for spinner

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process.stdout.write = (chunk: any, ...args: any[]) => {
        if (typeof chunk === 'string') {
            // 1. Make vertical lines and corners Orange (instead of Gray)
            // Clack sends \x1b[90m│  or \x1b[90m┌
            // Regex matches: (gray color)(one of the box drawing chars)
            let patched = chunk.replace(/(\x1b\[90m)([│┌└├])/g, (match, color, char) => {
                return orangeOpen + char
            })

            // 2. Make Diamonds White (instead of Magenta/Cyan)
            // Clack sends \x1b[35m◆ or \x1b[36m◆
            // Regex matches: (magenta or cyan color)(diamond chars)
            patched = patched.replace(/(\x1b\[3[56]m)([◆●])/g, (match, color, char) => {
                return whiteOpen + char
            })

            // 3. Make active bar line Orange (often Cyan in Clack)
            // Clack often uses cyan for the active left border of the current step
            // We look for \x1b[36m followed by box chars
            patched = patched.replace(/(\x1b\[36m)([│┌└├])/g, (_match, _color, char) => {
                return orangeOpen + char
            })

            // 4. Make selection bullet White (instead of Green)
            // Clack uses \x1b[32m● for selected radio/checkbox
            patched = patched.replace(/(\x1b\[32m)([●])/g, (_match, _color, char) => {
                return whiteOpen + char
            })

            // 5. Make Green Diamond Orange (User request) - kept for other usages if any
            // Clack uses \x1b[32m◆ or \x1b[32m◇ for active states
            patched = patched.replace(/(\x1b\[32m)([◆◇])/g, (_match, _color, char) => {
                return orangeOpen + char
            })

            // 6. Make Magenta Spinner Orange (User request)
            // Clack spinner uses \x1b[35m with chars ◒◐◓◑
            patched = patched.replace(/(\x1b\[35m)([◒◐◓◑])/g, (_match, _color, char) => {
                return orangeOpen + char
            })

            return originalWrite(patched, ...args)
        }
        return originalWrite(chunk, ...args)
    }
}
