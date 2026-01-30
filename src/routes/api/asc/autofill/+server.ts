/**
 * POST /api/asc/autofill — Fetch metadata for a specific app to auto-fill the form.
 *
 * Body: { appId: string }
 * Returns: Structured data matching the submit form fields.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type { Database } from '$lib/types/database';
import {
    getApp,
    getLatestVersion,
    getAppMetadata,
    getAppInfo,
    type ASCCredentials,
} from '$lib/utils/app-store-connect';
import { decryptPrivateKey } from '$lib/utils/asc-credential-store';

function getEncryptionKey(): string {
    const envKey = process.env.ASC_ENCRYPTION_KEY;
    if (envKey && envKey.length === 64) return envKey;
    return createHash('sha256').update(SUPABASE_SERVICE_ROLE_KEY).digest('hex');
}

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    const body = await request.json();
    const { appId } = body;
    if (!appId) throw error(400, 'Missing appId');

    // Fetch and decrypt credentials
    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: conn } = await serviceSupabase
        .from('asc_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!conn) throw error(404, 'No ASC connection found');

    const privateKey = decryptPrivateKey(
        conn.encrypted_private_key,
        conn.encryption_iv,
        getEncryptionKey(),
    );

    const credentials: ASCCredentials = {
        keyId: conn.key_id,
        issuerId: conn.issuer_id,
        privateKey,
    };

    // Fetch app data in parallel (each call is resilient — partial data is fine)
    const [app, version, appInfo] = await Promise.all([
        getApp(credentials, appId).catch(() => null),
        getLatestVersion(credentials, appId).catch(() => null),
        getAppInfo(credentials, appId).catch(() => null),
    ]);

    // Fetch localized metadata if we have a version
    let metadata = null;
    if (version) {
        metadata = await getAppMetadata(credentials, version.id).catch(() => null);
    }

    // Save selected app to connection record (prefer app-level name over localized)
    const resolvedAppName = app?.name || metadata?.name || null;
    await serviceSupabase
        .from('asc_connections')
        .update({
            selected_app_id: appId,
            selected_app_name: resolvedAppName,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

    return json({
        success: true,
        data: {
            // Basic info (app-level name > localized name)
            app_name: app?.name || metadata?.name || '',
            subtitle: metadata?.subtitle || '',
            description: metadata?.description || '',
            keywords: metadata?.keywords || '',
            promotional_text: metadata?.promotionalText || '',

            // URLs
            privacy_url: metadata?.privacyUrl || '',
            support_url: metadata?.supportUrl || '',
            marketing_url: metadata?.marketingUrl || '',

            // Category (names resolved directly from Apple's API)
            category: appInfo?.categoryName || '',
            secondary_category: appInfo?.subcategoryName || '',

            // Version info
            version: version?.versionString || '',
            app_store_state: version?.appStoreState || '',
        },
    });
};
