/**
 * Where every rule in the knowledge base comes from, and how far to trust it.
 *
 * The problem this solves is not missing URLs. It is that Preflight's own
 * inferences were rendered in the same voice as Apple's text, so a reader could
 * not tell a quoted requirement from a guess. That is how an invented
 * "Apple now uses automated detection for copycat identification" and a made-up
 * "expect 5-10 days" review time ended up printed as though Apple had said them.
 *
 * A `source` column alone would not have prevented either: someone would have
 * pasted the guidelines URL next to an invented sentence and CI would pass. So
 * provenance carries a KIND, the kind determines what is required, and the kind
 * is shown to the reader.
 *
 *   apple       Apple's own documentation. Authoritative, one URL is enough.
 *   regulatory  A law or regulator, which Apple then enforces. One URL.
 *   third-party Not from Apple. Requires THREE independent corroborating
 *               sources before Preflight will state it, because a single blog
 *               post repeating a rumour is how bad rules propagate.
 *   heuristic   Preflight's own inference, pattern-matching or judgement. No
 *               source is implied, and reports must SAY SO rather than let it
 *               borrow Apple's authority.
 */

export type Provenance =
    | { kind: 'apple'; source: string; verifiedOn: string }
    | { kind: 'regulatory'; source: string; verifiedOn: string }
    | { kind: 'third-party'; sources: string[]; verifiedOn: string }
    | { kind: 'heuristic'; rationale: string };

/** The date the Apple-sourced entries were last checked against live pages. */
export const KNOWLEDGE_VERIFIED_ON = '2026-09-12';

export const APPLE_SOURCES = {
    reviewGuidelines: 'https://developer.apple.com/app-store/review/guidelines/',
    guidelinesJune2026: 'https://developer.apple.com/news/?id=a233fmpw',
    guidelinesFebruary2026: 'https://developer.apple.com/news/?id=d75yllv4',
    developerAgreement: 'https://developer.apple.com/terms/',
    ageRating: 'https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating',
    ageRatingValues: 'https://developer.apple.com/help/app-store-connect/reference/age-rating-values',
    accessibilityLabels: 'https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels',
    gameCenter: 'https://developer.apple.com/help/app-store-connect/configure-game-center/enable-game-center',
    medicalDeviceStatus: 'https://developer.apple.com/help/app-store-connect/manage-app-information/provide-regulated-medical-device-status',
    declaredAgeRange: 'https://developer.apple.com/documentation/declaredagerange',
    /** Verified 2026-09-12: "Since April 28, 2026 ... must be built with Xcode 26 or later". */
    upcomingRequirements: 'https://developer.apple.com/news/upcoming-requirements/',
} as const;

function apple(source: string): Provenance {
    return { kind: 'apple', source, verifiedOn: KNOWLEDGE_VERIFIED_ON };
}

/**
 * Default provenance for the numbered App Store Review Guidelines.
 *
 * Points at the guidelines page rather than a per-section anchor. Apple's
 * anchors are not a stable function of the section number, so generating
 * `#4-1-c` style links would have produced plausible URLs that 404, which is
 * worse than one correct link next to a section number the reader already has.
 */
export const GUIDELINE_PROVENANCE: Provenance = apple(APPLE_SOURCES.reviewGuidelines);

/** Entries that are not numbered guidelines and have their own Apple source. */
export const GUIDELINE_PROVENANCE_OVERRIDES: Record<string, Provenance> = {
    'ASC-Time-Allowances': apple(APPLE_SOURCES.ageRating),
    'ASC-Regional-Age-Ratings': apple(APPLE_SOURCES.ageRatingValues),
    'ASC-Regional-Age-Assurance': apple(APPLE_SOURCES.declaredAgeRange),
    'ASC-Australia-Social-Media': apple(APPLE_SOURCES.ageRating),
    'ASC-Accessibility-Nutrition-Labels': apple(APPLE_SOURCES.accessibilityLabels),
    'ASC-Game-Center-Entitlement': apple(APPLE_SOURCES.gameCenter),
    'ASC-Regulated-Medical-Device': apple(APPLE_SOURCES.medicalDeviceStatus),
    'ASC-Brazil-Betting-License': apple(APPLE_SOURCES.reviewGuidelines),
    'EU-Digital-Services-Act': {
        kind: 'regulatory',
        source: 'https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-trader-status',
        verifiedOn: KNOWLEDGE_VERIFIED_ON,
    },
    'EU-Unified-Business-Terms': {
        kind: 'regulatory',
        source: APPLE_SOURCES.developerAgreement,
        verifiedOn: KNOWLEDGE_VERIFIED_ON,
    },
};

