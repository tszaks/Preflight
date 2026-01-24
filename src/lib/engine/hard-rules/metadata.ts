import type { CheckResult, HardRulesInput } from '../types';
import { METADATA_LIMITS, PLACEHOLDER_PATTERNS, APP_CATEGORIES } from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';

export function checkMetadata(input: HardRulesInput): CheckResult[] {
    const results: CheckResult[] = [];

    // App name checks
    results.push(...checkAppName(input.app_name));

    // Subtitle checks
    if (input.subtitle) {
        results.push(...checkSubtitle(input.subtitle, input.app_name));
    }

    // Description checks
    if (input.description) {
        results.push(...checkDescription(input.description));
    } else {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Missing app description',
            description: 'An app description is required for App Store submission.',
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Add a description between 100-4000 characters that accurately describes your app\'s features.',
        });
    }

    // Keywords checks
    if (input.keywords) {
        results.push(...checkKeywords(input.keywords));
    }

    // Category check
    if (input.category && !APP_CATEGORIES.includes(input.category as any)) {
        results.push({
            category: 'metadata',
            severity: 'warning',
            title: 'Unrecognized app category',
            description: `"${input.category}" is not a standard App Store category.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: `Use one of the standard categories: ${APP_CATEGORIES.slice(0, 5).join(', ')}...`,
        });
    }

    // If all checks passed, add a pass result
    if (results.length === 0) {
        results.push({
            category: 'metadata',
            severity: 'pass',
            title: 'Metadata checks passed',
            description: 'App name, subtitle, description, and keywords meet App Store requirements.',
        });
    }

    return results;
}

function checkAppName(name: string): CheckResult[] {
    const results: CheckResult[] = [];

    if (name.length > METADATA_LIMITS.app_name.max) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'App name too long',
            description: `App name is ${name.length} characters. Maximum is ${METADATA_LIMITS.app_name.max}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: `Shorten your app name to ${METADATA_LIMITS.app_name.max} characters or fewer.`,
        });
    }

    if (name.length < METADATA_LIMITS.app_name.min) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'App name too short',
            description: `App name is ${name.length} characters. Minimum is ${METADATA_LIMITS.app_name.min}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Provide a meaningful app name with at least 2 characters.',
        });
    }

    // Check for pricing references
    if (/\b(free|paid|\$\d|sale|discount|off)\b/i.test(name)) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Pricing reference in app name',
            description: 'App name contains pricing information which is not allowed.',
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Remove all pricing references (Free, $X, Sale, etc.) from the app name.',
        });
    }

    // Check for platform references
    if (/\b(ios|iphone|ipad|apple|android|mac)\b/i.test(name)) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Platform reference in app name',
            description: 'App name references a platform (iOS, iPhone, etc.) which Apple rejects.',
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Remove platform names from your app title. Apple already shows supported platforms.',
        });
    }

    // Check for placeholder content
    for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(name)) {
            results.push({
                category: 'metadata',
                severity: 'critical',
                title: 'Placeholder content in app name',
                description: `App name appears to contain placeholder text: "${name}".`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Replace placeholder text with your final app name.',
            });
            break;
        }
    }

    return results;
}

function checkSubtitle(subtitle: string, appName: string): CheckResult[] {
    const results: CheckResult[] = [];

    if (subtitle.length > METADATA_LIMITS.subtitle.max) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Subtitle too long',
            description: `Subtitle is ${subtitle.length} characters. Maximum is ${METADATA_LIMITS.subtitle.max}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: `Shorten your subtitle to ${METADATA_LIMITS.subtitle.max} characters or fewer.`,
        });
    }

    // Check if subtitle duplicates app name
    if (subtitle.toLowerCase().trim() === appName.toLowerCase().trim()) {
        results.push({
            category: 'metadata',
            severity: 'warning',
            title: 'Subtitle duplicates app name',
            description: 'Your subtitle is identical to your app name, wasting valuable metadata space.',
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Use the subtitle to add context about what your app does, not repeat the name.',
        });
    }

    // Check for pricing in subtitle
    if (/\b(free|paid|\$\d|sale|discount)\b/i.test(subtitle)) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Pricing reference in subtitle',
            description: 'Subtitle contains pricing information which is not allowed.',
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Remove pricing references from your subtitle.',
        });
    }

    return results;
}

function checkDescription(description: string): CheckResult[] {
    const results: CheckResult[] = [];

    if (description.length > METADATA_LIMITS.description.max) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Description too long',
            description: `Description is ${description.length} characters. Maximum is ${METADATA_LIMITS.description.max}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: `Trim your description to ${METADATA_LIMITS.description.max} characters.`,
        });
    }

    if (description.length < METADATA_LIMITS.description.min) {
        results.push({
            category: 'metadata',
            severity: 'warning',
            title: 'Description too short',
            description: `Description is only ${description.length} characters. Minimum recommended is ${METADATA_LIMITS.description.min}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Expand your description to better explain your app\'s features and value proposition.',
        });
    }

    // Check for placeholder content
    for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(description)) {
            results.push({
                category: 'metadata',
                severity: 'critical',
                title: 'Placeholder content in description',
                description: 'Description appears to contain placeholder or test text.',
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Replace all placeholder text with final marketing copy.',
            });
            break;
        }
    }

    return results;
}

function checkKeywords(keywords: string): CheckResult[] {
    const results: CheckResult[] = [];

    if (keywords.length > METADATA_LIMITS.keywords.max) {
        results.push({
            category: 'metadata',
            severity: 'critical',
            title: 'Keywords too long',
            description: `Keywords field is ${keywords.length} characters. Maximum is ${METADATA_LIMITS.keywords.max}.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: `Trim keywords to ${METADATA_LIMITS.keywords.max} characters. Remove less relevant terms.`,
        });
    }

    // Check for duplicates
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const kw of keywordList) {
        if (seen.has(kw)) {
            duplicates.push(kw);
        }
        seen.add(kw);
    }

    if (duplicates.length > 0) {
        results.push({
            category: 'metadata',
            severity: 'warning',
            title: 'Duplicate keywords',
            description: `Found duplicate keywords: ${duplicates.join(', ')}. Duplicates waste character space.`,
            guideline_ref: getGuidelineRef('2.3'),
            fix_suggestion: 'Remove duplicate keywords and use the space for additional relevant terms.',
        });
    }

    // Check if keywords contain the app name (waste of space)
    // This is an info-level suggestion, not a rejection risk

    return results;
}
