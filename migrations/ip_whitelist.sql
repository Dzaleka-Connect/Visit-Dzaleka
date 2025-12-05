CREATE TABLE IF NOT EXISTS allowed_ips (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR NOT NULL UNIQUE,
  description TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
