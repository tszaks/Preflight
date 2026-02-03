-- Migration: Add apple_rejections table for tracking Apple rejection reports
-- Allows users to report when Apple rejected their app, enabling credit refunds
-- and pattern confidence calibration

CREATE TABLE IF NOT EXISTS apple_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rejection_date DATE NOT NULL,
    rejection_reason TEXT NOT NULL,
    guideline_violated TEXT,
    apple_message TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    credits_refunded INTEGER DEFAULT 100,
    pattern_feedback_processed BOOLEAN DEFAULT FALSE,

    CONSTRAINT unique_submission_rejection UNIQUE(submission_id, rejection_date),
    CONSTRAINT rejection_date_not_future CHECK (rejection_date <= CURRENT_DATE)
);

-- Create indexes for common queries
CREATE INDEX idx_apple_rejections_user_id ON apple_rejections(user_id);
CREATE INDEX idx_apple_rejections_submission_id ON apple_rejections(submission_id);
CREATE INDEX idx_apple_rejections_reported_at ON apple_rejections(reported_at);
CREATE INDEX idx_apple_rejections_guideline ON apple_rejections(guideline_violated);

-- Add RLS policies (users can only read/insert their own rejections)
ALTER TABLE apple_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rejections"
    ON apple_rejections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rejections"
    ON apple_rejections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role (worker) can update pattern_feedback_processed flag
-- Regular users cannot update (pattern learning is server-only)
CREATE POLICY "Service role updates feedback processing status"
    ON apple_rejections FOR UPDATE
    USING (false)  -- Prevent user-facing updates via RLS
    WITH CHECK (false);

-- Add comments for documentation
COMMENT ON TABLE apple_rejections IS 'Tracks Apple rejections reported by users for pattern learning and credit refunds';
COMMENT ON COLUMN apple_rejections.rejection_date IS 'Date Apple rejected the submission (from user input)';
COMMENT ON COLUMN apple_rejections.rejection_reason IS 'Apple rejection reason as stated in App Store Connect';
COMMENT ON COLUMN apple_rejections.guideline_violated IS 'Specific guideline number (e.g., "4.3") if available';
COMMENT ON COLUMN apple_rejections.apple_message IS 'Full rejection message from Apple';
COMMENT ON COLUMN apple_rejections.credits_refunded IS 'Number of credits refunded (fixed at 100)';
COMMENT ON COLUMN apple_rejections.pattern_feedback_processed IS 'Whether pattern confidence has been updated based on this rejection';
