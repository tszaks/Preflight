'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '../actions'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const result = await resetPassword(formData)

        if (result?.error) {
            setError(result.error)
        } else if (result?.success) {
            setMessage(result.message || 'Check your email for a password reset link.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-6">
            <div className="w-full max-w-sm">
                <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to login
                </Link>

                <div className="vercel-card">
                    <h1 className="text-2xl font-bold tracking-tighter mb-2">Reset password</h1>
                    <p className="text-sm text-gray-500 font-light mb-8">Enter your email and we&apos;ll send you a reset link</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm focus:border-white transition-colors outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        {error && (
                            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 p-3 rounded-md">
                                {message}
                            </div>
                        )}

                        {!message && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="vercel-btn-primary w-full disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
