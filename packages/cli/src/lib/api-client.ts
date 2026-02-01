import { getConfig, setTokens } from './config.js'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cfqzdyktjhkalfrmcgmw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcXpkeWt0amhrYWxmcm1jZ213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzM4MjYsImV4cCI6MjA4NDg0OTgyNn0.O1bPUNHw7kzpWecAyT4Pizh2ITRSal3PJsrUIkZY04o'

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

    setTokens(data.session.access_token, data.session.refresh_token!)
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

    let response = await fetch(url, { ...options, headers })

    // If 401, try refreshing the token
    if (response.status === 401) {
        const refreshed = await refreshSession()
        if (refreshed) {
            const newConfig = getConfig()
            headers['Authorization'] = `Bearer ${newConfig.accessToken}`
            response = await fetch(url, { ...options, headers })
        }
    }

    return response
}
