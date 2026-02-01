import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const CREDIT_COSTS = {
    full: 100,
    recheck: 25,
} as const

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const appName = formData.get('app_name') as string
        const promotionalText = formData.get('promotional_text') as string
        const description = formData.get('description') as string
        const keywords = formData.get('keywords') as string
        const category = formData.get('category') as string
        const supportUrl = formData.get('support_url') as string
        const marketingUrl = formData.get('marketing_url') as string
        const signInRequired = formData.get('sign_in_required') === 'true'
        const demoUsername = formData.get('demo_username') as string
        const demoPassword = formData.get('demo_password') as string

        // Files
        const screenshots = formData.getAll('screenshots') as File[]
        const infoPlist = formData.get('plist') as File | null
        const privacyManifest = formData.get('manifest') as File | null
        const ipaBinary = formData.get('ipa') as File | null

        // Compliance Data (Step 3)
        const ageRatingRaw = formData.get('age_rating') as string | null
        const privacyDeclarationsRaw = formData.get('privacy_declarations') as string | null
        const checklistRaw = formData.get('checklist') as string | null

        const ageRating = ageRatingRaw ? JSON.parse(ageRatingRaw) : null
        const privacyDeclarations = privacyDeclarationsRaw ? JSON.parse(privacyDeclarationsRaw) : null
        const checklist = checklistRaw ? JSON.parse(checklistRaw) : null

        const isDraft = formData.get('is_draft') === 'true'
        const existingId = formData.get('submission_id') as string | null

        // 2. Initial DB Record (or Update)
        const recordData: any = {
            user_id: user.id,
            app_name: appName,
            promotional_text: promotionalText,
            description,
            keywords,
            category,
            support_url: supportUrl,
            marketing_url: marketingUrl,
            sign_in_required: signInRequired,
            demo_username: demoUsername,
            demo_password: demoPassword,
            age_rating: ageRating,
            privacy_declarations: privacyDeclarations,
            checklist: checklist,
            status: 'draft',
            review_type: 'full'
        }

        let submissionId: string
        if (existingId) {
            const { error: updateError } = await supabase
                .from('submissions')
                .update(recordData)
                .eq('id', existingId)
                .eq('user_id', user.id)

            if (updateError) {
                return NextResponse.json({ message: updateError.message }, { status: 500 })
            }
            submissionId = existingId
        } else {
            const { data: submission, error: subError } = await supabase
                .from('submissions')
                .insert(recordData)
                .select('id')
                .single()

            if (subError || !submission) {
                return NextResponse.json({ message: subError?.message || 'Failed to create submission' }, { status: 500 })
            }
            submissionId = submission.id
        }

        // For drafts without files, just save metadata and return early
        const hasFiles = (infoPlist && infoPlist.size > 0) ||
            (privacyManifest && privacyManifest.size > 0) ||
            (ipaBinary && ipaBinary.size > 0) ||
            screenshots.length > 0

        if (isDraft && !hasFiles) {
            return NextResponse.json({ submissionId, message: 'Draft saved successfully' })
        }

        const basePath = `${user.id}/${submissionId}`

        // 3. Upload Files
        const screenshotPaths: string[] = []

        // Screenshots
        for (let i = 0; i < screenshots.length; i++) {
            const file = screenshots[i]
            const ext = file.name.split('.').pop() || 'png'
            const path = `${basePath}/screenshot_${i}.${ext}`
            await supabase.storage.from('screenshots').upload(path, file, { upsert: true })
            screenshotPaths.push(path)
        }

        // Info.plist
        let plistPath = null
        if (infoPlist && infoPlist.size > 0) {
            plistPath = `${basePath}/Info.plist`
            await supabase.storage.from('plists').upload(plistPath, infoPlist, { upsert: true })
        }

        // Privacy Manifest
        let manifestPath = null
        if (privacyManifest && privacyManifest.size > 0) {
            manifestPath = `${basePath}/PrivacyInfo.xcprivacy`
            await supabase.storage.from('manifests').upload(manifestPath, privacyManifest, { upsert: true })
        }

        // IPA
        let ipaPath = null
        if (ipaBinary && ipaBinary.size > 0) {
            ipaPath = `${basePath}/app.ipa`
            await supabase.storage.from('ipas').upload(ipaPath, ipaBinary, { upsert: true })
        }

        // 4. Update References
        await supabase
            .from('submissions')
            .update({
                screenshot_paths: screenshotPaths,
                plist_path: plistPath,
                manifest_path: manifestPath,
                ipa_path: ipaPath,
                status: isDraft ? 'draft' : 'analyzing'
            })
            .eq('id', submissionId)

        if (isDraft) {
            return NextResponse.json({ submissionId, message: 'Draft saved successfully' })
        }

        // 5. Credit Check and Deduction (only for non-drafts)
        const creditCost = CREDIT_COSTS.full // TODO: Support recheck pricing

        // Fetch user's current credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 500 })
        }

        const currentCredits = profile.credits || 0
        if (currentCredits < creditCost) {
            // Revert status back to draft since we can't process
            await supabase
                .from('submissions')
                .update({ status: 'draft' })
                .eq('id', submissionId)

            return NextResponse.json({
                message: `Insufficient credits. You have ${currentCredits} credits but need ${creditCost} for a full review.`,
                credits: currentCredits,
                required: creditCost,
            }, { status: 402 }) // 402 Payment Required
        }

        // Deduct credits
        const { error: deductError } = await supabase
            .from('profiles')
            .update({ credits: currentCredits - creditCost })
            .eq('id', user.id)

        if (deductError) {
            await supabase
                .from('submissions')
                .update({ status: 'draft' })
                .eq('id', submissionId)
            return NextResponse.json({ message: 'Failed to deduct credits' }, { status: 500 })
        }

        // 6. Create Job
        await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending'
            })

        // 6. Trigger Worker (Internal Fetch)
        // In a real prod env, this would be an edge function or a queue
        // For now, we hit our own worker endpoint
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId, secret: process.env.WORKER_SECRET })
        }).catch(err => console.error('Worker trigger failed:', err))

        revalidatePath('/dashboard')
        console.log(`Submission ${submissionId} saved successfully. Status: ${isDraft ? 'draft' : 'analyzing'}`)
        return NextResponse.json({ submissionId })
    } catch (err: any) {
        console.error('Submission error:', err)
        return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
