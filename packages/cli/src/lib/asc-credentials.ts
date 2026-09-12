import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'
import type { AscCredentials } from '@preflight/shared/engine/app-store-connect/client'

export interface AscCredentialOptions {
    ascKeyId?: string
    ascIssuerId?: string
    /** Path to the .p8 file, or the key contents. */
    ascKey?: string
}

/**
 * Resolve App Store Connect credentials from flags, then environment.
 *
 * Returns null when nothing is configured, which is the normal case: App Store
 * Connect checks are opt-in and a scan without them still works, it just reports
 * those areas as not checked rather than silently skipping them.
 *
 * The key is never echoed, logged, or written into the scan result.
 */
export function resolveAscCredentials(options: AscCredentialOptions): AscCredentials | null {
    const keyId = options.ascKeyId ?? process.env.ASC_KEY_ID
    const issuerId = options.ascIssuerId ?? process.env.ASC_ISSUER_ID
    const keyInput = options.ascKey ?? process.env.ASC_PRIVATE_KEY_PATH ?? process.env.ASC_PRIVATE_KEY

    if (!keyId || !issuerId || !keyInput) return null

    return { keyId, issuerId, privateKey: readKeyMaterial(keyInput) }
}

/**
 * Accept either the key contents or a path to the .p8.
 *
 * Both spellings are common: CI tends to hold the contents in a secret, while a
 * developer on a laptop has the downloaded file. Guessing wrong produces a
 * confusing 401, so accept both rather than making people find out.
 */
function readKeyMaterial(input: string): string {
    if (input.includes('BEGIN PRIVATE KEY')) return input

    const candidates = [
        resolve(input),
        resolve(homedir(), 'private_keys', input),
        resolve(homedir(), '.appstoreconnect', 'private_keys', input),
    ]

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return readFileSync(candidate, 'utf-8')
        }
    }

    // Hand back the input; the client turns an unparseable key into a clear error.
    return input
}

/** Human-readable note for why App Store Connect checks did not run. */
export const ASC_NOT_CONFIGURED_REASON =
    'No App Store Connect credentials. Pass --asc-key-id, --asc-issuer-id and --asc-key, or set ASC_KEY_ID, ASC_ISSUER_ID and ASC_PRIVATE_KEY_PATH.'
