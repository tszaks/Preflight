-- Migration to add keywords and marketing_url columns
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS keywords TEXT,
ADD COLUMN IF NOT EXISTS marketing_url TEXT;

COMMENT ON COLUMN submissions.keywords IS 'App Store keywords (comma-separated, 100 char max)';
COMMENT ON COLUMN submissions.marketing_url IS 'Optional marketing URL for the app';
