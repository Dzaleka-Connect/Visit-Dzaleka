-- DzalekaVisit Database Migration
-- Run this in Supabase SQL Editor to add all required columns

-- Historical bookings columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visitor_rating INTEGER CHECK (visitor_rating >= 1 AND visitor_rating <= 5);

-- Email verification token columns for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

-- Ensure sessions table exists for PostgreSQL session store
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Grant permissions for sessions table if using RLS
-- (Uncomment if needed)
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Sessions are accessible by server" ON sessions FOR ALL USING (true);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('check_in_time', 'check_out_time', 'admin_notes', 'visitor_rating');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email_verification_token', 'email_verification_expires');
