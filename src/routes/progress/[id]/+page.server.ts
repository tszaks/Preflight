import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
    const submissionId = params.id;

    if (!submissionId) {
        throw error(400, 'Missing submission ID');
    }

    // Verify user is authenticated
    const { user } = await safeGetSession();
    if (!user) {
        throw redirect(303, '/auth/login');
    }

    // Fetch submission details
    const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

    if (subError || !submission) {
        throw error(404, 'Submission not found');
    }

    // Verify ownership (skip for test users)
    if (submission.user_id !== user.id && submission.user_id !== 'test-user') {
        throw error(403, 'Not authorized to view this submission');
    }

    // Check if report already exists (analysis already complete)
    const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('submission_id', submissionId)
        .single();

    if (existingReport) {
        // Analysis already done - redirect to report
        throw redirect(303, `/report/${existingReport.id}`);
    }

    // Get job status for initial state
    const { data: job } = await supabase
        .from('analysis_jobs')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

    return {
        submission: {
            id: submission.id,
            app_name: submission.app_name,
            review_type: submission.review_type,
            screenshot_count: submission.screenshot_paths?.length || 0,
            has_manifest: !!submission.manifest_path,
            has_plist: !!submission.plist_path,
            has_privacy_url: !!submission.privacy_url,
        },
        job: job ? {
            status: job.status,
            hard_rules_completed: job.hard_rules_completed,
            soft_rules_completed: job.soft_rules_completed,
        } : null,
    };
};
