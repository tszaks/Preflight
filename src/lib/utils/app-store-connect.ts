/**
 * App Store Connect API Client
 *
 * Uses JWT authentication with ES256 signing per Apple's requirements.
 * API Docs: https://developer.apple.com/documentation/appstoreconnectapi
 *
 * Authentication flow:
 * 1. Developer provides Key ID, Issuer ID, and .p8 private key
 * 2. Server generates a JWT signed with ES256 (20-minute TTL)
 * 3. JWT is sent as Bearer token in Authorization header
 */

import { SignJWT, importPKCS8 } from 'jose';

// ── Types ────────────────────────────────────────────────────────

export interface ASCCredentials {
    keyId: string;
    issuerId: string;
    privateKey: string; // PEM-encoded .p8 key content
}

export interface ASCApp {
    id: string;
    bundleId: string;
    name: string;
    sku: string;
    primaryLocale: string;
}

export interface ASCAppVersion {
    id: string;
    versionString: string;
    platform: string;
    appStoreState: string;
    createdDate: string;
    copyright: string | null;
}

export interface ASCAppMetadata {
    name: string;
    subtitle: string | null;
    description: string | null;
    keywords: string | null;
    promotionalText: string | null;
    privacyUrl: string | null;
    supportUrl: string | null;
    marketingUrl: string | null;
}

export interface ASCReviewDetail {
    demoAccountRequired: boolean;
    demoAccountName: string | null;
    demoAccountPassword: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    notes: string | null;
}

export interface ASCReviewSubmission {
    id: string;
    state: string;
    submittedDate: string | null;
}

export interface ASCAppStoreVersion {
    id: string;
    versionString: string;
    platform: string;
    appStoreState: string;
    createdDate: string;
}

// ── Constants ────────────────────────────────────────────────────

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com/v1';
const JWT_TTL_SECONDS = 20 * 60; // 20 minutes
const REQUEST_TIMEOUT_MS = 15_000; // 15 seconds

// ── JWT Generation ───────────────────────────────────────────────

let cachedToken: { jwt: string; expiresAt: number } | null = null;

async function generateJWT(credentials: ASCCredentials): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Reuse cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expiresAt > now + 60) {
        return cachedToken.jwt;
    }

    // Import the private key for ES256 signing
    const privateKey = await importPKCS8(credentials.privateKey, 'ES256');

    const jwt = await new SignJWT({})
        .setProtectedHeader({
            alg: 'ES256',
            kid: credentials.keyId,
            typ: 'JWT',
        })
        .setIssuer(credentials.issuerId)
        .setIssuedAt(now)
        .setExpirationTime(now + JWT_TTL_SECONDS)
        .setAudience('appstoreconnect-v1')
        .sign(privateKey);

    cachedToken = { jwt, expiresAt: now + JWT_TTL_SECONDS };
    return jwt;
}

// ── API Fetch Helper ─────────────────────────────────────────────

async function ascFetch(
    path: string,
    credentials: ASCCredentials,
    options?: RequestInit,
): Promise<unknown> {
    const token = await generateJWT(credentials);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${ASC_BASE_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(
                `ASC API error ${response.status}: ${response.statusText}. ${errorBody.slice(0, 200)}`
            );
        }

        return response.json();
    } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('ASC API request timed out');
        }
        throw error;
    }
}

// ── Public API Methods ───────────────────────────────────────────

/**
 * Validate credentials by attempting to list apps.
 * Returns the team name on success.
 */
export async function validateCredentials(
    credentials: ASCCredentials,
): Promise<{ valid: boolean; teamName?: string; appCount?: number }> {
    try {
        const data = (await ascFetch('/apps?limit=1', credentials)) as {
            data: Array<{ attributes: { name: string } }>;
            meta?: { paging?: { total?: number } };
        };
        return {
            valid: true,
            teamName: data.data?.[0]?.attributes?.name || 'Connected',
            appCount: data.meta?.paging?.total,
        };
    } catch {
        return { valid: false };
    }
}

