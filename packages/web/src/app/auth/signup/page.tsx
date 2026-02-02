'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '../actions'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OAuthButtons from '@/components/OAuthButtons'

export default function SignupPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [existing, setExisting] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)

    // Redirect if already logged in
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/dashboard')
            } else {
                setCheckingAuth(false)
            }
        }
        checkAuth()
    }, [router])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const result = await signup(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else if (result?.existing) {
            setExisting(true)
            setLoading(false)
        } else if (result?.success) {
            setMessage(result.message || 'Check your email to confirm your account.')
            setLoading(false)
        }
    }

    // Show a loading state while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-gray-500">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-6">
            <div className="w-full max-w-sm">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to site
                </Link>

                <div className="vercel-card">
                    <h1 className="text-2xl font-bold tracking-tighter mb-2">Create account</h1>
                    <p className="text-sm text-gray-500 font-light mb-8">Start scanning your iOS apps today</p>

                    <OAuthButtons />

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#0a0a0a] px-3 text-gray-500">or</span>
                        </div>
                    </div>

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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                className="w-full bg-black border border-border rounded-md px-3 py-2 text-sm focus:border-white transition-colors outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {existing && (
                            <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md space-y-2">
                                <p>An account with this email already exists.</p>
                                <Link href="/auth/login" className="inline-block text-white underline underline-offset-4 hover:text-yellow-300 transition-colors">
                                    Sign in instead
                                </Link>
                            </div>
                        )}

                        {message && (
                            <div className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 p-3 rounded-md">
                                {message}
                            </div>
                        )}

                        {!existing && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="vercel-btn-primary w-full disabled:opacity-50"
                            >
                                {loading ? "Creating account..." : "Sign Up"}
                            </button>
                        )}
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-gray-500 font-light">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-white hover:underline underline-offset-4">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
