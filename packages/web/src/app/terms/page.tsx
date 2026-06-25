'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="container mx-auto px-6 max-w-3xl py-24">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <h1 className="text-4xl font-bold tracking-tight mb-8">Terms</h1>

            <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
                <p className="text-gray-300">Last updated: June 25, 2026</p>

                <h2 className="text-xl font-semibold text-white mt-8">License</h2>
                <p>
                    Preflight is open-source software licensed under AGPL-3.0-only. See the repository license for
                    the full terms that govern copying, modifying, and distributing the software.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">No Hosted Service</h2>
                <p>
                    This repository does not sell credits, subscriptions, or a hosted cloud plan. Anyone who deploys
                    Preflight is responsible for their own infrastructure, provider accounts, data handling, and costs.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">No Guarantee</h2>
                <p>
                    Preflight helps identify App Store review risks, but it cannot guarantee Apple approval. Treat
                    its output as developer guidance, not legal advice or a binding App Store decision.
                </p>
            </div>
        </div>
    )
}
