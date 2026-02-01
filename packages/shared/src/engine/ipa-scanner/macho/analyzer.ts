/**
 * Mach-O analysis logic.
 *
 * Takes the parsed Mach-O data and produces CheckResult[] findings
 * for the Preflight report. Checks for:
 *   - Private API symbol usage (critical)
 *   - Private framework linkage (critical)
 *   - Deprecated framework usage (warning)
 *   - Encryption status (info)
 *   - Old deployment targets (info)
 *   - Missing arm64 architecture (critical)
 */

import type { CheckResult } from '../../types';
import type { MachOParseResult } from './parser';
import { PRIVATE_API_BLOCKLIST, PRIVATE_FRAMEWORKS, type PrivateAPIEntry } from './private-api-blocklist';

export interface MachOAnalysisResult {
    checks: CheckResult[];
    metadata: {
        arch: string;
        minOS?: string;
        sdk?: string;
        linkedFrameworkCount: number;
        importedSymbolCount: number;
        importedSymbols: string[];
        encrypted: boolean;
    };
}

/**
 * Analyze a parsed Mach-O binary for App Store compliance issues.
 */
export function analyzeMachOBinary(parseResult: MachOParseResult): MachOAnalysisResult {
    const checks: CheckResult[] = [];

    // 1. Check for private API symbol usage
    const privateAPIHits = findPrivateAPIUsage(parseResult.importedSymbols);
    for (const hit of privateAPIHits) {
        checks.push({
            category: 'ipa_binary',
            severity: hit.entry.severity === 'critical' ? 'critical' : 'warning',
            title: `Private API detected: ${hit.entry.symbol}`,
            description:
                `The binary imports "${hit.matchedSymbol}" from ${hit.entry.framework}. ` +
                `${hit.entry.description}. Apple's automated scanner (App Review) ` +
                `will detect this and reject the submission.`,
            guideline_ref: hit.entry.guideline_ref,
            fix_suggestion:
                `Remove usage of ${hit.entry.symbol}. Use the public API equivalent if available. ` +
                `If this symbol comes from a third-party SDK, update to the latest version or contact the vendor.`,
            confidence: hit.entry.severity === 'critical' ? 95 : 85,
        });
    }

    // 2. Check for private framework linkage
    const privateFrameworkHits = findPrivateFrameworks(parseResult.linkedFrameworks);
    for (const fw of privateFrameworkHits) {
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: `Private framework linked: ${fw}`,
            description:
                `The binary links against "${fw}", which is a private Apple framework. ` +
                `Apps must only use public APIs from documented frameworks. ` +
                `This will be automatically detected and rejected by App Review.`,
            guideline_ref: '2.5.1',
            fix_suggestion:
                `Remove the dependency on ${fw}. If it comes from a third-party SDK, ` +
                `update to a version that does not use private frameworks, or find an alternative SDK.`,
            confidence: 90,
        });
    }

    // 3. Check for deprecated UIWebView framework
    if (parseResult.linkedFrameworks.some(fw => fw === 'UIWebView')) {
        checks.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Deprecated UIWebView framework linked',
            description:
                'The binary still links against UIWebView, which has been deprecated since iOS 12. ' +
                'Apple rejects new submissions and updates that reference UIWebView.',
            guideline_ref: 'ITMS-90809',
            fix_suggestion:
                'Migrate from UIWebView to WKWebView. If this comes from a third-party SDK, ' +
                'update to the latest version that uses WKWebView.',
            confidence: 85,
        });
    }

    // 4. Check architecture
    if (parseResult.arch !== 'arm64') {
        checks.push({
            category: 'ipa_binary',
            severity: 'critical',
            title: 'Missing arm64 architecture',
            description:
                `The binary's primary architecture is "${parseResult.arch}" instead of arm64. ` +
                `All iOS apps submitted to the App Store must include arm64 support. ` +
                `Since the Apple A7 chip (iPhone 5s, 2013), arm64 has been required.`,
            guideline_ref: 'ITMS-90086',
            fix_suggestion:
                'Build with arm64 architecture. In Xcode: Build Settings > Architectures > Standard Architectures (arm64). ' +
                'Remove any "Excluded Architectures" entries for arm64.',
            confidence: 100,
        });
    }

    // 5. Check deployment target
    if (parseResult.buildVersion?.minOS) {
        const minOS = parseFloat(parseResult.buildVersion.minOS);
        if (minOS < 15.0) {
            checks.push({
                category: 'ipa_binary',
                severity: 'info',
                title: `Low minimum deployment target: iOS ${parseResult.buildVersion.minOS}`,
                description:
                    `The binary's minimum deployment target is iOS ${parseResult.buildVersion.minOS}. ` +
                    `While not a rejection reason, apps targeting very old iOS versions may encounter ` +
                    `additional review scrutiny. As of 2026, most apps target iOS 16.0 or higher.`,
                guideline_ref: 'Build Settings',
                fix_suggestion:
                    'Consider raising the minimum deployment target to iOS 16.0 or higher ' +
                    'to take advantage of modern APIs and reduce compatibility testing burden.',
                confidence: 80,
            });
        }
    }

    // 6. Report encryption status (info only)
    if (parseResult.encrypted) {
        checks.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'Binary is encrypted (DRM)',
            description:
                'The binary has FairPlay encryption (App Store DRM). Symbol analysis was limited ' +
                'because encrypted sections cannot be read. This is normal for apps downloaded ' +
                'from the App Store but unusual for development/ad-hoc builds.',
            confidence: 100,
        });
    }

    return {
        checks,
        metadata: {
            arch: parseResult.arch,
            minOS: parseResult.buildVersion?.minOS,
            sdk: parseResult.buildVersion?.sdk,
            linkedFrameworkCount: parseResult.linkedFrameworks.length,
            importedSymbolCount: parseResult.importedSymbols.length,
            importedSymbols: parseResult.importedSymbols,
            encrypted: parseResult.encrypted,
        },
    };
}

interface PrivateAPIHit {
    entry: PrivateAPIEntry;
    matchedSymbol: string;
}

/**
 * Scan imported symbols against the private API blocklist.
 * Matches with and without leading underscore.
 */
function findPrivateAPIUsage(symbols: string[]): PrivateAPIHit[] {
    const hits: PrivateAPIHit[] = [];

    // Build a Set of normalized symbol names for fast lookup
    const symbolSet = new Set<string>();
    for (const sym of symbols) {
        symbolSet.add(sym);
        // Strip leading underscore for matching
        if (sym.startsWith('_')) {
            symbolSet.add(sym.slice(1));
        }
    }

    for (const entry of PRIVATE_API_BLOCKLIST) {
        // Check both forms
        const withUnderscore = `_${entry.symbol}`;

        if (symbolSet.has(entry.symbol)) {
            hits.push({ entry, matchedSymbol: entry.symbol });
        } else if (symbolSet.has(withUnderscore)) {
            hits.push({ entry, matchedSymbol: withUnderscore });
        }
    }

    return hits;
}

/**
 * Check linked frameworks against known private frameworks list.
 */
function findPrivateFrameworks(linkedFrameworks: string[]): string[] {
    const privateSet = new Set(PRIVATE_FRAMEWORKS.map(f => f.toLowerCase()));
    return linkedFrameworks.filter(fw => privateSet.has(fw.toLowerCase()));
}
