import { createPrivateKey, sign as cryptoSign } from 'node:crypto';

/**
 * Minimal read-only App Store Connect API client.
 *
 * Scope is deliberately narrow. Preflight reads submission metadata to compare
 * it against the binary; it never writes. A tool that can edit your submission
 * is a different product with a different risk profile, and read-only means a
 * key with Developer access is enough.
 *
 * No dependency is needed for the JWT: App Store Connect uses ES256, and Node's
 * crypto can produce a JOSE-format signature directly with
 * `dsaEncoding: 'ieee-p1363'`, which avoids hand-converting the DER output.
 */

const ASC_BASE = 'https://api.appstoreconnect.apple.com';
const ASC_AUDIENCE = 'appstoreconnect-v1';

export interface AscCredentials {
    /** Key ID from App Store Connect > Users and Access > Integrations. */
    keyId: string;
    /** Issuer ID from the same page. */
    issuerId: string;
    /** Contents of the .p8 private key file (not a path). */
    privateKey: string;
}

export class AscError extends Error {
    constructor(message: string, readonly status?: number) {
        super(message);
        this.name = 'AscError';
    }
}

function base64url(input: Buffer | string): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Mint a short-lived ES256 token.
 *
 * Apple rejects tokens with a lifetime over 20 minutes; 10 is plenty for a scan
 * and limits the blast radius if one is ever logged.
 */
export function createAscToken(credentials: AscCredentials, now = Date.now()): string {
    const issuedAt = Math.floor(now / 1000);
    const header = { alg: 'ES256', kid: credentials.keyId, typ: 'JWT' };
    const payload = {
        iss: credentials.issuerId,
        iat: issuedAt,
        exp: issuedAt + 10 * 60,
        aud: ASC_AUDIENCE,
    };

    const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

    let key;
    try {
        key = createPrivateKey(credentials.privateKey);
    } catch {
        throw new AscError(
            'Could not read the App Store Connect private key. It should be the full contents of the .p8 file, including the BEGIN and END lines.'
        );
    }

    // ieee-p1363 is the r||s concatenation JOSE wants. The default DER encoding
    // would need manual unpacking and is a common source of "401 invalid token".
    const signature = cryptoSign('sha256', Buffer.from(signingInput), {
        key,
        dsaEncoding: 'ieee-p1363',
    });

    return `${signingInput}.${base64url(signature)}`;
}

export interface AscRequestOptions {
    token: string;
    /** Injected in tests. */
    fetchImpl?: typeof fetch;
}

