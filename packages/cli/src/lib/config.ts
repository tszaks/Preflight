import Conf from 'conf'
import { DEFAULT_API_URL } from './constants.js'

interface PreflightConfig {
    accessToken?: string
    refreshToken?: string
    apiUrl?: string
    userId?: string
    email?: string
    hasRunBefore?: boolean
    lastScannedPath?: string
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
    },
})

// Migrate existing users from old domain
try {
    if (config.get('apiUrl') === 'https://preflight.dev') {
        config.set('apiUrl', DEFAULT_API_URL)
    }
} catch {
    // Migration failed, getConfig() fallback handles it
}

export function getConfig(): PreflightConfig {
    return {
        accessToken: config.get('accessToken'),
        refreshToken: config.get('refreshToken'),
        apiUrl: config.get('apiUrl') || DEFAULT_API_URL,
        userId: config.get('userId'),
        email: config.get('email'),
        hasRunBefore: config.get('hasRunBefore') || false,
        lastScannedPath: config.get('lastScannedPath'),
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

export { config }
