import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

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

    // Map of storage path → signed URL for displaying saved files
    let fileUrls: Record<string, string> = {};

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

        // Generate signed URLs for saved files so the client can display thumbnails
        if (draftSubmission) {
            const pathsToSign: { bucket: string; path: string }[] = [];

            if (draftSubmission.screenshot_paths?.length) {
                for (const p of draftSubmission.screenshot_paths) {
                    pathsToSign.push({ bucket: 'screenshots', path: p });
                }
            }
            if (draftSubmission.app_icon_path) {
                pathsToSign.push({ bucket: 'screenshots', path: draftSubmission.app_icon_path });
            }

            // Generate all signed URLs in parallel
            const results = await Promise.all(
                pathsToSign.map(async ({ bucket, path }) => {
                    const { data } = await supabase.storage
                        .from(bucket)
                        .createSignedUrl(path, 3600); // 1 hour expiry
                    return { path, url: data?.signedUrl || null };
                })
            );

            for (const { path, url } of results) {
                if (url) fileUrls[path] = url;
            }
        }
    } else if (resubmitId) {
        // Creating a new submission based on an old one
        const { data } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', resubmitId)
            .eq('user_id', userId)
            .single();

        originalSubmission = data;

        // Generate signed URLs for saved files so the client can display thumbnails
        if (originalSubmission) {
            const pathsToSign: { bucket: string; path: string }[] = [];

            if (originalSubmission.screenshot_paths?.length) {
                for (const p of originalSubmission.screenshot_paths) {
                    pathsToSign.push({ bucket: 'screenshots', path: p });
                }
            }
            if (originalSubmission.app_icon_path) {
                pathsToSign.push({ bucket: 'screenshots', path: originalSubmission.app_icon_path });
            }

            const results = await Promise.all(
                pathsToSign.map(async ({ bucket, path }) => {
                    const { data } = await supabase.storage
                        .from(bucket)
                        .createSignedUrl(path, 3600);
                    return { path, url: data?.signedUrl || null };
                })
            );

            for (const { path, url } of results) {
                if (url) fileUrls[path] = url;
            }
        }
    }

    return {
        user: user || { id: 'test-user' },
        draftSubmission,
        originalSubmission,
        fileUrls,
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

            if (error) {
                console.error('[uploadFiles] Screenshot upload FAILED:', path, error.message, error);
            } else {
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
                .upload(path, manifest, { upsert: true, contentType: 'application/xml' });

            if (error) {
                console.error('[uploadFiles] Manifest upload FAILED:', path, error.message, error);
            } else {
                manifestPath = path;
            }
        }

        // Upload Info.plist
        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true, contentType: 'application/xml' });

            if (error) {
                console.error('[uploadFiles] Plist upload FAILED:', path, error.message, error);
            } else {
                plistPath = path;
            }
        }

        // Upload app icon
        let iconPath: string | null = null;
        const icon = formData.get('icon') as File | null;
        if (icon && icon.size > 0) {
            const ext = icon.name.split('.').pop() || 'png';
            const path = `${basePath}/app_icon.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, icon, { upsert: true });
            if (error) {
                console.error('[uploadFiles] Icon upload FAILED:', path, error.message, error);
            } else {
                iconPath = path;
            }
        }

        // Update submission with file paths
        const { error: pathUpdateError } = await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                manifest_path: manifestPath,
                plist_path: plistPath,
                app_icon_path: iconPath,
            })
            .eq('id', submissionId);

        if (pathUpdateError) {
            console.error('[uploadFiles] Path update FAILED:', pathUpdateError);
        }

        return { success: true, screenshotPaths, manifestPath, plistPath, iconPath };
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

        // Check if submitting from an existing draft
        const draftId = formData.get('draft_id')?.toString() || null;

        // Anti-gaming: verify app name matches original for retest discount
        let creditCost = 100;
        if (isRereviewing && originalSubmissionId) {
            const { data: originalSub } = await supabase
                .from('submissions')
                .select('app_name')
                .eq('id', originalSubmissionId)
                .single();

            const newName = (formData.get('app_name')?.toString() || '').trim().toLowerCase();
            const origName = (originalSub?.app_name || '').trim().toLowerCase();

            if (originalSub && newName === origName) {
                creditCost = 25; // Same app, retest discount
            } else {
                creditCost = 100; // Different app name = new review, full price
            }
        }

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

        // Step 2: Create or update submission
        const app_name = formData.get('app_name')?.toString().trim();
        if (!app_name) {
            return fail(400, { message: 'App name is required' });
        }

        const submissionFields = {
            user_id: userId,
            app_name,
            subtitle: formData.get('subtitle')?.toString().trim() || null,
            description: formData.get('description')?.toString().trim() || null,
            promotional_text: formData.get('promotional_text')?.toString().trim() || null,
            keywords: formData.get('keywords')?.toString().trim() || null,
            category: formData.get('category')?.toString() || null,
            secondary_category: formData.get('secondary_category')?.toString() || null,
            version: formData.get('version')?.toString() || '1.0',
            copyright: formData.get('copyright')?.toString().trim() || null,
            age_rating: formData.get('age_rating')?.toString() || '4+',
            age_rating_answers: formData.get('age_rating_answers')?.toString() || null,
            data_collection: formData.get('data_collection')?.toString() || null,
            privacy_url: formData.get('privacy_url')?.toString().trim() || null,
            support_url: formData.get('support_url')?.toString().trim() || null,
            marketing_url: formData.get('marketing_url')?.toString().trim() || null,
            review_type: 'full' as const,
            status: 'analyzing' as const,
            credits_used: creditCost,
            is_rereviewing: isRereviewing,
            original_submission_id: originalSubmissionId,
            sign_in_required: formData.get('sign_in_required') === 'true',
            demo_username: formData.get('demo_username')?.toString() || null,
            demo_password: formData.get('demo_password')?.toString() || null,
            review_notes: formData.get('review_notes')?.toString() || null,
            reviewer_contact: formData.get('reviewer_contact')?.toString() || null,
            has_iap: formData.get('has_iap') === 'true',
            has_subscriptions: formData.get('has_subscriptions') === 'true',
            has_ads: formData.get('has_ads') === 'true',
            has_third_party_login: formData.get('has_third_party_login') === 'true',
            // Explicit feature confirmations (null if not applicable)
            has_account_deletion: formData.has('has_account_deletion')
                ? formData.get('has_account_deletion') === 'true'
                : null,
            has_restore_purchases: formData.has('has_restore_purchases')
                ? formData.get('has_restore_purchases') === 'true'
                : null,
            is_new_app: formData.has('is_new_app')
                ? formData.get('is_new_app') === 'true'
                : null,
            // Screenshot index hints
            settings_screenshot_index: formData.get('settings_screenshot_index')
                ? parseInt(formData.get('settings_screenshot_index')!.toString(), 10)
                : null,
            paywall_screenshot_index: formData.get('paywall_screenshot_index')
                ? parseInt(formData.get('paywall_screenshot_index')!.toString(), 10)
                : null,
        };

        let submissionId: string;

        if (draftId) {
            // Update existing draft → analyzing
            const { error: updateError } = await supabase
                .from('submissions')
                .update(submissionFields)
                .eq('id', draftId)
                .eq('user_id', userId);

            if (updateError) {
                console.error('Draft update failed:', updateError);
                return fail(500, { message: 'Failed to update submission' });
            }
            submissionId = draftId;
        } else {
            // Create new submission
            const { data: submission, error: subError } = await supabase
                .from('submissions')
                .insert(submissionFields)
                .select('id')
                .single();

            if (subError || !submission) {
                console.error('Submission creation failed:', subError);
                return fail(500, { message: 'Failed to create submission' });
            }
            submissionId = submission.id;
        }

        const basePath = `${userId}/${submissionId}`;

        // Merge saved paths with newly uploaded files
        let savedScreenPaths: string[] = [];
        try {
            const saved = formData.get('saved_screenshot_paths')?.toString();
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string')) {
                    savedScreenPaths = parsed;
                } else {
                    console.warn('[testSubmit] saved_screenshot_paths was valid JSON but not a string array, ignoring');
                }
            }
        } catch (error) {
            console.warn('[testSubmit] Failed to parse saved_screenshot_paths:', error);
        }

        const savedManifest = formData.get('saved_manifest_path')?.toString() || null;
        const savedPlist = formData.get('saved_plist_path')?.toString() || null;

        // Upload new files only
        const newScreenshotPaths: string[] = [];
        const screenshots = formData.getAll('screenshots') as File[];
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            if (file.size === 0) continue;

            const ext = file.name.split('.').pop() || 'png';
            const idx = savedScreenPaths.length + i;
            const path = `${basePath}/screenshot_${idx}.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, file, { upsert: true });

            if (error) {
                console.error('[testSubmit] Screenshot upload FAILED:', path, error.message, error);
            } else {
                newScreenshotPaths.push(path);
            }
        }

        let manifestPath: string | null = null;
        const manifest = formData.get('manifest') as File | null;
        if (manifest && manifest.size > 0) {
            const path = `${basePath}/PrivacyInfo.xcprivacy`;
            const { error } = await supabase.storage
                .from('manifests')
                .upload(path, manifest, { upsert: true, contentType: 'application/xml' });
            if (error) {
                console.error('[testSubmit] Manifest upload FAILED:', path, error.message, error);
            } else {
                manifestPath = path;
            }
        }

        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true, contentType: 'application/xml' });
            if (error) {
                console.error('[testSubmit] Plist upload FAILED:', path, error.message, error);
            } else {
                plistPath = path;
            }
        }

        let iconPath: string | null = null;
        const icon = formData.get('icon') as File | null;
        if (icon && icon.size > 0) {
            const ext = icon.name.split('.').pop() || 'png';
            const path = `${basePath}/app_icon.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, icon, { upsert: true });
            if (error) {
                console.error('[testSubmit] Icon upload FAILED:', path, error.message, error);
            } else {
                iconPath = path;
            }
        }

        const savedIcon = formData.get('saved_icon_path')?.toString() || null;

        // Merge: saved paths + newly uploaded
        const allScreenshotPaths = [...savedScreenPaths, ...newScreenshotPaths];
        const finalManifestPath = manifestPath || savedManifest;
        const finalPlistPath = plistPath || savedPlist;
        const finalIconPath = iconPath || savedIcon;

        const { error: pathUpdateError } = await supabase
            .from('submissions')
            .update({
                screenshot_paths: allScreenshotPaths.length > 0 ? allScreenshotPaths : null,
                manifest_path: finalManifestPath,
                plist_path: finalPlistPath,
                app_icon_path: finalIconPath,
            })
            .eq('id', submissionId);

        if (pathUpdateError) {
            console.error('[testSubmit] File path update FAILED:', pathUpdateError);
            return fail(500, { message: 'Failed to save uploaded file references. Please try again.' });
        }

        // Step 3: Deduct credits FIRST (service role bypasses RLS)
        const serviceSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const newBalance = userCredits - creditCost;
        console.log(`[Credits] Deducting ${creditCost} from user ${userId}: ${userCredits} → ${newBalance}`);

        const { data: updatedProfile, error: creditError } = await serviceSupabase
            .from('profiles')
            .update({ credits: newBalance })
            .eq('id', userId)
            .select('credits')
            .single();

        if (creditError || !updatedProfile) {
            console.error('[Credits] Deduction FAILED:', creditError);
            return fail(500, { message: 'Failed to deduct credits. Your account was not charged. Please try again.' });
        }
        console.log(`[Credits] Deduction confirmed. DB now shows: ${updatedProfile.credits}`);

        // Step 4: Create analysis job (only after credits deducted)
        const { data: job, error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
                priority: 100,
            })
            .select('id')
            .single();

        if (jobError || !job) {
            console.error('Job creation failed:', jobError);
            // Refund credits since the job wasn't created
            const { error: refundError } = await serviceSupabase
                .from('profiles')
                .update({ credits: userCredits })
                .eq('id', userId);
            if (refundError) console.error('[Credits] REFUND FAILED:', refundError);
            else console.log(`[Credits] Refunded ${creditCost} credits to user ${userId}`);
            return fail(500, { message: 'Failed to create analysis job. Your credits have been refunded.' });
        }

        // Redirect to progress page
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
            has_third_party_login: formData.get('has_third_party_login') === 'true',
            // Explicit feature confirmations
            has_account_deletion: formData.has('has_account_deletion')
                ? formData.get('has_account_deletion') === 'true'
                : null,
            has_restore_purchases: formData.has('has_restore_purchases')
                ? formData.get('has_restore_purchases') === 'true'
                : null,
            is_new_app: formData.has('is_new_app')
                ? formData.get('is_new_app') === 'true'
                : null,
            // Screenshot index hints
            settings_screenshot_index: formData.get('settings_screenshot_index')
                ? parseInt(formData.get('settings_screenshot_index')!.toString(), 10)
                : null,
            paywall_screenshot_index: formData.get('paywall_screenshot_index')
                ? parseInt(formData.get('paywall_screenshot_index')!.toString(), 10)
                : null,
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

        // Merge saved paths with newly uploaded files
        const basePath = `${userId}/${submissionId}`;

        // Start with saved paths from client
        let savedScreenPaths: string[] = [];
        try {
            const saved = formData.get('saved_screenshot_paths')?.toString();
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.every(p => typeof p === 'string')) {
                    savedScreenPaths = parsed;
                } else {
                    console.warn('[saveDraft] saved_screenshot_paths was valid JSON but not a string array, ignoring');
                }
            }
        } catch (error) {
            console.warn('[saveDraft] Failed to parse saved_screenshot_paths:', error);
        }

        const savedManifest = formData.get('saved_manifest_path')?.toString() || null;
        const savedPlist = formData.get('saved_plist_path')?.toString() || null;

        // Upload new screenshots (appended after saved ones)
        console.log('[saveDraft] userId:', userId, 'submissionId:', submissionId, 'basePath:', basePath);
        const newScreenshotPaths: string[] = [];
        const screenshots = formData.getAll('screenshots') as File[];
        console.log('[saveDraft] Screenshots to upload:', screenshots.length, 'sizes:', screenshots.map(f => f.size));
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i];
            if (file.size === 0) continue;

            const ext = file.name.split('.').pop() || 'png';
            const idx = savedScreenPaths.length + i;
            const path = `${basePath}/screenshot_${idx}.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, file, { upsert: true });

            if (error) {
                console.error('[saveDraft] Screenshot upload FAILED:', path, error.message, error);
            } else {
                newScreenshotPaths.push(path);
            }
        }

        let manifestPath: string | null = null;
        const manifest = formData.get('manifest') as File | null;
        console.log('[saveDraft] Manifest file:', manifest?.name, 'size:', manifest?.size);
        if (manifest && manifest.size > 0) {
            const path = `${basePath}/PrivacyInfo.xcprivacy`;
            const { error } = await supabase.storage
                .from('manifests')
                .upload(path, manifest, { upsert: true, contentType: 'application/xml' });
            if (error) {
                console.error('[saveDraft] Manifest upload FAILED:', error.message, error);
            } else {
                manifestPath = path;
            }
        }

        let plistPath: string | null = null;
        const plist = formData.get('plist') as File | null;
        console.log('[saveDraft] Plist file:', plist?.name, 'size:', plist?.size);
        if (plist && plist.size > 0) {
            const path = `${basePath}/Info.plist`;
            const { error } = await supabase.storage
                .from('plists')
                .upload(path, plist, { upsert: true, contentType: 'application/xml' });
            if (error) {
                console.error('[saveDraft] Plist upload FAILED:', error.message, error);
            } else {
                plistPath = path;
            }
        }

        let iconPath: string | null = null;
        const icon = formData.get('icon') as File | null;
        console.log('[saveDraft] Icon file:', icon?.name, 'size:', icon?.size);
        if (icon && icon.size > 0) {
            const ext = icon.name.split('.').pop() || 'png';
            const path = `${basePath}/app_icon.${ext}`;
            const { error } = await supabase.storage
                .from('screenshots')
                .upload(path, icon, { upsert: true });
            if (error) {
                console.error('[saveDraft] Icon upload FAILED:', error.message, error);
            } else {
                iconPath = path;
            }
        }

        const savedIcon = formData.get('saved_icon_path')?.toString() || null;

        // Merge: saved paths + newly uploaded paths
        const allScreenshotPaths = [...savedScreenPaths, ...newScreenshotPaths];
        const finalManifestPath = manifestPath || savedManifest;
        const finalPlistPath = plistPath || savedPlist;
        const finalIconPath = iconPath || savedIcon;

        console.log('[saveDraft] Final paths:', {
            screenshots: allScreenshotPaths.length,
            manifest: finalManifestPath,
            plist: finalPlistPath,
            icon: finalIconPath,
        });

        // Always update file paths (to reflect any removals too)
        const { error: pathUpdateError } = await supabase
            .from('submissions')
            .update({
                screenshot_paths: allScreenshotPaths.length > 0 ? allScreenshotPaths : null,
                manifest_path: finalManifestPath,
                plist_path: finalPlistPath,
                app_icon_path: finalIconPath,
            })
            .eq('id', submissionId);

        if (pathUpdateError) {
            console.error('[saveDraft] Path update FAILED:', pathUpdateError);
        }

        return {
            success: true,
            draftId: submissionId,
            message: 'Draft saved successfully'
        };
    },
};
