import { NextRequest, NextResponse } from 'next/server'
import { createClientFromRequest } from '@/lib/supabase/from-request'
import { createServiceClient } from '@/lib/supabase/service'
import { decryptPrivateKey } from '@/lib/asc-credential-store'
import { getEncryptionKey } from '@/lib/asc-encryption'
import {
    getAppDetails,
    listAppStoreVersions,
    getVersionDetails,
    getBuildForVersion,
    type ASCCredentials,
} from '@/lib/app-store-connect'

const REFUND_AMOUNT = 100
const MAX_REJECTIONS_PER_MONTH = 5
const REJECTED_ASC_STATES = new Set(['REJECTED', 'METADATA_REJECTED'])

const isLikelyBuildVariable = (value: string): boolean =>
    /\$\([^)]+\)|\$\{[^}]+\}/.test(value)

const isValidBundleId = (bundleId: string): boolean =>
    /^[A-Za-z0-9]+(\.[A-Za-z0-9-]+)+$/.test(bundleId)

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClientFromRequest(req)
    const serviceSupabase = createServiceClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: submissionId } = await params

    try {
        const body = await req.json() as {
            rejectionDate: string
            rejectionReason: string
            guidelineViolated?: string
            appleMessage?: string
        }

        // Validate request body
        if (!body.rejectionDate || !body.rejectionReason) {
            return NextResponse.json(
                { message: 'rejectionDate and rejectionReason are required' },
                { status: 400 }
            )
        }

        // Parse and validate rejection date
        const rejectionDate = new Date(body.rejectionDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (isNaN(rejectionDate.getTime())) {
            return NextResponse.json(
                { message: 'Invalid rejection date format' },
                { status: 400 }
            )
        }

        if (rejectionDate > today) {
            return NextResponse.json(
                { message: 'Rejection date cannot be in the future' },
                { status: 400 }
            )
        }

        // Verify submission exists and belongs to user
        const { data: submission, error: subError } = await serviceSupabase
            .from('submissions')
            .select('id, status, bundle_id, bundle_version, build_number, version')
            .eq('id', submissionId)
            .eq('user_id', user.id)
            .single()

        if (subError || !submission) {
            return NextResponse.json(
                { message: 'Submission not found' },
                { status: 404 }
            )
        }

        // Ensure submission is complete
        if (submission.status !== 'complete') {
            return NextResponse.json(
                { message: 'Can only report rejections for completed submissions' },
                { status: 409 }
            )
        }

        // Fraud-resistant proof: verify rejection status via App Store Connect (ASC)
        const submissionBundleId = (submission as any).bundle_id as string | null
        const submissionVersionString =
            ((submission as any).bundle_version as string | null) ||
            ((submission as any).version as string | null)
        const submissionBuildNumber = (submission as any).build_number as string | null

        if (!submissionBundleId || !isValidBundleId(submissionBundleId) || isLikelyBuildVariable(submissionBundleId)) {
            return NextResponse.json(
                { message: 'Could not verify rejection: missing a valid bundle ID for this submission. Re-run Preflight with a resolved Info.plist (or an IPA) so we can verify via App Store Connect.' },
                { status: 409 }
            )
        }

        if (!submissionVersionString || isLikelyBuildVariable(submissionVersionString)) {
            return NextResponse.json(
                { message: 'Could not verify rejection: missing a valid version string for this submission. Re-run Preflight with a resolved Info.plist (or an IPA) so we can verify via App Store Connect.' },
                { status: 409 }
            )
        }

        // Load ASC connection for this user (service role, then verify user owns the submission)
        const { data: conn, error: connError } = await serviceSupabase
            .from('asc_connections')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (connError || !conn?.selected_app_id) {
            return NextResponse.json(
                { message: 'To get credits refunded, connect App Store Connect and select your app so we can verify the rejection.' },
                { status: 409 }
            )
        }

        const privateKey = decryptPrivateKey(
            conn.encrypted_private_key,
            conn.encryption_iv,
            getEncryptionKey(),
        )

        const credentials: ASCCredentials = {
            keyId: conn.key_id,
            issuerId: conn.issuer_id,
            privateKey,
        }

        const appDetails = await getAppDetails(credentials, conn.selected_app_id)
        if (!appDetails?.bundleId) {
            return NextResponse.json(
                { message: 'Could not verify rejection: failed to fetch app details from App Store Connect.' },
                { status: 409 }
            )
        }

        if (appDetails.bundleId !== submissionBundleId) {
            return NextResponse.json(
                { message: `Could not verify rejection: this submission bundle ID (${submissionBundleId}) does not match the selected App Store Connect app (${appDetails.bundleId}).` },
                { status: 409 }
            )
        }

        const versions = await listAppStoreVersions(credentials, conn.selected_app_id)
        const matchingVersion = versions.find(v => v.versionString === submissionVersionString)

        if (!matchingVersion) {
            return NextResponse.json(
                { message: `Could not verify rejection: App Store Connect has no iOS version "${submissionVersionString}" for the selected app.` },
                { status: 409 }
            )
        }

        const versionDetails = await getVersionDetails(credentials, matchingVersion.id)
        const ascState = versionDetails?.appStoreState || matchingVersion.appStoreState || 'UNKNOWN'

        if (!REJECTED_ASC_STATES.has(ascState)) {
            return NextResponse.json(
                { message: `Could not verify rejection: App Store Connect shows state "${ascState}" for version ${submissionVersionString}, not a rejection state.` },
                { status: 409 }
            )
        }

        const ascBuild = await getBuildForVersion(credentials, matchingVersion.id)
        const ascBuildNumber = ascBuild?.buildNumber || null

        // If we have both build numbers, require an exact match.
        if (submissionBuildNumber && ascBuildNumber && submissionBuildNumber !== ascBuildNumber) {
            return NextResponse.json(
                { message: `Could not verify rejection: build number mismatch (submission ${submissionBuildNumber} vs ASC ${ascBuildNumber}).` },
                { status: 409 }
            )
        }

        // Prevent multiple refunds for the same ASC version (even across multiple submissions)
        const { data: existingAscRefund } = await serviceSupabase
            .from('apple_rejections')
            .select('id')
            .eq('user_id', user.id)
            .eq('asc_app_store_version_id', matchingVersion.id)
            .maybeSingle()

        if (existingAscRefund?.id) {
            return NextResponse.json(
                { message: 'You have already received a refund for this rejected version.' },
                { status: 409 }
            )
        }

        // Check rate limit: max 5 rejections per month
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)

        // Use an exact count with `head: true` so we don't fetch rows and we avoid
        // relying on `data.length` (which can be empty/null depending on settings).
        const { count: recentCount, error: recentError } = await serviceSupabase
            .from('apple_rejections')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('reported_at', monthAgo.toISOString())

        if (recentError) {
            console.error('Error checking rate limit:', {
                message: recentError.message,
                code: (recentError as any).code,
                details: (recentError as any).details,
                hint: (recentError as any).hint,
            })
            return NextResponse.json(
                { message: 'Failed to check rate limit' },
                { status: 500 }
            )
        }

        if ((recentCount ?? 0) >= MAX_REJECTIONS_PER_MONTH) {
            return NextResponse.json(
                {
                    message: `You can only report up to ${MAX_REJECTIONS_PER_MONTH} rejections per month. Please try again later.`,
                },
                { status: 429 }
            )
        }

        // Check for duplicate rejection (same submission, same date)
        const dateString = rejectionDate.toISOString().split('T')[0]
        const { data: existingRejection, error: existingError } = await serviceSupabase
            .from('apple_rejections')
            .select('id')
            .eq('submission_id', submissionId)
            .eq('rejection_date', dateString)
            .single()

        if (existingError && existingError.code !== 'PGRST116') {
            // PGRST116 = no rows found (expected)
            console.error('Error checking duplicate rejection:', existingError)
            return NextResponse.json(
                { message: 'Failed to validate rejection' },
                { status: 500 }
            )
        }

        if (existingRejection) {
            return NextResponse.json(
                { message: 'This rejection has already been reported' },
                { status: 409 }
            )
        }

        // Insert rejection record AND refund credits atomically
        // The rejection record is the source of truth for what was refunded
        const { data: rejection, error: insertError } = await serviceSupabase
            .from('apple_rejections')
            .insert({
                submission_id: submissionId,
                user_id: user.id,
                rejection_date: dateString,
                rejection_reason: body.rejectionReason,
                guideline_violated: body.guidelineViolated || null,
                apple_message: body.appleMessage || null,
                credits_refunded: REFUND_AMOUNT,
                pattern_feedback_processed: false,
                asc_verified: true,
                asc_verified_at: new Date().toISOString(),
                asc_app_id: conn.selected_app_id,
                asc_app_store_version_id: matchingVersion.id,
                asc_app_store_state: ascState,
                asc_version_string: submissionVersionString,
                asc_bundle_id: submissionBundleId,
                asc_build_number: ascBuildNumber,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Error recording rejection:', insertError)
            return NextResponse.json(
                { message: 'Failed to record rejection' },
                { status: 500 }
            )
        }

        // Now refund credits (rejection record is committed, so we have backup)
        const { error: refundError } = await serviceSupabase
            .rpc('refund_credits', { p_user_id: user.id, p_amount: REFUND_AMOUNT })

        if (refundError) {
            console.error('Error refunding credits:', refundError)
            // Note: Rejection record exists but credits weren't refunded
            // This is logged and can be manually reviewed/rectified
            return NextResponse.json(
                { message: 'Rejection recorded but credit refund failed. Please contact support.' },
                { status: 500 }
            )
        }

        // Trigger pattern learning worker (async, don't block response)
        if (rejection?.id && process.env.WORKER_SECRET) {
            try {
                const workerRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/worker/process-rejection-feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-worker-secret': process.env.WORKER_SECRET,
                    },
                    body: JSON.stringify({ rejectionId: rejection.id }),
                })
                if (!workerRes.ok) {
                    console.error(`Pattern feedback worker returned ${workerRes.status} for rejection ${rejection.id}`)
                }
            } catch (err) {
                console.error('Pattern feedback worker trigger failed:', err)
            }
        }

        // Get updated credit balance
        const { data: profile, error: profileError } = await serviceSupabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Error fetching updated profile:', profileError)
            return NextResponse.json(
                {
                    success: true,
                    refundedCredits: REFUND_AMOUNT,
                    rejectionId: rejection?.id,
                    newCreditBalance: null,
                },
                { status: 200 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                refundedCredits: REFUND_AMOUNT,
                rejectionId: rejection?.id,
                newCreditBalance: profile.credits,
            },
            { status: 200 }
        )
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal Server Error'
        console.error('Rejection report error:', err)
        return NextResponse.json(
            { message },
            { status: 500 }
        )
    }
}
