import { getConfig, setTokens, clearAuth } from './config.js'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants.js'

const API_TIMEOUT_MS = 30_000

export function getSupabaseClient() {
    const { accessToken } = getConfig()
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
    })
}

export async function refreshSession() {
    const { refreshToken } = getConfig()
    if (!refreshToken) return false

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) return false

    if (!data.session.refresh_token) {
        console.warn('Warning: No refresh token returned. Storing access token only.')
        setTokens(data.session.access_token, refreshToken!)
    } else {
        setTokens(data.session.access_token, data.session.refresh_token)
    }
    return true
}

export async function apiRequest(path: string, options: RequestInit = {}) {
    const { apiUrl, accessToken } = getConfig()
    const url = `${apiUrl}${path}`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
        let response = await fetch(url, { ...options, headers, signal: controller.signal })

        // If 401, try refreshing the token
        if (response.status === 401) {
            const refreshed = await refreshSession()
            if (refreshed) {
                const newConfig = getConfig()
                headers['Authorization'] = `Bearer ${newConfig.accessToken}`
                const retryController = new AbortController()
                const retryTimeout = setTimeout(() => retryController.abort(), API_TIMEOUT_MS)
                try {
                    response = await fetch(url, { ...options, headers, signal: retryController.signal })
                } finally {
                    clearTimeout(retryTimeout)
                }
            } else {
                clearAuth()
                throw new Error('Session expired. Please run `preflight login` to re-authenticate.')
            }
        }

        return response
    } finally {
        clearTimeout(timeout)
    }
}
