import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    if (!user) {
        throw redirect(303, '/auth/login');
    }

    const { data: report, error: reportError } = await supabase
        .from('reports')
        .select(`
            *,
            submissions!inner(
                id,
                app_name,
                subtitle,
                description,
                keywords,
                category,
                age_rating,
                privacy_url,
                support_url,
                marketing_url,
                review_type,
                created_at,
                completed_at,
                user_id,
                manifest_path,
                plist_path,
                screenshot_paths
            )
        `)
        .eq('id', params.id)
        .single();

    if (reportError || !report) {
        throw error(404, 'Report not found');
    }

    const submission = (report as any).submissions;
    if (submission.user_id !== user.id) {
        throw error(403, 'Access denied');
    }

    const { data: items } = await supabase
        .from('report_items')
        .select('*')
        .eq('report_id', report.id)
        .order('severity', { ascending: true });

    return {
        report,
        submission,
        items: items || [],
    };
};
