import { Buffer } from 'node:buffer';
import bplist from 'bplist-parser';
import plist from 'plist';

export type ApplePlistDict = Record<string, unknown>;

function looksLikeBinaryPlist(buf: Buffer): boolean {
    // Binary plist magic header is "bplist00"
    return buf.length >= 8 && buf.subarray(0, 8).toString('ascii') === 'bplist00';
}

/**
 * Parse an Apple property list (XML or binary) into a plain JS object.
 * Returns null on parse failure.
 *
 * Notes:
 * - Built iOS app Info.plist files are commonly *binary* plists.
 * - Source-level Info.plist files are commonly XML plists with Xcode build variables.
 */
export function parseApplePlist(input: string | Buffer): ApplePlistDict | null {
    try {
        const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;

        // Binary plist
        if (looksLikeBinaryPlist(buf)) {
            const parsed = bplist.parseBuffer(buf);
            const root = Array.isArray(parsed) ? parsed[0] : null;
            if (!root || typeof root !== 'object' || Array.isArray(root)) return null;
            return root as ApplePlistDict;
        }

        // XML plist
        const xml = typeof input === 'string' ? input : buf.toString('utf8');
        const parsed = plist.parse(xml);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        return parsed as ApplePlistDict;
    } catch {
        return null;
    }
}

