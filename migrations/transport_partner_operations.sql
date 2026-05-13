-- Transport partner operations: quote approval, roster, availability, partner pricing, activity.

ALTER TYPE transport_request_status ADD VALUE IF NOT EXISTS 'quote_sent';
ALTER TYPE transport_request_status ADD VALUE IF NOT EXISTS 'visitor_approved';
ALTER TYPE transport_request_status ADD VALUE IF NOT EXISTS 'visitor_declined';
ALTER TYPE transport_request_status ADD VALUE IF NOT EXISTS 'reschedule_requested';

ALTER TABLE transport_partners
  ADD COLUMN IF NOT EXISTS default_currency varchar DEFAULT 'MWK',
  ADD COLUMN IF NOT EXISTS pricing_notes text;

ALTER TABLE transport_partners
  DROP COLUMN IF EXISTS default_commission_type,
  DROP COLUMN IF EXISTS default_commission_value,
  DROP COLUMN IF EXISTS commission_currency;

ALTER TABLE transport_requests
  ADD COLUMN IF NOT EXISTS quote_approval_token varchar,
  ADD COLUMN IF NOT EXISTS quote_sent_at timestamp,
  ADD COLUMN IF NOT EXISTS quote_decision varchar,
  ADD COLUMN IF NOT EXISTS quote_decision_at timestamp,
  ADD COLUMN IF NOT EXISTS quote_decision_notes text,
  ADD COLUMN IF NOT EXISTS requested_pickup_time time,
  ADD COLUMN IF NOT EXISTS requested_visit_date date,
  ADD COLUMN IF NOT EXISTS reschedule_notes text,
  ADD COLUMN IF NOT EXISTS driver_id varchar,
  ADD COLUMN IF NOT EXISTS vehicle_id varchar,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_requested_by varchar,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp;

CREATE INDEX IF NOT EXISTS IDX_transport_requests_quote_token
  ON transport_requests (quote_approval_token);

ALTER TABLE transport_requests
  DROP COLUMN IF EXISTS commission_amount,
  DROP COLUMN IF EXISTS commission_currency,
  DROP COLUMN IF EXISTS commission_status,
  DROP COLUMN IF EXISTS commission_notes,
  DROP COLUMN IF EXISTS commission_paid_at;

CREATE TABLE IF NOT EXISTS transport_partner_drivers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar NOT NULL REFERENCES transport_partners(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  phone varchar,
  email varchar,
  license_number varchar,
  status varchar DEFAULT 'active',
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_partner_drivers_partner
  ON transport_partner_drivers (partner_id);
CREATE INDEX IF NOT EXISTS IDX_transport_partner_drivers_status
  ON transport_partner_drivers (status);

CREATE TABLE IF NOT EXISTS transport_partner_vehicles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar NOT NULL REFERENCES transport_partners(id) ON DELETE CASCADE,
  label varchar NOT NULL,
  vehicle_type varchar,
  plate_number varchar,
  capacity integer,
  color varchar,
  status varchar DEFAULT 'active',
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_partner_vehicles_partner
  ON transport_partner_vehicles (partner_id);
CREATE INDEX IF NOT EXISTS IDX_transport_partner_vehicles_status
  ON transport_partner_vehicles (status);

CREATE TABLE IF NOT EXISTS transport_partner_pricing (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar NOT NULL REFERENCES transport_partners(id) ON DELETE CASCADE,
  route varchar NOT NULL,
  label varchar NOT NULL,
  base_price integer NOT NULL,
  currency varchar DEFAULT 'MWK',
  pricing_type varchar DEFAULT 'per_trip',
  price_includes text,
  notes text,
  status varchar DEFAULT 'active',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_partner_pricing_partner
  ON transport_partner_pricing (partner_id);
CREATE INDEX IF NOT EXISTS IDX_transport_partner_pricing_route
  ON transport_partner_pricing (route);
CREATE INDEX IF NOT EXISTS IDX_transport_partner_pricing_status
  ON transport_partner_pricing (status);

CREATE TABLE IF NOT EXISTS transport_partner_blackouts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar NOT NULL REFERENCES transport_partners(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status varchar DEFAULT 'active',
  created_by_user_id varchar REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_partner_blackouts_partner
  ON transport_partner_blackouts (partner_id);
CREATE INDEX IF NOT EXISTS IDX_transport_partner_blackouts_dates
  ON transport_partner_blackouts (start_date, end_date);

CREATE TABLE IF NOT EXISTS transport_request_activity (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id varchar NOT NULL REFERENCES transport_requests(id) ON DELETE CASCADE,
  actor_user_id varchar REFERENCES users(id),
  actor_role varchar,
  action varchar NOT NULL,
  old_status varchar,
  new_status varchar,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_request_activity_request
  ON transport_request_activity (request_id);
CREATE INDEX IF NOT EXISTS IDX_transport_request_activity_created
  ON transport_request_activity (created_at);

ALTER TABLE partner_tour_referrals
  DROP COLUMN IF EXISTS commission_amount,
  DROP COLUMN IF EXISTS commission_currency,
  DROP COLUMN IF EXISTS commission_status,
  DROP COLUMN IF EXISTS commission_notes,
  DROP COLUMN IF EXISTS commission_paid_at;

ALTER TABLE transport_partner_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_partner_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_partner_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_partner_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_request_activity ENABLE ROW LEVEL SECURITY;
