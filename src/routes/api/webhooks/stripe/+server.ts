import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

function getStripe() {
    return new Stripe(STRIPE_SECRET_KEY);
}

export const POST: RequestHandler = async ({ request }) => {
    const stripe = getStripe();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', message);
        return json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Use service role client for webhook operations (no user session)
    const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is a credit purchase or single review purchase
        const userId = session.metadata?.user_id;
        const credits = session.metadata?.credits;
        const submissionId = session.metadata?.submission_id;
        const reviewType = session.metadata?.review_type;

        // === Credit Purchase Flow ===
        if (userId && credits) {
            const creditAmount = parseInt(credits);

            // Add credits to user's account
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            const currentCredits = profile?.credits ?? 0;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: currentCredits + creditAmount })
                .eq('id', userId);

            if (updateError) {
                console.error('Failed to update user credits:', updateError);
                return json({ error: 'Credit update failed' }, { status: 500 });
            }

            console.log(`Added ${creditAmount} credits to user ${userId}. New balance: ${currentCredits + creditAmount}`);
            return json({ received: true });
        }

        // === Single Review Purchase Flow (Legacy) ===
        if (!submissionId) {
            console.error('Webhook: No submission_id or user_id in metadata');
            return json({ error: 'Missing required metadata' }, { status: 400 });
        }

        // Update submission to paid
        const { error: updateError } = await supabase
            .from('submissions')
            .update({
                status: 'paid',
                stripe_payment_intent: session.payment_intent as string,
                paid_at: new Date().toISOString(),
            })
            .eq('id', submissionId);

        if (updateError) {
            console.error('Failed to update submission:', updateError);
            return json({ error: 'Database update failed' }, { status: 500 });
        }

        // Create analysis job
        const { error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
                submission_id: submissionId,
                status: 'pending',
                priority: reviewType === 'full' ? 1 : 0,
            });

        if (jobError) {
            console.error('Failed to create analysis job:', jobError);
            return json({ error: 'Job creation failed' }, { status: 500 });
        }

        // Update submission status to queued
        await supabase
            .from('submissions')
            .update({ status: 'queued' })
            .eq('id', submissionId);

        console.log(`Payment complete for submission ${submissionId}, job queued`);
    }

    return json({ received: true });
};