/**
 * List all apps accessible with these credentials.
 */
export async function getApp(credentials: ASCCredentials, appId: string): Promise<ASCApp | null> {
    const data = (await ascFetch(
        `/apps/${appId}?fields[apps]=bundleId,name,sku,primaryLocale`,
        credentials,
    )) as {
        data: {
            id: string;
            attributes: {
                bundleId: string;
                name: string;
                sku: string;
                primaryLocale: string;
            };
        };
    };

    return {
        id: data.data.id,
        bundleId: data.data.attributes.bundleId,
        name: data.data.attributes.name,
        sku: data.data.attributes.sku,
        primaryLocale: data.data.attributes.primaryLocale,
    };
}

export async function listApps(credentials: ASCCredentials): Promise<ASCApp[]> {
    const data = (await ascFetch(
        '/apps?fields[apps]=bundleId,name,sku,primaryLocale&limit=100',
        credentials,
    )) as {
        data: Array<{
            id: string;
            attributes: {
                bundleId: string;
                name: string;
                sku: string;
                primaryLocale: string;
            };
        }>;
    };

    return data.data.map((app) => ({
        id: app.id,
        bundleId: app.attributes.bundleId,
        name: app.attributes.name,
        sku: app.attributes.sku,
        primaryLocale: app.attributes.primaryLocale,
    }));
}

/**
 * Get the latest app version for a specific app.
 */
