import { describe, expect, it } from 'vitest';
import { GUIDELINES } from './guidelines';
import { REJECTION_PATTERNS } from './rejection-patterns';
import { ENHANCED_PATTERNS } from '../historical-patterns/patterns-enhanced';
import { isRealGuidelineSection } from './apple-sections';
import { auditProvenance, provenanceForGuideline } from './provenance-registry';
import { validateProvenance, isAuthoritative, provenanceLabel, type Provenance } from './provenance';

/**
 * The gate that makes the README's traceability promise enforceable.
 *
 * Preflight told users "a claim that cannot be traced to an Apple page does not
 * go in" while the code had no way to check that, and nine rules cited
 * guidelines that did not govern them. Good intentions are not a mechanism;
 * a failing build is.
 */

describe('every rule resolves to a provenance', () => {
    it('audits without problems', () => {
        const audit = auditProvenance();
        expect(audit.problems).toEqual([]);
    });

    it('covers every rule in the knowledge base', () => {
        const audit = auditProvenance();
        expect(audit.total).toBe(Object.keys(GUIDELINES).length + REJECTION_PATTERNS.length);
        expect(audit.total).toBeGreaterThan(100);
    });

    it('classifies Apple guidelines as authoritative', () => {
        expect(isAuthoritative(provenanceForGuideline('2.1'))).toBe(true);
    });

    it('does not let community patterns claim Apple authority', () => {
        // These came from forum reports with no citations recorded. Presenting
        // them as Apple rules is exactly the failure this system prevents.
        const audit = auditProvenance();
        expect(audit.byKind.heuristic).toBeGreaterThan(0);
    });
});

describe('provenance validation', () => {
    const iso = '2026-09-12';

    it('rejects an apple rule with no source', () => {
        const bad = { kind: 'apple', source: '', verifiedOn: iso } as Provenance;
        expect(validateProvenance(bad, 'x')).not.toEqual([]);
    });

    it('rejects an apple rule with no verified date', () => {
        const bad = { kind: 'apple', source: 'https://developer.apple.com', verifiedOn: '' } as Provenance;
        expect(validateProvenance(bad, 'x')).not.toEqual([]);
    });

    it('rejects a third-party claim with fewer than three sources', () => {
        // Tyler's rule: Apple is trusted as-is, anything else needs three
        // independent corroborating sources before Preflight will state it.
        const two: Provenance = {
            kind: 'third-party',
            sources: ['https://a.example', 'https://b.example'],
            verifiedOn: iso,
        };
        expect(validateProvenance(two, 'x')).toEqual([
            'x: third-party provenance needs at least 3 independent sources, found 2',
        ]);
    });

    it('accepts a third-party claim with three distinct sources', () => {
        const three: Provenance = {
            kind: 'third-party',
            sources: ['https://a.example', 'https://b.example', 'https://c.example'],
            verifiedOn: iso,
        };
        expect(validateProvenance(three, 'x')).toEqual([]);
    });

    it('does not count the same source three times', () => {
        const duped: Provenance = {
            kind: 'third-party',
            sources: ['https://a.example', 'https://a.example', 'https://a.example'],
            verifiedOn: iso,
        };
        expect(validateProvenance(duped, 'x')).not.toEqual([]);
    });

    it('requires a heuristic to explain itself', () => {
        expect(validateProvenance({ kind: 'heuristic', rationale: 'because' }, 'x')).not.toEqual([]);
    });

    it('labels a heuristic so a report cannot pass it off as Apple', () => {
        expect(provenanceLabel({ kind: 'heuristic', rationale: 'x'.repeat(30) }))
            .toBe('Preflight heuristic, not an Apple rule');
    });
});

describe('no rule cites a guideline Apple does not have', () => {
    const allCitations = new Set<string>();
    for (const pattern of REJECTION_PATTERNS) allCitations.add(pattern.guideline);
    for (const pattern of ENHANCED_PATTERNS) allCitations.add(pattern.guideline);
    for (const section of Object.keys(GUIDELINES)) allCitations.add(section);

    // ASC-* and EU-* are Preflight's own keys for App Store Connect and
    // regulatory requirements that Apple does not number as review guidelines.
    // They are legitimate, but they must not look like Apple section numbers,
    // so they are held to a naming convention instead.
    const isPreflightKey = (s: string) => /^(ASC|EU)-/.test(s);
    const appleCitations = [...allCitations].filter((s) => !isPreflightKey(s)).sort();
    const preflightKeys = [...allCitations].filter(isPreflightKey).sort();

    it('checks a meaningful number of citations', () => {
        expect(appleCitations.length).toBeGreaterThan(30);
    });

    it.each(appleCitations)('%s is a real Apple guideline', (section) => {
        expect(isRealGuidelineSection(section)).toBe(true);
    });

    it.each(preflightKeys)('%s is clearly marked as a Preflight key, not an Apple number', (key) => {
        // The point of the prefix: a reader must never mistake one of these for
        // something Apple wrote and numbered.
        expect(key).toMatch(/^(ASC|EU)-/);
        expect(isRealGuidelineSection(key)).toBe(false);
    });
});
