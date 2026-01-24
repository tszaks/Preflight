import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        throw redirect(303, '/login');
    }

    // Fetch user's submissions with associated report IDs
    const { data: submissions } = await supabase
        .from('submissions')
        .select(`
            id,
            app_name,
            subtitle,
            review_type,
            status,
            created_at,
            completed_at,
            reports(id)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    // Flatten the report ID for easy access in the template
    const formatted = (submissions || []).map((s: any) => ({
        ...s,
        report_id: s.reports?.[0]?.id || null,
    }));

    return { submissions: formatted };
};
