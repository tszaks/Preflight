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

            <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>

            <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
                <p className="text-gray-300">Last updated: January 31, 2026</p>

                <h2 className="text-xl font-semibold text-white mt-8">1. Information We Collect</h2>
                <p>
                    We collect information you provide directly, including your email address, password (encrypted),
                    and any app submission data you upload for analysis (metadata, descriptions, screenshots,
                    Info.plist files, and privacy manifests).
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">2. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and improve our analysis service</li>
                    <li>Process your credit purchases</li>
                    <li>Send service-related communications</li>
                    <li>Protect against fraud and abuse</li>
                </ul>

                <h2 className="text-xl font-semibold text-white mt-8">3. Data Storage and Security</h2>
                <p>
                    Your data is stored securely using Supabase infrastructure with industry-standard encryption.
                    Uploaded files are stored in private storage buckets accessible only to your account.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">4. Data Retention</h2>
                <p>
                    We retain your submission data and analysis reports indefinitely for your reference.
                    You can request deletion of your account and associated data at any time by contacting support.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">5. Third-Party Services</h2>
                <p>We use the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Supabase:</strong> Authentication and database hosting</li>
                    <li><strong>Stripe:</strong> Payment processing</li>
                    <li><strong>Anthropic (Claude):</strong> AI-powered analysis (no data retained by Anthropic)</li>
                </ul>

                <h2 className="text-xl font-semibold text-white mt-8">6. Cookies</h2>
                <p>
                    We use essential cookies for authentication and session management.
                    We do not use tracking or advertising cookies.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">7. Your Rights</h2>
                <p>
                    You have the right to access, correct, or delete your personal data.
                    To exercise these rights, contact us at{' '}
                    <a href="mailto:privacy@preflight.dev" className="text-white hover:underline">privacy@preflight.dev</a>.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">8. Changes to Privacy Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of any
                    significant changes by email or through the Service.
                </p>

                <h2 className="text-xl font-semibold text-white mt-8">9. Contact</h2>
                <p>
                    For questions about this Privacy Policy, please contact us at{' '}
                    <a href="mailto:privacy@preflight.dev" className="text-white hover:underline">privacy@preflight.dev</a>.
                </p>
            </div>
        </div>
    )
}
