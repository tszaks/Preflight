import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();

    if (!user) {
        throw redirect(303, '/auth/login');
    }

    try {
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('id, app_name, review_type, status, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Dashboard query failed:', error.message);
            return { submissions: [] };
        }

        return {
            submissions: submissions ?? [],
        };
    } catch (err) {
        console.error('Dashboard load error:', err);
        return { submissions: [] };
    }
};
