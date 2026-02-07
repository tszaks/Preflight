import chalk from 'chalk'
import * as p from '@clack/prompts'
import {
    ok, okBold, warning, warningBold, critical, criticalBold,
    info, infoBold, subtext, heading, scoreBar, icons, brand, brandDim,
} from './theme.js'

interface ReportItem {
    category: string
    severity: string
    title: string
    description: string
    guideline_ref?: string
    fix_suggestion?: string
    confidence: number
    pattern_id?: string | null
}

interface ReportData {
    id?: string
    score_metadata: number
    score_screenshots: number | null
    score_privacy: number | null
    score_plist: number | null
    score_urls: number
    score_content: number
    score_ipa_binary: number | null
    score_overall: number
    summary?: string
}

export function renderScore(score: number): string {
    return scoreBar(score)
}

function computeCompleteness(report: ReportData): number {
    const provided = [
        report.score_screenshots,
        report.score_privacy,
        report.score_plist,
        report.score_ipa_binary,
    ].filter((v) => v != null).length
    return Math.round((provided / 4) * 100)
}

export function renderReport(report: ReportData, items: ReportItem[]) {
    console.log()
    p.log.step(heading('Analysis Complete'))
    console.log()
    console.log(`  ${chalk.bold('Risk Score:')} ${scoreBar(report.score_overall)}  ${subtext(`Completeness ${computeCompleteness(report)}%`)}`)
    console.log()

    if (report.summary) {
        console.log(`  ${subtext(report.summary)}`)
        console.log()
    }

    const isManualReview = (i: ReportItem) =>
        (i.title || '').toLowerCase().startsWith('manual review:')

    const manualReview = items.filter(isManualReview)
    const mainItems = items.filter((i) => !isManualReview(i))

    // Group items by severity
    const criticals = mainItems.filter((i) => i.severity === 'critical')
    const warnings = mainItems.filter((i) => i.severity === 'warning')
    const infos = mainItems.filter((i) => i.severity === 'info')
    const passes = mainItems.filter((i) => i.severity === 'pass')

    // Critical issues
    if (criticals.length > 0) {
        console.log(`  ${criticalBold(`\uD83D\uDD34 ${criticals.length} Critical Issue${criticals.length === 1 ? '' : 's'}`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of criticals) {
            console.log(`  ${critical(item.title)}`)
            if (item.fix_suggestion) {
                console.log(`  ${brandDim(icons.arrow)} ${item.fix_suggestion}`)
            }
            if (item.description && item.description !== item.title) {
                console.log(`  ${subtext(item.description)}`)
            }
            console.log()
        }
    }

    // Warnings
    if (warnings.length > 0) {
        console.log(`  ${warningBold(`\uD83D\uDFE1 ${warnings.length} Warning${warnings.length === 1 ? '' : 's'}`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of warnings) {
            console.log(`  ${warning(item.title)}`)
            if (item.fix_suggestion) {
                console.log(`  ${brandDim(icons.arrow)} ${item.fix_suggestion}`)
            }
            console.log()
        }
    }

    // Info items
    if (infos.length > 0) {
        console.log(`  ${infoBold(`\u2139\uFE0F  ${infos.length} Info`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of infos) {
            console.log(`  ${info(item.title)}`)
        }
        console.log()
    }

    // Manual review items (no score impact)
    if (manualReview.length > 0) {
        console.log(`  ${infoBold(`Manual Review (${manualReview.length})`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of manualReview) {
            console.log(`  ${subtext(item.title)}`)
        }
        console.log()
    }

    // Passed items
    if (passes.length > 0) {
        console.log(`  ${okBold(`\uD83D\uDFE2 ${passes.length} Passed`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of passes) {
            console.log(`  ✔ ${ok(item.title)}`)
        }
        console.log()
    }

    // Category breakdown
    const categories = [
        ['Metadata', report.score_metadata],
        ['Screenshots', report.score_screenshots],
        ['Privacy', report.score_privacy],
        ['Info.plist', report.score_plist],
        ['URLs', report.score_urls],
        ['Content', report.score_content],
        ['IPA Binary', report.score_ipa_binary],
    ] as const

    const validCategories = categories.filter(([, score]) => score != null) as Array<[string, number]>

    if (validCategories.length > 0) {
        console.log(`  ${heading('Category Scores')}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const [name, score] of validCategories) {
            const color = score >= 80 ? ok : (score >= 60 ? warning : critical)
            const filled = Math.round((score / 100) * 10)
            const miniBar = color(icons.block.repeat(filled))
            const emptyBar = subtext(icons.blockDim.repeat(10 - filled))
            console.log(`  ${name.padEnd(14)} ${miniBar}${emptyBar} ${color(`${score}`)}`)
        }
        console.log()
    }
}

export function renderReportJson(report: ReportData, items: ReportItem[]) {
    console.log(JSON.stringify({ report, items }, null, 2))
}