export async function getLatestVersion(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCAppVersion | null> {
    // Fetch recent versions — keep query simple to avoid PARAMETER_ERROR.ILLEGAL
    const data = (await ascFetch(
        `/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=5&fields[appStoreVersions]=versionString,platform,appStoreState,createdDate,copyright`,
        credentials,
    )) as {
        data: Array<{
            id: string;
            attributes: {
                versionString: string;
                platform: string;
                appStoreState: string;
                createdDate: string;
                copyright?: string;
            };
        }>;
    };

    if (!data.data.length) return null;

    // Prefer the version being prepared for submission, then most recent
    const preparing = data.data.find(
        (v) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION',
    );
    const v = preparing || data.data[0];
    return {
        id: v.id,
        versionString: v.attributes.versionString,
        platform: v.attributes.platform,
        appStoreState: v.attributes.appStoreState,
        createdDate: v.attributes.createdDate,
        copyright: v.attributes.copyright || null,
    };
}

/**
 * Get app metadata (localized info) for a specific app version.
 */
export async function getAppMetadata(
    credentials: ASCCredentials,
    versionId: string,
    locale?: string,
): Promise<ASCAppMetadata | null> {
    const localeFilter = locale ? `&filter[locale]=${locale}` : '';
    const data = (await ascFetch(
        `/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=1${localeFilter}`,
        credentials,
    )) as {
        data: Array<{
            attributes: {
                locale: string;
                name?: string;
                subtitle?: string;
                description?: string;
                keywords?: string;
                promotionalText?: string;
                privacyPolicyUrl?: string;
                supportUrl?: string;
                marketingUrl?: string;
            };
        }>;
    };

    if (!data.data.length) return null;

    const loc = data.data[0].attributes;
    return {
        name: loc.name || '',
        subtitle: loc.subtitle || null,
        description: loc.description || null,
        keywords: loc.keywords || null,
        promotionalText: loc.promotionalText || null,
        privacyUrl: loc.privacyPolicyUrl || null,
        supportUrl: loc.supportUrl || null,
        marketingUrl: loc.marketingUrl || null,
    };
}

/**
 * Get the app review detail (demo account, contact info, notes) for a specific version.
 */
export async function getReviewDetail(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCReviewDetail | null> {
    try {
        const data = (await ascFetch(
            `/appStoreVersions/${versionId}/appStoreReviewDetail`,
            credentials,
        )) as {
            data: {
                attributes: {
                    demoAccountRequired?: boolean;
                    demoAccountName?: string;
                    demoAccountPassword?: string;
                    contactFirstName?: string;
                    contactLastName?: string;
                    contactPhone?: string;
                    contactEmail?: string;
                    notes?: string;
                };
            };
        };

        const attrs = data.data?.attributes;
        if (!attrs) return null;

        return {
            demoAccountRequired: attrs.demoAccountRequired || false,
            demoAccountName: attrs.demoAccountName || null,
            demoAccountPassword: attrs.demoAccountPassword || null,
            contactFirstName: attrs.contactFirstName || null,
            contactLastName: attrs.contactLastName || null,
            contactPhone: attrs.contactPhone || null,
            contactEmail: attrs.contactEmail || null,
            notes: attrs.notes || null,
        };
    } catch {
        return null;
    }
}

/**
 * Get the app's general info (category, etc).
 * Uses `include` to get full category objects from the JSON:API `included` array.
 */
export async function getAppInfo(
    credentials: ASCCredentials,
    appId: string,
): Promise<{ categoryName: string | null; subcategoryName: string | null } | null> {
    try {
        const data = (await ascFetch(
            `/apps/${appId}/appInfos?limit=1&include=primaryCategory,secondaryCategory`,
            credentials,
        )) as {
            data: Array<{
                id: string;
                relationships?: {
                    primaryCategory?: { data?: { id: string; type: string } | null };
                    secondaryCategory?: { data?: { id: string; type: string } | null };
                };
            }>;
            included?: Array<{
                id: string;
                type: string;
                attributes?: { name?: string };
            }>;
        };

        if (!data.data.length) return null;

        const info = data.data[0];
        const included = data.included || [];

        // Look up category names from the included array
        const primaryId = info.relationships?.primaryCategory?.data?.id;
        const secondaryId = info.relationships?.secondaryCategory?.data?.id;

        const findName = (id: string | undefined) => {
            if (!id) return null;
            const match = included.find((inc) => inc.id === id);
            return match?.attributes?.name || null;
        };

        return {
            categoryName: findName(primaryId),
            subcategoryName: findName(secondaryId),
        };
    } catch {
        return null;
    }
}

/**
 * Get review submissions (history of submission states).
 */
export async function getReviewSubmissions(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCReviewSubmission[]> {
    try {
        const data = (await ascFetch(
            `/apps/${appId}/reviewSubmissions?limit=10&sort=-submittedDate`,
            credentials,
        )) as {
            data: Array<{
                id: string;
                attributes: {
                    state: string;
                    submittedDate: string | null;
                };
            }>;
        };

        return data.data.map((sub) => ({
            id: sub.id,
            state: sub.attributes.state,
            submittedDate: sub.attributes.submittedDate,
        }));
    } catch {
        return [];
    }
}

/**
 * Get app store version history for a specific app.
 * Returns up to 20 versions sorted by creation date (newest first).
 * Version states include: READY_FOR_SALE, REJECTED, DEVELOPER_REJECTED,
 * WAITING_FOR_REVIEW, IN_REVIEW, PREPARE_FOR_SUBMISSION, etc.
 */
export async function getAppStoreVersions(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCAppStoreVersion[]> {
    try {
        const data = (await ascFetch(
            `/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=20&sort=-createdDate&fields[appStoreVersions]=versionString,platform,appStoreState,createdDate`,
            credentials,
        )) as {
            data: Array<{
                id: string;
                attributes: {
                    versionString: string;
                    platform: string;
                    appStoreState: string;
                    createdDate: string;
                };
            }>;
        };

        return data.data.map((v) => ({
            id: v.id,
            versionString: v.attributes.versionString,
            platform: v.attributes.platform,
            appStoreState: v.attributes.appStoreState,
            createdDate: v.attributes.createdDate,
        }));
    } catch {
        return [];
    }
}
