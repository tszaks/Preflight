/**
 * Core Mach-O binary parser.
 *
 * Parses a Mach-O executable (or FAT/universal binary) to extract:
 * - Architecture info (arm64, x86_64)
 * - Linked frameworks (from LC_LOAD_DYLIB)
 * - Imported symbols (from LC_SYMTAB + LC_DYSYMTAB)
 * - Build version info (from LC_BUILD_VERSION)
 * - Encryption status (from LC_ENCRYPTION_INFO_64)
 *
 * This is a pure TypeScript implementation using DataView for all binary reads.
 * No native dependencies required.
 */

import {
    MH_MAGIC_64, MH_MAGIC, MH_CIGAM_64, MH_CIGAM,
    CPU_TYPE_ARM64, CPU_TYPE_X86_64,
    LC_SYMTAB, LC_DYSYMTAB, LC_LOAD_DYLIB, LC_LOAD_WEAK_DYLIB,
    LC_REEXPORT_DYLIB, LC_BUILD_VERSION, LC_ENCRYPTION_INFO_64,
    LC_ENCRYPTION_INFO, PLATFORM_NAMES,
    type MachOHeader, type FatArch, type SymtabCommand,
    type DysymtabCommand, type BuildVersionCommand, type EncryptionInfoCommand,
} from './types';

import {
    readCString, isSwappedMagic, isMachOMagic, isFatMagic,
    is64Bit, decodeVersion, extractDylibName,
} from './utils';

export interface MachOParseResult {
    arch: string;
    filetype: number;
    linkedFrameworks: string[];
    importedSymbols: string[];
    buildVersion?: {
        platform: string;
        minOS: string;
        sdk: string;
    };
    encrypted: boolean;
}

/**
 * Maximum number of imported symbols to extract.
 * Keeps memory bounded for very large binaries.
 */
const MAX_SYMBOLS = 20000;

/**
 * Parse a Mach-O binary (or FAT binary) from an ArrayBuffer.
 * For FAT binaries, selects the arm64 slice.
 */
export function parseMachO(buffer: ArrayBuffer): MachOParseResult {
    const view = new DataView(buffer);

    if (buffer.byteLength < 4) {
        throw new Error('Buffer too small to be a Mach-O binary');
    }

    // Read magic to determine format
    const magic = view.getUint32(0, false); // Try big-endian first

    if (isFatMagic(magic)) {
        return parseFatBinary(buffer);
    }

    // Also check little-endian magic
    const magicLE = view.getUint32(0, true);
    if (isMachOMagic(magicLE)) {
        return parseSingleMachO(buffer, 0);
    }
    if (isMachOMagic(magic)) {
        return parseSingleMachO(buffer, 0);
    }

    throw new Error(`Not a Mach-O binary (magic: 0x${magic.toString(16)})`);
}

/**
 * Parse a FAT (universal) binary. Reads the FAT header to find architecture
 * slices, then picks arm64 (preferred) or the first available slice.
 */
function parseFatBinary(buffer: ArrayBuffer): MachOParseResult {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false);

    // FAT headers are always big-endian
    const nfat = view.getUint32(4, false);

    if (nfat === 0 || nfat > 20) {
        throw new Error(`Invalid FAT binary: ${nfat} architectures`);
    }

    const arches: FatArch[] = [];
    let offset = 8;
    const is64Fat = magic === 0xcafebabf;

    for (let i = 0; i < nfat; i++) {
        if (is64Fat) {
            arches.push({
                cputype: view.getInt32(offset, false),
                cpusubtype: view.getInt32(offset + 4, false),
                offset: Number(view.getBigUint64(offset + 8, false)),
                size: Number(view.getBigUint64(offset + 16, false)),
                align: view.getUint32(offset + 24, false),
            });
            offset += 32;
        } else {
            arches.push({
                cputype: view.getInt32(offset, false),
                cpusubtype: view.getInt32(offset + 4, false),
                offset: view.getUint32(offset + 8, false),
                size: view.getUint32(offset + 12, false),
                align: view.getUint32(offset + 16, false),
            });
            offset += 20;
        }
    }

    // Prefer arm64
    const arm64 = arches.find(a => a.cputype === CPU_TYPE_ARM64);
    const target = arm64 || arches[0];

    if (!target || target.offset + target.size > buffer.byteLength) {
        throw new Error('FAT binary: selected slice is outside buffer bounds');
    }

    return parseSingleMachO(buffer, target.offset);
}

