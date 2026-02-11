-- Ensure new accounts always start with 100 free credits,
-- and remediate early x100 promo signups that missed the signup baseline.

ALTER TABLE public.profiles
  ALTER COLUMN credits SET DEFAULT 100;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    100
  );
  RETURN NEW;
END;
$$;

-- One-time remediation: users who redeemed x100 and still sit exactly at +100,
-- with no submissions yet, likely missed the signup baseline +100.
WITH impacted AS (
  SELECT DISTINCT p.id
  FROM public.profiles p
  JOIN public.credit_redemptions cr ON cr.user_id = p.id
  JOIN public.credit_campaigns c ON c.id = cr.campaign_id
  WHERE c.slug = 'x100'
    AND p.credits = c.bonus_credits
    AND NOT EXISTS (
      SELECT 1
      FROM public.submissions s
      WHERE s.user_id = p.id
    )
)
UPDATE public.profiles p
SET
  credits = p.credits + 100,
  updated_at = now()
FROM impacted i
WHERE p.id = i.id;
