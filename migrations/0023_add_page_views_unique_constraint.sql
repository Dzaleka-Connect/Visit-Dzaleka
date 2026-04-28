-- Add unique constraint to prevent future duplicate page views
-- This constraint ensures the same session can't record the same page twice in the same second

-- First, ensure no duplicates exist (run 0022 first!)
-- Then add the constraint:

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_views_unique_entry 
ON page_views (session_id, page, date_trunc('second', created_at));

-- Note: This index uses date_trunc to round created_at to the nearest second,
-- preventing rapid duplicate tracking for the same page within a session.