/**
 * Default provenance for the rejection-pattern and historical-pattern sets.
 *
 * These were assembled from community reports on developer forums, Reddit and
 * Stack Overflow. That origin is genuinely useful and no Apple page states them
 * in this form, but no citations were ever recorded alongside the entries.
 *
 * They are therefore classified as heuristics rather than as `third-party`.
 * Promoting them would mean attaching three sources each, and inventing
 * citations to satisfy a schema is precisely the failure this system exists to
 * prevent. Anyone who records real corroborating sources for a pattern can
 * reclassify it; until then it is honestly labelled as inference.
 */
export const PATTERN_PROVENANCE: Provenance = {
    kind: 'heuristic',
    rationale:
        'Derived from recurring rejection reports on Apple Developer Forums, Reddit and Stack Overflow. ' +
        'No Apple page states this in this form, and per-entry citations were not recorded, so it is ' +
        'presented as Preflight inference rather than as an Apple requirement.',
};

/** Default provenance for category and behavioural heuristics. */
export const HEURISTIC_PROVENANCE: Provenance = {
    kind: 'heuristic',
    rationale:
        'Preflight judgement about what a category of app typically needs. Useful as a prompt to check ' +
        'something, not a statement that Apple requires it.',
};

/** True when this provenance carries the weight of an official source. */
export function isAuthoritative(provenance: Provenance): boolean {
    return provenance.kind === 'apple' || provenance.kind === 'regulatory';
}

/** Short label for reports, so a reader can weigh a finding at a glance. */
export function provenanceLabel(provenance: Provenance): string {
    switch (provenance.kind) {
        case 'apple':
            return 'Apple documentation';
        case 'regulatory':
            return 'Regulatory requirement';
        case 'third-party':
            return `Third-party, ${provenance.sources.length} sources`;
        case 'heuristic':
            return 'Preflight heuristic, not an Apple rule';
    }
}

/**
 * Validate one provenance record.
 *
 * Returns the reasons it is invalid, empty when it is fine. Used by the CI gate
 * so the README's traceability promise is enforced by a failing build rather
 * than by good intentions.
 */
export function validateProvenance(provenance: Provenance | undefined, id: string): string[] {
    if (!provenance) return [`${id}: no provenance`];

    const problems: string[] = [];
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;

    switch (provenance.kind) {
        case 'apple':
        case 'regulatory':
            if (!provenance.source?.startsWith('http')) {
                problems.push(`${id}: ${provenance.kind} provenance needs a source URL`);
            }
            if (!isoDate.test(provenance.verifiedOn ?? '')) {
                problems.push(`${id}: ${provenance.kind} provenance needs a verifiedOn date (YYYY-MM-DD)`);
            }
            break;
        case 'third-party': {
            const sources = provenance.sources ?? [];
            const unique = new Set(sources.filter((s) => s?.startsWith('http')));
            if (unique.size < 3) {
                problems.push(
                    `${id}: third-party provenance needs at least 3 independent sources, found ${unique.size}`
                );
            }
            if (!isoDate.test(provenance.verifiedOn ?? '')) {
                problems.push(`${id}: third-party provenance needs a verifiedOn date (YYYY-MM-DD)`);
            }
            break;
        }
        case 'heuristic':
            if (!provenance.rationale || provenance.rationale.length < 20) {
                problems.push(`${id}: heuristic provenance needs a rationale explaining the inference`);
            }
            break;
        default:
            problems.push(`${id}: unknown provenance kind`);
    }

    return problems;
}
