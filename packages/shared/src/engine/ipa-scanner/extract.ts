/**
 * IPA file extraction utilities.
 * An IPA is a ZIP archive with structure: Payload/AppName.app/...
 * We extract key files for analysis without needing the full binary.
 */
import JSZip from 'jszip';

export interface ExtractedIPA {
    /** The app bundle name (e.g., "MyApp.app") */
    bundleName: string;
    /** Raw Info.plist XML content from the built binary */
    infoPlist?: string;
    /** Raw PrivacyInfo.xcprivacy content */
    privacyManifest?: string;
    /** List of embedded framework names */
    frameworks: string[];
    /** Frameworks that are missing their own PrivacyInfo.xcprivacy (ITMS-91061) */
    frameworksMissingPrivacyManifest: string[];
    /** Entitlements XML if found */
    entitlements?: string;
    /** Embedded provisioning profile (CMS with plist payload) */
    mobileProvision?: string;
    /** App icon file names found */
    iconFiles: string[];
    /** App icon dimensions (PNG only) */
    iconDimensions: Record<string, { width: number; height: number }>;
    /** Whether Assets.car exists in the app bundle */
    hasAssetsCar: boolean;
    /** Total IPA size in bytes */
    totalSize: number;
    /** Minimum OS version reported by Mach-O analysis (if available) */
    minOSVersion?: string;
    /** The JSZip instance (for deferred binary extraction by Mach-O analyzer) */
    zip?: JSZip;
    /** The app directory path inside the ZIP (e.g., "Payload/MyApp.app/") */
    appDir?: string;
    /** Breakdown of IPA size by content type */
    sizeBreakdown?: {
        frameworksSize: number;
        assetsSize: number;
        executableSize: number;
        otherSize: number;
        largestFrameworks: Array<{ name: string; size: number }>;
    };
}

/**
 * Extract key files from an IPA buffer for analysis.
 * Does NOT extract the full binary — only metadata files we can parse.
 */
