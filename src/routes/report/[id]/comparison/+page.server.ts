import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CheckResult, ScoreResult } from '$lib/engine/types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    if (!user) {
        throw redirect(303, '/auth/login');
    }

    // Load the current report (by report ID or submission ID)
    const currentReport = await findReport(supabase, params.id);
    if (!currentReport) {
        throw error(404, 'Report not found');
    }

    const submission = (currentReport as any).submissions;
    if (submission.user_id !== user.id) {
        throw error(403, 'Access denied');
    }

    // Check if this is a re-review
    if (!submission.is_rereviewing || !submission.original_submission_id) {
        throw error(400, 'This report is not a retest. No comparison available.');
    }

    // Load the original (previous) report
    const { data: originalReport } = await supabase
        .from('reports')
        .select('*')
        .eq('submission_id', submission.original_submission_id)
        .single();

    if (!originalReport) {
        throw error(404, 'Original report not found for comparison');
    }

    // Load items for both reports
    const [currentItemsResult, originalItemsResult] = await Promise.all([
        supabase
            .from('report_items')
            .select('*')
            .eq('report_id', currentReport.id)
            .order('severity', { ascending: true }),
        supabase
            .from('report_items')
            .select('*')
            .eq('report_id', originalReport.id)
            .order('severity', { ascending: true }),
    ]);

    const currentItems = currentItemsResult.data || [];
    const originalItems = originalItemsResult.data || [];

    return {
        currentReport,
        originalReport,
        submission,
        currentItems,
        originalItems,
    };
};

async function findReport(supabase: any, id: string) {
    // Try report ID first
    const { data: byReportId } = await supabase
        .from('reports')
        .select(`
            *,
            submissions!inner(
                id,
                app_name,
                category,
                review_type,
                created_at,
                completed_at,
                user_id,
                is_rereviewing,
                original_submission_id
            )
        `)
        .eq('id', id)
        .single();

    if (byReportId) return byReportId;

    // Try submission ID
    const { data: bySubmissionId } = await supabase
        .from('reports')
        .select(`
            *,
            submissions!inner(
                id,
                app_name,
                category,
                review_type,
                created_at,
                completed_at,
                user_id,
                is_rereviewing,
                original_submission_id
            )
        `)
        .eq('submission_id', id)
        .single();

    return bySubmissionId;
}
