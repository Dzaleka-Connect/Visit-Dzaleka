-- Transport partner portal: partner accounts, transport requests, and partner tour referrals

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'transport_partner';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_request_status') THEN
    CREATE TYPE transport_request_status AS ENUM (
      'pending',
      'sent_to_partner',
      'accepted',
      'confirmed',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_referral_status') THEN
    CREATE TYPE partner_referral_status AS ENUM (
      'submitted',
      'contacted',
      'booked',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS transport_partners (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id),
  company_name varchar NOT NULL,
  contact_name varchar,
  email varchar NOT NULL,
  phone varchar,
  whatsapp varchar,
  base_location varchar,
  preferred_contact_method varchar DEFAULT 'whatsapp',
  payment_terms text,
  public_notes text,
  internal_notes text,
  service_areas text[] DEFAULT ARRAY[]::text[],
  status varchar DEFAULT 'active',
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_transport_partners_user ON transport_partners(user_id);
CREATE INDEX IF NOT EXISTS IDX_transport_partners_email ON transport_partners(email);

INSERT INTO transport_partners (
  id,
  company_name,
  contact_name,
  email,
  service_areas,
  status,
  notes
) VALUES (
  'ashraf-taxi-tours',
  'Ashraf''s Taxi & Tours',
  'Ashraf',
  'ashraftaximw',
  ARRAY['Lilongwe', 'Dzaleka', 'Lake Malawi', 'Senga Bay']::text[],
  'active',
  'Seeded from the initial Visit Dzaleka transport partnership conversation.'
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS transport_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id varchar REFERENCES bookings(id),
  partner_id varchar REFERENCES transport_partners(id),
  visitor_name varchar NOT NULL,
  visitor_email varchar NOT NULL,
  visitor_phone varchar,
  visit_date date,
  visit_time time,
  route varchar NOT NULL,
  pickup_location text,
  notes text,
  status transport_request_status DEFAULT 'pending',
  quoted_amount integer,
  currency varchar DEFAULT 'MWK',
  estimated_pickup_time time,
  driver_name varchar,
  driver_phone varchar,
  vehicle_details text,
  partner_notes text,
  admin_notes text,
  assigned_by_user_id varchar REFERENCES users(id),
  assigned_at timestamp,
  partner_responded_at timestamp,
  created_by_user_id varchar REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_transport_requests_partner ON transport_requests(partner_id);
CREATE INDEX IF NOT EXISTS IDX_transport_requests_booking ON transport_requests(booking_id);
CREATE INDEX IF NOT EXISTS IDX_transport_requests_status ON transport_requests(status);

ALTER TABLE transport_partners ADD COLUMN IF NOT EXISTS base_location varchar;
ALTER TABLE transport_partners ADD COLUMN IF NOT EXISTS preferred_contact_method varchar DEFAULT 'whatsapp';
ALTER TABLE transport_partners ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE transport_partners ADD COLUMN IF NOT EXISTS public_notes text;
ALTER TABLE transport_partners ADD COLUMN IF NOT EXISTS internal_notes text;

ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS quoted_amount integer;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS currency varchar DEFAULT 'MWK';
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS estimated_pickup_time time;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS driver_name varchar;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS driver_phone varchar;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS vehicle_details text;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS assigned_by_user_id varchar REFERENCES users(id);
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS assigned_at timestamp;
ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS partner_responded_at timestamp;

CREATE TABLE IF NOT EXISTS partner_tour_referrals (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar NOT NULL REFERENCES transport_partners(id),
  booking_id varchar REFERENCES bookings(id),
  visitor_name varchar NOT NULL,
  visitor_email varchar NOT NULL,
  visitor_phone varchar,
  visit_date date NOT NULL,
  visit_time time NOT NULL,
  group_size group_size NOT NULL,
  number_of_people integer DEFAULT 1,
  tour_type tour_type NOT NULL,
  notes text,
  status partner_referral_status DEFAULT 'submitted',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_partner_tour_referrals_partner ON partner_tour_referrals(partner_id);
CREATE INDEX IF NOT EXISTS IDX_partner_tour_referrals_booking ON partner_tour_referrals(booking_id);
CREATE INDEX IF NOT EXISTS IDX_partner_tour_referrals_status ON partner_tour_referrals(status);

ALTER TABLE transport_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_tour_referrals ENABLE ROW LEVEL SECURITY;
