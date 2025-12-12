-- Add version column for optimistic locking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
