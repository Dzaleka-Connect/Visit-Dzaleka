-- Migration: Add new guide profile fields
-- Run this in Supabase SQL Editor

-- Add availability fields
ALTER TABLE guides ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS preferred_times text[] DEFAULT '{}';

-- Add emergency contact fields
ALTER TABLE guides ADD COLUMN IF NOT EXISTS emergency_contact_name varchar;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS emergency_contact_phone varchar;

-- Add payment preferences
ALTER TABLE guides ADD COLUMN IF NOT EXISTS preferred_payment_method varchar DEFAULT 'cash';

-- Add additional notes
ALTER TABLE guides ADD COLUMN IF NOT EXISTS additional_notes text;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'guides' 
AND column_name IN ('available_days', 'preferred_times', 'emergency_contact_name', 'emergency_contact_phone', 'preferred_payment_method', 'additional_notes');
