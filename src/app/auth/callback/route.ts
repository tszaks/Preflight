import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

  if (process.env.NODE_ENV === 'development') {
    return new URL(request.url).origin
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const baseUrl = getBaseUrl(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/auth/login?error=Could+not+verify+email`)
}
