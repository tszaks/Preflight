import { getConfig, setTokens, clearAuth } from './config.js'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './constants.js'

const API_TIMEOUT_MS = 30_000
const API_MAX_RETRIES = 3

export function getSupabaseClient() {
    const { accessToken } = getConfig()
    if (!DEFAULT_SUPABASE_URL || !DEFAULT_SUPABASE_ANON_KEY) {
        throw new Error('Set PREFLIGHT_SUPABASE_URL and PREFLIGHT_SUPABASE_ANON_KEY to use Supabase-backed CLI features.')
    }

    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
        global: {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        },
    })
}

export async function refreshSession(): Promise<boolean> {
    const { refreshToken } = getConfig()
    if (!refreshToken) return false
    if (!DEFAULT_SUPABASE_URL || !DEFAULT_SUPABASE_ANON_KEY) return false

    const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY)
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

function isRetryableHttp(status: number): boolean {
    return status === 502 || status === 503 || status === 504
}

function isRetryableError(err: unknown): boolean {
    if (!(err instanceof Error)) return false
    // Undici / Node fetch error messages vary; match common transient cases.
    const msg = err.message.toLowerCase()
    return (
        msg.includes('fetch failed') ||
        msg.includes('network') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('eai_again') ||
        msg.includes('aborted')
    )
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastErr: unknown = null

    for (let attempt = 1; attempt <= API_MAX_RETRIES; attempt++) {
        try {
            const res = await fetchWithTimeout(url, options)
            if (!isRetryableHttp(res.status) || attempt === API_MAX_RETRIES) return res

            // Backoff before retrying.
            const base = 250 * Math.pow(2, attempt - 1)
            const jitter = Math.floor(Math.random() * 150)
            await new Promise((r) => setTimeout(r, base + jitter))
            continue
        } catch (err) {
            lastErr = err
            if (!isRetryableError(err) || attempt === API_MAX_RETRIES) throw err

            const base = 250 * Math.pow(2, attempt - 1)
            const jitter = Math.floor(Math.random() * 150)
            await new Promise((r) => setTimeout(r, base + jitter))
        }
    }

    // Should never reach here, but keep TS happy.
    throw lastErr instanceof Error ? lastErr : new Error('Request failed')
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

    let response = await fetchWithRetry(url, { ...options, headers })

    // If 401, try refreshing the token
    if (response.status === 401) {
        const refreshed = await refreshSession()
        if (refreshed) {
            const newConfig = getConfig()
            headers['Authorization'] = `Bearer ${newConfig.accessToken}`
            response = await fetchWithRetry(url, { ...options, headers })
        } else {
            clearAuth()
            throw new Error('Session expired. Please run `preflight login` to re-authenticate.')
        }
    }

    return response
}
