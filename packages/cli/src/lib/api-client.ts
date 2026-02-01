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

export async function refreshSession(): Promise<boolean> {
    const { refreshToken } = getConfig()
    if (!refreshToken) return false

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) return false

    setTokens(data.session.access_token, data.session.refresh_token ?? refreshToken)
    return true
}

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const { apiUrl, accessToken } = getConfig()
    const url = `${apiUrl}${path}`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    }

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
    }

    let response = await fetchWithTimeout(url, { ...options, headers })

    // If 401, try refreshing the token
    if (response.status === 401) {
        const refreshed = await refreshSession()
        if (refreshed) {
            const newConfig = getConfig()
            headers['Authorization'] = `Bearer ${newConfig.accessToken}`
            response = await fetchWithTimeout(url, { ...options, headers })
        } else {
            clearAuth()
            throw new Error('Session expired. Please run `preflight login` to re-authenticate.')
        }
    }

    return response
}
