import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

function parseCredits(value: string | undefined): number | null {
    if (!value) return null
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return parsed
}

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
        return NextResponse.json({ message: 'Webhook Error: Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ message: `Webhook Error: ${message}` }, { status: 400 })
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id?.trim()
        const credits = parseCredits(session.metadata?.credits)
        const eventContext = {
            event_id: event.id,
            event_type: event.type,
            user_id: userId ?? null,
            credits: credits ?? null,
        }

        if (!userId || !credits) {
            console.warn('[stripe-webhook] Skipping credit grant due to invalid metadata', eventContext)
            return NextResponse.json({ received: true })
        }

        // Create a service role client to bypass RLS for credit updates
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch current profile to decide between normal update and recovery upsert.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, credits')
            .eq('id', userId)
            .maybeSingle()

        if (profileError) {
            console.error('[stripe-webhook] Failed to read profile before credit grant', {
                ...eventContext,
                error: profileError,
            })
            return NextResponse.json({ message: 'Error reading profile' }, { status: 500 })
        }

        if (profile) {
            const currentCredits = profile.credits || 0
            const newCredits = currentCredits + credits
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId)
                .select('id, credits')
                .maybeSingle()

            if (updateError) {
                console.error('[stripe-webhook] Error updating credits', {
                    ...eventContext,
                    error: updateError,
                })
                return NextResponse.json({ message: 'Error updating credits' }, { status: 500 })
            }

            if (!updatedProfile) {
                console.error('[stripe-webhook] Profile update returned no row', eventContext)
                return NextResponse.json({ message: 'Profile update yielded no row' }, { status: 500 })
            }

            console.log('[stripe-webhook] Awarded credits', {
                ...eventContext,
                status: 'awarded',
                new_balance: updatedProfile.credits,
            })
            return NextResponse.json({ received: true })
        }

        // Recovery path: profile row is missing. Recreate using checkout email.
        let recoveryEmail = session.customer_email || session.customer_details?.email || null
        if (!recoveryEmail) {
            const { data: adminUser, error: adminUserError } = await supabase.auth.admin.getUserById(userId)
            if (adminUserError) {
                console.error('[stripe-webhook] Could not fetch auth user for profile recovery', {
                    ...eventContext,
                    error: adminUserError,
                })
                return NextResponse.json({ message: 'Profile missing and email lookup failed' }, { status: 500 })
            }
            recoveryEmail = adminUser.user.email || null
        }

        if (!recoveryEmail) {
            console.error('[stripe-webhook] Profile recovery blocked because email is unavailable', eventContext)
            return NextResponse.json({ message: 'Profile missing and email unavailable' }, { status: 500 })
        }

        const { data: insertedProfile, error: recoveryError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: recoveryEmail,
                credits,
                full_name: null,
            })
            .select('id, credits')
            .maybeSingle()

        if (!recoveryError && insertedProfile) {
            console.log('[stripe-webhook] Recovered profile and awarded credits', {
                ...eventContext,
                status: 'recovered_awarded',
                new_balance: insertedProfile.credits,
            })
            return NextResponse.json({ received: true })
        }

        // Race recovery: profile may have been created between read and insert.
        const { data: racedProfile, error: raceReadError } = await supabase
            .from('profiles')
            .select('id, credits')
            .eq('id', userId)
            .maybeSingle()

        if (raceReadError || !racedProfile) {
            console.error('[stripe-webhook] Failed to recover missing profile and apply credits', {
                ...eventContext,
                error: recoveryError ?? raceReadError ?? 'missing_row_after_insert',
            })
            return NextResponse.json({ message: 'Error recovering missing profile' }, { status: 500 })
        }

        const racedNewCredits = (racedProfile.credits || 0) + credits
        const { data: racedUpdatedProfile, error: raceUpdateError } = await supabase
            .from('profiles')
            .update({ credits: racedNewCredits })
            .eq('id', userId)
            .select('id, credits')
            .maybeSingle()

        if (raceUpdateError || !racedUpdatedProfile) {
            console.error('[stripe-webhook] Failed to apply credits after profile race recovery', {
                ...eventContext,
                error: raceUpdateError ?? 'missing_row_after_race_update',
            })
            return NextResponse.json({ message: 'Error applying credits after recovery' }, { status: 500 })
        }

        console.log('[stripe-webhook] Awarded credits after race recovery', {
            ...eventContext,
            status: 'race_recovered_awarded',
            new_balance: racedUpdatedProfile.credits,
        })
        return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })
}
