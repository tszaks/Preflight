import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' });

// Credit package price IDs (from Stripe dashboard)
const PRICE_IDS: Record<string, string> = {
    starter: 'price_1StuTwCatxMRYTXTOJusK3zi',  // $49 - 200 credits
    pro: 'price_1StuUXCatxMRYTXTBFlDuYjK',      // $99 - 600 credits
    agency: 'price_1StuVaCatxMRYTXTkE9Qirqi',   // $249 - 2000 credits
};

// Credit amounts for each plan
const CREDIT_AMOUNTS: Record<string, number> = {
    starter: 200,   // 1 review + 4 rechecks
    pro: 600,       // 3 reviews + 12 rechecks
    agency: 2000,   // 10 reviews + 40 rechecks
};

export const actions: Actions = {
    buyCredits: async ({ request, locals: { safeGetSession } }) => {
        const formData = await request.formData();
        const plan = formData.get('plan')?.toString() as keyof typeof PRICE_IDS;

        const { user } = await safeGetSession();

        if (!user) {
            // Send to signup with return URL to resume checkout
            throw redirect(303, `/auth/signup?next=/pricing&plan=${plan || 'starter'}`);
        }

        if (!plan || !PRICE_IDS[plan]) {
            return fail(400, { message: 'Invalid plan selected' });
        }

        try {
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: [
                    {
                        price: PRICE_IDS[plan],
                        quantity: 1,
                    },
                ],
                success_url: `${PUBLIC_BASE_URL}/dashboard?credits_purchased=true`,
                cancel_url: `${PUBLIC_BASE_URL}/pricing`,
                customer_email: user.email,
                metadata: {
                    user_id: user.id,
                    plan,
                    credits: CREDIT_AMOUNTS[plan].toString(),
                },
            });

            if (session.url) {
                throw redirect(303, session.url);
            }

            return fail(500, { message: 'Failed to create checkout session' });
        } catch (error) {
            console.error('Stripe checkout error:', error);
            return fail(500, { message: 'Failed to process payment' });
        }
    },
};
