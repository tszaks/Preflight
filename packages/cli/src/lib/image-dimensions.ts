import { openSync, readSync, closeSync } from 'node:fs'

/**
 * Lightweight image dimension reader.
 * Reads only the minimal header bytes from PNG/JPEG files
 * to extract width and height without loading the entire image.
 */
export function getImageDimensions(filePath: string): { width: number; height: number } | null {
    const ext = filePath.toLowerCase()
    if (ext.endsWith('.png')) return getPngDimensions(filePath)
    if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) return getJpegDimensions(filePath)
    return null
}

/**
 * PNG: Width and height are stored in the IHDR chunk at bytes 16-23.
 * Layout: 8-byte signature, 4-byte length, 4-byte "IHDR", 4-byte width, 4-byte height
 */
function getPngDimensions(filePath: string): { width: number; height: number } | null {
    let fd: number | undefined
    try {
        fd = openSync(filePath, 'r')
        const buf = Buffer.alloc(24)
        const bytesRead = readSync(fd, buf, 0, 24, 0)
        if (bytesRead < 24) return null

        // Verify PNG signature: 137 80 78 71 13 10 26 10
        if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
            return null
        }

        const width = buf.readUInt32BE(16)
        const height = buf.readUInt32BE(20)
        return { width, height }
    } catch {
        return null
    } finally {
        if (fd !== undefined) closeSync(fd)
    }
}

/**
 * JPEG: Dimensions are in the SOF (Start Of Frame) marker.
 * We scan for SOF0 (0xFFC0) through SOF3 (0xFFC3), skipping other markers.
 * SOF layout after marker: 2-byte length, 1-byte precision, 2-byte height, 2-byte width
 */
function getJpegDimensions(filePath: string): { width: number; height: number } | null {
    let fd: number | undefined
    try {
        fd = openSync(filePath, 'r')
        // Read enough to find SOF marker (usually within first 64KB)
        const buf = Buffer.alloc(65536)
        const bytesRead = readSync(fd, buf, 0, buf.length, 0)
        if (bytesRead < 4) return null

        // Verify JPEG signature: FF D8
        if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null

        let offset = 2
        while (offset < bytesRead - 1) {
            if (buf[offset] !== 0xFF) {
                offset++
                continue
            }

            const marker = buf[offset + 1]

            // SOF markers: C0-C3 (baseline, extended, progressive, lossless)
            if (marker >= 0xC0 && marker <= 0xC3) {
                if (offset + 9 > bytesRead) return null
                const height = buf.readUInt16BE(offset + 5)
                const width = buf.readUInt16BE(offset + 7)
                return { width, height }
            }

            // Skip marker segment (read length and advance)
            if (marker === 0xD0 || marker === 0xD1 || marker === 0xD2 || marker === 0xD3 ||
                marker === 0xD4 || marker === 0xD5 || marker === 0xD6 || marker === 0xD7 ||
                marker === 0xD8 || marker === 0x01) {
                // Standalone markers (no length field)
                offset += 2
                continue
            }

            if (offset + 3 >= bytesRead) return null
            const segmentLength = buf.readUInt16BE(offset + 2)
            offset += 2 + segmentLength
        }

        return null
    } catch {
        return null
    } finally {
        if (fd !== undefined) closeSync(fd)
    }
}
