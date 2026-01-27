import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    // Ensure cookies persist across browser sessions
                    // Default to 1 year if Supabase doesn't provide maxAge
                    const maxAge = options?.maxAge ?? 60 * 60 * 24 * 365; // 1 year

                    event.cookies.set(name, value, {
                        ...options,
                        path: '/',
                        maxAge,
                        secure: !dev,
                        httpOnly: true,
                        sameSite: 'lax',
                    });
                });
            },
        },
    });

    event.locals.safeGetSession = async () => {
        // IMPORTANT: getUser() validates the JWT with Supabase servers AND
        // automatically refreshes expired tokens. getSession() only reads
        // from cookies without validation, which can return stale/expired data.
        // Always call getUser() first to ensure tokens are refreshed.
        const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser();

        if (userError || !user) {
            return { session: null, user: null };
        }

        // Now get the (potentially refreshed) session
        const { data: { session } } = await event.locals.supabase.auth.getSession();

        return { session, user };
    };

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        },
    });
};
