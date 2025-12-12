-- Add guide payouts tracking table
-- Note: guide_id and paid_by use VARCHAR to match existing table schemas
CREATE TABLE IF NOT EXISTS guide_payouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  guide_id VARCHAR NOT NULL REFERENCES guides(id),
  amount INTEGER NOT NULL,              -- Amount in MWK
  period_start DATE,                    -- Optional: Payout period start
  period_end DATE,                      -- Optional: Payout period end
  tours_count INTEGER DEFAULT 0,        -- Number of tours included
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
  paid_at TIMESTAMP,                    -- When actually paid
  paid_by VARCHAR REFERENCES users(id), -- Admin who processed payment
  payment_method VARCHAR(50),           -- cash, airtel_money, tnm_mpamba
  payment_reference VARCHAR(100),       -- Transaction reference
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payouts_guide ON guide_payouts(guide_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON guide_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON guide_payouts(created_at);
