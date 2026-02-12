-- Add Terms of Use / EULA URL for subscription compliance checks
alter table public.submissions
  add column if not exists terms_url text;
