-- User Invites Table - Tracks pending invitations for new users
CREATE TABLE IF NOT EXISTS user_invites (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'visitor',
  invite_token VARCHAR NOT NULL UNIQUE,
  invited_by VARCHAR REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for finding invites by token (for accepting)
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(invite_token);

-- Index for finding invites by email
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);

-- Index for finding pending invites (not accepted, not expired)
CREATE INDEX IF NOT EXISTS idx_user_invites_pending ON user_invites(expires_at, accepted_at);
