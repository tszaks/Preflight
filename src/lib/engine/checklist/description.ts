import type { CheckResult, HardRulesInput } from '../types';
import {
    DESCRIPTION_RULES,
    FORBIDDEN_NAME_PATTERNS,
    FORBIDDEN_DESCRIPTION_PATTERNS,
    AI_MENTION_PATTERN,
} from './rules';

/**
 * Deterministic description and metadata text checks.
 *
 * Scans app name, subtitle, and description for:
 * - Forbidden labels (beta, demo, test, coming soon)
 * - Price references in name/subtitle
 * - Platform names in name/subtitle
 * - Unsubstantiated superlatives
 * - Placeholder content
 * - AI mentions without privacy disclosure
 */
/**
 * Extracts a short snippet of surrounding text around a regex match.
 * Helps users see exactly what triggered a detection flag.
 */
function getMatchContext(text: string, match: RegExpMatchArray | null, maxContext = 20): string {
    if (!match || match.index === undefined) return text.slice(0, 60);
    const start = Math.max(0, match.index - maxContext);
    const end = Math.min(text.length, match.index + match[0].length + maxContext);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
}

/**
 * Checks if a forbidden-label match in the description is actually
 * benign contextual usage (e.g., "Beta user" testimonial attribution).
 * Returns true if the match should be SKIPPED (not flagged).
 */
function isFalsePositiveLabel(text: string, match: RegExpMatchArray | null): boolean {
    if (!match || match.index === undefined) return false;
    const matchedWord = match[0].toLowerCase();

    // Only apply context filtering for "beta" — other labels (demo, test version, etc.)
    // are almost always genuine app-status indicators
    if (matchedWord !== 'beta') return false;

    // Check text after the match for person-role words
    const afterMatch = text.slice(match.index + match[0].length, match.index + match[0].length + 20).toLowerCase();
    const personRoles = /^\s+(user|tester|participant|member|reviewer|feedback)/;
    if (personRoles.test(afterMatch)) return true;

    return false;
}

export function checkDescription(input: HardRulesInput): CheckResult[] {
    const checks: CheckResult[] = [];
    const triggered = new Set<string>();

    const name = input.app_name || '';
    const subtitle = input.subtitle || '';
    const description = input.description || '';

    // === Check name and subtitle against forbidden patterns ===
    const nameSubtitle = `${name} ${subtitle}`.trim();

    for (const { pattern, ruleId } of FORBIDDEN_NAME_PATTERNS) {
        if (pattern.test(nameSubtitle) && !triggered.has(ruleId)) {
            triggered.add(ruleId);
            const rule = DESCRIPTION_RULES.find(r => r.id === ruleId);
            if (rule) {
                const match = nameSubtitle.match(pattern);
                checks.push({
                    category: rule.category,
                    severity: rule.severity,
                    title: rule.title,
                    description: `Found "${match?.[0]}" in your app name/subtitle: "${getMatchContext(nameSubtitle, match)}". ${rule.description}`,
                    guideline_ref: rule.guideline_ref,
                    fix_suggestion: rule.fix_suggestion,
                    confidence: 100,
                });
            }
        }
    }

    // === Check description against forbidden patterns ===
    if (description) {
        for (const { pattern, ruleId } of FORBIDDEN_DESCRIPTION_PATTERNS) {
            if (pattern.test(description) && !triggered.has(ruleId)) {
                const match = description.match(pattern);
                if (isFalsePositiveLabel(description, match)) continue;
                triggered.add(ruleId);
                const rule = DESCRIPTION_RULES.find(r => r.id === ruleId);
                if (rule) {
                    checks.push({
                        category: rule.category,
                        severity: rule.severity,
                        title: rule.title,
                        description: `Found "${match?.[0]}" in your description: "${getMatchContext(description, match)}". ${rule.description}`,
                        guideline_ref: rule.guideline_ref,
                        fix_suggestion: rule.fix_suggestion,
                        confidence: 100,
                    });
                }
            }
        }

        // Also check name/subtitle patterns against description
        // (e.g., placeholder "lorem ipsum" in description)
        for (const { pattern, ruleId } of FORBIDDEN_NAME_PATTERNS) {
            if (ruleId === 'desc_forbidden_labels' && pattern.test(description) && !triggered.has(ruleId)) {
                const match = description.match(pattern);
                if (isFalsePositiveLabel(description, match)) continue;
                triggered.add(ruleId);
                const rule = DESCRIPTION_RULES.find(r => r.id === ruleId);
                if (rule) {
                    checks.push({
                        category: rule.category,
                        severity: rule.severity,
                        title: rule.title,
                        description: `Found "${match?.[0]}" in your description: "${getMatchContext(description, match)}". ${rule.description}`,
                        guideline_ref: rule.guideline_ref,
                        fix_suggestion: rule.fix_suggestion,
                        confidence: 100,
                    });
                }
            }
        }
    }

    // === AI disclosure check ===
    const allText = `${name} ${subtitle} ${description}`.toLowerCase();
    if (AI_MENTION_PATTERN.test(allText)) {
        // App mentions AI — check if data collection is disclosed
        const dc = input.data_collection;
        const hasAnyDataDisclosure = dc && Object.values(dc).some(v => v === true);

        if (!hasAnyDataDisclosure) {
            const rule = DESCRIPTION_RULES.find(r => r.id === 'desc_ai_no_disclosure');
            if (rule) {
                checks.push({
                    category: rule.category,
                    severity: rule.severity,
                    title: rule.title,
                    description: rule.description,
                    guideline_ref: rule.guideline_ref,
                    fix_suggestion: rule.fix_suggestion,
                    confidence: 100,
                });
            }
        }
    }

    // === Pass results for rules that didn't trigger ===
    for (const rule of DESCRIPTION_RULES) {
        if (!triggered.has(rule.id) && rule.id !== 'desc_ai_no_disclosure') {
            checks.push({
                category: rule.category,
                severity: 'pass',
                title: rule.title,
                description: `No issues found.`,
                guideline_ref: rule.guideline_ref,
                confidence: 100,
            });
        }
    }

    return checks;
}
