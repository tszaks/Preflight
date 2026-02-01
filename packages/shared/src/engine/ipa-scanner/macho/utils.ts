/**
 * Binary reading utilities for Mach-O parsing.
 *
 * All reads use DataView which handles endianness correctly.
 * Mach-O files on iOS are always little-endian (ARM), but
 * FAT headers are big-endian, so we must handle both.
 */

import {
    MH_MAGIC_64, MH_MAGIC, MH_CIGAM_64, MH_CIGAM,
    FAT_MAGIC, FAT_CIGAM, FAT_MAGIC_64,
} from './types';

/**
 * Read a null-terminated C string from a DataView starting at the given offset.
 * Returns the string (without the null terminator).
 * Stops at maxLen characters to prevent runaway reads.
 */
export function readCString(view: DataView, offset: number, maxLen = 256): string {
    const bytes: number[] = [];
    for (let i = 0; i < maxLen; i++) {
        if (offset + i >= view.byteLength) break;
        const byte = view.getUint8(offset + i);
        if (byte === 0) break;
        bytes.push(byte);
    }
    return String.fromCharCode(...bytes);
}

/**
 * Determine byte order from the Mach-O magic number.
 * Returns true if the magic indicates a swapped (big-endian) Mach-O.
 */
export function isSwappedMagic(magic: number): boolean {
    return magic === MH_CIGAM_64 || magic === MH_CIGAM;
}

/**
 * Check if a magic number indicates a valid Mach-O file (any variant).
 */
export function isMachOMagic(magic: number): boolean {
    return (
        magic === MH_MAGIC_64 ||
        magic === MH_MAGIC ||
        magic === MH_CIGAM_64 ||
        magic === MH_CIGAM
    );
}

/**
 * Check if a magic number indicates a FAT/universal binary.
 */
export function isFatMagic(magic: number): boolean {
    return magic === FAT_MAGIC || magic === FAT_CIGAM || magic === FAT_MAGIC_64;
}

/**
 * Check if a magic number indicates a 64-bit Mach-O.
 */
export function is64Bit(magic: number): boolean {
    return magic === MH_MAGIC_64 || magic === MH_CIGAM_64;
}

/**
 * Decode a packed version number (major << 16 | minor << 8 | patch).
 * Used for minos and sdk fields in LC_BUILD_VERSION.
 */
export function decodeVersion(packed: number): string {
    const major = (packed >> 16) & 0xffff;
    const minor = (packed >> 8) & 0xff;
    const patch = packed & 0xff;
    if (patch === 0) return `${major}.${minor}`;
    return `${major}.${minor}.${patch}`;
}

/**
 * Extract the framework/library name from a dylib path.
 * e.g., "/usr/lib/libSystem.B.dylib" => "libSystem.B"
 * e.g., "/System/Library/Frameworks/UIKit.framework/UIKit" => "UIKit"
 */
export function extractDylibName(path: string): string {
    // Handle .framework paths
    const fwMatch = path.match(/([^/]+)\.framework\//);
    if (fwMatch) return fwMatch[1];

    // Handle .dylib paths
    const dylibMatch = path.match(/([^/]+)\.dylib$/);
    if (dylibMatch) return dylibMatch[1];

    // Handle .tbd paths
    const tbdMatch = path.match(/([^/]+)\.tbd$/);
    if (tbdMatch) return tbdMatch[1];

    // Fallback: last path component
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
}
