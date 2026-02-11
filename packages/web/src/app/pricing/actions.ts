'use server'

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { CREDIT_AMOUNTS } from '@preflight/shared/constants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS: Record<string, string> = {
    starter: 'price_1StuTwCatxMRYTXTOJusK3zi',
    pro: 'price_1StuUXCatxMRYTXTBFlDuYjK',
    agency: 'price_1StuVaCatxMRYTXTkE9Qirqi',
}

export async function buyCredits(planId: string) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { url: `/auth/signup?next=/pricing&plan=${planId}` }
    }

    if (!PRICE_IDS[planId]) {
        throw new Error('Invalid plan selected')
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    price: PRICE_IDS[planId],
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?credits_purchased=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
            customer_email: user.email,
            metadata: {
                user_id: user.id,
                planId,
                credits: CREDIT_AMOUNTS[planId].toString(),
            },
        })

        return { url: session.url }
    } catch (error) {
        console.error('Stripe checkout error:', error)
        throw new Error('Failed to process payment')
    }
}
