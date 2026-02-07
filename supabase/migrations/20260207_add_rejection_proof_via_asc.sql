-- Migration: Add fraud-resistant proof fields for Apple rejection reporting
-- Goal: Refund credits only when rejection can be verified via App Store Connect (ASC)

-- Store identity extracted from Info.plist / IPA on each submission
ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS bundle_id TEXT,
    ADD COLUMN IF NOT EXISTS bundle_version TEXT,
    ADD COLUMN IF NOT EXISTS build_number TEXT;

-- Store ASC verification metadata on each reported rejection (audit trail)
ALTER TABLE apple_rejections
    ADD COLUMN IF NOT EXISTS asc_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS asc_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS asc_app_id TEXT,
    ADD COLUMN IF NOT EXISTS asc_app_store_version_id TEXT,
    ADD COLUMN IF NOT EXISTS asc_app_store_state TEXT,
    ADD COLUMN IF NOT EXISTS asc_version_string TEXT,
    ADD COLUMN IF NOT EXISTS asc_bundle_id TEXT,
    ADD COLUMN IF NOT EXISTS asc_build_number TEXT;

-- Prevent multiple refunds for the same user and the same ASC version
CREATE UNIQUE INDEX IF NOT EXISTS idx_apple_rejections_user_asc_version_unique
    ON apple_rejections (user_id, asc_app_store_version_id)
    WHERE asc_app_store_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_apple_rejections_asc_verified
    ON apple_rejections (asc_verified);

