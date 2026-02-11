'use client'

import { useState } from 'react'
import { Check, Shield, Clock, Zap } from 'lucide-react'
import { buyCredits } from './actions'
import { cn } from '@/components/ui/status'

const plans = [
    {
        id: "free",
        name: "Free",
        credits: 100,
        price: 0,
        description: "Try Preflight risk-free",
        free: true,
        ctaLabel: "Get Started",
        ctaLink: "/signup",
        creditsNote: "on signup",
        features: [
            { text: "Local compliance scan", hint: "Info.plist, privacy manifest, screenshots" },
            { text: "100 credits on signup", hint: "1 full review included" },
            { text: "No credit card required" },
        ],
    },
    {
        id: "starter",
        name: "Starter",
        credits: 200,
        price: 49,
        description: "Perfect for your first launch",
        features: [
            "1 full review + 4 rechecks",
            "Complete compliance report",
            "Never expires",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        credits: 600,
        price: 99,
        savings: "Save 33%",
        description: "For developers shipping regularly",
        featured: true,
        features: [
            "3 full reviews + 12 rechecks",
            "Perfect for iterating before launch",
            "Best value for active devs",
        ],
    },
    {
        id: "agency",
        name: "Agency",
        credits: 2000,
        price: 249,
        savings: "Save 49%",
        description: "For teams and agencies",
        features: [
            "10 full reviews + 40 rechecks",
            "Cover your whole app portfolio",
            "Volume pricing for studios",
        ],
    },
]

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null)

    const handleBuy = async (planId: string) => {
        setLoading(planId)
        try {
            const { url } = await buyCredits(planId)
            if (url) window.location.href = url
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="container mx-auto px-6 max-w-7xl py-24">
            <header className="text-center mb-16 space-y-4">
                <div className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Pricing</div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                    Catch rejection risks <br />
                    <span className="text-gray-500">before Apple does.</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
                    One-time purchase. No subscription. Credits never expire. <br />
                    <span className="text-sm font-mono text-gray-500">Full review = 100 credits &middot; Recheck = 25 credits</span>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "vercel-card relative flex flex-col p-8 transition-all hover:scale-[1.02]",
                            plan.featured && "border-white/30 bg-white/[0.02]"
                        )}
                    >
                        {plan.featured && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-gray-500 text-sm font-light leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="mb-8 flex items-baseline gap-2">
                            <span className="text-5xl font-bold tracking-tighter">${plan.price}</span>
                            {plan.savings && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">{plan.savings}</span>}
                        </div>

                        <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                            <div className="text-2xl font-bold tracking-tight">{plan.credits}</div>
                            <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                {plan.creditsNote ? plan.creditsNote : "Credits"}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-grow">
                            {plan.features.map((feature, i) => {
                                const text = typeof feature === 'string' ? feature : feature.text
                                const hint = typeof feature === 'string' ? null : feature.hint
                                return (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400 font-light">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>
                                            {text}
                                            {hint && <span className="block text-[11px] text-gray-600 mt-0.5">({hint})</span>}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>

                        {plan.free ? (
                            <a
                                href={plan.ctaLink}
                                className="w-full py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 text-center block"
                            >
                                {plan.ctaLabel}
                            </a>
                        ) : (
                            <button
                                onClick={() => handleBuy(plan.id)}
                                disabled={!!loading}
                                className={cn(
                                    "w-full py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all",
                                    plan.featured
                                        ? "bg-white text-black hover:bg-gray-200"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                )}
                            >
                                {loading === plan.id ? "Processing..." : "Buy Credits"}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-16 mt-16">
                <div className="flex items-center gap-4 text-gray-400">
                    <Shield className="w-6 h-6 text-gray-600" />
                    <div className="text-sm font-light">Credits never expire. Use them when you need them.</div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <Clock className="w-6 h-6 text-gray-600" />
                    <div className="text-sm font-light">Results in minutes. Catch issues before you submit.</div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <Zap className="w-6 h-6 text-gray-600" />
                    <div className="text-sm font-light">One-time purchase. No recurring fees or hidden costs.</div>
                </div>
            </div>
        </div>
    )
}
