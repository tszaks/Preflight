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

            <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>

            <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
                <p className="text-gray-300">Last updated: January 31, 2026</p>

                <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
                <p>
                    By accessing and using Preflight ("the Service"), you agree to be bound by these Terms of Service.
                    If you do not agree to these terms, please do not use our Service.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">2. Description of Service</h2>
                <p>
                    Preflight provides an automated analysis service that simulates Apple's App Store review process
                    to help developers identify potential compliance issues before submitting their iOS applications.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">3. Credits and Payment</h2>
                <p>
                    The Service operates on a credit-based system. Credits are non-refundable and never expire.
                    One full review costs 100 credits. Credit purchases are processed securely through Stripe.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">4. No Guarantee</h2>
                <p>
                    While we strive to provide accurate analysis, Preflight does not guarantee that your app will
                    be approved by Apple. Our analysis is based on publicly available guidelines and is provided
                    for informational purposes only.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">5. User Responsibilities</h2>
                <p>
                    You are responsible for the accuracy and legality of any content you submit for analysis.
                    You must not submit content that violates any applicable laws or third-party rights.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">6. Intellectual Property</h2>
                <p>
                    You retain all rights to your submitted content. By using our Service, you grant us a
                    limited license to process your content solely for the purpose of providing the analysis service.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">7. Limitation of Liability</h2>
                <p>
                    Preflight shall not be liable for any indirect, incidental, special, consequential, or
                    punitive damages resulting from your use of or inability to use the Service.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">8. Contact</h2>
                <p>
                    For questions about these Terms, please contact us at{' '}
                    <a href="mailto:support@preflight.dev" className="text-white hover:underline">support@preflight.dev</a>.
                </p>
            </div>
        </div>
    )
}
