-- =====================================================
-- Combined Analytics Cleanup Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- ===== PART 1: Fix analytics_settings duplicates =====
-- Keep only the most recently updated record
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

-- ===== PART 2: Clean page_views duplicates =====
-- Remove duplicates where same session recorded same page within 1 second
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY session_id, page, date_trunc('second', created_at)
           ORDER BY id
         ) as row_num
  FROM page_views
)
DELETE FROM page_views
WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);

-- ===== PART 3: Prevent future page_views duplicates =====
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_views_unique_entry 
ON page_views (session_id, page, date_trunc('second', created_at));

-- ===== Summary =====
-- Run this to see remaining counts:
-- SELECT 'analytics_settings' as table_name, COUNT(*) as rows FROM analytics_settings
-- UNION ALL
-- SELECT 'page_views' as table_name, COUNT(*) as rows FROM page_views;
