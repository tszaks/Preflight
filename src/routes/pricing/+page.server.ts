import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' });

// Credit package price IDs (from Stripe dashboard)
const PRICE_IDS = {
    starter: 'price_1StuTwCatxMRYTXTOJusK3zi',
    pro: 'price_1StuUXCatxMRYTXTBFlDuYjK',
    team: 'price_1StuUqCatxMRYTXTCJM5ALRU',
    agency: 'price_1StuVaCatxMRYTXTkE9Qirqi',
};

// Credit amounts for each plan
const CREDIT_AMOUNTS = {
    starter: 100,
    pro: 350,
    team: 750,
    agency: 1500,
};

export const actions: Actions = {
    buyCredits: async ({ request, locals: { safeGetSession } }) => {
        const { user } = await safeGetSession();

        if (!user) {
            throw redirect(303, '/auth/login');
        }

        const formData = await request.formData();
        const plan = formData.get('plan')?.toString() as keyof typeof PRICE_IDS;

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
