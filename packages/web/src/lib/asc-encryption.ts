import { createHash } from 'crypto'

/**
 * Get the encryption key for ASC credential storage.
 * Uses ASC_ENCRYPTION_KEY env var if available (64-char hex),
 * otherwise derives one from the Supabase service role key.
 */
export function getEncryptionKey(): string {
    const envKey = process.env.ASC_ENCRYPTION_KEY
    if (envKey && envKey.length === 64) return envKey

    return createHash('sha256')
        .update(process.env.SUPABASE_SERVICE_ROLE_KEY!)
        .digest('hex')
}
