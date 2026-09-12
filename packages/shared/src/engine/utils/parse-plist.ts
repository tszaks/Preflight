/**
 * XML plist parsing for Apple's Info.plist and PrivacyInfo.xcprivacy files.
 *
 * This used to be a hand-rolled tokenizer and recursive-descent parser, written
 * to avoid a dependency. It silently corrupted nearly every real privacy
 * manifest, and it did so in the worst possible direction: by making declared
 * data disappear rather than by failing.
 *
 * The bug was one character of regex. The tokenizer matched tags with
 *
 *     /<(\/?)(\w+)[^>]*(\/?)>|([^<]+)/g
 *
 * and on `<array/>` the greedy `[^>]*` consumed the self-closing slash before
 * the `(\/?)` group could capture it. So `selfClose` was always empty and every
 * self-closing tag was classified as an *opening* tag. Xcode writes exactly
 * `<array/>` for `NSPrivacyTrackingDomains` in any app that does not track, and
 * `<false/>` for `NSPrivacyTracking`, so this fired on essentially every
 * well-formed manifest. The phantom `<array>` then swallowed each following
 * sibling key, and `NSPrivacyCollectedDataTypes` vanished from the top level.
 *
 * Observed consequence: scanning a real shipping app reported "no collected
 * data types declared" for a manifest that declared five, which is precisely
 * the kind of false reassurance a compliance tool must never produce.
 *
 * `parseApplePlist` was already in this directory, already used by
 * `info-plist.ts` and `detect-from-plist.ts`, and already backed by the `plist`
 * and `bplist-parser` libraries, so it also handles the *binary* plists that
 * built apps actually ship. There was never a reason to maintain a second,
 * worse parser beside it.
 *
 * @deprecated Prefer `parseApplePlist` directly. It accepts a Buffer and so can
 * read binary plists, which this string-only signature cannot express. This
 * wrapper exists so the seven existing call sites keep their types; new code
 * should not use it.
 */
import { parseApplePlist } from './parse-apple-plist';

type PlistValue = string | number | boolean | Date | PlistValue[] | PlistDict;
interface PlistDict { [key: string]: PlistValue }

/**
 * Parse an XML plist string into a JavaScript object.
 * Returns null if the content is not valid plist XML.
 */
export function parsePlist(xml: string): PlistDict | null {
    // The cast is safe in practice and unavoidable in principle: a plist can
    // nest arbitrarily, so the library returns `unknown` values. Every caller
    // already narrows with its own `isPlistDict`-style type guard before
    // indexing, which is the correct place for that check.
    return parseApplePlist(xml) as PlistDict | null;
}
