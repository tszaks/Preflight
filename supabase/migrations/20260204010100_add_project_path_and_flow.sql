-- Migration to add project_path and flow_position to submissions table

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS project_path TEXT,
ADD COLUMN IF NOT EXISTS flow_position TEXT;

-- Add comments for documentation
COMMENT ON COLUMN submissions.project_path IS 'The local absolute path to the Xcode project directory on the user''s machine';
COMMENT ON COLUMN submissions.flow_position IS 'The current step identifier the user is on in the submission flow';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('project_path', 'flow_position');
