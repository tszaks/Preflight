import { describe, expect, it } from 'vitest';
import { checkAppStoreConnect, checkPrivacyLabelReminder } from './rules';
import { createAscToken } from './client';
import type { AscSubmissionMetadata } from './client';

function metadata(overrides: Partial<AscSubmissionMetadata> = {}): AscSubmissionMetadata {
    return {
        appId: '123456',
        bundleId: 'com.acme.app',
        appName: 'Acme',
        versionString: '1.0',
        usesIdfa: false,
        privacyPolicyUrl: 'https://acme.example/privacy',
        reviewNotes: 'Tap around, everything is open.',
        demoAccountRequired: false,
        hasBuildAttached: true,
        ...overrides,
    };
}

const titles = (results: { title: string }[]) => results.map((r) => r.title);

describe('review notes versus the binary', () => {
    it('flags notes claiming no sign-in when the app links Sign in with Apple', () => {
        // The real case, verbatim in shape: the notes opened with this claim while
        // the app gated everything behind Sign in with Apple. No local file could
        // have revealed the contradiction.
        const results = checkAppStoreConnect(
            metadata({ reviewNotes: 'Payday requires no account and no sign-in, so no demo credentials are needed.' }),
            { signInWithApple: true }
        );

        const finding = results.find((r) => r.title.includes('Review notes claim no sign-in'));
        expect(finding).toBeDefined();
        expect(finding!.severity).toBe('critical');
        expect(finding!.status).toBe('checked');
    });

    it('does not flag the same notes when the app genuinely has no sign-in', () => {
        const results = checkAppStoreConnect(
            metadata({ reviewNotes: 'This app requires no account.' }),
            { signInWithApple: false, signInRequired: false }
        );
        expect(titles(results)).not.toContain('Review notes claim no sign-in, but the app requires one');
    });

    it('warns when sign-in is detected and the notes are empty', () => {
        const results = checkAppStoreConnect(metadata({ reviewNotes: '' }), { signInRequired: true });
        const finding = results.find((r) => r.title.includes('review notes are empty'));
        expect(finding?.severity).toBe('warning');
    });

    it('reports not_checked when the notes could not be read', () => {
        const results = checkAppStoreConnect(metadata({ reviewNotes: undefined }), {});
        const finding = results.find((r) => r.title.includes('notes not checked'));
        expect(finding?.status).toBe('not_checked');
    });
});

describe('IDFA question', () => {
    it('treats an unanswered question as a submission blocker', () => {
        const results = checkAppStoreConnect(metadata({ usesIdfa: null }));
        const finding = results.find((r) => r.title.includes('Advertising Identifier question is unanswered'));
        expect(finding?.severity).toBe('critical');
    });

    it('is silent when the question is answered either way', () => {
        expect(titles(checkAppStoreConnect(metadata({ usesIdfa: false })))
            .some((t) => t.includes('Advertising Identifier question is unanswered'))).toBe(false);
        expect(titles(checkAppStoreConnect(metadata({ usesIdfa: true })))
            .some((t) => t.includes('Advertising Identifier question is unanswered'))).toBe(false);
    });
});

describe('privacy policy URL', () => {
    it('is critical when App Store Connect has none', () => {
        const results = checkAppStoreConnect(metadata({ privacyPolicyUrl: null }));
        const finding = results.find((r) => r.title.includes('No privacy policy URL set'));
        expect(finding?.severity).toBe('critical');
    });

    it('is not_checked when it could not be read, rather than reported missing', () => {
        const results = checkAppStoreConnect(metadata({ privacyPolicyUrl: undefined }));
        const finding = results.find((r) => r.title.includes('Privacy policy URL in App Store Connect not checked'));
        expect(finding?.status).toBe('not_checked');
    });
});

