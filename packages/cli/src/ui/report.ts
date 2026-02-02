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
}

interface ReportData {
    id?: string
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

export function renderScore(score: number): string {
    return scoreBar(score)
}

export function renderReport(report: ReportData, items: ReportItem[]) {
    console.log()
    p.log.step(heading('Analysis Complete'))
    console.log()
    console.log(`  ${chalk.bold('Overall Score:')} ${scoreBar(report.overall_score)}`)
    console.log()

    if (report.summary) {
        console.log(`  ${subtext(report.summary)}`)
        console.log()
    }

    // Group items by severity
    const criticals = items.filter((i) => i.severity === 'critical')
    const warnings = items.filter((i) => i.severity === 'warning')
    const infos = items.filter((i) => i.severity === 'info')
    const passes = items.filter((i) => i.severity === 'pass')

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

    // Passed items
    if (passes.length > 0) {
        console.log(`  ${okBold(`\uD83D\uDFE2 ${passes.length} Passed`)}`)
        console.log(subtext(`  ${'─'.repeat(40)}`))
        for (const item of passes) {
            console.log(`  ${icons.check} ${ok(item.title)}`)
        }
        console.log()
    }

    // Category breakdown
    const categories = [
        ['Metadata', report.metadata_score],
        ['Screenshots', report.screenshots_score],
        ['Privacy', report.privacy_score],
        ['Info.plist', report.info_plist_score],
        ['URLs', report.urls_score],
        ['Content', report.content_score],
        ['IPA Binary', report.ipa_binary_score],
    ] as const

    const validCategories = categories.filter(([, score]) => score != null)

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
