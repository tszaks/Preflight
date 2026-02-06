'use client'

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { Check, CreditCard, Zap, Shield, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

async function fetchCreditsForUser(
    setCurrentCredits: Dispatch<SetStateAction<number | null>>
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single()
        setCurrentCredits(data?.credits || 0)
    }
}

export default function CreditsPage() {
    const [currentCredits, setCurrentCredits] = useState<number | null>(null)

    useEffect(() => {
        void fetchCreditsForUser(setCurrentCredits)
    }, [])

    const handlePurchase = (plan: string) => {
        // Todo: Integrate Stripe
        alert(`Initiating purchase for ${plan} plan. Stripe integration coming soon.`)
    }

    return (
        <div className="container mx-auto px-6 max-w-5xl py-24 min-h-screen">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Power Up Your Workflow</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Pay as you go. No subscriptions. Credits never expire.
                    {currentCredits !== null && <span className="block mt-2 text-white font-medium">Current Balance: {currentCredits.toLocaleString()} Credits</span>}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Starter Plan */}
                <div className="vercel-card p-8 flex flex-col hover:border-white/20 transition-all group">
                    <div className="mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                            <Zap className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Starter</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-3xl font-bold">$10</span>
                            <span className="text-gray-500 text-sm">/ 5 credits</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-2">$2.00 per scan</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Full Compliance Scan</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Basic Report</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => handlePurchase('starter')}
                        className="w-full py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white hover:text-black hover:border-white transition-all text-sm font-medium"
                    >
                        Buy Starter
                    </button>
                </div>

                {/* Pro Plan (Highlighted) */}
                <div className="vercel-card p-8 flex flex-col border-white/20 relative overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                    <div className="mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Pro</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-3xl font-bold">$30</span>
                            <span className="text-gray-500 text-sm">/ 20 credits</span>
                        </div>
                        <p className="text-green-400 text-sm mt-2 font-medium">$1.50 per scan (Save 25%)</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-white">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Priority Queuing</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-white">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Detailed Analysis</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-white">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Email Support</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => handlePurchase('pro')}
                        className="w-full py-2 rounded-md bg-white text-black hover:bg-gray-200 transition-all text-sm font-bold"
                    >
                        Buy Pro
                    </button>
                </div>

                {/* Agency Plan */}
                <div className="vercel-card p-8 flex flex-col hover:border-white/20 transition-all group">
                    <div className="mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                            <Shield className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Agency</h3>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-3xl font-bold">$100</span>
                            <span className="text-gray-500 text-sm">/ 100 credits</span>
                        </div>
                        <p className="text-green-400 text-sm mt-2 font-medium">$1.00 per scan (Save 50%)</p>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Instant Processing</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>API Access (Beta)</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Dedicated Support</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => handlePurchase('agency')}
                        className="w-full py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white hover:text-black hover:border-white transition-all text-sm font-medium"
                    >
                        Buy Agency
                    </button>
                </div>
            </div>

            <div className="mt-16 text-center border-t border-white/5 pt-12">
                <p className="text-sm text-gray-500">
                    Secure payments powered by Stripe. Enterprise needs? <a href="mailto:sales@preflight.com" className="text-white hover:underline">Contact us</a>.
                </p>
                <div className="mt-6 flex justify-center gap-4 opacity-50">
                    {/* Add card brand icons here if we had them or simple text */}
                    <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
            </div>
        </div>
    )
}
