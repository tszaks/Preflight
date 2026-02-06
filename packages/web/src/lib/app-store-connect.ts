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

type ASCAttributes = Record<string, unknown>;
type ASCRelationships = Record<string, unknown>;

interface ASCResource {
    id: string;
    attributes?: ASCAttributes;
    relationships?: ASCRelationships;
}

interface ASCResponse<T = ASCResource> {
    data: T[];
    included?: ASCResource[];
}

interface ASCResponseSingle<T = ASCResource> {
    data: T;
    included?: ASCResource[];
}

const getAttr = (resource: ASCResource): ASCAttributes => (resource.attributes ?? {}) as ASCAttributes;
const getRel = (resource: ASCResource): ASCRelationships => (resource.relationships ?? {}) as ASCRelationships;
const getString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const getOptionalString = (value: unknown): string | null =>
    (typeof value === 'string' && value.length > 0 ? value : null);
const getNumber = (value: unknown, fallback = 0): number =>
    (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const getBoolean = (value: unknown, fallback = false): boolean =>
    (typeof value === 'boolean' ? value : fallback);
const getDimensionString = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return String(Math.round(value));
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return /^[0-9]+$/.test(trimmed) ? trimmed : null;
    }
    return null;
};
const getFileExtension = (fileName: string | null, fallback: string): string => {
    if (!fileName) return fallback;
    const dot = fileName.lastIndexOf('.');
    if (dot < 0 || dot === fileName.length - 1) return fallback;
    const raw = fileName.slice(dot + 1).toLowerCase();
    // Apple's templates commonly expect jpg even when source says jpeg.
    return raw === 'jpeg' ? 'jpg' : raw;
};

function buildAssetTemplateUrl(
    templateUrl: string | null,
    opts: {
        width: unknown;
        height: unknown;
        fileName?: string | null;
        defaultFormat: string;
    },
): string | null {
    if (!templateUrl) return null;

    const width = getDimensionString(opts.width) ?? '0';
    const height = getDimensionString(opts.height) ?? '0';
    const format = getFileExtension(opts.fileName ?? null, opts.defaultFormat);

    return templateUrl
        .replace(/\{w(?:idth)?\}/gi, width)
        .replace(/\{h(?:eight)?\}/gi, height)
        .replace(/\{f(?:ormat)?\}/gi, format)
        .replace(/\{extension\}/gi, format)
        .replace(/\{c\}/gi, '')
        .replace(/\{[^}]+\}/g, '');
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

async function ascFetch<T = ASCResponse>(
    path: string,
    credentials: ASCCredentials,
    options?: RequestInit,
): Promise<T> {
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

    return response.json() as Promise<T>;
}

export async function validateCredentials(
    credentials: ASCCredentials,
): Promise<{ valid: boolean; teamName?: string }> {
    try {
        const data = await ascFetch<ASCResponse<ASCResource>>('/apps?limit=1', credentials);
        const apps = Array.isArray(data.data) ? data.data : [];
        const teamName = apps.length > 0 ? getString(getAttr(apps[0]).name, 'Connected') : 'Connected';
        return {
            valid: true,
            teamName,
        };
    } catch {
        return { valid: false };
    }
}

export async function listApps(credentials: ASCCredentials): Promise<ASCApp[]> {
    const data = await ascFetch<ASCResponse<ASCResource>>(
        '/apps?fields[apps]=bundleId,name,sku,primaryLocale&limit=100',
        credentials,
    );

    const apps = Array.isArray(data.data) ? data.data : [];
    return apps.map((app) => {
        const attr = getAttr(app);
        return {
            id: app.id,
            bundleId: getString(attr.bundleId),
            name: getString(attr.name),
            sku: getString(attr.sku),
            primaryLocale: getString(attr.primaryLocale),
        };
    });
}

export async function getAppDetails(
    credentials: ASCCredentials,
    appId: string,
): Promise<ASCApp & { privacyInfoConfigured?: boolean } | null> {
    try {
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(`/apps/${appId}`, credentials);
        const app = data.data;
        const attr = getAttr(app);
        const contentRights = attr.contentRightsDeclaration as Record<string, unknown> | undefined;

        console.log('getAppDetails - all app attributes:', {
            appId,
            keys: Object.keys(attr),
            contentRightsDeclaration: contentRights,
        });

        return {
            id: app.id,
            bundleId: getString(attr.bundleId),
            name: getString(attr.name),
            sku: getString(attr.sku),
            primaryLocale: getString(attr.primaryLocale),
            privacyInfoConfigured: typeof contentRights?.usesThirdPartyContent !== 'undefined',
        };
    } catch {
        return null;
    }
}

