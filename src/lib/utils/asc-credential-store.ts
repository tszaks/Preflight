/**
 * ASC Credential Storage
 *
 * Handles encryption/decryption of App Store Connect private keys
 * for secure storage in the database.
 *
 * Uses AES-256-GCM with a server-side encryption key.
 * The key content is encrypted before writing to the DB and
 * decrypted only when needed for API calls.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a private key for database storage.
 * Returns encrypted content and IV (both base64-encoded).
 */
export function encryptPrivateKey(
    privateKey: string,
    encryptionKey: string,
): { encrypted: string; iv: string } {
    const keyBuffer = Buffer.from(encryptionKey, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error('ASC_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Append auth tag to encrypted data
    return {
        encrypted: encrypted + '.' + authTag.toString('base64'),
        iv: iv.toString('base64'),
    };
}

/**
 * Decrypt a private key retrieved from the database.
 */
export function decryptPrivateKey(
    encryptedWithTag: string,
    iv: string,
    encryptionKey: string,
): string {
    const keyBuffer = Buffer.from(encryptionKey, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error('ASC_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }

    // Split encrypted data and auth tag
    const parts = encryptedWithTag.split('.');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
    }

    const encrypted = parts[0];
    const authTag = Buffer.from(parts[1], 'base64');

    const ivBuffer = Buffer.from(iv, 'base64');
    const decipher = createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
