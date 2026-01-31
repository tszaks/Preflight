-- Add ipa_binary to check_category enum
-- This is needed for IPA binary analysis results

ALTER TYPE check_category ADD VALUE IF NOT EXISTS 'ipa_binary';
