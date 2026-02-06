import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-10-10' as Stripe.LatestApiVersion,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

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
        const userId = session.metadata?.user_id
        const credits = parseInt(session.metadata?.credits || '0', 10)

        if (userId && credits > 0) {
            // Create a service role client to bypass RLS for credit updates
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            // Fetch current credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single()

            const currentCredits = profile?.credits || 0
            const newCredits = currentCredits + credits

            // Update credits
            const { error } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId)

            if (error) {
                console.error('Error updating credits:', error)
                return NextResponse.json({ message: 'Error updating credits' }, { status: 500 })
            }

            console.log(`Successfully added ${credits} credits to user ${userId}. New total: ${newCredits}`)
        }
    }

    return NextResponse.json({ received: true })
}
