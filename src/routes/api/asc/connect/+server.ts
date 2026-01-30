/**
 * POST /api/asc/connect — Save ASC credentials (validate first)
 * DELETE /api/asc/connect — Remove ASC connection
 * GET /api/asc/connect — Check if user has an active connection
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { Database } from '$lib/types/database';
import { validateCredentials, listApps } from '$lib/utils/app-store-connect';
import { encryptPrivateKey } from '$lib/utils/asc-credential-store';

// We use an env var for the encryption key. Fallback to a derived key from service role.
function getEncryptionKey(): string {
    // Try dedicated env var first
    const envKey = process.env.ASC_ENCRYPTION_KEY;
    if (envKey && envKey.length === 64) return envKey;

    // Fallback: derive from service role key (not ideal but functional)
    return createHash('sha256')
        .update(SUPABASE_SERVICE_ROLE_KEY)
        .digest('hex');
}

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    const body = await request.json();
    const { keyId, issuerId, privateKey } = body;

    if (!keyId || !issuerId || !privateKey) {
        throw error(400, 'Missing required fields: keyId, issuerId, privateKey');
    }

    // Validate the private key looks correct
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw error(400, 'Invalid private key format. Must be a PEM-encoded .p8 file content.');
    }

    // Validate credentials against Apple's API
    const validation = await validateCredentials({ keyId, issuerId, privateKey });
    if (!validation.valid) {
        throw error(400, 'Invalid credentials. Could not connect to App Store Connect.');
    }

    // Encrypt private key before storage
    const encryptionKey = getEncryptionKey();
    const { encrypted, iv } = encryptPrivateKey(privateKey, encryptionKey);

    // Store in database (upsert — one connection per user)
    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await serviceSupabase
        .from('asc_connections')
        .upsert(
            {
                user_id: user.id,
                key_id: keyId,
                issuer_id: issuerId,
                encrypted_private_key: encrypted,
                encryption_iv: iv,
                selected_app_id: null,
                selected_app_name: null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
        );

    if (dbError) {
        console.error('[ASC] Failed to save connection:', dbError);
        throw error(500, 'Failed to save connection');
    }

    // Fetch apps to return to the UI
    const apps = await listApps({ keyId, issuerId, privateKey });

    return json({
        success: true,
        teamName: validation.teamName,
        apps: apps.map((a) => ({ id: a.id, name: a.name, bundleId: a.bundleId })),
    });
};

export const DELETE: RequestHandler = async ({ locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await serviceSupabase
        .from('asc_connections')
        .delete()
        .eq('user_id', user.id);

    return json({ success: true });
};

export const GET: RequestHandler = async ({ locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    const { data } = await supabase
        .from('asc_connections')
        .select('key_id, selected_app_name, created_at')
        .eq('user_id', user.id)
        .single();

    return json({
        connected: !!data,
        appName: data?.selected_app_name || null,
        keyId: data?.key_id ? `...${data.key_id.slice(-4)}` : null,
        connectedAt: data?.created_at || null,
    });
};
