import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
    depends('supabase:auth');

    const supabase = isBrowser()
        ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            global: { fetch }
        })
        : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            global: { fetch },
            cookies: {
                getAll() {
                    return data.cookies;
                }
            }
        });

    // On server: get fresh user data (validates JWT, refreshes tokens)
    // On browser: use server-provided data as source of truth since
    // httpOnly cookies aren't accessible to the browser client
    let user = data.user;
    let session = data.session;

    if (isBrowser()) {
        // Browser client can still manage auth state changes
        const { data: authData } = await supabase.auth.getSession();
        if (authData.session) {
            session = authData.session;
            user = authData.session.user;
        }
    } else {
        // Server-side: validate and refresh tokens
        const { data: { user: serverUser } } = await supabase.auth.getUser();
        if (serverUser) {
            user = serverUser;
        }
        const { data: { session: serverSession } } = await supabase.auth.getSession();
        if (serverSession) {
            session = serverSession;
        }
    }

    return { session, supabase, user, credits: data.credits };
};
