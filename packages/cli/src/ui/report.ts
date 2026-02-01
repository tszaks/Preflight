import chalk from 'chalk'
import Table from 'cli-table3'

interface ReportItem {
    category: string
    severity: string
    title: string
    description: string
    guideline_ref?: string
    fix_suggestion?: string
    confidence: number
}

interface ReportData {
    metadata_score: number
    screenshots_score: number
    privacy_score: number
    info_plist_score: number
    urls_score: number
    content_score: number
    ipa_binary_score: number
    overall_score: number
    summary?: string
}

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
    critical: chalk.red.bold,
    warning: chalk.yellow,
    info: chalk.blue,
    pass: chalk.green,
}

const SEVERITY_ICONS: Record<string, string> = {
    critical: '!',
    warning: '!',
    info: 'i',
    pass: '+',
}

export function renderScore(score: number): string {
    const width = 30
    const filled = Math.round((score / 100) * width)
    const empty = width - filled

    let color: (s: string) => string
    let label: string

    if (score >= 80) {
        color = chalk.green
        label = 'READY'
    } else if (score >= 60) {
        color = chalk.yellow
        label = 'NEEDS ATTENTION'
    } else {
        color = chalk.red
        label = 'AT RISK'
    }

    const bar = color('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(empty))
    return `${score}/100 [${bar}] ${color(label)}`
}

export function renderReport(report: ReportData, items: ReportItem[]) {
    console.log()
    console.log(chalk.bold('  Score: ') + renderScore(report.overall_score))
    console.log()

    if (report.summary) {
        console.log(chalk.dim('  ' + report.summary))
        console.log()
    }

    // Category scores
    const scoreTable = new Table({
        head: [chalk.bold('Category'), chalk.bold('Score')],
        style: { head: [], border: [], 'padding-left': 2 },
        colWidths: [25, 12],
    })

    const categories = [
        ['Metadata', report.metadata_score],
        ['Screenshots', report.screenshots_score],
        ['Privacy', report.privacy_score],
        ['Info.plist', report.info_plist_score],
        ['URLs', report.urls_score],
        ['Content', report.content_score],
        ['IPA Binary', report.ipa_binary_score],
    ] as const

    for (const [name, score] of categories) {
        if (score != null) {
            const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red
            scoreTable.push([name, color(`${score}`)])
        }
    }

    console.log(scoreTable.toString())
    console.log()

    // Group items by severity
    const critical = items.filter((i) => i.severity === 'critical')
    const warnings = items.filter((i) => i.severity === 'warning')
    const info = items.filter((i) => i.severity === 'info')
    const passes = items.filter((i) => i.severity === 'pass')

    if (critical.length > 0) {
        console.log(chalk.red.bold(`  CRITICAL (${critical.length})`))
        for (const item of critical) {
            console.log(chalk.red(`    ! ${item.title}`))
            if (item.fix_suggestion) {
                console.log(chalk.dim(`      Fix: ${item.fix_suggestion}`))
            }
        }
        console.log()
    }

    if (warnings.length > 0) {
        console.log(chalk.yellow.bold(`  WARNINGS (${warnings.length})`))
        for (const item of warnings) {
            console.log(chalk.yellow(`    ! ${item.title}`))
            if (item.fix_suggestion) {
                console.log(chalk.dim(`      Fix: ${item.fix_suggestion}`))
            }
        }
        console.log()
    }

    if (info.length > 0) {
        console.log(chalk.blue.bold(`  INFO (${info.length})`))
        for (const item of info) {
            console.log(chalk.blue(`    i ${item.title}`))
        }
        console.log()
    }

    if (passes.length > 0) {
        console.log(chalk.green.bold(`  PASSED (${passes.length})`))
        for (const item of passes) {
            console.log(chalk.green(`    + ${item.title}`))
        }
        console.log()
    }
}

export function renderReportJson(report: ReportData, items: ReportItem[]) {
    console.log(JSON.stringify({ report, items }, null, 2))
}
