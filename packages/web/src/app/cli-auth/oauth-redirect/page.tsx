'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CLIOAuthRedirect() {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function redirectToCLI() {
            const cliRedirectTo = sessionStorage.getItem('cli_redirect_to')
            sessionStorage.removeItem('cli_redirect_to')

            if (!cliRedirectTo) {
                setError('No CLI redirect URL found. Please start the login flow from the Preflight CLI.')
                return
            }

            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setError('No active session. Please try logging in again.')
                return
            }

            const callbackUrl = new URL(cliRedirectTo)
            callbackUrl.searchParams.set('access_token', session.access_token)
            callbackUrl.searchParams.set('refresh_token', session.refresh_token || '')

            window.location.href = callbackUrl.toString()
        }

        redirectToCLI()
    }, [])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black px-6">
                <div className="w-full max-w-sm text-center">
                    <div className="vercel-card">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-tighter mb-2">Something went wrong</h1>
                        <p className="text-sm text-gray-500 font-light">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

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
