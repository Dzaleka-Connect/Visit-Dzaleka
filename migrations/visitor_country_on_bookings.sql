-- Track visitor country per booking for visibility and reporting.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS visitor_country varchar;

CREATE INDEX IF NOT EXISTS IDX_bookings_visitor_country
  ON bookings(visitor_country);
