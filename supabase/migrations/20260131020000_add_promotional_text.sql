-- Migration to add promotional_text column and rename from subtitle
-- Also removes subtitle column if it exists

-- Add promotional_text column
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS promotional_text TEXT;

-- Copy existing subtitle data to promotional_text if subtitle exists
UPDATE submissions 
SET promotional_text = subtitle 
WHERE promotional_text IS NULL AND subtitle IS NOT NULL;

COMMENT ON COLUMN submissions.promotional_text IS 'Promotional text shown on app product page (170 char max in ASC)';
