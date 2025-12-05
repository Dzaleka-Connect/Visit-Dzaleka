-- Add potentially missing columns for historical bookings and check-in/out features

-- Check-in/out times
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_by VARCHAR;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_by VARCHAR;

-- Admin notes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Visitor rating (if not already added)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visitor_rating INTEGER;

-- Ensure status enum has 'completed' (it should, but good to verify)
-- Note: Modifying enums in Postgres is different, usually it's:
-- ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
