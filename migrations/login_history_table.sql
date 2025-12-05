-- Login History Table - Tracks all login attempts with detailed metadata
CREATE TABLE IF NOT EXISTS login_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  email VARCHAR NOT NULL,
  ip_address VARCHAR,
  user_agent TEXT,
  device_type VARCHAR, -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR,
  os VARCHAR,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason VARCHAR, -- 'invalid_password', 'account_disabled', 'user_not_found'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying by user
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);

-- Index for efficient querying by time
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);

-- Index for querying by success/failure
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);
