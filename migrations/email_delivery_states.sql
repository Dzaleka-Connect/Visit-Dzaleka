-- Track provider delivery lifecycle events from Resend webhooks.
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id ON email_logs(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_related_entity ON email_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_delivery_status ON email_logs(status);
