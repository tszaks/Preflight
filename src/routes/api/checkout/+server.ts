import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_PRICE_QUICK, STRIPE_PRICE_FULL } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

function getStripe() {
    return new Stripe(STRIPE_SECRET_KEY);
}

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
    const stripe = getStripe();
    const { user } = await safeGetSession();
    if (!user) {
        throw error(401, 'Not authenticated');
    }

    const body = await request.json();
    const submissionId = body.submission_id;
    const reviewType = body.review_type;

    if (!submissionId || !reviewType) {
        throw error(400, 'Missing submission_id or review_type');
    }

    const priceId = reviewType === 'full' ? STRIPE_PRICE_FULL : STRIPE_PRICE_QUICK;
    const amount = reviewType === 'full' ? 4900 : 2900;

    if (!priceId) {
        throw error(500, 'Stripe price not configured');
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        metadata: {
            submission_id: submissionId,
            review_type: reviewType,
            user_id: user.id,
        },
        success_url: `${PUBLIC_BASE_URL}/dashboard?payment=success&submission=${submissionId}`,
        cancel_url: `${PUBLIC_BASE_URL}/submit?payment=cancelled&submission=${submissionId}`,
        customer_email: user.email,
    });

    await supabase
        .from('submissions')
        .update({
            stripe_session_id: checkoutSession.id,
            amount_paid: amount,
        })
        .eq('id', submissionId);

    return json({ url: checkoutSession.url });
};
