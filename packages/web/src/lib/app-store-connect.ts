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
    whatsNew: string | null;
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
): Promise<{ id: string; versionString: string; appStoreState: string } | null> {
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
        appStoreState: v.attributes.appStoreState || 'UNKNOWN',
    };
}

export async function getAppInfo(
    credentials: ASCCredentials,
    appId: string,
): Promise<{
    categoryId: string | null;
    subcategoryId: string | null;
    privacyConfigured: boolean;
    privacyUpdateDate: string | null;
} | null> {
    try {
        const data = await ascFetch(
            `/apps/${appId}/appInfos?limit=1`,
            credentials,
        );

        if (!data.data.length) return null;

        const info = data.data[0];
        const privacyUpdateDate = info.attributes?.appPrivacyDetailsUpdateDate || null;

        return {
            categoryId: info.relationships?.primaryCategory?.data?.id || null,
            subcategoryId: info.relationships?.secondaryCategory?.data?.id || null,
            privacyConfigured: privacyUpdateDate !== null,
            privacyUpdateDate,
        };
    } catch {
        return null;
    }
}

export async function getAppInfoLocalization(
    credentials: ASCCredentials,
    appId: string
): Promise<{ privacyPolicyUrl: string | null; privacyChoicesUrl: string | null; privacyPolicyText: string | null } | null> {
    try {
        const infos = await ascFetch(
            `/apps/${appId}/appInfos?limit=1&sort=-state`,
            credentials,
        );

        if (!infos.data.length) return null;

        const infoId = infos.data[0].id;
        const locs = await ascFetch(
            `/appInfos/${infoId}/appInfoLocalizations?limit=1`,
            credentials,
        );

        if (!locs.data.length) return null;

        const attr = locs.data[0].attributes;
        return {
            privacyPolicyUrl: attr.privacyPolicyUrl || null,
            privacyChoicesUrl: attr.privacyChoicesUrl || null,
            privacyPolicyText: attr.privacyPolicyText || null,
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
        whatsNew: loc.whatsNew || null,
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

// ─── Version Details (Copyright) ─────────────────────────────────────────

export interface ASCVersionDetails {
    versionString: string;
    copyright: string | null;
    releaseType: string | null;
    earliestReleaseDate: string | null;
    appStoreState: string;
}

export async function getVersionDetails(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCVersionDetails | null> {
    try {
        const data = await ascFetch(
            `/appStoreVersions/${versionId}`,
            credentials,
        );

        if (!data.data) return null;

        const attr = data.data.attributes;
        return {
            versionString: attr.versionString || '',
            copyright: attr.copyright || null,
            releaseType: attr.releaseType || null,
            earliestReleaseDate: attr.earliestReleaseDate || null,
            appStoreState: attr.appStoreState || '',
        };
    } catch {
        return null;
    }
}

// ─── Screenshot Status ───────────────────────────────────────────────────

export interface ASCScreenshotStatus {
    deviceType: string;
    count: number;
    screenshots: ASCScreenshot[];
}

export interface ASCScreenshot {
    id: string;
    fileName: string;
    fileSize: number;
    url: string | null;
    state: string;
}

export async function getScreenshotStatus(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCScreenshotStatus[]> {
    try {
        // First get the localizations for this version
        const locs = await ascFetch(
            `/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
            credentials,
        );

        if (!locs.data?.length) return [];

        const locId = locs.data[0].id;

        // Then get screenshot sets for the localization
        const sets = await ascFetch(
            `/appStoreVersionLocalizations/${locId}/appScreenshotSets`,
            credentials,
        );

        if (!sets.data?.length) return [];

        // For each set, get the screenshots with their URLs
        const results: ASCScreenshotStatus[] = [];
        for (const set of sets.data) {
            const deviceType = set.attributes?.screenshotDisplayType || 'UNKNOWN';

            // Get screenshots in this set
            const screenshotsResp = await ascFetch(
                `/appScreenshotSets/${set.id}/appScreenshots`,
                credentials,
            );

            const screenshots: ASCScreenshot[] = (screenshotsResp.data || []).map((s: any) => {
                const attr = s.attributes || {};
                // imageAsset contains the template URL and dimensions
                const imageAsset = attr.imageAsset || {};

                // Build the URL from template if available
                let url: string | null = null;
                if (imageAsset.templateUrl) {
                    // Template format: {url}/{width}x{height}{extension}
                    // We want the full resolution
                    url = imageAsset.templateUrl
                        .replace('{w}', imageAsset.width || '0')
                        .replace('{h}', imageAsset.height || '0')
                        .replace('{f}', 'png');
                }

                return {
                    id: s.id,
                    fileName: attr.fileName || '',
                    fileSize: attr.fileSize || 0,
                    url,
                    state: attr.assetDeliveryState?.state || 'UNKNOWN',
                };
            });

            results.push({
                deviceType,
                count: screenshots.length,
                screenshots,
            });
        }

        return results;
    } catch {
        return [];
    }
}

// ─── Subscription Groups & Subscriptions ─────────────────────────────────

export interface ASCSubscriptionGroup {
    id: string;
    name: string;
}

export interface ASCSubscription {
    id: string;
    name: string;
    productId: string;
    state: string;
    groupId: string;
    groupName?: string;
    subscriptionPeriod: string | null;
}

export async function getSubscriptionGroups(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCSubscriptionGroup[]> {
    try {
        const data = await ascFetch(
            `/apps/${appId}/subscriptionGroups`,
            credentials,
        );

        if (!data.data?.length) return [];

        return data.data.map((group: any) => ({
            id: group.id,
            name: group.attributes?.referenceName || 'Unnamed Group',
        }));
    } catch {
        return [];
    }
}

export async function getSubscriptions(
    credentials: ASCCredentials,
    groupId: string,
    groupName: string,
): Promise<ASCSubscription[]> {
    try {
        const data = await ascFetch(
            `/subscriptionGroups/${groupId}/subscriptions`,
            credentials,
        );

        if (!data.data?.length) return [];

        return data.data.map((sub: any) => ({
            id: sub.id,
            name: sub.attributes?.name || 'Unnamed',
            productId: sub.attributes?.productId || '',
            state: sub.attributes?.state || 'UNKNOWN',
            groupId,
            groupName,
            subscriptionPeriod: sub.attributes?.subscriptionPeriod || null,
        }));
    } catch {
        return [];
    }
}

// ─── In-App Purchases ────────────────────────────────────────────────────

export interface ASCInAppPurchase {
    id: string;
    name: string;
    productId: string;
    inAppPurchaseType: string;
    state: string;
}

export async function getInAppPurchases(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCInAppPurchase[]> {
    try {
        const data = await ascFetch(
            `/apps/${appId}/inAppPurchasesV2`,
            credentials,
        );

        if (!data.data?.length) return [];

        return data.data.map((iap: any) => ({
            id: iap.id,
            name: iap.attributes?.name || 'Unnamed',
            productId: iap.attributes?.productId || '',
            inAppPurchaseType: iap.attributes?.inAppPurchaseType || 'UNKNOWN',
            state: iap.attributes?.state || 'UNKNOWN',
        }));
    } catch {
        return [];
    }
}

// ─── Age Rating Declaration ──────────────────────────────────────────────

export interface ASCAgeRating {
    rating: string | null;
    alcoholTobaccoOrDrugUseOrReferences: string | null;
    contests: string | null;
    gamblingSimulated: string | null;
    horrorOrFearThemes: string | null;
    matureOrSuggestiveThemes: string | null;
    medicalOrTreatmentInformation: string | null;
    profanityOrCrudeHumor: string | null;
    sexualContentGraphicAndNudity: string | null;
    sexualContentOrNudity: string | null;
    violenceCartoonOrFantasy: string | null;
    violenceRealistic: string | null;
    violenceRealisticProlongedGraphicOrSadistic: string | null;
    gambling: boolean;
    unrestrictedWebAccess: boolean;
    kidsAgeBand: string | null;
    seventeenPlus: boolean;
}

export async function getAgeRatingDeclaration(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCAgeRating | null> {
    try {
        // First get the latest appInfo
        const infos = await ascFetch(
            `/apps/${appId}/appInfos?limit=1`,
            credentials,
        );

        console.log('getAgeRatingDeclaration - appInfos response:', {
            appId,
            hasData: !!infos.data,
            length: infos.data?.length || 0,
            firstId: infos.data?.[0]?.id || null
        });

        if (!infos.data?.length) return null;

        const infoId = infos.data[0].id;

        // Then get the age rating declaration
        const data = await ascFetch(
            `/appInfos/${infoId}/ageRatingDeclaration`,
            credentials,
        );

        if (!data.data) return null;

        const attr = data.data.attributes;

        // Compute the rating if ASC doesn't return it directly
        // This mirrors Apple's age rating logic
        let computedRating = attr.rating;
        if (!computedRating) {
            // Check for 17+ conditions
            if (
                attr.violenceRealisticProlongedGraphicOrSadistic === 'FREQUENT_OR_INTENSE' ||
                attr.sexualContentGraphicAndNudity === 'FREQUENT_OR_INTENSE' ||
                attr.gambling === true ||
                attr.seventeenPlus === true
            ) {
                computedRating = '17+';
            }
            // Check for 12+ conditions
            else if (
                attr.violenceRealistic === 'INFREQUENT_OR_MILD' || attr.violenceRealistic === 'FREQUENT_OR_INTENSE' ||
                attr.sexualContentOrNudity === 'INFREQUENT_OR_MILD' || attr.sexualContentOrNudity === 'FREQUENT_OR_INTENSE' ||
                attr.matureOrSuggestiveThemes === 'FREQUENT_OR_INTENSE' ||
                attr.alcoholTobaccoOrDrugUseOrReferences === 'FREQUENT_OR_INTENSE' ||
                attr.gamblingSimulated === 'INFREQUENT_OR_MILD' || attr.gamblingSimulated === 'FREQUENT_OR_INTENSE'
            ) {
                computedRating = '12+';
            }
            // Check for 9+ conditions
            else if (
                attr.violenceCartoonOrFantasy === 'FREQUENT_OR_INTENSE' ||
                attr.matureOrSuggestiveThemes === 'INFREQUENT_OR_MILD' ||
                attr.profanityOrCrudeHumor === 'FREQUENT_OR_INTENSE' ||
                attr.horrorOrFearThemes === 'FREQUENT_OR_INTENSE'
            ) {
                computedRating = '9+';
            }
            // Default to 4+
            else {
                computedRating = '4+';
            }
        }

        return {
            rating: computedRating,
            alcoholTobaccoOrDrugUseOrReferences: attr.alcoholTobaccoOrDrugUseOrReferences || null,
            contests: attr.contests || null,
            gamblingSimulated: attr.gamblingSimulated || null,
            horrorOrFearThemes: attr.horrorOrFearThemes || null,
            matureOrSuggestiveThemes: attr.matureOrSuggestiveThemes || null,
            medicalOrTreatmentInformation: attr.medicalOrTreatmentInformation || null,
            profanityOrCrudeHumor: attr.profanityOrCrudeHumor || null,
            sexualContentGraphicAndNudity: attr.sexualContentGraphicAndNudity || null,
            sexualContentOrNudity: attr.sexualContentOrNudity || null,
            violenceCartoonOrFantasy: attr.violenceCartoonOrFantasy || null,
            violenceRealistic: attr.violenceRealistic || null,
            violenceRealisticProlongedGraphicOrSadistic: attr.violenceRealisticProlongedGraphicOrSadistic || null,
            gambling: attr.gambling || false,
            unrestrictedWebAccess: attr.unrestrictedWebAccess || false,
            kidsAgeBand: attr.kidsAgeBand || null,
            seventeenPlus: attr.seventeenPlus || false,
        };
    } catch (e) {
        console.error('getAgeRatingDeclaration error:', e);
        return null;
    }
}

// ─── App Previews (Videos) ───────────────────────────────────────────────

export interface ASCAppPreview {
    id: string;
    fileName: string;
    fileSize: number;
    url: string | null;
    previewFrameTimeCode: string | null;
    mimeType: string | null;
    state: string;
}

export interface ASCAppPreviewStatus {
    deviceType: string;
    count: number;
    previews: ASCAppPreview[];
}

export async function getAppPreviewStatus(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCAppPreviewStatus[]> {
    try {
        // Get localizations for this version
        const locs = await ascFetch(
            `/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
            credentials,
        );

        if (!locs.data?.length) return [];

        const locId = locs.data[0].id;

        // Get app preview sets
        const sets = await ascFetch(
            `/appStoreVersionLocalizations/${locId}/appPreviewSets`,
            credentials,
        );

        if (!sets.data?.length) return [];

        const results: ASCAppPreviewStatus[] = [];
        for (const set of sets.data) {
            const deviceType = set.attributes?.previewType || 'UNKNOWN';

            // Get previews in this set
            const previewsResp = await ascFetch(
                `/appPreviewSets/${set.id}/appPreviews`,
                credentials,
            );

            const previews: ASCAppPreview[] = (previewsResp.data || []).map((p: any) => {
                const attr = p.attributes || {};
                const videoAsset = attr.videoAsset || {};

                let url: string | null = null;
                if (videoAsset.templateUrl) {
                    url = videoAsset.templateUrl
                        .replace('{w}', videoAsset.width || '0')
                        .replace('{h}', videoAsset.height || '0')
                        .replace('{f}', 'm3u8');
                }

                return {
                    id: p.id,
                    fileName: attr.fileName || '',
                    fileSize: attr.fileSize || 0,
                    url,
                    previewFrameTimeCode: attr.previewFrameTimeCode || null,
                    mimeType: attr.mimeType || null,
                    state: attr.assetDeliveryState?.state || 'UNKNOWN',
                };
            });

            results.push({
                deviceType,
                count: previews.length,
                previews,
            });
        }

        return results;
    } catch {
        return [];
    }
}

// ─── Content Rights ──────────────────────────────────────────────────────

export interface ASCContentRights {
    usesThirdPartyContent: boolean;
    hasRightsToContent: boolean;
}

export async function getContentRights(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCContentRights | null> {
    try {
        const data = await ascFetch(
            `/apps/${appId}?fields[apps]=contentRightsDeclaration`,
            credentials,
        );

        if (!data.data?.attributes) return null;

        const attr = data.data.attributes;
        return {
            usesThirdPartyContent: attr.contentRightsDeclaration === 'USES_THIRD_PARTY_CONTENT',
            hasRightsToContent: attr.contentRightsDeclaration === 'DOES_NOT_USE_THIRD_PARTY_CONTENT' ||
                attr.contentRightsDeclaration === 'USES_THIRD_PARTY_CONTENT',
        };
    } catch {
        return null;
    }
}

// ─── IAP Localization ────────────────────────────────────────────────────

export interface ASCIAPLocalization {
    iapId: string;
    locale: string;
    displayName: string;
    description: string;
}

export async function getIAPLocalizations(
    credentials: ASCCredentials,
    iapId: string,
): Promise<ASCIAPLocalization[]> {
    try {
        const data = await ascFetch(
            `/inAppPurchases/${iapId}/inAppPurchaseLocalizations`,
            credentials,
        );

        if (!data.data?.length) return [];

        return data.data.map((loc: any) => ({
            iapId,
            locale: loc.attributes?.locale || 'en-US',
            displayName: loc.attributes?.name || '',
            description: loc.attributes?.description || '',
        }));
    } catch {
        return [];
    }
}

// ─── Subscription Localization ───────────────────────────────────────────

export interface ASCSubscriptionLocalization {
    subscriptionId: string;
    locale: string;
    displayName: string;
    description: string;
}

export async function getSubscriptionLocalizations(
    credentials: ASCCredentials,
    subscriptionId: string,
): Promise<ASCSubscriptionLocalization[]> {
    try {
        const data = await ascFetch(
            `/subscriptions/${subscriptionId}/subscriptionLocalizations`,
            credentials,
        );

        if (!data.data?.length) return [];

        return data.data.map((loc: any) => ({
            subscriptionId,
            locale: loc.attributes?.locale || 'en-US',
            displayName: loc.attributes?.name || '',
            description: loc.attributes?.description || '',
        }));
    } catch {
        return [];
    }
}

// ─── App Availability & Pricing ──────────────────────────────────────────

export interface ASCAppAvailability {
    availableInNewTerritories: boolean;
    territoryCount: number;
}

export async function getAppAvailability(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCAppAvailability | null> {
    try {
        const data = await ascFetch(
            `/apps/${appId}/appAvailabilityV2`,
            credentials,
        );

        if (!data.data) return null;

        const attr = data.data.attributes || {};
        return {
            availableInNewTerritories: attr.availableInNewTerritories || false,
            territoryCount: 0, // Would need separate territories fetch
        };
    } catch {
        return null;
    }
}
