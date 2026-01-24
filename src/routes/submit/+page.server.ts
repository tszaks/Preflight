import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) {
        throw redirect(303, '/auth/login');
    }

    return { user };
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
};
