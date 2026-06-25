import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreditsPage() {
    return (
        <div className="container mx-auto px-6 max-w-3xl py-24 min-h-screen">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            <div className="space-y-4">
                <div className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Legacy Credits</div>
                <h1 className="text-4xl font-bold tracking-tight">Credits are disabled by default.</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Open-source Preflight does not sell credits or require payment. This route remains only for forks
                    that choose to keep the old credit-based database model.
                </p>
            </div>
        </div>
    )
}
