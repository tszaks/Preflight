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
    /** Entitlements XML if found */
    entitlements?: string;
    /** App icon file names found */
    iconFiles: string[];
    /** Total IPA size in bytes */
    totalSize: number;
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
        iconFiles: [],
        totalSize: buffer.byteLength,
    };

    // Find the .app directory inside Payload/
    const appDir = findAppDirectory(zip);
    if (!appDir) {
        throw new Error('Invalid IPA: No .app bundle found in Payload/');
    }
    result.bundleName = appDir.split('/').filter(Boolean).pop() || '';

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
    zip.forEach((path) => {
        if (path.startsWith(frameworksDir) && path.endsWith('.framework/')) {
            const name = path.replace(frameworksDir, '').replace('.framework/', '');
            if (name && !name.includes('/')) {
                result.frameworks.push(name);
            }
        }
    });

    // Find entitlements (embedded.mobileprovision contains them, but they're also in the binary)
    const entFile = zip.file(`${appDir}archived-expanded-entitlements.xcent`);
    if (entFile) {
        result.entitlements = await entFile.async('string');
    }

    // Find app icons
    zip.forEach((path) => {
        if (path.startsWith(appDir) && path.includes('AppIcon') && path.endsWith('.png')) {
            const name = path.split('/').pop();
            if (name) result.iconFiles.push(name);
        }
    });

    return result;
}

/**
 * Find the .app directory path inside the IPA.
 * Expected structure: Payload/AppName.app/
 */
function findAppDirectory(zip: JSZip): string | null {
    let appDir: string | null = null;
    zip.forEach((path) => {
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
