-- Calendar feeds are now token-scoped and fail closed when no hashed token is
-- configured. Existing calendars intentionally receive no public feed token.

ALTER TABLE external_calendars
  ADD COLUMN IF NOT EXISTS feed_token_hash varchar,
  ADD COLUMN IF NOT EXISTS feed_owner_user_id varchar REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS feed_audience varchar DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS include_sensitive_details boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS IDX_external_calendars_feed_token_hash
  ON external_calendars (feed_token_hash);
