/**
 * POST /api/asc/screenshot-proxy — Download screenshots from Apple CDN and save to Supabase Storage.
 *
 * Body: { urls: Array<{ url: string, fileName: string }> }
 * Returns: { paths: string[], signedUrls: Record<string, string> }
 *
 * This proxy exists because Apple CDN URLs have CORS restrictions.
 * The server downloads each image, uploads it to Supabase Storage,
 * and returns paths + signed URLs the client can display.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) throw error(401, 'Not authenticated');

    const body = await request.json();
    const { urls } = body as { urls: Array<{ url: string; fileName: string }> };
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        throw error(400, 'Missing or empty urls array');
    }

    // Cap at 10 screenshots (App Store limit)
    const toProcess = urls.slice(0, 10);

    const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const paths: string[] = [];
    const signedUrls: Record<string, string> = {};

    // Download and upload each screenshot in parallel
    const results = await Promise.allSettled(
        toProcess.map(async ({ url, fileName }, index) => {
            // Download from Apple CDN
            const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
            if (!response.ok) {
                throw new Error(`Failed to download ${fileName}: ${response.status}`);
            }

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            // Determine content type from response or fall back to filename extension
            const contentType = response.headers.get('content-type') ||
                (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

            // Upload to Supabase Storage
            const storagePath = `screenshots/${user.id}/asc_${index}_${fileName}`;
            const { error: uploadError } = await serviceSupabase.storage
                .from('screenshots')
                .upload(storagePath, arrayBuffer, {
                    contentType,
                    upsert: true, // Overwrite if re-importing
                });

            if (uploadError) {
                throw new Error(`Failed to upload ${fileName}: ${uploadError.message}`);
            }

            // Generate signed URL (1-hour expiry)
            const { data: signedUrlData } = await serviceSupabase.storage
                .from('screenshots')
                .createSignedUrl(storagePath, 3600);

            return {
                path: storagePath,
                signedUrl: signedUrlData?.signedUrl || null,
            };
        }),
    );

    // Collect successful results (skip failures gracefully)
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            paths.push(result.value.path);
            if (result.value.signedUrl) {
                signedUrls[result.value.path] = result.value.signedUrl;
            }
        }
    }

    return json({ paths, signedUrls });
};
