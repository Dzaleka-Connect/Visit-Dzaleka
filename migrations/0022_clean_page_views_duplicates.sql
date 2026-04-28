-- Clean up duplicate page_views rows
-- Duplicates are defined as records with the same session_id, page, and created_at within 1 second

-- This CTE finds duplicates and keeps only the first one (by ID)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY session_id, page, date_trunc('second', created_at)
           ORDER BY id
         ) as row_num
  FROM page_views
)
DELETE FROM page_views
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Report how many rows remain
-- SELECT COUNT(*) as remaining_rows FROM page_views;
