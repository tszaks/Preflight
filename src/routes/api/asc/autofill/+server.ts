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
    const [version, appInfo] = await Promise.all([
        getLatestVersion(credentials, appId).catch(() => null),
        getAppInfo(credentials, appId).catch(() => null),
    ]);

    // Fetch localized metadata if we have a version
    let metadata = null;
    if (version) {
        metadata = await getAppMetadata(credentials, version.id).catch(() => null);
    }

    // Save selected app to connection record
    await serviceSupabase
        .from('asc_connections')
        .update({
            selected_app_id: appId,
            selected_app_name: metadata?.name || null,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

    // Map ASC category IDs to human-readable names (partial mapping)
    const categoryMap: Record<string, string> = {
        'BUSINESS': 'Business',
        'DEVELOPER_TOOLS': 'Developer Tools',
        'EDUCATION': 'Education',
        'ENTERTAINMENT': 'Entertainment',
        'FINANCE': 'Finance',
        'FOOD_AND_DRINK': 'Food & Drink',
        'GAMES': 'Games',
        'GRAPHICS_AND_DESIGN': 'Graphics & Design',
        'HEALTH_AND_FITNESS': 'Health & Fitness',
        'LIFESTYLE': 'Lifestyle',
        'MEDICAL': 'Medical',
        'MUSIC': 'Music',
        'NAVIGATION': 'Navigation',
        'NEWS': 'News',
        'PHOTO_AND_VIDEO': 'Photo & Video',
        'PRODUCTIVITY': 'Productivity',
        'REFERENCE': 'Reference',
        'SHOPPING': 'Shopping',
        'SOCIAL_NETWORKING': 'Social Networking',
        'SPORTS': 'Sports',
        'TRAVEL': 'Travel',
        'UTILITIES': 'Utilities',
        'WEATHER': 'Weather',
    };

    return json({
        success: true,
        data: {
            // Basic info
            app_name: metadata?.name || '',
            subtitle: metadata?.subtitle || '',
            description: metadata?.description || '',
            keywords: metadata?.keywords || '',
            promotional_text: metadata?.promotionalText || '',

            // URLs
            privacy_url: metadata?.privacyUrl || '',
            support_url: metadata?.supportUrl || '',
            marketing_url: metadata?.marketingUrl || '',

            // Category (best-effort mapping)
            category: appInfo?.categoryId
                ? categoryMap[appInfo.categoryId] || appInfo.categoryId
                : '',
            secondary_category: appInfo?.subcategoryId
                ? categoryMap[appInfo.subcategoryId] || appInfo.subcategoryId
                : '',

            // Version info
            version: version?.versionString || '',
            app_store_state: version?.appStoreState || '',
        },
    });
};