/**
 * Parse a single Mach-O slice starting at the given offset in the buffer.
 */
function parseSingleMachO(buffer: ArrayBuffer, startOffset: number): MachOParseResult {
    const view = new DataView(buffer);

    // Read magic to determine endianness
    const magicLE = view.getUint32(startOffset, true);
    const magicBE = view.getUint32(startOffset, false);
    const magic = isMachOMagic(magicLE) ? magicLE : magicBE;
    const littleEndian = !isSwappedMagic(magic);
    const bit64 = is64Bit(magic);

    // Parse header
    const header = readHeader(view, startOffset, littleEndian, bit64);

    const result: MachOParseResult = {
        arch: cpuTypeToString(header.cputype),
        filetype: header.filetype,
        linkedFrameworks: [],
        importedSymbols: [],
        encrypted: false,
    };

    // Header size: 28 bytes for 32-bit, 32 bytes for 64-bit
    const headerSize = bit64 ? 32 : 28;
    let cmdOffset = startOffset + headerSize;

    // Collected data from load commands (processed after all commands are read)
    let symtab: SymtabCommand | null = null;
    let dysymtab: DysymtabCommand | null = null;

    // Walk load commands
    for (let i = 0; i < header.ncmds; i++) {
        if (cmdOffset + 8 > buffer.byteLength) break;

        const cmd = view.getUint32(cmdOffset, littleEndian);
        const cmdsize = view.getUint32(cmdOffset + 4, littleEndian);

        if (cmdsize < 8 || cmdOffset + cmdsize > buffer.byteLength) break;

        switch (cmd) {
            case LC_LOAD_DYLIB:
            case LC_LOAD_WEAK_DYLIB:
            case LC_REEXPORT_DYLIB: {
                const nameOffset = view.getUint32(cmdOffset + 8, littleEndian);
                if (nameOffset < cmdsize) {
                    const name = readCString(view, cmdOffset + nameOffset, 512);
                    if (name) {
                        result.linkedFrameworks.push(extractDylibName(name));
                    }
                }
                break;
            }

            case LC_SYMTAB: {
                symtab = {
                    cmd,
                    cmdsize,
                    symoff: view.getUint32(cmdOffset + 8, littleEndian),
                    nsyms: view.getUint32(cmdOffset + 12, littleEndian),
                    stroff: view.getUint32(cmdOffset + 16, littleEndian),
                    strsize: view.getUint32(cmdOffset + 20, littleEndian),
                };
                break;
            }

            case LC_DYSYMTAB: {
                dysymtab = {
                    cmd,
                    cmdsize,
                    ilocalsym: view.getUint32(cmdOffset + 8, littleEndian),
                    nlocalsym: view.getUint32(cmdOffset + 12, littleEndian),
                    iextdefsym: view.getUint32(cmdOffset + 16, littleEndian),
                    nextdefsym: view.getUint32(cmdOffset + 20, littleEndian),
                    iundefsym: view.getUint32(cmdOffset + 24, littleEndian),
                    nundefsym: view.getUint32(cmdOffset + 28, littleEndian),
                };
                break;
            }

            case LC_BUILD_VERSION: {
                const bv: BuildVersionCommand = {
                    cmd,
                    cmdsize,
                    platform: view.getUint32(cmdOffset + 8, littleEndian),
                    minos: view.getUint32(cmdOffset + 12, littleEndian),
                    sdk: view.getUint32(cmdOffset + 16, littleEndian),
                    ntools: view.getUint32(cmdOffset + 20, littleEndian),
                };
                result.buildVersion = {
                    platform: PLATFORM_NAMES[bv.platform] || `Unknown (${bv.platform})`,
                    minOS: decodeVersion(bv.minos),
                    sdk: decodeVersion(bv.sdk),
                };
                break;
            }

            case LC_ENCRYPTION_INFO_64:
            case LC_ENCRYPTION_INFO: {
                const enc: EncryptionInfoCommand = {
                    cmd,
                    cmdsize,
                    cryptoff: view.getUint32(cmdOffset + 8, littleEndian),
                    cryptsize: view.getUint32(cmdOffset + 12, littleEndian),
                    cryptid: view.getUint32(cmdOffset + 16, littleEndian),
                };
                if (enc.cryptid !== 0) {
                    result.encrypted = true;
                }
                break;
            }
        }

        cmdOffset += cmdsize;
    }

    // Extract imported symbols using symtab + dysymtab
    if (symtab && dysymtab && !result.encrypted) {
        result.importedSymbols = extractImportedSymbols(
            view, symtab, dysymtab, startOffset, bit64, littleEndian
        );
    } else if (symtab && !result.encrypted) {
        // No dysymtab: fall back to reading all external symbols
        result.importedSymbols = extractAllExternalSymbols(
            view, symtab, startOffset, bit64, littleEndian
        );
    }

    return result;
}