describe('privacy label reminder', () => {
    it('lists the declared types in readable form', () => {
        const [finding] = checkPrivacyLabelReminder([
            'NSPrivacyCollectedDataTypeEmailAddress',
            'NSPrivacyCollectedDataTypeOtherFinancialInfo',
        ], '123456');

        expect(finding.status).toBe('not_checked');
        expect(finding.description).toContain('Email Address');
        expect(finding.description).toContain('Other Financial Info');
        expect(finding.description).toContain('2 collected data types');
    });

    it('links straight to the App Privacy page when the app id is known', () => {
        const [finding] = checkPrivacyLabelReminder(['NSPrivacyCollectedDataTypeName'], '123456');
        expect(finding.fix_suggestion).toContain('appstoreconnect.apple.com/apps/123456/distribution/privacy');
    });

    it('still gives directions without an app id, since it needs no credentials', () => {
        const [finding] = checkPrivacyLabelReminder(['NSPrivacyCollectedDataTypeName']);
        expect(finding.fix_suggestion).toContain('App Privacy');
        expect(finding.fix_suggestion).not.toContain('undefined');
    });

    it('says the label should read Data Not Collected when nothing is declared', () => {
        const [finding] = checkPrivacyLabelReminder([]);
        expect(finding.description).toContain('Data Not Collected');
    });

    it('never reports as a violation, because it cannot be verified', () => {
        // Apple exposes no API for the App Privacy answers, so a hard finding here
        // would be an assertion the tool cannot support.
        const [finding] = checkPrivacyLabelReminder(['NSPrivacyCollectedDataTypeName']);
        expect(finding.severity).not.toBe('critical');
        expect(finding.status).toBe('not_checked');
    });
});

describe('demo account configuration', () => {
    it('accepts no demo account when the notes explain Sign in with Apple', () => {
        // The correct configuration for a SIWA-only app: a demo Apple ID would
        // send its two-factor code to the developer, locking the reviewer out.
        const results = checkAppStoreConnect(
            metadata({
                demoAccountRequired: false,
                reviewNotes: 'Tap Continue with Apple and use your own Apple ID.',
            }),
            { signInWithApple: true }
        );
        expect(titles(results).some((t) => t.includes('demo account'))).toBe(false);
    });

    it('warns when a Sign in with Apple app explains nothing', () => {
        const results = checkAppStoreConnect(
            metadata({ demoAccountRequired: false, reviewNotes: 'Enjoy the app.' }),
            { signInWithApple: true }
        );
        const finding = results.find((r) => r.title.includes('no demo account and no explanation'));
        expect(finding?.severity).toBe('warning');
    });

    it('is critical for a password-based login with no credentials supplied', () => {
        const results = checkAppStoreConnect(
            metadata({ demoAccountRequired: false, reviewNotes: 'Log in to continue.' }),
            { signInRequired: true, signInWithApple: false }
        );
        const finding = results.find((r) => r.title.includes('no demo account is provided'));
        expect(finding?.severity).toBe('critical');
    });
});

describe('build attachment', () => {
    it('warns when no build is attached to the version', () => {
        const results = checkAppStoreConnect(metadata({ hasBuildAttached: false }));
        expect(titles(results).some((t) => t.includes('No build is attached'))).toBe(true);
    });
});

describe('token signing', () => {
    // A throwaway P-256 key generated for this test only. Not a credential.
    const testKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2
OF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r
1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G
-----END PRIVATE KEY-----`;

    it('produces a three-part JWT with the expected header and claims', () => {
        const token = createAscToken(
            { keyId: 'ABC123DEFG', issuerId: 'issuer-uuid', privateKey: testKey },
            1_700_000_000_000
        );

        const [headerB64, payloadB64, signature] = token.split('.');
        expect(signature.length).toBeGreaterThan(0);

        const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

        expect(header).toEqual({ alg: 'ES256', kid: 'ABC123DEFG', typ: 'JWT' });
        expect(payload.iss).toBe('issuer-uuid');
        expect(payload.aud).toBe('appstoreconnect-v1');
        // Apple rejects lifetimes over 20 minutes.
        expect(payload.exp - payload.iat).toBeLessThanOrEqual(20 * 60);
    });

    it('produces a 64-byte JOSE signature, not DER', () => {
        // ES256 in JWT is r||s, 64 bytes. Node's default DER encoding is a
        // variable-length wrapper and is the usual cause of a 401 from Apple.
        const token = createAscToken({ keyId: 'K', issuerId: 'I', privateKey: testKey });
        const signature = Buffer.from(token.split('.')[2], 'base64url');
        expect(signature.length).toBe(64);
    });

    it('explains itself when the key is not a readable .p8', () => {
        expect(() => createAscToken({ keyId: 'K', issuerId: 'I', privateKey: 'not-a-key' }))
            .toThrow(/private key/i);
    });
});
