'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-6 max-w-3xl py-24">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy</h1>

            <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
                <p className="text-gray-300">Last updated: June 25, 2026</p>

                <h2 className="text-xl font-semibold text-white mt-8">Open-Source Software</h2>
                <p>
                    This repository does not provide a hosted Preflight service. If you run Preflight locally or
                    self-host it, you control where app files, account data, reports, and logs are stored.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">Local CLI</h2>
                <p>
                    The local CLI scan reads files from the project path you provide and runs checks on your machine.
                    It does not require a Preflight account or Tyler-operated infrastructure.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">Self-Hosted Web App</h2>
                <p>
                    The optional web app can use Supabase for auth, database, and storage, and Anthropic for AI
                    analysis. Those services are configured by whoever deploys the app. Review your own provider
                    settings, retention policy, and access controls before processing private app data.
                </p>
            </div>
        </div>
    )
}