function readHeader(
    view: DataView, offset: number, littleEndian: boolean, bit64: boolean
): MachOHeader {
    return {
        magic: view.getUint32(offset, littleEndian),
        cputype: view.getInt32(offset + 4, littleEndian),
        cpusubtype: view.getInt32(offset + 8, littleEndian),
        filetype: view.getUint32(offset + 12, littleEndian),
        ncmds: view.getUint32(offset + 16, littleEndian),
        sizeofcmds: view.getUint32(offset + 20, littleEndian),
        flags: view.getUint32(offset + 24, littleEndian),
        ...(bit64 ? { reserved: view.getUint32(offset + 28, littleEndian) } : {}),
    };
}

/**
 * Extract imported (undefined) symbols using LC_SYMTAB + LC_DYSYMTAB.
 * Only reads the undefined symbol range for performance.
 */
function extractImportedSymbols(
    view: DataView,
    symtab: SymtabCommand,
    dysymtab: DysymtabCommand,
    baseOffset: number,
    bit64: boolean,
    littleEndian: boolean,
): string[] {
    const symbols: string[] = [];
    const nlistSize = bit64 ? 16 : 12;
    const startIdx = dysymtab.iundefsym;
    const count = Math.min(dysymtab.nundefsym, MAX_SYMBOLS);

    const symTableStart = baseOffset + symtab.symoff;
    const strTableStart = baseOffset + symtab.stroff;

    for (let i = 0; i < count; i++) {
        const entryOffset = symTableStart + (startIdx + i) * nlistSize;

        if (entryOffset + nlistSize > view.byteLength) break;

        // nlist_64: n_strx(4) n_type(1) n_sect(1) n_desc(2) n_value(8)
        const strIdx = view.getUint32(entryOffset, littleEndian);
        const strOffset = strTableStart + strIdx;

        if (strOffset >= view.byteLength || strOffset < 0) continue;

        const name = readCString(view, strOffset, 512);
        if (name) {
            symbols.push(name);
        }
    }

    return symbols;
}

/**
 * Fallback: extract all external symbols when no dysymtab is available.
 * Checks the n_type field for N_EXT flag.
 */
function extractAllExternalSymbols(
    view: DataView,
    symtab: SymtabCommand,
    baseOffset: number,
    bit64: boolean,
    littleEndian: boolean,
): string[] {
    const symbols: string[] = [];
    const nlistSize = bit64 ? 16 : 12;
    const count = Math.min(symtab.nsyms, MAX_SYMBOLS * 2);

    const symTableStart = baseOffset + symtab.symoff;
    const strTableStart = baseOffset + symtab.stroff;

    for (let i = 0; i < count; i++) {
        const entryOffset = symTableStart + i * nlistSize;

        if (entryOffset + nlistSize > view.byteLength) break;

        const strIdx = view.getUint32(entryOffset, littleEndian);
        const nType = view.getUint8(entryOffset + 4);

        // Check if external and undefined (imported)
        const isExternal = (nType & 0x01) !== 0;
        const symbolType = nType & 0x0e;
        const isUndefined = symbolType === 0;

        if (isExternal && isUndefined) {
            const strOffset = strTableStart + strIdx;
            if (strOffset >= view.byteLength || strOffset < 0) continue;

            const name = readCString(view, strOffset, 512);
            if (name) {
                symbols.push(name);
                if (symbols.length >= MAX_SYMBOLS) break;
            }
        }
    }

    return symbols;
}

function cpuTypeToString(cputype: number): string {
    switch (cputype) {
        case CPU_TYPE_ARM64: return 'arm64';
        case CPU_TYPE_X86_64: return 'x86_64';
        default: return `unknown (0x${cputype.toString(16)})`;
    }
}
