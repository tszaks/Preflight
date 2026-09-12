/**
 * The section numbers Apple's App Store Review Guidelines actually contain.
 *
 * Snapshotted from the live page so a rule can never cite a guideline that does
 * not exist. This is the cheap, mechanical half of keeping the knowledge base
 * honest: it cannot tell you a rule's *content* is wrong, but it stops an
 * invented number reaching a user, and a wrong number printed in Apple's voice
 * is worse than saying nothing.
 *
 * Extraction note: the numbers must be matched with boundaries on both sides.
 * A naive `\d.\d` pattern pulls "5.5" out of "2.5.5" and invents sections that
 * do not exist, which would make this gate fail honest rules. The generator
 * uses a lookaround on each side for that reason.
 *
 * Regenerate by re-reading the guidelines page and updating the verified date.
 *
 * Source: https://developer.apple.com/app-store/review/guidelines/
 * Verified: 2026-09-12
 */

export const APPLE_GUIDELINE_SECTIONS_VERIFIED_ON = '2026-09-12';

export const APPLE_GUIDELINE_SECTIONS: ReadonlySet<string> = new Set([
    // Top-level sections.
    '1', '2', '3', '4', '5',

    '1.1', '1.1.1', '1.1.2', '1.1.3', '1.1.4', '1.1.5', '1.1.6', '1.1.7',
    '1.2', '1.2.1', '1.3', '1.4', '1.4.1', '1.4.2', '1.4.3', '1.4.4',
    '1.4.5', '1.5', '1.6', '1.7', '2.1', '2.2', '2.3', '2.3.1',
    '2.3.2', '2.3.3', '2.3.4', '2.3.5', '2.3.6', '2.3.7', '2.3.8', '2.3.9',
    '2.3.10', '2.3.11', '2.3.12', '2.3.13', '2.4', '2.4.1', '2.4.2', '2.4.3',
    '2.4.4', '2.4.5', '2.5', '2.5.1', '2.5.2', '2.5.3', '2.5.4', '2.5.5',
    '2.5.6', '2.5.7', '2.5.8', '2.5.9', '2.5.10', '2.5.11', '2.5.12', '2.5.13',
    '2.5.14', '2.5.15', '2.5.16', '2.5.17', '2.5.18', '3.1', '3.1.1', '3.1.2',
    '3.1.3', '3.1.4', '3.1.5', '3.2', '3.2.1', '3.2.2', '4.1', '4.2',
    '4.2.1', '4.2.2', '4.2.3', '4.2.4', '4.2.5', '4.2.6', '4.2.7', '4.3',
    '4.4', '4.4.1', '4.4.2', '4.4.3', '4.5', '4.5.1', '4.5.2', '4.5.3',
    '4.5.4', '4.5.5', '4.5.6', '4.6', '4.7', '4.7.1', '4.7.2', '4.7.3',
    '4.7.4', '4.7.5', '4.8', '4.9', '4.10', '5.1', '5.1.1', '5.1.2',
    '5.1.3', '5.1.4', '5.1.5', '5.2', '5.2.1', '5.2.2', '5.2.3', '5.2.4',
    '5.2.5', '5.3', '5.3.1', '5.3.2', '5.3.3', '5.3.4', '5.4', '5.5',
    '5.6', '5.6.1', '5.6.2', '5.6.3', '5.6.4',

    // Sub-guidelines Apple numbers parenthetically. Some appear only in the
    // revision notes rather than as headings on the page.
    '1.2.1(a)', '3.1.1(a)', '3.1.2(a)', '3.1.2(b)',
    '3.1.2(c)', '3.1.3(a)', '3.1.3(b)', '3.1.3(c)',
    '3.1.3(d)', '3.1.3(e)', '3.1.3(f)', '3.1.3(g)',
    '3.1.5(i)', '3.1.5(ii)', '3.2.1(viii)', '3.2.2(ix)',
    '3.2.2(x)', '4.1(c)', '4.3(a)', '4.3(b)',
    '5.1.1(i)', '5.1.1(iv)', '5.1.1(ix)', '5.1.1(v)',
    '5.1.2(i)',
]);

/** True when a citation names a real Apple guideline. */
export function isRealGuidelineSection(section: string): boolean {
    return APPLE_GUIDELINE_SECTIONS.has(section.trim());
}
