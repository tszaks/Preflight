import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const PROMO_COOKIE = 'promo_slug'

function getBaseUrl(request: NextRequest): string {
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

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/dashboard'
  return next
}

function clearPromoCookie(response: NextResponse) {
  response.cookies.set(PROMO_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

type PromoRedeemResult =
  | { status: 'applied'; credits: number }
  | { status: 'not_applied'; reason: string }

async function redeemPromoCampaign(
  supabase: Awaited<ReturnType<typeof createClient>>,
  promoSlug: string,
): Promise<PromoRedeemResult> {
  const { data: userResult } = await supabase.auth.getUser()
  const user = userResult.user

  if (!user) {
    return { status: 'not_applied', reason: 'no_user' }
  }

  const { data, error } = await (supabase as any).rpc('redeem_credit_campaign', {
    p_slug: promoSlug,
    p_user_id: user.id,
  })

  if (error) {
    console.error('[promo] Redemption RPC failed:', error)
    return { status: 'not_applied', reason: 'rpc_error' }
  }

  const row = Array.isArray(data) ? data[0] : null
  const success = Boolean(row?.success)
  const reason = typeof row?.reason === 'string' ? row.reason : 'unknown'
  const creditsGranted = typeof row?.credits_granted === 'number' ? row.credits_granted : 0

  if (!success) {
    return { status: 'not_applied', reason }
  }

  return { status: 'applied', credits: creditsGranted }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'))
  const baseUrl = getBaseUrl(request)
  const promoSlug = request.cookies.get(PROMO_COOKIE)?.value?.trim().toLowerCase()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const destination = new URL(next, baseUrl)

      if (promoSlug) {
        const promoResult = await redeemPromoCampaign(supabase, promoSlug)

        if (destination.pathname === '/dashboard') {
          if (promoResult.status === 'applied') {
            destination.searchParams.set('promo', 'applied')
            destination.searchParams.set('credits', String(promoResult.credits))
          } else {
            destination.searchParams.set('promo', 'not_applied')
            destination.searchParams.set('reason', promoResult.reason)
          }
        }
      }

      const response = NextResponse.redirect(destination)
      if (promoSlug) clearPromoCookie(response)
      return response
    }
  }

  const response = NextResponse.redirect(`${baseUrl}/auth/login?error=Could+not+verify+email`)
  if (promoSlug) clearPromoCookie(response)
  return response
}
