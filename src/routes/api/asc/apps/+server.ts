/**
 * GET /api/asc/apps — List apps from connected ASC account
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { listApps } from '$lib/utils/app-store-connect';
import { decryptPrivateKey } from '$lib/utils/asc-credential-store';

function getEncryptionKey(): string {
    const envKey = process.env.ASC_ENCRYPTION_KEY;
    if (envKey && envKey.length === 64) return envKey;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(SUPABASE_SERVICE_ROLE_KEY).digest('hex');
}

export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    // Fetch connection with service role (to read encrypted data)
    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: conn } = await serviceSupabase
        .from('asc_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!conn) {
        throw error(404, 'No ASC connection found. Connect your App Store Connect account first.');
    }

    // Decrypt private key
    const privateKey = decryptPrivateKey(
        conn.encrypted_private_key,
        conn.encryption_iv,
        getEncryptionKey(),
    );

    const apps = await listApps({
        keyId: conn.key_id,
        issuerId: conn.issuer_id,
        privateKey,
    });

    return json({
        apps: apps.map((a) => ({
            id: a.id,
            name: a.name,
            bundleId: a.bundleId,
        })),
    });
};
