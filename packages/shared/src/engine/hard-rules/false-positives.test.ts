import { describe, expect, it } from 'vitest';
import { checkInfoPlist } from './info-plist';
import { checkUrls } from './urls';
import { checkMetadata } from './metadata';
import type { HardRulesInput } from '../types';

/**
 * Regression tests for findings that were CRITICAL at 100% confidence and wrong.
 *
 * These matter more than a normal false positive. Preflight is meant to be run by
 * an agent, and an agent acts on what it is told: a false "placeholder bundle
 * identifier" gets a correct bundle ID rewritten and code signing broken, and a
 * false "missing required key" gets a key added that then conflicts with the
 * build setting that was already supplying it.
 */

function builtPlist(bundleId: string): string {
    // Includes the marker keys Xcode injects, so this reads as a built plist and
    // required-key checks apply in full.
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleIdentifier</key><string>${bundleId}</string>
	<key>CFBundleName</key><string>Tracker</string>
	<key>CFBundleShortVersionString</key><string>1.0</string>
	<key>CFBundleVersion</key><string>42</string>
	<key>CFBundleExecutable</key><string>Tracker</string>
	<key>UISupportedInterfaceOrientations</key>
	<array><string>UIInterfaceOrientationPortrait</string></array>
	<key>DTPlatformName</key><string>iphoneos</string>
	<key>DTSDKName</key><string>iphoneos26.0</string>
	<key>CFBundleSupportedPlatforms</key><array><string>iPhoneOS</string></array>
</dict>
</plist>`;
}

const SOURCE_PLIST_MISSING_ORIENTATIONS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
	<key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
	<key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
	<key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
</dict>
</plist>`;

describe('bundle identifier placeholder detection', () => {
    const placeholderTitles = (bundleId: string) =>
        checkInfoPlist(builtPlist(bundleId))
            .filter((c) => c.title === 'Placeholder bundle identifier')
            .map((c) => c.severity);

    it('does not flag a real bundle ID that merely contains "test" inside a word', () => {
        // The reported case. "fastest" contains "test".
        expect(placeholderTitles('com.fastestapps.tracker')).toEqual([]);
    });

    it('does not flag "contest" either', () => {
        expect(placeholderTitles('com.contestapp.ios')).toEqual([]);
    });

    it('does not flag other words that happen to contain a placeholder word', () => {
        expect(placeholderTitles('com.latestnews.reader')).toEqual([]);
        expect(placeholderTitles('com.protestapp.org')).toEqual([]);
    });

    it('still flags a genuine placeholder segment', () => {
        expect(placeholderTitles('com.example.myapp')).toEqual(['critical']);
        expect(placeholderTitles('com.yourcompany.myapp')).toEqual(['critical']);
    });

    it('flags a placeholder word delimited by a hyphen inside a segment', () => {
        expect(placeholderTitles('com.acme.test-app')).toEqual(['critical']);
    });

    it('still flags a bare "test" segment', () => {
        expect(placeholderTitles('com.acme.test')).toEqual(['critical']);
    });
});

describe('required keys on a source vs built Info.plist', () => {
    it('reports a genuinely missing key as critical in a built plist', () => {
        // Non-greedy on purpose: a greedy `.*` here runs to the last </array> in
        // the document and takes the built-plist marker keys with it, which makes
        // the fixture look like a source plist and quietly tests the wrong thing.
        const withoutOrientations = builtPlist('com.acme.app').replace(
            /\t<key>UISupportedInterfaceOrientations<\/key>\n\t<array>.*?<\/array>\n/s,
            ''
        );
        expect(withoutOrientations).toContain('DTPlatformName');
        expect(withoutOrientations).not.toContain('UISupportedInterfaceOrientations');
        const findings = checkInfoPlist(withoutOrientations)
            .filter((c) => c.title.includes('UISupportedInterfaceOrientations'));

        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe('critical');
        expect(findings[0].status).toBe('checked');
    });

    it('does not call a source plist non-compliant for keys Xcode injects at build time', () => {
        // With GENERATE_INFOPLIST_FILE, the repository plist legitimately omits
        // keys that come from INFOPLIST_KEY_* build settings. Verified on a real
        // project: absent from the source plist, present in the shipped .ipa.
        const findings = checkInfoPlist(SOURCE_PLIST_MISSING_ORIENTATIONS)
            .filter((c) => c.title.includes('UISupportedInterfaceOrientations'));

        expect(findings).toHaveLength(1);
        expect(findings[0].severity).not.toBe('critical');
        expect(findings[0].status).toBe('not_checked');
    });
});

describe('URL rules: unasked is not the same as absent', () => {
    const base: HardRulesInput = { app_name: 'Tracker' };

    it('does not invent a violation when no privacy URL was supplied', () => {
        // This fired CRITICAL on every CLI run for every user, because the CLI
        // never collected the field. A rule that always fires carries no signal,
        // and it meant the reachability checks never ran even once.
        return checkUrls(base).then((results) => {
            const privacy = results.filter((r) => r.title.includes('Privacy policy'));
            expect(privacy).toHaveLength(1);
            expect(privacy[0].severity).not.toBe('critical');
            expect(privacy[0].status).toBe('not_checked');
        });
    });

    it('reports a critical when the URL is known to be absent', async () => {
        const results = await checkUrls({ ...base, privacy_url: null });
        const privacy = results.filter((r) => r.title === 'Missing privacy policy URL');
        expect(privacy).toHaveLength(1);
        expect(privacy[0].severity).toBe('critical');
        expect(privacy[0].status).toBe('checked');
    });

    it('does not invent a terms violation for subscriptions when none was supplied', async () => {
        const results = await checkUrls({ ...base, has_subscriptions: true });
        const terms = results.filter((r) => r.title.includes('Terms of Use'));
        expect(terms).toHaveLength(1);
        expect(terms[0].severity).not.toBe('critical');
        expect(terms[0].status).toBe('not_checked');
    });

    it('reports a terms critical for subscriptions when known absent', async () => {
        const results = await checkUrls({ ...base, has_subscriptions: true, terms_url: null });
        const terms = results.filter((r) => r.title.includes('Terms of Use'));
        expect(terms.some((t) => t.severity === 'critical')).toBe(true);
    });
});

describe('description rule: unasked is not the same as absent', () => {
    it('does not invent a violation when no description was supplied', () => {
        const results = checkMetadata({ app_name: 'Tracker' });
        const desc = results.filter((r) => r.title.includes('description'));
        expect(desc).toHaveLength(1);
        expect(desc[0].severity).not.toBe('critical');
        expect(desc[0].status).toBe('not_checked');
    });

    it('reports a critical when the description is known to be absent', () => {
        const results = checkMetadata({ app_name: 'Tracker', description: null });
        const desc = results.filter((r) => r.title === 'Missing app description');
        expect(desc).toHaveLength(1);
        expect(desc[0].severity).toBe('critical');
    });
});
