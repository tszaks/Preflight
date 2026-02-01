/**
 * Export compliance detection.
 *
 * Checks for encryption usage that triggers export compliance requirements
 * during App Store submission. Detects:
 *   - Encryption frameworks (Security, CommonCrypto, OpenSSL, CryptoKit)
 *   - Encryption symbols from Mach-O imports
 *   - ITSAppUsesEncryption key in Info.plist
 */

import type { CheckResult } from '../types';

/** Encryption frameworks and their exemption status */
const ENCRYPTION_FRAMEWORKS: Record<string, { label: string; usuallyExempt: boolean }> = {
    'Security': { label: 'Apple Security framework', usuallyExempt: true },
    'CommonCrypto': { label: 'Apple CommonCrypto', usuallyExempt: false },
    'OpenSSL': { label: 'OpenSSL', usuallyExempt: false },
    'libssl': { label: 'OpenSSL (libssl)', usuallyExempt: false },
    'libcrypto': { label: 'OpenSSL (libcrypto)', usuallyExempt: false },
    'CryptoKit': { label: 'Apple CryptoKit', usuallyExempt: true },
};

/** OpenSSL-specific symbol prefixes (non-exempt encryption) */
const OPENSSL_SYMBOL_PREFIXES = ['SSL_', 'EVP_', 'AES_', 'RSA_', 'DES_'];

/** Symbol prefixes that indicate encryption usage (matched with or without leading underscore) */
const ENCRYPTION_SYMBOL_PREFIXES = [
    // CommonCrypto functions
    'CC_SHA',
    'CC_MD5',
    'CCCrypt',
    'CCKeyDerivationPBKDF',
    // OpenSSL functions
    ...OPENSSL_SYMBOL_PREFIXES,
    // Security framework
    'SecKey',
    'SecCertificate',
    'SecTrust',
];

/** Strip leading underscore from a Mach-O symbol name for matching. */
function normalizeSymbol(sym: string): string {
    return sym.startsWith('_') ? sym.slice(1) : sym;
}

/**
 * Check for export compliance concerns based on frameworks, symbols, and Info.plist.
 */
