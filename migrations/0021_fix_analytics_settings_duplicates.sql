-- Fix duplicate analytics_settings rows
-- This migration cleans up duplicate rows and ensures only one row exists

-- First, keep only the most recently updated record
DELETE FROM analytics_settings
WHERE id NOT IN (
  SELECT id FROM analytics_settings
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1
);

-- Update the remaining row to have the consistent ID
UPDATE analytics_settings
SET id = 'default-analytics-settings'
WHERE id != 'default-analytics-settings';

-- Note: If you have no rows yet, the application will create one with the default ID automatically.
