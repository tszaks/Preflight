import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WORKER_SECRET, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { runAnalysis, fetchSubmissionFiles } from '$lib/engine';
import type { SoftRulesInput } from '$lib/engine';

/**
 * Worker endpoint that processes analysis jobs.
 * Called by a cron job or Supabase webhook after payment.
 * Protected by WORKER_SECRET header.
 */
export const POST: RequestHandler = async ({ request }) => {
    // Verify worker auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${WORKER_SECRET}`) {
        throw error(401, 'Unauthorized');
    }

    const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch next pending job
    const { data: job, error: jobError } = await supabase
        .from('analysis_jobs')
        .select('*, submissions(*)')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (jobError || !job) {
        return json({ message: 'No pending jobs' });
    }

    const submission = (job as any).submissions;
    if (!submission) {
        return json({ error: 'Submission not found for job' }, { status: 404 });
    }

    // Increment attempts
    await supabase
        .from('analysis_jobs')
        .update({ attempts: job.attempts + 1 })
        .eq('id', job.id);

    // Fetch files from storage
    const files = await fetchSubmissionFiles(supabase, submission);

    // Build soft rules input
    const input: SoftRulesInput = {
        app_name: submission.app_name,
        subtitle: submission.subtitle,
        description: submission.description,
        keywords: submission.keywords,
        category: submission.category,
        age_rating: submission.age_rating,
        privacy_url: submission.privacy_url,
        support_url: submission.support_url,
        marketing_url: submission.marketing_url,
        screenshot_paths: submission.screenshot_paths || [],
        manifest_path: submission.manifest_path,
        plist_path: submission.plist_path,
        review_type: submission.review_type,
        screenshots_data: files.screenshotsData,
        manifest_content: files.manifestContent,
        plist_content: files.plistContent,
        privacy_policy_text: files.privacyPolicyText,
    };

    // Run analysis
    const result = await runAnalysis(supabase, submission.id, input, {
        anthropicApiKey: ANTHROPIC_API_KEY,
        skipSoftRules: submission.review_type === 'quick' && !files.manifestContent,
    });

    return json({
        success: result.success,
        reportId: result.reportId,
        error: result.error,
    });
};
