import type { CheckResult, DataCollectionDeclaration } from '../types';
import {
    PRIVACY_POLICY_RULES,
    PRIVACY_POLICY_KEYWORDS,
    MANIFEST_POLICY_CROSS_REF,
} from './rules';

/**
 * Privacy policy keyword matching.
 *
 * Fetches the privacy policy text (already done upstream) and checks for
 * required keyword sections. Also cross-references the privacy manifest
 * data declarations against the policy text.
 *
 * All checks are deterministic: keyword present = pass, absent = warning.
 */
export function checkPrivacyPolicy(
    policyText: string | undefined,
    dataCollection: DataCollectionDeclaration | undefined,
): CheckResult[] {
    const checks: CheckResult[] = [];

    if (!policyText) {
        // No privacy policy text available — can't run these checks
        checks.push({
            category: 'content_policy',
            severity: 'info',
            title: 'Privacy policy not available for analysis',
            description: 'Could not fetch privacy policy text. Keyword analysis was skipped.',
            guideline_ref: '5.1.1 — Data Collection and Storage',
            fix_suggestion: 'Ensure your privacy policy URL is reachable and returns readable HTML.',
            confidence: 100,
        });
        return checks;
    }

    const lowerPolicy = policyText.toLowerCase();

    // === Check required sections via keywords ===
    const sectionRuleMap: Record<string, string> = {
        data_collection: 'privacy_data_collection',
        data_retention: 'privacy_data_retention',
        data_deletion: 'privacy_data_deletion',
        contact_info: 'privacy_contact_info',
        children: 'privacy_children',
        data_sharing: 'privacy_data_sharing',
        user_rights: 'privacy_user_rights',
        international_transfers: 'privacy_international_transfers',
    };

    for (const [section, ruleId] of Object.entries(sectionRuleMap)) {
        const keywords = PRIVACY_POLICY_KEYWORDS[section];
        if (!keywords) continue;

        const found = keywords.some(kw => lowerPolicy.includes(kw.toLowerCase()));
        const rule = PRIVACY_POLICY_RULES.find(r => r.id === ruleId);
        if (!rule) continue;

        if (found) {
            checks.push({
                category: rule.category,
                severity: 'pass',
                title: rule.title,
                description: `Privacy policy contains ${section.replace(/_/g, ' ')} section.`,
                guideline_ref: rule.guideline_ref,
                confidence: 100,
            });
        } else {
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

    // === Policy length check ===
    const wordCount = policyText.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 200) {
        checks.push({
            category: 'content_policy',
            severity: 'warning',
            title: 'Privacy policy appears unusually short',
            description: `The privacy policy contains only ${wordCount} words, which may not adequately cover required disclosures.`,
            guideline_ref: '5.1.1 — Data Collection and Storage',
            fix_suggestion: 'A comprehensive privacy policy typically covers data collection, usage, sharing, retention, deletion rights, and contact information.',
            confidence: 75,
        });
    }

    // === Last-updated date detection ===
    const datePattern = /(?:last\s+(?:updated|modified|revised)|effective\s+date|updated?\s*:?\s*(?:on)?)\s*:?\s*(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i;
    const dateMatch = policyText.match(datePattern);
    if (!dateMatch) {
        checks.push({
            category: 'content_policy',
            severity: 'info',
            title: 'No last-updated date detected in privacy policy',
            description: 'No last-updated date detected in privacy policy. Apple recommends keeping policies current.',
            guideline_ref: '5.1.1 — Data Collection and Storage',
            fix_suggestion: 'Add a visible "Last Updated" or "Effective Date" to your privacy policy.',
            confidence: 60,
        });
    } else {
        const dateStr = dateMatch[1];
        try {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                if (parsedDate < oneYearAgo) {
                    checks.push({
                        category: 'content_policy',
                        severity: 'info',
                        title: 'Privacy policy last-updated date appears outdated',
                        description: `Privacy policy last-updated date appears to be over a year old (${dateStr}). Consider updating.`,
                        guideline_ref: '5.1.1 — Data Collection and Storage',
                        fix_suggestion: 'Review and update your privacy policy regularly, especially after adding new features or data practices.',
                        confidence: 60,
                    });
                }
            }
        } catch (dateParseError) {
            console.warn('[PrivacyPolicy] Could not parse last-updated date:', dateStr, dateParseError);
        }
    }

    // === Cross-reference manifest declarations vs policy text ===
    if (dataCollection) {
        const missingInPolicy: string[] = [];

        for (const [field, keywords] of Object.entries(MANIFEST_POLICY_CROSS_REF)) {
            const declared = dataCollection[field as keyof DataCollectionDeclaration];
            if (declared !== true) continue;

            const mentioned = keywords.some(kw => lowerPolicy.includes(kw.toLowerCase()));
            if (!mentioned) {
                missingInPolicy.push(field);
            }
        }

        if (missingInPolicy.length > 0) {
            const rule = PRIVACY_POLICY_RULES.find(r => r.id === 'privacy_manifest_cross_ref');
            if (rule) {
                const fieldNames = missingInPolicy
                    .map(f => f.replace(/([A-Z])/g, ' $1').toLowerCase().trim())
                    .join(', ');
                checks.push({
                    category: rule.category,
                    severity: rule.severity,
                    title: rule.title,
                    description: `Your submission indicates your app collects: ${fieldNames}. These data types are not clearly mentioned in your privacy policy. Your privacy policy should disclose all data your app collects.`,
                    guideline_ref: rule.guideline_ref,
                    fix_suggestion: rule.fix_suggestion,
                    confidence: 100,
                });
            }
        } else if (Object.values(dataCollection).some(v => v === true)) {
            checks.push({
                category: 'content_policy',
                severity: 'pass',
                title: 'Privacy manifest matches policy',
                description: 'All declared data types are mentioned in the privacy policy.',
                guideline_ref: '5.1.1 — Data Collection and Storage',
                confidence: 100,
            });
        }
    }

    return checks;
}
