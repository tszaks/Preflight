import { describe, expect, it } from 'vitest';
import { parsePlist } from './parse-plist';
import { parseApplePlist } from './parse-apple-plist';

/**
 * Regression tests for the self-closing-tag bug that made the hand-rolled
 * tokenizer drop declared data.
 *
 * The old parser classified `<array/>` and `<false/>` as *opening* tags, so the
 * phantom open array swallowed every sibling key that followed it. Verified
 * against the old implementation before it was replaced: it emitted zero
 * `selfclose` tokens for the manifest below, and `NSPrivacyCollectedDataTypes`
 * disappeared from the result entirely.
 *
 * This shape is not hypothetical. Xcode writes `<array/>` for
 * `NSPrivacyTrackingDomains` and `<false/>` for `NSPrivacyTracking` in every
 * app that does not track, which is most of them.
 */
const MANIFEST_WITH_SELF_CLOSING_TAGS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSPrivacyTracking</key>
	<false/>
	<key>NSPrivacyTrackingDomains</key>
	<array/>
	<key>NSPrivacyCollectedDataTypes</key>
	<array>
		<dict>
			<key>NSPrivacyCollectedDataType</key>
			<string>NSPrivacyCollectedDataTypeEmailAddress</string>
			<key>NSPrivacyCollectedDataTypeLinked</key>
			<true/>
			<key>NSPrivacyCollectedDataTypeTracking</key>
			<false/>
			<key>NSPrivacyCollectedDataTypePurposes</key>
			<array>
				<string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
			</array>
		</dict>
		<dict>
			<key>NSPrivacyCollectedDataType</key>
			<string>NSPrivacyCollectedDataTypePhotosorVideos</string>
			<key>NSPrivacyCollectedDataTypeLinked</key>
			<true/>
			<key>NSPrivacyCollectedDataTypeTracking</key>
			<false/>
			<key>NSPrivacyCollectedDataTypePurposes</key>
			<array>
				<string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
			</array>
		</dict>
	</array>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
				<string>1C8F.1</string>
			</array>
		</dict>
	</array>
</dict>
</plist>`;

describe('parsePlist: self-closing tags', () => {
    it('keeps every top-level key when a self-closing tag appears mid-dict', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS);

        expect(parsed).not.toBeNull();
        // The old parser returned only the first two of these four.
        expect(Object.keys(parsed!).sort()).toEqual([
            'NSPrivacyAccessedAPITypes',
            'NSPrivacyCollectedDataTypes',
            'NSPrivacyTracking',
            'NSPrivacyTrackingDomains',
        ]);
    });

    it('reads <false/> as boolean false, not as an open element', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)!;
        expect(parsed.NSPrivacyTracking).toBe(false);
    });

    it('reads <array/> as an empty array', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)!;
        expect(parsed.NSPrivacyTrackingDomains).toEqual([]);
    });

    it('does not nest later siblings inside the empty array', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)!;
        const collected = parsed.NSPrivacyCollectedDataTypes as unknown[];

        // This is the assertion that actually failed before: the collected data
        // types were swallowed into NSPrivacyTrackingDomains and reported as
        // absent, so a manifest declaring data read as declaring none.
        expect(Array.isArray(collected)).toBe(true);
        expect(collected).toHaveLength(2);
    });

    it('preserves the declared data types and their purposes', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)!;
        const collected = parsed.NSPrivacyCollectedDataTypes as Array<Record<string, unknown>>;

        expect(collected.map((d) => d.NSPrivacyCollectedDataType)).toEqual([
            'NSPrivacyCollectedDataTypeEmailAddress',
            // Apple spells this with a lowercase "or", unlike its sibling
            // EmailsOrTextMessages. App Store Connect rejects manifests with
            // unexpected keys, so the exact spelling matters.
            'NSPrivacyCollectedDataTypePhotosorVideos',
        ]);
        expect(collected[0].NSPrivacyCollectedDataTypeLinked).toBe(true);
        expect(collected[0].NSPrivacyCollectedDataTypeTracking).toBe(false);
        expect(collected[0].NSPrivacyCollectedDataTypePurposes).toEqual([
            'NSPrivacyCollectedDataTypePurposeAppFunctionality',
        ]);
    });

    it('preserves required-reason API codes', () => {
        const parsed = parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)!;
        const apis = parsed.NSPrivacyAccessedAPITypes as Array<Record<string, unknown>>;

        expect(apis).toHaveLength(1);
        expect(apis[0].NSPrivacyAccessedAPITypeReasons).toEqual(['CA92.1', '1C8F.1']);
    });

    it('agrees with parseApplePlist, since it now delegates to it', () => {
        expect(parsePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)).toEqual(
            parseApplePlist(MANIFEST_WITH_SELF_CLOSING_TAGS)
        );
    });
});

describe('parsePlist: failure handling', () => {
    it('returns null rather than throwing on malformed XML', () => {
        expect(parsePlist('<plist><dict><key>oops')).toBeNull();
    });

    it('returns null on an empty string', () => {
        expect(parsePlist('')).toBeNull();
    });

    it('returns null when the root is an array rather than a dict', () => {
        expect(
            parsePlist('<?xml version="1.0"?><plist version="1.0"><array/></plist>')
        ).toBeNull();
    });
});
