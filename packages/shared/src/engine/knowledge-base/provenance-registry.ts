import { GUIDELINES } from './guidelines';
import { REJECTION_PATTERNS } from './rejection-patterns';
import {
    GUIDELINE_PROVENANCE,
    GUIDELINE_PROVENANCE_OVERRIDES,
    PATTERN_PROVENANCE,
    HEURISTIC_PROVENANCE,
    validateProvenance,
    type Provenance,
} from './provenance';

/**
 * One place that answers "where did this rule come from?" for every rule.
 *
 * Provenance is resolved here rather than pasted onto 225 objects. Both work,
 * but per-collection defaults with explicit overrides mean a new rule inherits
 * an honest classification automatically, and nobody can add a rule that
 * silently has no provenance: the CI gate below walks every rule and fails if
 * one does not resolve.
 */

export interface RuleProvenanceEntry {
    id: string;
    collection: string;
    provenance: Provenance;
}

export function provenanceForGuideline(section: string): Provenance {
    return GUIDELINE_PROVENANCE_OVERRIDES[section] ?? GUIDELINE_PROVENANCE;
}

export function provenanceForRejectionPattern(_id: string): Provenance {
    return PATTERN_PROVENANCE;
}

export function provenanceForHeuristic(_id: string): Provenance {
    return HEURISTIC_PROVENANCE;
}

/** Every rule in the knowledge base with its resolved provenance. */
export function allRuleProvenance(): RuleProvenanceEntry[] {
    const entries: RuleProvenanceEntry[] = [];

    for (const section of Object.keys(GUIDELINES)) {
        entries.push({
            id: section,
            collection: 'guidelines',
            provenance: provenanceForGuideline(section),
        });
    }

    for (const pattern of REJECTION_PATTERNS) {
        entries.push({
            id: pattern.id,
            collection: 'rejection-patterns',
            provenance: provenanceForRejectionPattern(pattern.id),
        });
    }

    return entries;
}

export interface ProvenanceAudit {
    total: number;
    byKind: Record<string, number>;
    problems: string[];
}

/**
 * Audit the whole knowledge base. The CI gate fails on any problem.
 */
export function auditProvenance(): ProvenanceAudit {
    const entries = allRuleProvenance();
    const byKind: Record<string, number> = {};
    const problems: string[] = [];

    for (const entry of entries) {
        byKind[entry.provenance.kind] = (byKind[entry.provenance.kind] ?? 0) + 1;
        problems.push(...validateProvenance(entry.provenance, `${entry.collection}/${entry.id}`));
    }

    return { total: entries.length, byKind, problems };
}
