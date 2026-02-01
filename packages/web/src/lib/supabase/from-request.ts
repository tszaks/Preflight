import { createClient } from './server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@preflight/shared/types/database'

/**
 * Create a Supabase client from a request, supporting both cookie and Bearer token auth.
 * CLI sends Bearer tokens; web app sends cookies. This helper handles both.
 */
export async function createClientFromRequest(req: Request) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        return createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` }
                }
            }
        )
    }
    // Fall back to cookie-based auth (existing web flow)
    return await createClient()
}
