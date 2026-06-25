import Link from 'next/link'
import { ArrowLeft, Github, Server } from 'lucide-react'

export default function PricingPage() {
    return (
        <div className="container mx-auto px-6 max-w-3xl py-24">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Open Source</div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                        No hosted plan.
                    </h1>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Preflight is open-source software. Run the CLI locally for static checks, or bring your own
                        database and AI provider for the full web workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                        href="https://github.com/tszaks/Preflight"
                        className="vercel-card p-6 hover:border-white/30 transition-colors"
                    >
                        <Github className="w-5 h-5 mb-4 text-gray-400" />
                        <h2 className="text-lg font-semibold mb-2">Source Code</h2>
                        <p className="text-sm text-gray-400">Fork it, audit it, and run it on your own machine or infrastructure.</p>
                    </a>
                    <Link href="/dashboard" className="vercel-card p-6 hover:border-white/30 transition-colors">
                        <Server className="w-5 h-5 mb-4 text-gray-400" />
                        <h2 className="text-lg font-semibold mb-2">Self-Hosted App</h2>
                        <p className="text-sm text-gray-400">Use your own Supabase project and Anthropic API key if you want the web workflow.</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
