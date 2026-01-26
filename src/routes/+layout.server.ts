import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
    const { session, user } = await safeGetSession();

    let credits = 0;
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Failed to fetch credits:', error);
        }
        credits = profile?.credits ?? 0;
    }

    return {
        session,
        user,
        credits,
        cookies: cookies.getAll(),
    };
};
