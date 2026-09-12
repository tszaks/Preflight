import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@preflight/shared/engine/types'
import {
    EXIT,
    SCAN_SCHEMA_VERSION,
    computeExitCode,
    summarize,
    toFinding,
    type ScanFinding,
} from './scan-result.js'

function check(overrides: Partial<CheckResult> = {}): CheckResult {
    return {
        category: 'metadata',
        severity: 'critical',
        title: 'Something is wrong',
        description: 'Details',
        confidence: 100,
        ...overrides,
    }
}

function finding(overrides: Partial<ScanFinding> = {}): ScanFinding {
    return {
        id: 'metadata:something-is-wrong',
        severity: 'critical',
        status: 'checked',
        category: 'metadata',
        title: 'Something is wrong',
        description: 'Details',
        confidence: 100,
        ...overrides,
    }
}

describe('toFinding', () => {
    it('treats a rule with no explicit status as having run', () => {
        expect(toFinding(check(), 0).status).toBe('checked')
    })

    it('preserves an explicit not_checked status', () => {
        expect(toFinding(check({ status: 'not_checked' }), 0).status).toBe('not_checked')
    })

    it('derives a stable id from category and title', () => {
        expect(toFinding(check({ title: 'Missing privacy policy URL', category: 'urls' }), 0).id)
            .toBe('urls:missing-privacy-policy-url')
    })

    it('prefers an explicit pattern id so historical patterns stay linkable', () => {
        expect(toFinding(check({ pattern_id: 'new-app-demo-account' }), 0).id)
            .toBe('new-app-demo-account')
    })

    it('carries file and line through so an agent can act without searching', () => {
        const f = toFinding(check({ file: 'Payday/Info.plist', line: 12 }), 0)
        expect(f.file).toBe('Payday/Info.plist')
        expect(f.line).toBe(12)
    })

    it('omits optional fields rather than emitting nulls', () => {
        const f = toFinding(check(), 0)
        expect('file' in f).toBe(false)
        expect('fix' in f).toBe(false)
    })
})

describe('computeExitCode', () => {
    it('is clean when there are no findings', () => {
        expect(computeExitCode([], 'critical')).toBe(EXIT.CLEAN)
    })

    it('fails on a real critical', () => {
        expect(computeExitCode([finding()], 'critical')).toBe(EXIT.FINDINGS)
    })

    it('does NOT fail on a not_checked finding', () => {
        // A coverage gap is not a violation. Failing the build on it would push
        // people to pass fake values just to get a green run, which is worse
        // than an honest gap.
        expect(computeExitCode([finding({ status: 'not_checked', severity: 'info' })], 'critical'))
            .toBe(EXIT.CLEAN)
    })

    it('does not fail on a not_checked finding even when it is severe', () => {
        expect(computeExitCode([finding({ status: 'not_checked' })], 'critical')).toBe(EXIT.CLEAN)
    })

    it('ignores warnings at the default threshold', () => {
        expect(computeExitCode([finding({ severity: 'warning' })], 'critical')).toBe(EXIT.CLEAN)
    })

    it('fails on warnings when asked to', () => {
        expect(computeExitCode([finding({ severity: 'warning' })], 'warning')).toBe(EXIT.FINDINGS)
    })

    it('fails on info when asked to', () => {
        expect(computeExitCode([finding({ severity: 'info' })], 'info')).toBe(EXIT.FINDINGS)
    })

    it('keeps "could not run" distinct from "found nothing"', () => {
        // The whole point of a separate code: a scan that never ran must not be
        // indistinguishable from a passing one in CI.
        expect(EXIT.COULD_NOT_RUN).not.toBe(EXIT.CLEAN)
        expect(EXIT.COULD_NOT_RUN).not.toBe(EXIT.FINDINGS)
    })
})

describe('summarize', () => {
    it('counts only findings that actually ran', () => {
        const summary = summarize([
            finding({ severity: 'critical' }),
            finding({ severity: 'critical', status: 'not_checked' }),
            finding({ severity: 'warning' }),
            finding({ severity: 'info' }),
            finding({ severity: 'pass' }),
            finding({ severity: 'info', status: 'inconclusive' }),
        ])

        expect(summary).toEqual({
            critical: 1,
            warning: 1,
            info: 1,
            pass: 1,
            notChecked: 1,
            inconclusive: 1,
        })
    })
})

describe('schema contract', () => {
    it('pins the schema version so a breaking change is deliberate', () => {
        // Agents and CI parse this. Bumping it should require editing this test.
        expect(SCAN_SCHEMA_VERSION).toBe(1)
    })

    it('pins the exit codes', () => {
        expect(EXIT).toEqual({ CLEAN: 0, FINDINGS: 1, COULD_NOT_RUN: 2 })
    })
})