export async function getLatestVersion(
    credentials: ASCCredentials,
    appId: string,
): Promise<{ id: string; versionString: string; appStoreState: string } | null> {
    const data = await ascFetch<ASCResponse<ASCResource>>(
        `/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=5`,
        credentials,
    );

    const versions = Array.isArray(data.data) ? data.data : [];
    if (versions.length === 0) return null;

    const preparing = versions.find(
        (v) => getString(getAttr(v).appStoreState) === 'PREPARE_FOR_SUBMISSION',
    );
    const v = preparing || versions[0];
    const attr = getAttr(v);
    return {
        id: v.id,
        versionString: getString(attr.versionString),
        appStoreState: getString(attr.appStoreState, 'UNKNOWN'),
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/apps/${appId}/appInfos?limit=1`,
            credentials,
        );

        const infos = Array.isArray(data.data) ? data.data : [];
        if (infos.length === 0) return null;

        const info = infos[0];
        const attr = getAttr(info);
        const rel = getRel(info);
        const privacyUpdateDate = getOptionalString(attr.appPrivacyDetailsUpdateDate);
        const primaryCategory = (rel.primaryCategory as { data?: { id?: string } } | undefined)?.data?.id ?? null;
        const secondaryCategory = (rel.secondaryCategory as { data?: { id?: string } } | undefined)?.data?.id ?? null;

        return {
            categoryId: primaryCategory,
            subcategoryId: secondaryCategory,
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
        const infos = await ascFetch<ASCResponse<ASCResource>>(
            `/apps/${appId}/appInfos?limit=1`,
            credentials,
        );

        const infoList = Array.isArray(infos.data) ? infos.data : [];
        if (infoList.length === 0) return null;

        const infoId = infoList[0].id;
        const locs = await ascFetch<ASCResponse<ASCResource>>(
            `/appInfos/${infoId}/appInfoLocalizations?limit=10`,
            credentials,
        );

        const locList = Array.isArray(locs.data) ? locs.data : [];
        if (locList.length === 0) return null;

        // Find the first localization that has a privacy policy URL
        // Preferably 'en-US' but any will do if that's missing
        const validLoc = locList.find((l) => getOptionalString(getAttr(l).privacyPolicyUrl)) || locList[0];
        const attr = getAttr(validLoc);

        return {
            privacyPolicyUrl: getOptionalString(attr.privacyPolicyUrl),
            privacyChoicesUrl: getOptionalString(attr.privacyChoicesUrl),
            privacyPolicyText: getOptionalString(attr.privacyPolicyText),
        };
    } catch {
        return null;
    }
}

export async function getAppMetadata(
    credentials: ASCCredentials,
    versionId: string,
): Promise<ASCAppMetadata | null> {
    const data = await ascFetch<ASCResponse<ASCResource>>(
        `/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=1`,
        credentials,
    );

    const locs = Array.isArray(data.data) ? data.data : [];
    if (locs.length === 0) return null;

    const loc = getAttr(locs[0]);
    return {
        name: getString(loc.name),
        subtitle: getOptionalString(loc.subtitle),
        description: getOptionalString(loc.description),
        keywords: getOptionalString(loc.keywords),
        promotionalText: getOptionalString(loc.promotionalText),
        privacyUrl: getOptionalString(loc.privacyPolicyUrl),
        supportUrl: getOptionalString(loc.supportUrl),
        marketingUrl: getOptionalString(loc.marketingUrl),
        whatsNew: getOptionalString(loc.whatsNew),
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
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(
            `/appStoreVersions/${versionId}/appStoreReviewDetail`,
            credentials,
        );

        if (!data.data) return null;

        const detail = getAttr(data.data);
        return {
            signInRequired: getBoolean(detail.demoAccountRequired),
            demoAccountName: getOptionalString(detail.demoAccountName),
            demoAccountPassword: getOptionalString(detail.demoAccountPassword),
            contactFirstName: getOptionalString(detail.contactFirstName),
            contactLastName: getOptionalString(detail.contactLastName),
            contactEmail: getOptionalString(detail.contactEmail),
            contactPhone: getOptionalString(detail.contactPhone),
            notes: getOptionalString(detail.notes),
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
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(
            `/appStoreVersions/${versionId}`,
            credentials,
        );

        if (!data.data) return null;

        const attr = getAttr(data.data);
        return {
            versionString: getString(attr.versionString),
            copyright: getOptionalString(attr.copyright),
            releaseType: getOptionalString(attr.releaseType),
            earliestReleaseDate: getOptionalString(attr.earliestReleaseDate),
            appStoreState: getString(attr.appStoreState),
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
        const locs = await ascFetch<ASCResponse<ASCResource>>(
            `/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
            credentials,
        );

        const locList = Array.isArray(locs.data) ? locs.data : [];
        if (locList.length === 0) return [];

        const locId = locList[0].id;

        // Then get screenshot sets for the localization
        const sets = await ascFetch<ASCResponse<ASCResource>>(
            `/appStoreVersionLocalizations/${locId}/appScreenshotSets`,
            credentials,
        );

        const setList = Array.isArray(sets.data) ? sets.data : [];
        if (setList.length === 0) return [];

        // For each set, get the screenshots with their URLs
        const results: ASCScreenshotStatus[] = [];
        for (const set of setList) {
            const setAttr = getAttr(set);
            const deviceType = getString(setAttr.screenshotDisplayType, 'UNKNOWN');

            // Get screenshots in this set
            const screenshotsResp = await ascFetch<ASCResponse<ASCResource>>(
                `/appScreenshotSets/${set.id}/appScreenshots`,
                credentials,
            );

            const screenshotList = Array.isArray(screenshotsResp.data) ? screenshotsResp.data : [];
            const screenshots: ASCScreenshot[] = screenshotList.map((s) => {
                const attr = getAttr(s);
                // imageAsset contains the template URL and dimensions
                const imageAsset = (attr.imageAsset ?? {}) as Record<string, unknown>;
                const templateUrl = getOptionalString(imageAsset.templateUrl);
                const fileName = getString(attr.fileName);
                const url = buildAssetTemplateUrl(templateUrl, {
                    width: imageAsset.width,
                    height: imageAsset.height,
                    fileName,
                    defaultFormat: 'png',
                });

                return {
                    id: s.id,
                    fileName,
                    fileSize: getNumber(attr.fileSize),
                    url,
                    state: getString((attr.assetDeliveryState as Record<string, unknown> | undefined)?.state, 'UNKNOWN'),
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/apps/${appId}/subscriptionGroups`,
            credentials,
        );

        const groups = Array.isArray(data.data) ? data.data : [];
        if (groups.length === 0) return [];

        return groups.map((group) => ({
            id: group.id,
            name: getString(getAttr(group).referenceName, 'Unnamed Group'),
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/subscriptionGroups/${groupId}/subscriptions`,
            credentials,
        );

        const subs = Array.isArray(data.data) ? data.data : [];
        if (subs.length === 0) return [];

        return subs.map((sub) => {
            const attr = getAttr(sub);
            return {
                id: sub.id,
                name: getString(attr.name, 'Unnamed'),
                productId: getString(attr.productId),
                state: getString(attr.state, 'UNKNOWN'),
                groupId,
                groupName,
                subscriptionPeriod: getOptionalString(attr.subscriptionPeriod),
            };
        });
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/apps/${appId}/inAppPurchasesV2`,
            credentials,
        );

        const iaps = Array.isArray(data.data) ? data.data : [];
        if (iaps.length === 0) return [];

        return iaps.map((iap) => {
            const attr = getAttr(iap);
            return {
                id: iap.id,
                name: getString(attr.name, 'Unnamed'),
                productId: getString(attr.productId),
                inAppPurchaseType: getString(attr.inAppPurchaseType, 'UNKNOWN'),
                state: getString(attr.state, 'UNKNOWN'),
            };
        });
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
        const infos = await ascFetch<ASCResponse<ASCResource>>(
            `/apps/${appId}/appInfos?limit=1`,
            credentials,
        );

        console.log('getAgeRatingDeclaration - appInfos response:', {
            appId,
            hasData: !!infos.data,
            length: infos.data?.length || 0,
            firstId: infos.data?.[0]?.id || null
        });

        const infoList = Array.isArray(infos.data) ? infos.data : [];
        if (infoList.length === 0) return null;

        const infoId = infoList[0].id;

        // Then get the age rating declaration
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(
            `/appInfos/${infoId}/ageRatingDeclaration`,
            credentials,
        );

        if (!data.data) return null;

        const attr = getAttr(data.data);
        const violenceRealisticProlongedGraphicOrSadistic = getString(attr.violenceRealisticProlongedGraphicOrSadistic);
        const sexualContentGraphicAndNudity = getString(attr.sexualContentGraphicAndNudity);
        const gambling = getBoolean(attr.gambling);
        const seventeenPlus = getBoolean(attr.seventeenPlus);
        const violenceRealistic = getString(attr.violenceRealistic);
        const sexualContentOrNudity = getString(attr.sexualContentOrNudity);
        const matureOrSuggestiveThemes = getString(attr.matureOrSuggestiveThemes);
        const alcoholTobaccoOrDrugUseOrReferences = getString(attr.alcoholTobaccoOrDrugUseOrReferences);
        const gamblingSimulated = getString(attr.gamblingSimulated);
        const violenceCartoonOrFantasy = getString(attr.violenceCartoonOrFantasy);
        const profanityOrCrudeHumor = getString(attr.profanityOrCrudeHumor);
        const horrorOrFearThemes = getString(attr.horrorOrFearThemes);

        // Compute the rating if ASC doesn't return it directly
        // This mirrors Apple's age rating logic
        let computedRating = getString(attr.rating);
        if (!computedRating) {
            // Check for 17+ conditions
            if (
                violenceRealisticProlongedGraphicOrSadistic === 'FREQUENT_OR_INTENSE' ||
                sexualContentGraphicAndNudity === 'FREQUENT_OR_INTENSE' ||
                gambling === true ||
                seventeenPlus === true
            ) {
                computedRating = '17+';
            }
            // Check for 12+ conditions
            else if (
                violenceRealistic === 'INFREQUENT_OR_MILD' || violenceRealistic === 'FREQUENT_OR_INTENSE' ||
                sexualContentOrNudity === 'INFREQUENT_OR_MILD' || sexualContentOrNudity === 'FREQUENT_OR_INTENSE' ||
                matureOrSuggestiveThemes === 'FREQUENT_OR_INTENSE' ||
                alcoholTobaccoOrDrugUseOrReferences === 'FREQUENT_OR_INTENSE' ||
                gamblingSimulated === 'INFREQUENT_OR_MILD' || gamblingSimulated === 'FREQUENT_OR_INTENSE'
            ) {
                computedRating = '12+';
            }
            // Check for 9+ conditions
            else if (
                violenceCartoonOrFantasy === 'FREQUENT_OR_INTENSE' ||
                matureOrSuggestiveThemes === 'INFREQUENT_OR_MILD' ||
                profanityOrCrudeHumor === 'FREQUENT_OR_INTENSE' ||
                horrorOrFearThemes === 'FREQUENT_OR_INTENSE'
            ) {
                computedRating = '9+';
            }
            // Default to 4+
            else {
                computedRating = '4+';
            }
        }

        return {
            rating: computedRating || null,
            alcoholTobaccoOrDrugUseOrReferences: getOptionalString(attr.alcoholTobaccoOrDrugUseOrReferences),
            contests: getOptionalString(attr.contests),
            gamblingSimulated: getOptionalString(attr.gamblingSimulated),
            horrorOrFearThemes: getOptionalString(attr.horrorOrFearThemes),
            matureOrSuggestiveThemes: getOptionalString(attr.matureOrSuggestiveThemes),
            medicalOrTreatmentInformation: getOptionalString(attr.medicalOrTreatmentInformation),
            profanityOrCrudeHumor: getOptionalString(attr.profanityOrCrudeHumor),
            sexualContentGraphicAndNudity: getOptionalString(attr.sexualContentGraphicAndNudity),
            sexualContentOrNudity: getOptionalString(attr.sexualContentOrNudity),
            violenceCartoonOrFantasy: getOptionalString(attr.violenceCartoonOrFantasy),
            violenceRealistic: getOptionalString(attr.violenceRealistic),
            violenceRealisticProlongedGraphicOrSadistic: getOptionalString(attr.violenceRealisticProlongedGraphicOrSadistic),
            gambling,
            unrestrictedWebAccess: getBoolean(attr.unrestrictedWebAccess),
            kidsAgeBand: getOptionalString(attr.kidsAgeBand),
            seventeenPlus,
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
        const locs = await ascFetch<ASCResponse<ASCResource>>(
            `/appStoreVersions/${versionId}/appStoreVersionLocalizations`,
            credentials,
        );

        const locList = Array.isArray(locs.data) ? locs.data : [];
        if (locList.length === 0) return [];

        const locId = locList[0].id;

        // Get app preview sets
        const sets = await ascFetch<ASCResponse<ASCResource>>(
            `/appStoreVersionLocalizations/${locId}/appPreviewSets`,
            credentials,
        );

        const setList = Array.isArray(sets.data) ? sets.data : [];
        if (setList.length === 0) return [];

        const results: ASCAppPreviewStatus[] = [];
        for (const set of setList) {
            const deviceType = getString(getAttr(set).previewType, 'UNKNOWN');

            // Get previews in this set
            const previewsResp = await ascFetch<ASCResponse<ASCResource>>(
                `/appPreviewSets/${set.id}/appPreviews`,
                credentials,
            );

            const previewList = Array.isArray(previewsResp.data) ? previewsResp.data : [];
            const previews: ASCAppPreview[] = previewList.map((p) => {
                const attr = getAttr(p);
                const videoAsset = (attr.videoAsset ?? {}) as Record<string, unknown>;
                const templateUrl = getOptionalString(videoAsset.templateUrl);
                const fileName = getString(attr.fileName);
                const url = buildAssetTemplateUrl(templateUrl, {
                    width: videoAsset.width,
                    height: videoAsset.height,
                    fileName,
                    defaultFormat: 'm3u8',
                });

                return {
                    id: p.id,
                    fileName,
                    fileSize: getNumber(attr.fileSize),
                    url,
                    previewFrameTimeCode: getOptionalString(attr.previewFrameTimeCode),
                    mimeType: getOptionalString(attr.mimeType),
                    state: getString((attr.assetDeliveryState as Record<string, unknown> | undefined)?.state, 'UNKNOWN'),
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
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(
            `/apps/${appId}?fields[apps]=contentRightsDeclaration`,
            credentials,
        );

        if (!data.data) return null;

        const attr = getAttr(data.data);
        const declaration = getString(attr.contentRightsDeclaration);
        return {
            usesThirdPartyContent: declaration === 'USES_THIRD_PARTY_CONTENT',
            hasRightsToContent:
                declaration === 'DOES_NOT_USE_THIRD_PARTY_CONTENT' ||
                declaration === 'USES_THIRD_PARTY_CONTENT',
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/inAppPurchases/${iapId}/inAppPurchaseLocalizations`,
            credentials,
        );

        const locs = Array.isArray(data.data) ? data.data : [];
        if (locs.length === 0) return [];

        return locs.map((loc) => {
            const attr = getAttr(loc);
            return {
                iapId,
                locale: getString(attr.locale, 'en-US'),
                displayName: getString(attr.name),
                description: getString(attr.description),
            };
        });
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
        const data = await ascFetch<ASCResponse<ASCResource>>(
            `/subscriptions/${subscriptionId}/subscriptionLocalizations`,
            credentials,
        );

        const locs = Array.isArray(data.data) ? data.data : [];
        if (locs.length === 0) return [];

        return locs.map((loc) => {
            const attr = getAttr(loc);
            return {
                subscriptionId,
                locale: getString(attr.locale, 'en-US'),
                displayName: getString(attr.name),
                description: getString(attr.description),
            };
        });
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
        const data = await ascFetch<ASCResponseSingle<ASCResource>>(
            `/apps/${appId}/appAvailabilityV2`,
            credentials,
        );

        if (!data.data) return null;

        const attr = getAttr(data.data);
        return {
            availableInNewTerritories: getBoolean(attr.availableInNewTerritories),
            territoryCount: 0, // Would need separate territories fetch
        };
    } catch {
        return null;
    }
}