export function checkExportCompliance(
    frameworks: string[],
    importedSymbols: string[],
    plistContent: string | undefined,
): CheckResult[] {
    const results: CheckResult[] = [];

    // 1. Detect encryption frameworks
    const detectedFrameworks = frameworks.filter(fw => ENCRYPTION_FRAMEWORKS[fw]);

    // 2. Detect encryption symbols from Mach-O imports
    const detectedSymbols = importedSymbols.filter(sym =>
        ENCRYPTION_SYMBOL_PREFIXES.some(prefix => normalizeSymbol(sym).startsWith(prefix))
    );

    const hasEncryption = detectedFrameworks.length > 0 || detectedSymbols.length > 0;

    // Determine if all detected encryption is likely exempt (Apple-standard only)
    const hasNonExemptFramework = detectedFrameworks.some(fw => !ENCRYPTION_FRAMEWORKS[fw]?.usuallyExempt);
    const hasOpenSSLSymbols = detectedSymbols.some(sym =>
        OPENSSL_SYMBOL_PREFIXES.some(prefix => normalizeSymbol(sym).startsWith(prefix))
    );

    // 3. Check Info.plist for ITSAppUsesEncryption
    const plistHasKey = plistContent?.includes('ITSAppUsesEncryption') ?? false;
    let encryptionDeclaredTrue = false;
    let encryptionDeclaredFalse = false;

    if (plistHasKey && plistContent) {
        // Simple XML parsing: look for the key followed by <true/> or <false/>
        const keyIndex = plistContent.indexOf('ITSAppUsesEncryption');
        if (keyIndex !== -1) {
            const afterKey = plistContent.slice(keyIndex + 'ITSAppUsesEncryption'.length, keyIndex + 200);
            if (afterKey.includes('<true/>') || afterKey.includes('<true />')) {
                encryptionDeclaredTrue = true;
            } else if (afterKey.includes('<false/>') || afterKey.includes('<false />')) {
                encryptionDeclaredFalse = true;
            }
        }
    }

    // 3b. Handle unparseable key value
    if (plistHasKey && !encryptionDeclaredTrue && !encryptionDeclaredFalse) {
        results.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'ITSAppUsesEncryption key found but value could not be determined',
            description:
                'The Info.plist contains ITSAppUsesEncryption but the boolean value could not be parsed. ' +
                'Verify the key is correctly set to YES or NO in your Info.plist.',
            guideline_ref: 'export_compliance',
            confidence: 60,
        });
    }

    // 4. Generate findings based on state

    // Case: Key missing + encryption detected
    if (!plistHasKey && hasEncryption) {
        const summary = formatEncryptionSummary(detectedFrameworks, detectedSymbols.length);

        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Missing ITSAppUsesEncryption key in Info.plist',
            description:
                `Encryption usage detected but ITSAppUsesEncryption is not declared in Info.plist. ` +
                `You will be asked about encryption during App Store submission. ${summary}`,
            guideline_ref: 'export_compliance',
            fix_suggestion:
                'Add the ITSAppUsesEncryption key to your Info.plist. ' +
                buildExemptionGuidance(hasNonExemptFramework, hasOpenSSLSymbols),
            confidence: 80,
        });
    }

    // Case: Key = true
    if (encryptionDeclaredTrue) {
        results.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'App declares encryption usage (ITSAppUsesEncryption = YES)',
            description:
                'Your app declares that it uses encryption. Ensure you have proper export compliance documentation. ' +
                'This may include an ECCN classification, an exemption (e.g., TSU exception for mass-market apps), ' +
                'or a BIS self-classification report.',
            guideline_ref: 'export_compliance',
            fix_suggestion:
                'Verify your export compliance documentation is up to date. ' +
                buildExemptionGuidance(hasNonExemptFramework, hasOpenSSLSymbols),
            confidence: 85,
        });
    }

    // Case: Key = false + encryption detected
    if (encryptionDeclaredFalse && hasEncryption) {
        const summary = formatEncryptionSummary(detectedFrameworks, detectedSymbols.length);

        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Encryption detected despite ITSAppUsesEncryption = NO',
            description:
                `Your Info.plist declares no encryption usage, but encryption frameworks or symbols were detected in the binary. ${summary} ` +
                `This mismatch may cause issues during App Store review.`,
            guideline_ref: 'export_compliance',
            fix_suggestion:
                'Review your encryption declaration. If your app only uses HTTPS (via URLSession/ATS), ' +
                'setting ITSAppUsesEncryption to NO is correct. If you use encryption beyond HTTPS, ' +
                'set it to YES and file the appropriate compliance documentation.',
            confidence: 70,
        });
    }

    // Case: Key = false + no encryption → pass (no result needed)

    return results;
}

/**
 * Format a summary of detected encryption frameworks and symbols.
 */
function formatEncryptionSummary(frameworks: string[], symbolCount: number): string {
    const parts: string[] = [];
    if (frameworks.length > 0) {
        parts.push(`Encryption frameworks detected: ${frameworks.join(', ')}.`);
    }
    if (symbolCount > 0) {
        parts.push(`${symbolCount} encryption-related symbol${symbolCount > 1 ? 's' : ''} found in binary.`);
    }
    return parts.join(' ');
}

/**
 * Build exemption guidance text based on detected encryption type.
 */
function buildExemptionGuidance(hasNonExempt: boolean, hasOpenSSL: boolean): string {
    if (hasOpenSSL || hasNonExempt) {
        return 'Your app uses non-standard encryption (OpenSSL or custom crypto). ' +
            'This likely requires ECCN documentation or a BIS self-classification. ' +
            'Consult your legal team or Apple\'s export compliance documentation.';
    }
    return 'If your app only uses HTTPS (URLSession/ATS) or standard Apple frameworks ' +
        '(Security, CryptoKit), you likely qualify for the TSU exception. ' +
        'Set ITSAppUsesEncryption to NO if only using HTTPS-based encryption.';
}
