/**
 * Mach-O binary format constants and interfaces.
 *
 * The Mach-O (Mach Object) format is the executable format used by macOS, iOS,
 * watchOS, and tvOS. Every compiled iOS app contains a Mach-O binary that we
 * can parse to detect private API usage, linked frameworks, and build info.
 *
 * References:
 *   - /usr/include/mach-o/loader.h
 *   - /usr/include/mach-o/nlist.h
 *   - /usr/include/mach-o/fat.h
 */

// === Magic Numbers ===
// These identify the binary format at offset 0

/** 64-bit Mach-O (little-endian) */
export const MH_MAGIC_64 = 0xfeedfacf;
/** 32-bit Mach-O (little-endian) */
export const MH_MAGIC = 0xfeedface;
/** 64-bit Mach-O (big-endian / swapped) */
export const MH_CIGAM_64 = 0xcffaedfe;
/** 32-bit Mach-O (big-endian / swapped) */
export const MH_CIGAM = 0xcefaedfe;
/** FAT / Universal binary (big-endian) */
export const FAT_MAGIC = 0xcafebabe;
/** FAT / Universal binary (little-endian) */
export const FAT_CIGAM = 0xbebafeca;
/** 64-bit FAT (big-endian) */
export const FAT_MAGIC_64 = 0xcafebabf;

// === CPU Types ===
export const CPU_TYPE_ARM64 = 0x0100000c; // CPU_TYPE_ARM | CPU_ARCH_ABI64
export const CPU_TYPE_X86_64 = 0x01000007; // CPU_TYPE_X86 | CPU_ARCH_ABI64
export const CPU_TYPE_ARM = 0x0000000c;

// === File Types ===
export const MH_EXECUTE = 0x2; // Executable
export const MH_DYLIB = 0x6;  // Dynamic library

// === Load Command Types ===
export const LC_SEGMENT_64 = 0x19;
export const LC_SYMTAB = 0x02;
export const LC_DYSYMTAB = 0x0b;
export const LC_LOAD_DYLIB = 0x0c;
export const LC_LOAD_WEAK_DYLIB = 0x80000018;
export const LC_REEXPORT_DYLIB = 0x8000001f;
export const LC_BUILD_VERSION = 0x32;
export const LC_ENCRYPTION_INFO_64 = 0x2c;
export const LC_ENCRYPTION_INFO = 0x21;

// === Platform Constants (for LC_BUILD_VERSION) ===
export const PLATFORM_MACOS = 1;
export const PLATFORM_IOS = 2;
export const PLATFORM_TVOS = 3;
export const PLATFORM_WATCHOS = 4;
export const PLATFORM_MACCATALYST = 6;
export const PLATFORM_IOSSIMULATOR = 7;

export const PLATFORM_NAMES: Record<number, string> = {
    [PLATFORM_MACOS]: 'macOS',
    [PLATFORM_IOS]: 'iOS',
    [PLATFORM_TVOS]: 'tvOS',
    [PLATFORM_WATCHOS]: 'watchOS',
    [PLATFORM_MACCATALYST]: 'Mac Catalyst',
    [PLATFORM_IOSSIMULATOR]: 'iOS Simulator',
};

// === Nlist symbol types ===
export const N_EXT = 0x01;  // External symbol
export const N_UNDF = 0x00; // Undefined (imported) symbol type

// === Interfaces ===

export interface MachOHeader {
    magic: number;
    cputype: number;
    cpusubtype: number;
    filetype: number;
    ncmds: number;
    sizeofcmds: number;
    flags: number;
    reserved?: number; // 64-bit only
}

export interface FatArch {
    cputype: number;
    cpusubtype: number;
    offset: number;
    size: number;
    align: number;
}

export interface LoadCommand {
    cmd: number;
    cmdsize: number;
}

export interface SymtabCommand extends LoadCommand {
    symoff: number;   // Offset to symbol table
    nsyms: number;    // Number of symbols
    stroff: number;   // Offset to string table
    strsize: number;  // Size of string table
}

export interface DysymtabCommand extends LoadCommand {
    ilocalsym: number;
    nlocalsym: number;
    iextdefsym: number;
    nextdefsym: number;
    iundefsym: number;  // Index of first undefined (imported) symbol
    nundefsym: number;  // Number of undefined symbols
}

export interface DylibCommand extends LoadCommand {
    name_offset: number;
    timestamp: number;
    current_version: number;
    compat_version: number;
}

export interface BuildVersionCommand extends LoadCommand {
    platform: number;
    minos: number;   // Packed: major << 16 | minor << 8 | patch
    sdk: number;     // Packed same way
    ntools: number;
}

export interface EncryptionInfoCommand extends LoadCommand {
    cryptoff: number;
    cryptsize: number;
    cryptid: number;  // 0 = not encrypted, non-zero = encrypted
}
