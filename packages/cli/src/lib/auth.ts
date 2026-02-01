import http from 'node:http'
import { createClient } from '@supabase/supabase-js'
import open from 'open'
import { setTokens, setUser, clearAuth } from './config.js'

const SUPABASE_URL = 'https://cfqzdyktjhkalfrmcgmw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcXpkeWt0amhrYWxmcm1jZ213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzM4MjYsImV4cCI6MjA4NDg0OTgyNn0.O1bPUNHw7kzpWecAyT4Pizh2ITRSal3PJsrUIkZY04o'
const CALLBACK_PORT = 54321

export async function loginWithBrowser(): Promise<{ email: string } | null> {
    return new Promise((resolve) => {
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`)

            if (url.pathname === '/callback') {
                const code = url.searchParams.get('code')

                if (!code) {
                    res.writeHead(400, { 'Content-Type': 'text/html' })
                    res.end('<html><body><h1>Login failed</h1><p>No authorization code received.</p></body></html>')
                    server.close()
                    resolve(null)
                    return
                }

                try {
                    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                    if (error || !data.session) {
                        res.writeHead(400, { 'Content-Type': 'text/html' })
                        res.end('<html><body><h1>Login failed</h1><p>' + (error?.message || 'Unknown error') + '</p></body></html>')
                        server.close()
                        resolve(null)
                        return
                    }

                    setTokens(data.session.access_token, data.session.refresh_token!)
                    setUser(data.session.user.id, data.session.user.email || '')

                    res.writeHead(200, { 'Content-Type': 'text/html' })
                    res.end(`
                        <html>
                        <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: white;">
                            <div style="text-align: center;">
                                <h1>Logged in to Preflight!</h1>
                                <p>You can close this tab and return to your terminal.</p>
                            </div>
                        </body>
                        </html>
                    `)

                    server.close()
                    resolve({ email: data.session.user.email || '' })
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' })
                    res.end('<html><body><h1>Login failed</h1><p>Internal error</p></body></html>')
                    server.close()
                    resolve(null)
                }
            }
        })

        server.listen(CALLBACK_PORT, () => {
            const loginUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=email&redirect_to=http://localhost:${CALLBACK_PORT}/callback`
            // Open the Preflight login page which will redirect to Supabase auth
            open(`${SUPABASE_URL}/auth/v1/authorize?provider=email&redirect_to=http://localhost:${CALLBACK_PORT}/callback`)
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
