ALTER TABLE community_listings
  ADD COLUMN IF NOT EXISTS experience_price integer,
  ADD COLUMN IF NOT EXISTS experience_currency varchar DEFAULT 'MWK',
  ADD COLUMN IF NOT EXISTS experience_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS experience_min_guests integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience_max_guests integer,
  ADD COLUMN IF NOT EXISTS experience_booking_notes text,
  ADD COLUMN IF NOT EXISTS impact_statement text;

CREATE TABLE IF NOT EXISTS community_experience_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id varchar NOT NULL REFERENCES community_listings(id),
  visitor_name varchar NOT NULL,
  visitor_email varchar NOT NULL,
  visitor_phone varchar,
  preferred_date date NOT NULL,
  preferred_time varchar,
  group_size integer NOT NULL DEFAULT 1,
  message text,
  status varchar NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp
);

CREATE INDEX IF NOT EXISTS IDX_community_experience_requests_listing
  ON community_experience_requests(listing_id);

CREATE INDEX IF NOT EXISTS IDX_community_experience_requests_status
  ON community_experience_requests(status);

CREATE INDEX IF NOT EXISTS IDX_community_experience_requests_created
  ON community_experience_requests(created_at);
