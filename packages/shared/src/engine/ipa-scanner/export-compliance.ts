/**
 * Export compliance detection.
 *
 * Checks for encryption usage that triggers export compliance requirements
 * during App Store submission. Detects:
 *   - Encryption frameworks (Security, CommonCrypto, OpenSSL, CryptoKit)
 *   - Encryption symbols from Mach-O imports
 *   - Export compliance key in Info.plist (ITSAppUsesEncryption or ITSAppUsesNonExemptEncryption)
 */

import type { CheckResult } from '../types';
import { parseApplePlist } from '../utils/parse-apple-plist';

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

/** Supported Info.plist export compliance keys (legacy + current naming). */
const EXPORT_COMPLIANCE_KEYS = ['ITSAppUsesEncryption', 'ITSAppUsesNonExemptEncryption'] as const;

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
    plistContent: string | Buffer | undefined,
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
    const likelyNonExemptEncryption = hasNonExemptFramework || hasOpenSSLSymbols;

    // 3. Check Info.plist for export compliance declaration
    const declarationStates = EXPORT_COMPLIANCE_KEYS
        .map(key => parsePlistBooleanKey(plistContent, key))
        .filter((state): state is PlistBooleanState => state !== null);

    const plistHasKey = declarationStates.length > 0;
    const encryptionDeclaredTrue = declarationStates.some(state => state.value === true);
    const encryptionDeclaredFalse = !encryptionDeclaredTrue && declarationStates.some(state => state.value === false);
    const plistLooksXml = typeof plistContent === 'string' && plistContent.includes('<plist');
    const hasUnparseableDeclaration = plistLooksXml && !encryptionDeclaredTrue && !encryptionDeclaredFalse &&
        declarationStates.some(state => state.value === null);

    // 3b. Handle unparseable key value
    if (hasUnparseableDeclaration) {
        results.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'Export compliance key found but value could not be determined',
            description:
                'The Info.plist contains ITSAppUsesEncryption/ITSAppUsesNonExemptEncryption, ' +
                'but the boolean value could not be parsed. Verify the key is correctly set to YES or NO.',
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
            title: 'Missing export compliance key in Info.plist',
            description:
                `Encryption usage detected but no export compliance key is declared in Info.plist. ` +
                `You will be asked about encryption during App Store submission. ${summary}`,
            guideline_ref: 'export_compliance',
            fix_suggestion:
                'Add ITSAppUsesNonExemptEncryption (or ITSAppUsesEncryption) to your Info.plist. ' +
                buildExemptionGuidance(hasNonExemptFramework, hasOpenSSLSymbols),
            confidence: 80,
        });
    }

    // Case: Key = true
    if (encryptionDeclaredTrue) {
        results.push({
            category: 'ipa_binary',
            severity: 'info',
            title: 'App declares encryption usage (export compliance key = YES)',
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
    if (encryptionDeclaredFalse && hasEncryption && likelyNonExemptEncryption) {
        const summary = formatEncryptionSummary(detectedFrameworks, detectedSymbols.length);

        results.push({
            category: 'ipa_binary',
            severity: 'warning',
            title: 'Encryption detected despite export compliance key = NO',
            description:
                `Your Info.plist declares no encryption usage, but encryption frameworks or symbols were detected in the binary. ${summary} ` +
                `This mismatch may cause issues during App Store review.`,
            guideline_ref: 'export_compliance',
            fix_suggestion:
                'Review your export compliance declaration. If your app only uses exempt encryption ' +
                '(HTTPS via URLSession/ATS or standard Apple frameworks), keep ITSAppUsesNonExemptEncryption set to NO. ' +
                'If you use non-exempt encryption (OpenSSL or custom crypto), set it to YES and file the appropriate compliance documentation.',
            confidence: 70,
        });
    }

    // Case: Key = false + no encryption → pass (no result needed)

    return results;
}

interface PlistBooleanState {
    value: boolean | null;
}

function parsePlistBooleanKey(
    plistContent: string | Buffer | undefined,
    key: typeof EXPORT_COMPLIANCE_KEYS[number],
): PlistBooleanState | null {
    if (!plistContent) return null;

    // Prefer parsing (handles binary plists). Fall back to XML regex if needed.
    const parsed = parseApplePlist(plistContent);
    const parsedValue = parsed ? (parsed as Record<string, unknown>)[key] : undefined;
    if (typeof parsedValue === 'boolean') {
        return { value: parsedValue };
    }

    if (typeof plistContent !== 'string') return null;
    if (!plistContent.includes(key)) return null;

    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boolMatch = plistContent.match(
        new RegExp(`<key>\\s*${escapedKey}\\s*<\\/key>\\s*<(true|false)\\s*\\/>`, 'i'),
    );

    if (!boolMatch) {
        return { value: null };
    }

    return { value: boolMatch[1].toLowerCase() === 'true' };
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
