import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    const session = await locals.getSession();
    if (!session) {
        throw redirect(303, '/login');
    }

    // Fetch report with submission info
    const { data: report, error: reportError } = await locals.supabase
        .from('reports')
        .select(`
            *,
            submissions!inner(
                id,
                app_name,
                subtitle,
                review_type,
                created_at,
                completed_at,
                user_id
            )
        `)
        .eq('id', params.id)
        .single();

    if (reportError || !report) {
        throw error(404, 'Report not found');
    }

    // Verify ownership
    const submission = (report as any).submissions;
    if (submission.user_id !== session.user.id) {
        throw error(403, 'Access denied');
    }

    // Fetch report items
    const { data: items } = await locals.supabase
        .from('report_items')
        .select('*')
        .eq('report_id', report.id)
        .order('severity', { ascending: true }); // critical first

    return {
        report,
        submission,
        items: items || [],
    };
};
