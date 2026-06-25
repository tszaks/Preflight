import Conf from 'conf'
import { DEFAULT_API_URL } from './constants.js'

interface PreflightConfig {
    accessToken?: string
    refreshToken?: string
    apiUrl: string
    userId?: string
    email?: string
    hasRunBefore?: boolean
    lastScannedPath?: string
    ascConnected?: boolean
}

const config = new Conf<PreflightConfig>({
    projectName: 'preflight',
    schema: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        apiUrl: { type: 'string', default: DEFAULT_API_URL },
        userId: { type: 'string' },
        email: { type: 'string' },
        hasRunBefore: { type: 'boolean', default: false },
        lastScannedPath: { type: 'string' },
        ascConnected: { type: 'boolean', default: false },
    },
})

// Migrate existing users from the old development domain to the local/self-host default.
try {
    const apiUrl = config.get('apiUrl')
    if (apiUrl === 'https://preflight.dev') {
        config.set('apiUrl', DEFAULT_API_URL)
    }
} catch {
    // Migration failed, getConfig() fallback handles it
}

export function getConfig(): PreflightConfig {
    return {
        accessToken: config.get('accessToken'),
        refreshToken: config.get('refreshToken'),
        apiUrl: process.env.PREFLIGHT_API_URL || config.get('apiUrl') || DEFAULT_API_URL,
        userId: config.get('userId'),
        email: config.get('email'),
        hasRunBefore: config.get('hasRunBefore') || false,
        lastScannedPath: config.get('lastScannedPath'),
        ascConnected: config.get('ascConnected') || false,
    }
}

export function setTokens(accessToken: string, refreshToken: string) {
    config.set('accessToken', accessToken)
    config.set('refreshToken', refreshToken)
}

export function setUser(userId: string, email: string) {
    config.set('userId', userId)
    config.set('email', email)
}

export function setApiUrl(url: string) {
    config.set('apiUrl', url)
}

export function clearAuth() {
    config.delete('accessToken')
    config.delete('refreshToken')
    config.delete('userId')
    config.delete('email')
}

export function isLoggedIn(): boolean {
    return !!config.get('accessToken')
}

export function hasRunBefore(): boolean {
    return !!config.get('hasRunBefore')
}

export function markAsRun() {
    config.set('hasRunBefore', true)
}

export function setLastScannedPath(path: string) {
    config.set('lastScannedPath', path)
}

export function getLastScannedPath(): string | undefined {
    return config.get('lastScannedPath')
}

export function getAscConnected(): boolean {
    return config.get('ascConnected') || false
}

export function setAscConnected(connected: boolean) {
    config.set('ascConnected', connected)
}

export { config }
