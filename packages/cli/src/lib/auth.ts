import http from 'node:http'
import open from 'open'
import { setTokens, setUser, clearAuth, getConfig } from './config.js'
import { CALLBACK_PORT, DEFAULT_API_URL } from './constants.js'

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function htmlPage(title: string, subtitle: string): string {
    return `<html>
        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: white;">
            <div style="text-align: center;">
                <h1>${title}</h1>
                <p style="color: #888;">${subtitle}</p>
            </div>
        </body>
        </html>`
}

/**
 * Decodes a JWT payload without verifying the signature.
 * Used to extract user info (email, sub) from the access token.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid JWT format')
    const payload = parts[1]!
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    return JSON.parse(decoded)
}

export async function loginWithBrowser(): Promise<{ email: string } | null> {
    const { apiUrl } = getConfig()
    const baseUrl = apiUrl || DEFAULT_API_URL

    return new Promise((resolve) => {
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`)

            if (url.pathname === '/callback') {
                const accessToken = url.searchParams.get('access_token')
                const refreshToken = url.searchParams.get('refresh_token')

                if (!accessToken || !refreshToken) {
                    const errorMsg = escapeHtml(url.searchParams.get('error') || 'No tokens received')
                    res.writeHead(400, { 'Content-Type': 'text/html' })
                    res.end(htmlPage('Login failed', errorMsg))
                    server.close()
                    resolve(null)
                    return
                }

                try {
                    const payload = decodeJwtPayload(accessToken)
                    const userId = (payload.sub as string) || ''
                    const email = (payload.email as string) || ''

                    setTokens(accessToken, refreshToken)
                    setUser(userId, email)

                    res.writeHead(200, { 'Content-Type': 'text/html' })
                    res.end(htmlPage('Logged in to Preflight!', 'You can close this tab and return to your terminal.'))

                    server.close()
                    resolve({ email })
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' })
                    res.end(htmlPage('Login failed', 'Could not process authentication tokens.'))
                    server.close()
                    resolve(null)
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end('Not found')
            }
        })

        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Error: Port ${CALLBACK_PORT} is already in use. Close the other process and try again.`)
            } else {
                console.error(`Server error: ${err.message}`)
            }
            resolve(null)
        })

        server.listen(CALLBACK_PORT, () => {
            const redirectTo = encodeURIComponent(`http://localhost:${CALLBACK_PORT}/callback`)
            const loginUrl = `${baseUrl}/cli-auth?redirect_to=${redirectTo}`
            open(loginUrl)
        })

        // Timeout after 5 minutes
        setTimeout(() => {
            server.close()
            resolve(null)
        }, 5 * 60 * 1000)
    })
}

export function logout() {
    clearAuth()
}
