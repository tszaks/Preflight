import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();

    if (!user) {
        throw redirect(303, '/auth/login');
    }

    try {
        // Fetch user's credit balance
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        const credits = profile?.credits ?? 0;

        // Fetch submissions
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('id, app_name, review_type, status, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Dashboard query failed:', error.message);
            return { submissions: [], credits };
        }

        return {
            submissions: submissions ?? [],
            credits,
        };
    } catch (err) {
        console.error('Dashboard load error:', err);
        return { submissions: [], credits: 0 };
    }
};
