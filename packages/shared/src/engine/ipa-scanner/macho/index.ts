/**
 * Mach-O analysis orchestrator.
 *
 * Entry point for analyzing the Mach-O executable inside an IPA.
 * Extracts the binary from the ZIP, parses it, and runs analysis.
 */

import type JSZip from 'jszip';
import { parseMachO } from './parser';
import { analyzeMachOBinary, type MachOAnalysisResult } from './analyzer';

/**
 * Extract and analyze the Mach-O executable from an IPA's ZIP archive.
 *
 * @param zip - The JSZip instance of the extracted IPA
 * @param appDir - The app directory path inside the ZIP (e.g., "Payload/MyApp.app/")
 * @param bundleName - The bundle name (e.g., "MyApp.app")
 */
export async function analyzeMachOFromIPA(
    zip: JSZip,
    appDir: string,
    bundleName: string,
): Promise<MachOAnalysisResult> {
    // Determine executable name: strip ".app" suffix from bundle name
    const executableName = bundleName.replace(/\.app$/, '');

    if (!executableName) {
        return {
            checks: [],
            metadata: {
                arch: 'unknown',
                linkedFrameworkCount: 0,
                importedSymbolCount: 0,
                importedSymbols: [],
                encrypted: false,
            },
        };
    }

    // Find the executable in the ZIP
    const executablePath = `${appDir}${executableName}`;
    const executableFile = zip.file(executablePath);

    if (!executableFile) {
        // Not all IPAs have the executable with the exact bundle name.
        // Try searching for any file at the app root that isn't a known metadata file.
        console.warn(`[Mach-O] Executable not found at ${executablePath}, skipping binary analysis`);
        return {
            checks: [],
            metadata: {
                arch: 'unknown',
                linkedFrameworkCount: 0,
                importedSymbolCount: 0,
                importedSymbols: [],
                encrypted: false,
            },
        };
    }

    // Extract the binary as ArrayBuffer
    const buffer = await executableFile.async('arraybuffer');

    // Guard: minimum viable size (at least a Mach-O header = 28 bytes)
    if (buffer.byteLength < 28) {
        console.warn(`[Mach-O] Binary too small (${buffer.byteLength} bytes), skipping`);
        return {
            checks: [],
            metadata: {
                arch: 'unknown',
                linkedFrameworkCount: 0,
                importedSymbolCount: 0,
                importedSymbols: [],
                encrypted: false,
            },
        };
    }

    // Parse Mach-O
    const parseResult = parseMachO(buffer);

    // Analyze
    return analyzeMachOBinary(parseResult, executableName);
}

// Re-export for external use
export type { MachOAnalysisResult } from './analyzer';
export type { MachOParseResult } from './parser';
