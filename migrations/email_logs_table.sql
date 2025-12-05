-- Email History Table Migration
-- Tracks all emails sent by the system

-- Add new columns to existing email_logs table (if it exists)
-- First, check if the table exists and add missing columns

-- Add templateType column
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS template_type VARCHAR DEFAULT 'custom';

-- Add errorMessage column  
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add relatedEntityType column
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR;

-- Add relatedEntityId column
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS related_entity_id VARCHAR;

-- Add metadata column
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Make sentBy nullable (was NOT NULL before)
ALTER TABLE email_logs ALTER COLUMN sent_by DROP NOT NULL;

-- Make message nullable (was NOT NULL before)
ALTER TABLE email_logs ALTER COLUMN message DROP NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_type ON email_logs (template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON email_logs (sent_by);
