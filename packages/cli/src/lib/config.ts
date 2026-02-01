import Conf from 'conf'

interface PreflightConfig {
    accessToken?: string
    refreshToken?: string
    apiUrl?: string
    userId?: string
    email?: string
}

const config = new Conf<PreflightConfig>({
    projectName: 'preflight',
    schema: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        apiUrl: { type: 'string', default: 'https://preflight.dev' },
        userId: { type: 'string' },
        email: { type: 'string' },
    },
})

export function getConfig(): PreflightConfig {
    return {
        accessToken: config.get('accessToken'),
        refreshToken: config.get('refreshToken'),
        apiUrl: config.get('apiUrl') || 'https://preflight.dev',
        userId: config.get('userId'),
        email: config.get('email'),
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

export { config }