export async function extractIPA(buffer: ArrayBuffer): Promise<ExtractedIPA> {
    const zip = await JSZip.loadAsync(buffer);
    const result: ExtractedIPA = {
        bundleName: '',
        frameworks: [],
        frameworksMissingPrivacyManifest: [],
        iconFiles: [],
        iconDimensions: {},
        hasAssetsCar: false,
        totalSize: buffer.byteLength,
        zip,
        appDir: '',
    };

    // Find the .app directory inside Payload/
    const appDir = findAppDirectory(zip);
    if (!appDir) {
        throw new Error('Invalid IPA: No .app bundle found in Payload/');
    }
    result.bundleName = appDir.split('/').filter(Boolean).pop() || '';
    result.appDir = appDir;

    // Extract Info.plist
    const plistFile = zip.file(`${appDir}Info.plist`);
    if (plistFile) {
        result.infoPlist = await plistFile.async('string');
    }

    // Extract PrivacyInfo.xcprivacy
    const privacyFile = zip.file(`${appDir}PrivacyInfo.xcprivacy`);
    if (privacyFile) {
        result.privacyManifest = await privacyFile.async('string');
    }

    // Find embedded frameworks
    const frameworksDir = `${appDir}Frameworks/`;
    zip.forEach((path: string) => {
        if (path.startsWith(frameworksDir) && path.endsWith('.framework/')) {
            const name = path.replace(frameworksDir, '').replace('.framework/', '');
            if (name && !name.includes('/')) {
                result.frameworks.push(name);
            }
        }
    });

    // Check each framework for its own PrivacyInfo.xcprivacy (ITMS-91061)
    for (const fw of result.frameworks) {
        const fwPrivacyPath = `${frameworksDir}${fw}.framework/PrivacyInfo.xcprivacy`;
        const hasPrivacyManifest = zip.file(fwPrivacyPath) !== null;
        if (!hasPrivacyManifest) {
            result.frameworksMissingPrivacyManifest.push(fw);
        }
    }

    // Find entitlements (embedded.mobileprovision contains them, but they're also in the binary)
    const entFile = zip.file(`${appDir}archived-expanded-entitlements.xcent`);
    if (entFile) {
        result.entitlements = await entFile.async('string');
    }

    // Extract embedded.mobileprovision (for provisioning profile checks)
    const provFile = zip.file(`${appDir}embedded.mobileprovision`);
    if (provFile) {
        result.mobileProvision = await provFile.async('string');
    }

    // Find app icons + asset catalog
    const iconPaths: string[] = [];
    zip.forEach((path: string) => {
        if (path === `${appDir}Assets.car`) {
            result.hasAssetsCar = true;
        }
        if (path.startsWith(appDir) && path.includes('AppIcon') && path.endsWith('.png')) {
            const name = path.split('/').pop();
            if (name) result.iconFiles.push(name);
            iconPaths.push(path);
        }
    });

    if (iconPaths.length > 0) {
        await Promise.all(
            iconPaths.map(async (path) => {
                const file = zip.file(path);
                if (!file) return;
                const data = await file.async('uint8array');
                const dims = readPngDimensions(data);
                if (!dims) return;
                const name = path.split('/').pop() || path;
                result.iconDimensions[name] = dims;
            })
        );
    }

    // Calculate size breakdown by content type
    const executableName = result.bundleName.replace(/\.app$/, '');
    const executablePath = `${appDir}${executableName}`;
    const assetExtensions = /\.(car|png|jpg|jpeg|gif|mp4|mov|mp3|wav|pdf)$/i;

    let frameworksSize = 0;
    let assetsSize = 0;
    let executableSize = 0;
    let otherSize = 0;
    const frameworkSizeMap = new Map<string, number>();

    zip.forEach((path: string, file: JSZip.JSZipObject) => {
        if (file.dir) return;

        // JSZip exposes _data.uncompressedSize for entries (compressed size not directly available,
        // so we use the uncompressed size as reported by the ZIP central directory)
        const entrySize = (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;

        if (path === executablePath) {
            executableSize = entrySize;
        } else if (path.startsWith(frameworksDir)) {
            frameworksSize += entrySize;
            // Track per-framework sizes
            const relativePath = path.replace(frameworksDir, '');
            const fwName = relativePath.split('/')[0]?.replace('.framework', '') || '';
            if (fwName) {
                frameworkSizeMap.set(fwName, (frameworkSizeMap.get(fwName) || 0) + entrySize);
            }
        } else if (
            assetExtensions.test(path) ||
            path.includes('Assets.car') ||
            path.includes('/Assets/')
        ) {
            assetsSize += entrySize;
        } else {
            otherSize += entrySize;
        }
    });

    // Sort frameworks by size descending
    const largestFrameworks = Array.from(frameworkSizeMap.entries())
        .map(([name, size]) => ({ name, size }))
        .sort((a, b) => b.size - a.size);

    // Only report size breakdown if we actually got meaningful data from JSZip internals.
    // _data.uncompressedSize is an internal API — if it stops working, all sizes will be 0.
    const calculatedTotal = frameworksSize + assetsSize + executableSize + otherSize;
    if (calculatedTotal > 0) {
        result.sizeBreakdown = {
            frameworksSize,
            assetsSize,
            executableSize,
            otherSize,
            largestFrameworks,
        };
    }

    return result;
}

/**
 * Find the .app directory path inside the IPA.
 * Expected structure: Payload/AppName.app/
 */
function findAppDirectory(zip: JSZip): string | null {
    let appDir: string | null = null;
    zip.forEach((path: string) => {
        if (!appDir && path.startsWith('Payload/') && path.endsWith('.app/')) {
            // Only match top-level .app directory (no nested slashes between Payload/ and .app/)
            const inner = path.replace('Payload/', '').replace('.app/', '');
            if (!inner.includes('/')) {
                appDir = path;
            }
        }
    });
    return appDir;
}

function readPngDimensions(data: Uint8Array): { width: number; height: number } | null {
    if (data.length < 24) return null;
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < signature.length; i += 1) {
        if (data[i] !== signature[i]) return null;
    }
    const type = String.fromCharCode(data[12], data[13], data[14], data[15]);
    if (type !== 'IHDR') return null;

    const width = (
        (data[16] << 24) |
        (data[17] << 16) |
        (data[18] << 8) |
        data[19]
    ) >>> 0;
    const height = (
        (data[20] << 24) |
        (data[21] << 16) |
        (data[22] << 8) |
        data[23]
    ) >>> 0;

    if (width === 0 || height === 0) return null;
    return { width, height };
}
