-- Add campaign-based credit redemptions (X promo links, referral drops, etc.)
-- Initial campaign: x100 (+100 credits), 30 days, max 1000 redemptions

CREATE TABLE IF NOT EXISTS public.credit_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bonus_credits INTEGER NOT NULL CHECK (bonus_credits > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_redemptions INTEGER NOT NULL CHECK (max_redemptions > 0),
  redemptions_count INTEGER NOT NULL DEFAULT 0 CHECK (redemptions_count >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_campaigns_window_valid CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.credit_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.credit_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_granted INTEGER NOT NULL CHECK (credits_granted > 0),
  source TEXT NOT NULL DEFAULT 'x',
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_campaign_user_unique UNIQUE (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_credit_campaigns_slug_active
  ON public.credit_campaigns (slug, active);

CREATE INDEX IF NOT EXISTS idx_credit_redemptions_user_id
  ON public.credit_redemptions (user_id);

CREATE INDEX IF NOT EXISTS idx_credit_redemptions_campaign_id
  ON public.credit_redemptions (campaign_id);

ALTER TABLE public.credit_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can read only their own redemptions.
DROP POLICY IF EXISTS "Users can read own credit redemptions" ON public.credit_redemptions;
CREATE POLICY "Users can read own credit redemptions"
  ON public.credit_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- No public policy on campaigns: campaign reads should happen server-side.

CREATE OR REPLACE FUNCTION public.redeem_credit_campaign(p_slug text, p_user_id uuid)
RETURNS TABLE(success boolean, reason text, credits_granted integer, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := now();
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_campaign public.credit_campaigns%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_new_balance integer;
BEGIN
  IF v_slug = '' OR p_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'invalid_input', 0, NULL::integer;
    RETURN;
  END IF;

  SELECT *
  INTO v_campaign
  FROM public.credit_campaigns
  WHERE slug = v_slug
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found', 0, NULL::integer;
    RETURN;
  END IF;

  IF v_campaign.active IS NOT TRUE THEN
    RETURN QUERY SELECT false, 'inactive', 0, NULL::integer;
    RETURN;
  END IF;

  IF v_campaign.starts_at > v_now THEN
    RETURN QUERY SELECT false, 'not_started', 0, NULL::integer;
    RETURN;
  END IF;

  IF v_campaign.ends_at <= v_now THEN
    RETURN QUERY SELECT false, 'expired', 0, NULL::integer;
    RETURN;
  END IF;

  IF v_campaign.redemptions_count >= v_campaign.max_redemptions THEN
    RETURN QUERY SELECT false, 'cap_reached', 0, NULL::integer;
    RETURN;
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'profile_not_found', 0, NULL::integer;
    RETURN;
  END IF;

  -- New users only for this campaign model:
  -- if profile predates campaign start, they are not eligible.
  IF v_profile.created_at < v_campaign.starts_at THEN
    RETURN QUERY SELECT false, 'not_eligible_existing_user', 0, coalesce(v_profile.credits, 0)::integer;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.credit_redemptions cr
    WHERE cr.campaign_id = v_campaign.id
      AND cr.user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'already_redeemed', 0, coalesce(v_profile.credits, 0)::integer;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    credits = coalesce(credits, 0) + v_campaign.bonus_credits,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  INSERT INTO public.credit_redemptions (campaign_id, user_id, credits_granted, source)
  VALUES (v_campaign.id, p_user_id, v_campaign.bonus_credits, 'x');

  UPDATE public.credit_campaigns
  SET
    redemptions_count = redemptions_count + 1,
    updated_at = now()
  WHERE id = v_campaign.id;

  RETURN QUERY SELECT true, 'ok', v_campaign.bonus_credits, v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_credit_campaign(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_credit_campaign(text, uuid) TO service_role;

INSERT INTO public.credit_campaigns (
  slug,
  name,
  bonus_credits,
  starts_at,
  ends_at,
  max_redemptions,
  redemptions_count,
  active
)
VALUES (
  'x100',
  'X Launch +100 Credits',
  100,
  now(),
  now() + interval '30 days',
  1000,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  bonus_credits = EXCLUDED.bonus_credits,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  max_redemptions = EXCLUDED.max_redemptions,
  active = EXCLUDED.active,
  updated_at = now();
