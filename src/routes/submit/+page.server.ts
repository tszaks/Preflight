import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    // TEMP: Skip auth for testing
    // if (!user) {
    //     throw redirect(303, '/auth/login');
    // }

    const userId = user?.id || 'test-user';

    // Check if editing an existing draft
    const draftId = url.searchParams.get('draft');
    // Check if re-submitting (pre-fill form with previous data but create new submission)
    const resubmitId = url.searchParams.get('resubmit');

    let draftSubmission = null;
    let originalSubmission = null;

    if (draftId) {
        // Editing an existing draft - we'll update this submission
        const { data } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', draftId)
            .eq('user_id', userId)
            .eq('status', 'draft')
            .single();

        draftSubmission = data;
    } else if (resubmitId) {
        // Creating a new submission based on an old one
        const { data } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', resubmitId)
            .eq('user_id', userId)
            .single();

        originalSubmission = data;
    }

    return {
        user: user || { id: 'test-user' },
        draftSubmission,
        originalSubmission,
    };
};

export const actions: Actions = {
    createSubmission: async ({ request, locals: { safeGetSession, supabase } }) => {
        const { user } = await safeGetSession();
        if (!user) {
            return fail(401, { message: 'Not authenticated' });
        }

        const formData = await request.formData();

        const app_name = formData.get('app_name')?.toString().trim();
        const subtitle = formData.get('subtitle')?.toString().trim() || null;
        const description = formData.get('description')?.toString().trim() || null;
        const keywords = formData.get('keywords')?.toString().trim() || null;
        const category = formData.get('category')?.toString() || null;
        const age_rating = formData.get('age_rating')?.toString() || null;
        const privacy_url = formData.get('privacy_url')?.toString().trim() || null;
        const review_type = formData.get('review_type')?.toString() as 'quick' | 'full' || 'quick';

        if (!app_name) {
            return fail(400, { message: 'App name is required' });
        }

        const { data: submission, error } = await supabase
            .from('submissions')
            .insert({
                user_id: user.id,
                app_name,
                subtitle,
                description,
                keywords,
                category,
                age_rating,
                privacy_url,
                review_type,
                status: 'draft',
            })
            .select('id')
            .single();

        if (error || !submission) {
            console.error('Submission creation failed:', error);
            return fail(500, { message: 'Failed to create submission' });
        }

        return { submissionId: submission.id };
    },

    uploadFiles: async ({ request, locals: { safeGetSession, supabase } }) => {
        const { user } = await safeGetSession();
        if (!user) {
            return fail(401, { message: 'Not authenticated' });
        }

        const formData = await request.formData();
        const submissionId = formData.get('submission_id')?.toString();

        if (!submissionId) {
            return fail(400, { message: 'Missing submission ID' });
        }

        const basePath = `${user.id}/${submissionId}`;
        const screenshotPaths: string[] = [];

        // Upload screenshots
        const screenshots = formData.getAll('screenshots') as File[];
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            if (file.size === 0) continue;

            const ext = file.name.split('.').pop() || 'png';
            const path = `${basePath}/screenshot_${i}.${ext}`;

            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, file, { upsert: true });

            if (!error) {
                screenshotPaths.push(path);
            }
        }

        // Upload privacy manifest
        let manifestPath: string | null = null;
        const manifest = formData.get('manifest') as File | null;
        if (manifest && manifest.size > 0) {
            const path = `${basePath}/PrivacyInfo.xcprivacy`;
            const { error } = await supabase.storage
                .from('manifests')
                .upload(path, manifest, { upsert: true });

            if (!error) manifestPath = path;
        }

        // Upload Info.plist
        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true });

            if (!error) plistPath = path;
        }

        // Update submission with file paths
        await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                manifest_path: manifestPath,
                plist_path: plistPath,
            })
            .eq('id', submissionId);

        return { success: true, screenshotPaths, manifestPath, plistPath };
    },

    // Test mode: Skip Stripe, run analysis immediately
    testSubmit: async ({ request, locals: { safeGetSession, supabase }, fetch }) => {
        const { user } = await safeGetSession();
        // TEMP: Use test user if not authenticated
        const userId = user?.id || 'test-user';

        const formData = await request.formData();

        // Check if this is a re-review
        const isRereviewing = formData.get('is_rereviewing') === 'true';
        const originalSubmissionId = formData.get('original_submission_id')?.toString() || null;

        // Credit cost: 100 for full review, 25 for re-review
        const creditCost = isRereviewing ? 25 : 100;

        // Step 1: Check user has enough credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        const userCredits = profile?.credits ?? 0;

        if (userCredits < creditCost) {
            return fail(402, {
                message: `Insufficient credits. You need ${creditCost} credits but only have ${userCredits}.`,
                credits: userCredits
            });
        }

        // Step 2: Create submission
        const app_name = formData.get('app_name')?.toString().trim();
        if (!app_name) {
            return fail(400, { message: 'App name is required' });
        }

        const { data: submission, error: subError } = await supabase
            .from('submissions')
            .insert({
                user_id: userId,
                app_name,
                subtitle: formData.get('subtitle')?.toString().trim() || null,
                description: formData.get('description')?.toString().trim() || null,
                keywords: formData.get('keywords')?.toString().trim() || null,
                category: formData.get('category')?.toString() || null,
                age_rating: formData.get('age_rating')?.toString() || '4+',
                privacy_url: formData.get('privacy_url')?.toString().trim() || null,
                review_type: 'full',
                status: 'analyzing',
                credits_used: creditCost,
                is_rereviewing: isRereviewing,
                original_submission_id: originalSubmissionId,
            })
            .select('id')
            .single();

        if (subError || !submission) {
            console.error('Submission creation failed:', subError);
            return fail(500, { message: 'Failed to create submission' });
        }

        const submissionId = submission.id;
        const basePath = `${userId}/${submissionId}`;
        const screenshotPaths: string[] = [];

        // Step 2: Upload files
        const screenshots = formData.getAll('screenshots') as File[];
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            if (file.size === 0) continue;

            const ext = file.name.split('.').pop() || 'png';
            const path = `${basePath}/screenshot_${i}.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, file, { upsert: true });

            if (!error) screenshotPaths.push(path);
        }

        let manifestPath: string | null = null;
        const manifest = formData.get('manifest') as File | null;
        if (manifest && manifest.size > 0) {
            const path = `${basePath}/PrivacyInfo.xcprivacy`;
            const { error } = await supabase.storage
                .from('manifests')
                .upload(path, manifest, { upsert: true });
            if (!error) manifestPath = path;
        }

        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true });
            if (!error) plistPath = path;
        }

        await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                manifest_path: manifestPath,
                plist_path: plistPath,
            })
            .eq('id', submissionId);

        // Step 3: Create analysis job
        const { data: job, error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
                priority: 100, // High priority for test
            })
            .select('id')
            .single();

        if (jobError || !job) {
            console.error('Job creation failed:', jobError);
            return fail(500, { message: 'Failed to create analysis job' });
        }

        // Step 4: Deduct credits upfront (analysis will run on progress page)
        await supabase
            .from('profiles')
            .update({ credits: userCredits - creditCost })
            .eq('id', userId);

        // Redirect to progress page - analysis will stream from there
        // The SSE endpoint handles running the actual analysis
        throw redirect(303, `/progress/${submissionId}`);
    },

    // Save draft without triggering analysis - for "save and continue later"
    saveDraft: async ({ request, locals: { safeGetSession, supabase } }) => {
        const { user } = await safeGetSession();
        const userId = user?.id || 'test-user';

        const formData = await request.formData();
        const existingDraftId = formData.get('draft_id')?.toString() || null;

        const draftData = {
            user_id: userId,
            app_name: formData.get('app_name')?.toString().trim() || 'Untitled',
            subtitle: formData.get('subtitle')?.toString().trim() || null,
            description: formData.get('description')?.toString().trim() || null,
            promotional_text: formData.get('promotional_text')?.toString().trim() || null,
            keywords: formData.get('keywords')?.toString().trim() || null,
            category: formData.get('category')?.toString() || null,
            secondary_category: formData.get('secondary_category')?.toString() || null,
            version: formData.get('version')?.toString() || '1.0',
            copyright: formData.get('copyright')?.toString().trim() || null,
            privacy_url: formData.get('privacy_url')?.toString().trim() || null,
            support_url: formData.get('support_url')?.toString().trim() || null,
            marketing_url: formData.get('marketing_url')?.toString().trim() || null,
            age_rating: formData.get('age_rating')?.toString() || '4+',
            age_rating_answers: formData.get('age_rating_answers')?.toString() || null,
            data_collection: formData.get('data_collection')?.toString() || null,
            sign_in_required: formData.get('sign_in_required') === 'true',
            demo_username: formData.get('demo_username')?.toString() || null,
            demo_password: formData.get('demo_password')?.toString() || null,
            review_notes: formData.get('review_notes')?.toString() || null,
            reviewer_contact: formData.get('reviewer_contact')?.toString() || null,
            has_iap: formData.get('has_iap') === 'true',
            has_subscriptions: formData.get('has_subscriptions') === 'true',
            has_ads: formData.get('has_ads') === 'true',
            review_type: 'full',
            status: 'draft',
        };

        let submissionId: string;

        if (existingDraftId) {
            // Update existing draft
            const { error } = await supabase
                .from('submissions')
                .update(draftData)
                .eq('id', existingDraftId)
                .eq('user_id', userId)
                .eq('status', 'draft');

            if (error) {
                console.error('Draft update failed:', error);
                return fail(500, { message: 'Failed to save draft' });
            }
            submissionId = existingDraftId;
        } else {
            // Create new draft
            const { data: submission, error } = await supabase
                .from('submissions')
                .insert(draftData)
                .select('id')
                .single();

            if (error || !submission) {
                console.error('Draft creation failed:', error);
                return fail(500, { message: 'Failed to save draft' });
            }
            submissionId = submission.id;
        }

        // Upload files if provided
        const basePath = `${userId}/${submissionId}`;
        const screenshotPaths: string[] = [];

        const screenshots = formData.getAll('screenshots') as File[];
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            if (file.size === 0) continue;

            const ext = file.name.split('.').pop() || 'png';
            const path = `${basePath}/screenshot_${i}.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, file, { upsert: true });

            if (!error) screenshotPaths.push(path);
        }

        let manifestPath: string | null = null;
        const manifest = formData.get('manifest') as File | null;
        if (manifest && manifest.size > 0) {
            const path = `${basePath}/PrivacyInfo.xcprivacy`;
            const { error } = await supabase.storage
                .from('manifests')
                .upload(path, manifest, { upsert: true });
            if (!error) manifestPath = path;
        }

        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true });
            if (!error) plistPath = path;
        }

        // Update submission with file paths (only if files were uploaded)
        if (screenshotPaths.length > 0 || manifestPath || plistPath) {
            const updateData: Record<string, unknown> = {};
            if (screenshotPaths.length > 0) updateData.screenshot_paths = screenshotPaths;
            if (manifestPath) updateData.manifest_path = manifestPath;
            if (plistPath) updateData.plist_path = plistPath;

            await supabase
                .from('submissions')
                .update(updateData)
                .eq('id', submissionId);
        }

        return {
            success: true,
            draftId: submissionId,
            message: 'Draft saved successfully'
        };
    },
};
