import type { CheckResult } from '../types';
import { parsePlist } from '../utils/parse-plist';
import { URL_REQUIREMENTS } from '../knowledge-base/requirements';
import { getGuidelineRef } from '../knowledge-base/guidelines';

interface AssociatedDomainEntry {
    domain: string;
    types: Set<'applinks' | 'webcredentials' | 'appclips'>;
}

function parseAssociatedDomains(entitlementsXml: string): AssociatedDomainEntry[] {
    const parsed = parsePlist(entitlementsXml);
    if (!parsed) return [];

    const raw = (parsed as Record<string, unknown>)['com.apple.developer.associated-domains'];
    if (!Array.isArray(raw)) return [];

    const domainMap = new Map<string, AssociatedDomainEntry>();

    for (const entry of raw) {
        if (typeof entry !== 'string') continue;
        const [prefix, rest] = entry.split(':', 2);
        if (!rest) continue;

        const type = prefix as 'applinks' | 'webcredentials' | 'appclips';
        if (!['applinks', 'webcredentials', 'appclips'].includes(type)) continue;

        const domain = rest.split('/')[0]?.split('?')[0]?.trim();
        if (!domain) continue;

        const existing = domainMap.get(domain);
        if (existing) {
            existing.types.add(type);
        } else {
            domainMap.set(domain, { domain, types: new Set([type]) });
        }
    }

    return Array.from(domainMap.values());
}

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), URL_REQUIREMENTS.timeout_ms);
    try {
        return await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'Accept': 'application/json, application/pkcs7-mime',
            },
        });
    } finally {
        clearTimeout(timeout);
    }
}

export async function checkAssociatedDomains(entitlementsXml: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    const entries = parseAssociatedDomains(entitlementsXml);
    if (entries.length === 0) return results;

    for (const entry of entries) {
        const aasaUrl = `https://${entry.domain}/.well-known/apple-app-site-association`;

        try {
            const response = await fetchWithTimeout(aasaUrl);
            if (!response.ok) {
                results.push({
                    category: 'urls',
                    severity: 'warning',
                    title: 'Associated domains AASA file not reachable',
                    description:
                        `Associated domain "${entry.domain}" returned HTTP ${response.status} for the AASA file. ` +
                        'Universal Links and credential sharing may fail during review.',
                    guideline_ref: getGuidelineRef('2.1'),
                    fix_suggestion:
                        `Serve a valid Apple App Site Association file at ${aasaUrl} and ensure it is publicly reachable.`,
                    confidence: 80,
                });
                continue;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const json = await response.json().catch(() => null);
                if (!json || typeof json !== 'object') {
                    results.push({
                        category: 'urls',
                        severity: 'warning',
                        title: 'AASA file is not valid JSON',
                        description:
                            `The AASA file for "${entry.domain}" is not valid JSON. Apple requires a valid JSON or PKCS7 file.`,
                        guideline_ref: getGuidelineRef('2.1'),
                        fix_suggestion:
                            'Fix the AASA file to return valid JSON with applinks/webcredentials sections as needed.',
                        confidence: 80,
                    });
                    continue;
                }

                const needsApplinks = entry.types.has('applinks');
                const needsWebCreds = entry.types.has('webcredentials');

                if (needsApplinks && !('applinks' in (json as Record<string, unknown>))) {
                    results.push({
                        category: 'urls',
                        severity: 'warning',
                        title: 'AASA file missing applinks section',
                        description:
                            `Associated domain "${entry.domain}" declares applinks but the AASA file has no "applinks" section.`,
                        guideline_ref: getGuidelineRef('2.1'),
                        fix_suggestion:
                            'Add an "applinks" section to the AASA file for Universal Links.',
                        confidence: 80,
                    });
                }

                if (needsWebCreds && !('webcredentials' in (json as Record<string, unknown>))) {
                    results.push({
                        category: 'urls',
                        severity: 'warning',
                        title: 'AASA file missing webcredentials section',
                        description:
                            `Associated domain "${entry.domain}" declares webcredentials but the AASA file has no "webcredentials" section.`,
                        guideline_ref: getGuidelineRef('2.1'),
                        fix_suggestion:
                            'Add a "webcredentials" section to the AASA file for Shared Web Credentials.',
                        confidence: 80,
                    });
                }
            } else if (!contentType.includes('application/pkcs7-mime')) {
                results.push({
                    category: 'urls',
                    severity: 'warning',
                    title: 'AASA file has unexpected content type',
                    description:
                        `AASA for "${entry.domain}" returned Content-Type "${contentType}". Apple expects application/json or application/pkcs7-mime.`,
                    guideline_ref: getGuidelineRef('2.1'),
                    fix_suggestion:
                        'Serve the AASA file with Content-Type application/json (or PKCS7).',
                    confidence: 70,
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            results.push({
                category: 'urls',
                severity: 'warning',
                title: 'Associated domains AASA check failed',
                description:
                    `Failed to fetch AASA for "${entry.domain}": ${message}`,
                guideline_ref: getGuidelineRef('2.1'),
                fix_suggestion:
                    `Ensure ${aasaUrl} is reachable and responds within ${URL_REQUIREMENTS.timeout_ms / 1000}s.`,
                confidence: 70,
            });
        }
    }

    return results;
}
