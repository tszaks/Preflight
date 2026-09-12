import type { CheckResult, CheckStatus, SeverityLevel } from '@preflight/shared/engine/types'

/**
 * The machine-readable result of a scan.
 *
 * This is a contract. Agents and CI jobs read it, so the shape is versioned and
 * snapshot-tested: adding a field is fine, renaming or removing one is breaking.
 */
export const SCAN_SCHEMA_VERSION = 1

export type FailOnThreshold = 'critical' | 'warning' | 'info'

/**
 * Process exit codes.
 *
 * `COULD_NOT_RUN` is separate from `FINDINGS` on purpose. "We found nothing
 * wrong" and "we could not look" are the same exit status in most tools, and
 * conflating them is how a broken scan in CI reads as a passing one.
 */
export const EXIT = {
    CLEAN: 0,
    FINDINGS: 1,
    COULD_NOT_RUN: 2,
} as const

export interface ScanFinding {
    id: string
    severity: SeverityLevel
    status: CheckStatus
    category: string
    title: string
    description: string
    fix?: string
    guideline?: string
    confidence: number
    file?: string
    line?: number
    patternId?: string
}

export interface CoverageEntry {
    area: string
    status: CheckStatus
    /** Why it was not checked, so the gap is actionable rather than mysterious. */
    reason?: string
}

/**
 * A value the scan assumed because nobody supplied it.
 *
 * Recorded explicitly because a non-interactive run cannot ask, and silently
 * defaulting `has_account_deletion` to true would let the scan claim a clean
 * result on evidence it never had.
 */
export interface ScanAssumption {
    field: string
    assumed: boolean | string
    reason: string
}

export interface ScanResult {
    schemaVersion: number
    preflightVersion: string
    scannedAt: string
    subject: {
        path: string
        kind: 'project' | 'ipa'
        appName: string
    }
    inputs: {
        xcodeProject: string | null
        infoPlist: string | null
        privacyManifest: string | null
        ipa: string | null
        screenshotCount: number
        screenshotsSupplied: boolean
    }
    coverage: CoverageEntry[]
    assumptions: ScanAssumption[]
    findings: ScanFinding[]
    summary: {
        critical: number
        warning: number
        info: number
        pass: number
        notChecked: number
        inconclusive: number
    }
    exitCode: number
}

/** Stable id for a finding, so agents can dedupe and suppress across runs. */
function findingId(check: CheckResult, index: number): string {
    if (check.pattern_id) return check.pattern_id
    const slug = check.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    return `${check.category}:${slug || `finding-${index}`}`
}

export function toFinding(check: CheckResult, index: number): ScanFinding {
    return {
        id: findingId(check, index),
        severity: check.severity,
        // Absent status means the rule ran; only rules that opt out say otherwise.
        status: check.status ?? 'checked',
        category: check.category,
        title: check.title,
        description: check.description,
        ...(check.fix_suggestion ? { fix: check.fix_suggestion } : {}),
        ...(check.guideline_ref ? { guideline: check.guideline_ref } : {}),
        confidence: check.confidence,
        ...(check.file ? { file: check.file } : {}),
        ...(check.line !== undefined ? { line: check.line } : {}),
        ...(check.pattern_id ? { patternId: check.pattern_id } : {}),
    }
}

const SEVERITY_ORDER: Record<FailOnThreshold, SeverityLevel[]> = {
    critical: ['critical'],
    warning: ['critical', 'warning'],
    info: ['critical', 'warning', 'info'],
}

/**
 * Decide the exit code.
 *
 * Only findings that actually ran can fail a build. A `not_checked` result is a
 * gap in coverage, not a violation, and failing on it would push people toward
 * passing fake values just to get a green run.
 */
export function computeExitCode(findings: ScanFinding[], failOn: FailOnThreshold): number {
    const failing = SEVERITY_ORDER[failOn]
    const hit = findings.some(
        (f) => f.status === 'checked' && failing.includes(f.severity)
    )
    return hit ? EXIT.FINDINGS : EXIT.CLEAN
}

export function summarize(findings: ScanFinding[]): ScanResult['summary'] {
    const counted = (severity: SeverityLevel) =>
        findings.filter((f) => f.severity === severity && f.status === 'checked').length

    return {
        critical: counted('critical'),
        warning: counted('warning'),
        info: counted('info'),
        pass: counted('pass'),
        notChecked: findings.filter((f) => f.status === 'not_checked').length,
        inconclusive: findings.filter((f) => f.status === 'inconclusive').length,
    }
}
