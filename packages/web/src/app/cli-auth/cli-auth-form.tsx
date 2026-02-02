'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Terminal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OAuthButtons from '@/components/OAuthButtons'

export default function CLIAuthForm() {
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect_to')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const supabase = createClient()
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            if (!data.session) {
                setError('Login succeeded but no session was returned.')
                return
            }

            if (!redirectTo) {
                setError('Missing redirect URL. Please start the login from the Preflight CLI.')
                return
            }

            const { access_token, refresh_token } = data.session

            // Show success briefly, then redirect with tokens
            setSuccess(true)

            const callbackUrl = new URL(redirectTo)
            callbackUrl.searchParams.set('access_token', access_token)
            callbackUrl.searchParams.set('refresh_token', refresh_token || '')

            setTimeout(() => {
                window.location.href = callbackUrl.toString()
            }, 800)
            return
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-6">
                <div className="w-full max-w-sm text-center">
                    <div className="vercel-card">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tighter mb-2">Authenticated</h1>
                        <p className="text-sm text-gray-500 font-light">Redirecting back to the CLI...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-6">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/preflight-brand.png"
                        alt="Preflight"
                        width={140}
                        height={32}
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="vercel-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-border flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tighter">CLI Login</h1>
                            <p className="text-xs text-gray-500 font-light">Log in to use Preflight from your terminal</p>
                        </div>
                    </div>

                    {!redirectTo && (
                        <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md mb-4">
                            No redirect URL detected. Please start the login flow from the CLI by running <code className="bg-white/5 px-1.5 py-0.5 rounded text-yellow-400">preflight login</code>.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                autoFocus
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

                        <button
                            type="submit"
                            disabled={loading || !redirectTo}
                            className="vercel-btn-primary w-full disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Log In"}
                        </button>
                    </form>

                    {redirectTo && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-[#0a0a0a] px-3 text-gray-500">or</span>
                                </div>
                            </div>

                            <OAuthButtons
                                cliRedirectTo={redirectTo}
                                redirectAfterAuth="/cli-auth/callback"
                            />
                        </>
                    )}

                    <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-gray-600 text-center leading-relaxed">
                            After logging in, your session will be sent back to the CLI running on your machine. No credentials are stored in the browser.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
