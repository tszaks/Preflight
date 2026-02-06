/**
 * Lightweight XML plist parser for Apple's PrivacyInfo.xcprivacy files.
 * No npm dependencies — handles the subset of plist types Apple uses:
 * <dict>, <array>, <string>, <true/>, <false/>, <integer>, <real>, <date>.
 *
 * Returns null on parse failure so callers can fall back to string matching.
 */

type PlistValue = string | number | boolean | Date | PlistValue[] | PlistDict;
interface PlistDict { [key: string]: PlistValue }

/**
 * Parse an XML plist string into a JavaScript object.
 * Returns null if the content is not valid plist XML.
 */
export function parsePlist(xml: string): PlistDict | null {
    try {
        // Strip XML declaration and find <plist> content
        const plistMatch = xml.match(/<plist[^>]*>([\s\S]*)<\/plist>/);
        if (!plistMatch) return null;

        const inner = plistMatch[1].trim();
        const tokens = tokenize(inner);
        const [value] = parseValue(tokens, 0);

        // Top-level plist value should be a dict
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        return value as PlistDict;
    } catch {
        return null;
    }
}

// ─── Tokenizer ───────────────────────────────────────────────────────────────

interface Token {
    type: 'open' | 'close' | 'selfclose' | 'text';
    tag?: string;
    value?: string;
}

function tokenize(xml: string): Token[] {
    const tokens: Token[] = [];
    const re = /<(\/?)(\w+)[^>]*(\/?)>|([^<]+)/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(xml)) !== null) {
        const [, closing, tag, selfClose, text] = m;
        if (text !== undefined) {
            const trimmed = text.trim();
            if (trimmed) tokens.push({ type: 'text', value: trimmed });
        } else if (selfClose === '/') {
            tokens.push({ type: 'selfclose', tag });
        } else if (closing === '/') {
            tokens.push({ type: 'close', tag });
        } else {
            tokens.push({ type: 'open', tag });
        }
    }
    return tokens;
}

// ─── Recursive Descent Parser ────────────────────────────────────────────────

function parseValue(tokens: Token[], i: number): [PlistValue | null, number] {
    if (i >= tokens.length) return [null, i];

    const token = tokens[i];

    // Self-closing tags: <true/>, <false/>
    if (token.type === 'selfclose') {
        if (token.tag === 'true') return [true, i + 1];
        if (token.tag === 'false') return [false, i + 1];
        return [null, i + 1];
    }

    if (token.type !== 'open') return [null, i + 1];

    switch (token.tag) {
        case 'dict':
            return parseDict(tokens, i + 1);
        case 'array':
            return parseArray(tokens, i + 1);
        case 'string':
            return parseTextContent(tokens, i + 1, 'string', String);
        case 'integer':
            return parseTextContent(tokens, i + 1, 'integer', (s) => parseInt(s, 10));
        case 'real':
            return parseTextContent(tokens, i + 1, 'real', parseFloat);
        case 'date':
            return parseTextContent(tokens, i + 1, 'date', (s) => new Date(s));
        case 'true':
            // Handle <true></true> (non-self-closing variant)
            return consumeClose(tokens, i + 1, 'true', true);
        case 'false':
            return consumeClose(tokens, i + 1, 'false', false);
        default:
            // Skip unknown tags — advance past their close tag
            return skipUnknown(tokens, i + 1, token.tag!);
    }
}

function parseDict(tokens: Token[], i: number): [PlistDict, number] {
    const dict: PlistDict = {};

    while (i < tokens.length) {
        const t = tokens[i];

        // End of dict
        if (t.type === 'close' && t.tag === 'dict') {
            return [dict, i + 1];
        }

        // Expect <key>
        if (t.type !== 'open' || t.tag !== 'key') {
            i++;
            continue;
        }

        // Get key text
        i++;
        if (i >= tokens.length || tokens[i].type !== 'text') {
            i++;
            continue;
        }
        const key = tokens[i].value!;
        i++;

        // Consume </key>
        if (i < tokens.length && tokens[i].type === 'close' && tokens[i].tag === 'key') {
            i++;
        }

        // Parse value
        const [value, nextI] = parseValue(tokens, i);
        if (value !== null) {
            dict[key] = value;
        }
        i = nextI;
    }

    return [dict, i];
}

function parseArray(tokens: Token[], i: number): [PlistValue[], number] {
    const arr: PlistValue[] = [];

    while (i < tokens.length) {
        const t = tokens[i];

        // End of array
        if (t.type === 'close' && t.tag === 'array') {
            return [arr, i + 1];
        }

        const [value, nextI] = parseValue(tokens, i);
        if (value !== null) {
            arr.push(value);
        }
        i = nextI;
    }

    return [arr, i];
}

function parseTextContent<T>(
    tokens: Token[],
    i: number,
    tag: string,
    transform: (s: string) => T,
): [T | null, number] {
    // Handle empty tags like <string></string>
    if (i < tokens.length && tokens[i].type === 'close' && tokens[i].tag === tag) {
        return [transform(''), i + 1];
    }
    if (i >= tokens.length || tokens[i].type !== 'text') {
        // Skip to close tag
        while (i < tokens.length && !(tokens[i].type === 'close' && tokens[i].tag === tag)) i++;
        return [null, i + 1];
    }
    const value = transform(tokens[i].value!);
    i++;
    // Consume close tag
    if (i < tokens.length && tokens[i].type === 'close' && tokens[i].tag === tag) {
        i++;
    }
    return [value, i];
}

function consumeClose<T>(tokens: Token[], i: number, tag: string, value: T): [T, number] {
    if (i < tokens.length && tokens[i].type === 'close' && tokens[i].tag === tag) {
        return [value, i + 1];
    }
    return [value, i];
}

function skipUnknown(tokens: Token[], i: number, tag: string): [null, number] {
    let depth = 1;
    while (i < tokens.length && depth > 0) {
        if (tokens[i].type === 'open' && tokens[i].tag === tag) depth++;
        if (tokens[i].type === 'close' && tokens[i].tag === tag) depth--;
        i++;
    }
    return [null, i];
}
