-- Give new users 50 free credits on signup
-- This sets the column default so any new profile row gets 50 credits automatically

ALTER TABLE profiles ALTER COLUMN credits SET DEFAULT 50;

-- Update the handle_new_user trigger function to explicitly set credits = 50
-- This ensures the trigger doesn't override the default with NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (
    NEW.id,
    NEW.email,
    50  -- Free credits on signup
  );
  RETURN NEW;
END;
$$;