async function ascGet<T>(path: string, options: AscRequestOptions): Promise<T> {
    const doFetch = options.fetchImpl ?? fetch;
    const response = await doFetch(`${ASC_BASE}${path}`, {
        headers: {
            Authorization: `Bearer ${options.token}`,
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        throw new AscError(
            'App Store Connect rejected the credentials (401). Check the key ID, issuer ID, and that the key has not been revoked.',
            401
        );
    }
    if (response.status === 403) {
        throw new AscError(
            'App Store Connect denied access (403). The key needs at least Developer access to this app.',
            403
        );
    }
    if (!response.ok) {
        throw new AscError(`App Store Connect returned ${response.status} for ${path}`, response.status);
    }

    return (await response.json()) as T;
}

interface AscResource<A> {
    id: string;
    attributes: A;
}

interface AscList<A> {
    data: AscResource<A>[];
}

interface AscSingle<A> {
    data: AscResource<A> | null;
}

/**
 * Everything Preflight reads from App Store Connect, in one shape.
 *
 * Fields are optional because a partially readable submission is normal: a brand
 * new app has no review details yet, and a key scoped to one app cannot see
 * others. Absent means "not checked", never "compliant".
 */
export interface AscSubmissionMetadata {
    appId: string;
    bundleId: string;
    appName: string;
    versionString?: string;
    appStoreState?: string;
    /** null when Apple has the field but it is unanswered, which blocks submission. */
    usesIdfa?: boolean | null;
    description?: string | null;
    keywords?: string | null;
    supportUrl?: string | null;
    marketingUrl?: string | null;
    privacyPolicyUrl?: string | null;
    reviewNotes?: string | null;
    demoAccountRequired?: boolean | null;
    hasBuildAttached?: boolean;
}

/**
 * Fetch submission metadata for a bundle ID.
 *
 * Returns null when the bundle ID is not in this account, which is a normal
 * outcome (wrong key, app not created yet) and not an error.
 */
export async function fetchSubmissionMetadata(
    bundleId: string,
    options: AscRequestOptions
): Promise<AscSubmissionMetadata | null> {
    const apps = await ascGet<AscList<{ bundleId: string; name: string }>>(
        `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name&limit=1`,
        options
    );

    const app = apps.data[0];
    if (!app) return null;

    const metadata: AscSubmissionMetadata = {
        appId: app.id,
        bundleId: app.attributes.bundleId,
        appName: app.attributes.name,
    };

    // Latest version. An app in review or preparing for submission is the one we
    // care about; a live app's most recent version is still the right subject.
    const versions = await ascGet<AscList<{ versionString: string; appStoreState: string; usesIdfa: boolean | null }>>(
        `/v1/apps/${app.id}/appStoreVersions?limit=1&fields[appStoreVersions]=versionString,appStoreState,usesIdfa`,
        options
    );
    const version = versions.data[0];
    if (!version) return metadata;

    metadata.versionString = version.attributes.versionString;
    metadata.appStoreState = version.attributes.appStoreState;
    metadata.usesIdfa = version.attributes.usesIdfa;

    // Version localization: description, keywords, support and marketing URLs.
    // Note privacyPolicyUrl is NOT here; it lives on appInfoLocalizations.
    const localizations = await ascGet<AscList<{
        locale: string; description: string | null; keywords: string | null;
        supportUrl: string | null; marketingUrl: string | null;
    }>>(
        `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=1&fields[appStoreVersionLocalizations]=locale,description,keywords,supportUrl,marketingUrl`,
        options
    );
    const localization = localizations.data[0];
    if (localization) {
        metadata.description = localization.attributes.description;
        metadata.keywords = localization.attributes.keywords;
        metadata.supportUrl = localization.attributes.supportUrl;
        metadata.marketingUrl = localization.attributes.marketingUrl;
    }

    // Privacy policy URL lives on the app info localization, a different resource.
    try {
        const appInfos = await ascGet<AscList<Record<string, unknown>>>(
            `/v1/apps/${app.id}/appInfos?limit=1`,
            options
        );
        const appInfo = appInfos.data[0];
        if (appInfo) {
            const infoLocalizations = await ascGet<AscList<{ privacyPolicyUrl: string | null }>>(
                `/v1/appInfos/${appInfo.id}/appInfoLocalizations?limit=1&fields[appInfoLocalizations]=privacyPolicyUrl`,
                options
            );
            metadata.privacyPolicyUrl = infoLocalizations.data[0]?.attributes.privacyPolicyUrl ?? null;
        }
    } catch {
        // Leave undefined: not checked, rather than reporting a missing policy.
    }

    // Review details: the notes App Review reads first, and the demo account flag.
    try {
        const reviewDetail = await ascGet<AscSingle<{ notes: string | null; demoAccountRequired: boolean | null }>>(
            `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`,
            options
        );
        if (reviewDetail.data) {
            metadata.reviewNotes = reviewDetail.data.attributes.notes;
            metadata.demoAccountRequired = reviewDetail.data.attributes.demoAccountRequired;
        }
    } catch {
        // A version with no review detail yet is normal.
    }

    try {
        const build = await ascGet<AscSingle<Record<string, unknown>>>(
            `/v1/appStoreVersions/${version.id}/build`,
            options
        );
        metadata.hasBuildAttached = Boolean(build.data);
    } catch {
        metadata.hasBuildAttached = false;
    }

    return metadata;
}
