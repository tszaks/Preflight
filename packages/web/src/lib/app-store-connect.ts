/**
 * App Store Connect API Client
 * 
 * Uses JWT authentication with ES256 signing per Apple's requirements.
 */

import { SignJWT, importPKCS8 } from 'jose';

export interface ASCCredentials {
    keyId: string;
    issuerId: string;
    privateKey: string;
}

export interface ASCApp {
    id: string;
    bundleId: string;
    name: string;
    sku: string;
    primaryLocale: string;
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

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com/v1';
const JWT_TTL_SECONDS = 20 * 60;

let cachedToken: { jwt: string; expiresAt: number } | null = null;

async function generateJWT(credentials: ASCCredentials): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    if (cachedToken && cachedToken.expiresAt > now + 60) {
        return cachedToken.jwt;
    }

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

async function ascFetch(
    path: string,
    credentials: ASCCredentials,
    options?: RequestInit,
): Promise<any> {
    const token = await generateJWT(credentials);

    const response = await fetch(`${ASC_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`ASC API error ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    return response.json();
}

export async function validateCredentials(
    credentials: ASCCredentials,
): Promise<{ valid: boolean; teamName?: string }> {
    try {
        const data = await ascFetch('/apps?limit=1', credentials);
        return {
            valid: true,
            teamName: data.data?.[0]?.attributes?.name || 'Connected',
        };
    } catch {
        return { valid: false };
    }
}

export async function listApps(credentials: ASCCredentials): Promise<ASCApp[]> {
    const data = await ascFetch(
        '/apps?fields[apps]=bundleId,name,sku,primaryLocale&limit=100',
        credentials,
    );

    return data.data.map((app: any) => ({
        id: app.id,
        bundleId: app.attributes.bundleId,
        name: app.attributes.name,
        sku: app.attributes.sku,
        primaryLocale: app.attributes.primaryLocale,
    }));
}

export async function getAppDetails(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCApp | null> {
    try {
        const data = await ascFetch(`/apps/${appId}`, credentials);
        const app = data.data;
        return {
            id: app.id,
            bundleId: app.attributes.bundleId,
            name: app.attributes.name,
            sku: app.attributes.sku,
            primaryLocale: app.attributes.primaryLocale,
        };
    } catch {
        return null;
    }
}

export async function getLatestVersion(
    credentials: ASCCredentials,
    appId: string,
): Promise<{ id: string; versionString: string } | null> {
    const data = await ascFetch(
        `/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=5`,
        credentials,
    );

    if (!data.data.length) return null;

    const preparing = data.data.find(
        (v: any) => v.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION',
    );
    const v = preparing || data.data[0];
    return {
        id: v.id,
        versionString: v.attributes.versionString,
    };
}

export async function getAppInfo(
    credentials: ASCCredentials,
    appId: string,
): Promise<{ categoryId: string | null; subcategoryId: string | null } | null> {
    try {
        const data = await ascFetch(
            `/apps/${appId}/appInfos?limit=1&sort=-state`,
            credentials,
        );

        if (!data.data.length) return null;

        const info = data.data[0];
        return {
            categoryId: info.relationships?.primaryCategory?.data?.id || null,
            subcategoryId: info.relationships?.secondaryCategory?.data?.id || null,
        };
    } catch {
        return null;
    }
}

export async function getAppMetadata(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCAppMetadata | null> {
    const data = await ascFetch(
        `/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=1`,
        credentials,
    );

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

export interface ASCReviewDetail {
    signInRequired: boolean;
    demoAccountName: string | null;
    demoAccountPassword: string | null;
    contactFirstName: string | null;
    contactLastName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    notes: string | null;
}

export async function getReviewDetail(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCReviewDetail | null> {
    try {
        const data = await ascFetch(
            `/appStoreVersions/${versionId}/appStoreReviewDetail`,
            credentials,
        );

        if (!data.data) return null;

        const detail = data.data.attributes;
        return {
            signInRequired: detail.demoAccountRequired || false,
            demoAccountName: detail.demoAccountName || null,
            demoAccountPassword: detail.demoAccountPassword || null,
            contactFirstName: detail.contactFirstName || null,
            contactLastName: detail.contactLastName || null,
            contactEmail: detail.contactEmail || null,
            contactPhone: detail.contactPhone || null,
            notes: detail.notes || null,
        };
    } catch {
        return null;
    }
}
