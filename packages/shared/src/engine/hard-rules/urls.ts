import type { CheckResult, HardRulesInput } from '../types';
import { URL_REQUIREMENTS, PLACEHOLDER_PATTERNS } from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';

/**
 * Validates URLs (privacy policy, support, marketing).
 * Checks: HTTPS, reachability, placeholder detection.
 */
export async function checkUrls(input: HardRulesInput): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const urlsToCheck: Array<{ url: string; label: string; required: boolean }> = [];

    if (input.privacy_url) {
        urlsToCheck.push({ url: input.privacy_url, label: 'Privacy Policy', required: true });
    } else {
        results.push({
            category: 'urls',
            severity: 'critical',
            title: 'Missing privacy policy URL',
            description: 'A privacy policy URL is required for all App Store submissions.',
            guideline_ref: getGuidelineRef('5.1.1'),
            fix_suggestion: 'Add a privacy policy URL that describes how your app handles user data.',
            confidence: 100,
        });
    }

    if (input.support_url) {
        urlsToCheck.push({ url: input.support_url, label: 'Support', required: false });
    }

    if (input.marketing_url) {
        urlsToCheck.push({ url: input.marketing_url, label: 'Marketing', required: false });
    }

    // Check each URL
    for (const { url, label, required } of urlsToCheck) {
        results.push(...validateUrl(url, label, required));
    }

    // Reachability checks (async)
    const reachabilityResults = await Promise.all(
        urlsToCheck
            .filter(({ url }) => isValidHttpsUrl(url))
            .map(({ url, label }) => checkReachability(url, label))
    );

    results.push(...reachabilityResults.flat());

    // Domain consistency checks for privacy policy
    results.push(...checkPrivacyDomainConsistency(input));

    // If no issues
    if (results.length === 0 && urlsToCheck.length > 0) {
        results.push({
            category: 'urls',
            severity: 'pass',
            title: 'URL checks passed',
            description: 'All provided URLs are valid HTTPS and properly formatted.',
            confidence: 100,
        });
    }

    return results;
}

function validateUrl(url: string, label: string, _required: boolean): CheckResult[] {
    const results: CheckResult[] = [];

    // Check HTTPS
    if (!url.startsWith('https://')) {
        if (url.startsWith('http://')) {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL is not HTTPS`,
                description: `"${url}" uses HTTP. Apple requires HTTPS for all URLs.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Update to use HTTPS. Ensure your server has a valid SSL certificate.',
                confidence: 100,
            });
        } else {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL is not a valid URL`,
                description: `"${url}" is not a properly formatted URL.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Provide a full URL starting with https://',
                confidence: 100,
            });
        }
    }

    // Check for placeholder URLs
    for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(url)) {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL appears to be a placeholder`,
                description: `"${url}" matches a known placeholder pattern.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Replace with a real, live URL hosting actual content.',
                confidence: 100,
            });
            break;
        }
    }

    return results;
}

function isValidHttpsUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

async function checkReachability(url: string, label: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), URL_REQUIREMENTS.timeout_ms);

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL returns error`,
                description: `"${url}" returned HTTP ${response.status}. Apple requires all URLs to be accessible.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: `Fix the URL to return HTTP 200. Current status: ${response.status} ${response.statusText}.`,
                confidence: 100,
            });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (message.includes('abort')) {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL timed out`,
                description: `"${url}" did not respond within ${URL_REQUIREMENTS.timeout_ms / 1000} seconds.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Ensure the URL is accessible and responds quickly. Check server availability.',
                confidence: 100,
            });
        } else {
            results.push({
                category: 'urls',
                severity: 'critical',
                title: `${label} URL unreachable`,
                description: `"${url}" could not be reached: ${message}`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'Verify the URL is correct and the server is running with valid DNS/SSL.',
                confidence: 100,
            });
        }
    }

    return results;
}

function normalizeHost(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
        return null;
    }
}

function isSameOrSubdomain(a: string, b: string): boolean {
    if (a === b) return true;
    return a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function isGenericPolicyHost(host: string): boolean {
    const genericHosts = [
        'github.io',
        'vercel.app',
        'netlify.app',
        'notion.site',
        'notion.so',
        'medium.com',
        'sites.google.com',
        'appspot.com',
        'firebaseapp.com',
        'pages.dev',
        'webflow.io',
        'wixsite.com',
        'squarespace.com',
        'substack.com',
    ];
    return genericHosts.some(h => host === h || host.endsWith(`.${h}`));
}

function checkPrivacyDomainConsistency(input: HardRulesInput): CheckResult[] {
    const results: CheckResult[] = [];
    if (!input.privacy_url) return results;

    const privacyHost = normalizeHost(input.privacy_url);
    if (!privacyHost) return results;

    const supportHost = input.support_url ? normalizeHost(input.support_url) : null;
    const marketingHost = input.marketing_url ? normalizeHost(input.marketing_url) : null;

    const referenceHosts = [supportHost, marketingHost].filter(Boolean) as string[];

    if (referenceHosts.length > 0) {
        const matchesAny = referenceHosts.some(h => isSameOrSubdomain(privacyHost, h));
        if (!matchesAny) {
            results.push({
                category: 'urls',
                severity: 'info',
                title: 'Privacy policy domain differs from support/marketing site',
                description:
                    `Privacy policy is hosted on "${privacyHost}", which does not match your support/marketing domains ` +
                    `(${referenceHosts.join(', ')}). This can be legitimate, but Apple may scrutinize mismatched domains.`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion: 'If possible, host the privacy policy on the same domain as your app or company website.',
                confidence: 70,
            });
        }
    }

    if (isGenericPolicyHost(privacyHost)) {
        results.push({
            category: 'urls',
            severity: 'warning',
            title: 'Privacy policy hosted on a generic platform',
            description:
                `Privacy policy is hosted on "${privacyHost}", a generic hosting platform. ` +
                'Apple sometimes flags policies that appear templated or not tied to the app developer.',
            guideline_ref: getGuidelineRef('2.1'),
            fix_suggestion: 'Consider hosting the privacy policy on your primary domain or a branded subdomain.',
            confidence: 70,
        });
    }

    return results;
}
