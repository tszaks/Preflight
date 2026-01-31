-- Migration to add compliance data columns to submissions table
-- Run this in your Supabase SQL editor

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS age_rating JSONB,
ADD COLUMN IF NOT EXISTS privacy_declarations JSONB,
ADD COLUMN IF NOT EXISTS checklist JSONB;

-- Add comments for documentation
COMMENT ON COLUMN submissions.age_rating IS 'Age rating questionnaire answers from Step 3';
COMMENT ON COLUMN submissions.privacy_declarations IS 'Privacy data collection declarations from Step 3 (what data is collected, linked, used for tracking)';
COMMENT ON COLUMN submissions.checklist IS 'Feature self-check answers from Step 3 (ugc, login, iap, subscriptions, etc.)';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('age_rating', 'privacy_declarations', 'checklist');

-- Add keywords and marketing_url columns
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS keywords TEXT,
ADD COLUMN IF NOT EXISTS marketing_url TEXT;

COMMENT ON COLUMN submissions.keywords IS 'App Store keywords (comma-separated, 100 char max)';
COMMENT ON COLUMN submissions.marketing_url IS 'Optional marketing URL for the app';
