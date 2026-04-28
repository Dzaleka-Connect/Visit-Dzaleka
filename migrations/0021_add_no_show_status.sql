-- Add no_show status to booking_status enum
-- This allows guides to mark visitors who didn't show up for their tour

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_show';
