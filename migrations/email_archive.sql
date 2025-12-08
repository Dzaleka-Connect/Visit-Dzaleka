-- Add archive and delete support for email logs
-- Run this in Supabase SQL Editor

-- Add archived column to email_logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add deleted_at column for soft delete
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_email_logs_archived ON email_logs(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_email_logs_deleted ON email_logs(deleted_at) WHERE deleted_at IS NULL;
