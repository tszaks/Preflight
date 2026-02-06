/**
 * Project Scanner - Auto-detects Xcode project files
 *
 * Uses the browser's webkitdirectory API to scan a folder and find:
 * - Info.plist (app configuration)
 * - PrivacyInfo.xcprivacy (privacy manifest, required iOS 17+)
 */

export interface ScanResults {
  infoPlist: File | null;
  infoPlistPath: string | null;
  privacyManifest: File | null;
  privacyManifestPath: string | null;
  ipaBinary: File | null;
  ipaBinaryPath: string | null;
  projectName: string | null;
}

/**
 * Folders to skip during scanning (build artifacts, dependencies, etc.)
 */
const SKIP_PATTERNS = [
  '/build/',
  '/deriveddata/',
  '/pods/',
  '/.build/',
  '/node_modules/',
  '/xcuserdata/',
  '/xcshareddata/',
  '/.git/',
  '/carthage/',
  '/spm_packages/',
];

/**
 * Scan an Xcode project folder for configuration files
 */
export function scanProjectFolder(files: FileList): ScanResults {
  const results: ScanResults = {
    infoPlist: null,
    infoPlistPath: null,
    privacyManifest: null,
    privacyManifestPath: null,
    ipaBinary: null,
    ipaBinaryPath: null,
    projectName: null,
  };

  // Track candidates for Info.plist (may find multiple)
  const infoPlistCandidates: Array<{ file: File; path: string; depth: number; priority: number }> = [];

  for (const file of files) {
    const path = file.webkitRelativePath;
    const pathLower = path.toLowerCase();

    // Skip build artifacts and dependencies
    if (SKIP_PATTERNS.some(pattern => pathLower.includes(pattern))) {
      continue;
    }

    // Extract project name from root folder
    if (!results.projectName) {
      const rootFolder = path.split('/')[0];
      if (rootFolder) {
        results.projectName = rootFolder;
      }
    }

    // Find Privacy Manifest (.xcprivacy files)
    if (file.name.endsWith('.xcprivacy')) {
      // Prefer PrivacyInfo.xcprivacy specifically
      if (!results.privacyManifest || file.name === 'PrivacyInfo.xcprivacy') {
        results.privacyManifest = file;
        results.privacyManifestPath = path;
      }
    }

    // Find Info.plist - collect all candidates
    if (file.name === 'Info.plist') {
      const depth = path.split('/').length;
      let priority = 0;

      // Higher priority for files in expected locations
      if (pathLower.includes('/resources/')) priority += 2;
      if (!pathLower.includes('/test')) priority += 1;
      if (!pathLower.includes('extension')) priority += 1;

      // Prefer shallower paths (closer to project root)
      infoPlistCandidates.push({ file, path, depth, priority });
    }

    // Find IPA Binary
    if (file.name.endsWith('.ipa')) {
      // Prioritize IPAs that aren't in temporary build folders if possible,
      // but if we find one, we should probably take it.
      if (!results.ipaBinary) {
        results.ipaBinary = file;
        results.ipaBinaryPath = path;
      }
    }
  }

  // Select best Info.plist candidate
  if (infoPlistCandidates.length > 0) {
    // Sort by priority (desc), then depth (asc)
    infoPlistCandidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.depth - b.depth;
    });

    results.infoPlist = infoPlistCandidates[0].file;
    results.infoPlistPath = infoPlistCandidates[0].path;
  }

  return results;
}
