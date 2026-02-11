import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/
const PROMO_COOKIE = 'promo_slug'
const PROMO_COOKIE_TTL_SECONDS = 60 * 60 * 24

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

  if (process.env.NODE_ENV === 'development') {
    return new URL(request.url).origin
  }

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

function buildSignupUrl(request: NextRequest, promoSlug?: string): URL {
  const signupUrl = new URL('/auth/signup', getPublicOrigin(request))
  if (promoSlug) {
    signupUrl.searchParams.set('promo', promoSlug)
  }
  return signupUrl
}

function isCampaignLive(campaign: {
  active?: boolean
  starts_at?: string | null
  ends_at?: string | null
  redemptions_count?: number
  max_redemptions?: number
}): boolean {
  if (!campaign.active) return false

  const now = Date.now()
  const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : NaN
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : NaN

  if (Number.isFinite(startsAt) && startsAt > now) return false
  if (Number.isFinite(endsAt) && endsAt <= now) return false

  if (
    typeof campaign.redemptions_count === 'number' &&
    typeof campaign.max_redemptions === 'number' &&
    campaign.redemptions_count >= campaign.max_redemptions
  ) {
    return false
  }

  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params
  const slug = rawSlug?.trim().toLowerCase()

  if (!slug || !SLUG_PATTERN.test(slug)) {
    return NextResponse.redirect(buildSignupUrl(request))
  }

  let isLive = false

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('credit_campaigns')
      .select('active, starts_at, ends_at, redemptions_count, max_redemptions')
      .eq('slug', slug)
      .maybeSingle()

    if (!error && data) {
      isLive = isCampaignLive(data)
    }
  } catch (err) {
    console.error('[promo route] Failed to load campaign:', err)
  }

  const destination = buildSignupUrl(request, isLive ? slug : undefined)
  const response = NextResponse.redirect(destination)

  if (isLive) {
    response.cookies.set(PROMO_COOKIE, slug, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: PROMO_COOKIE_TTL_SECONDS,
    })
  }

  return response
}
