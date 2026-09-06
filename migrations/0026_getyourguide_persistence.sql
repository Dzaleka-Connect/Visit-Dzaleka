-- Shared by all Netlify instances. No traveler/contact data is stored in telemetry.
CREATE TABLE IF NOT EXISTS public.getyourguide_reservations (
  reservation_reference text PRIMARY KEY,
  gyg_booking_reference text NOT NULL,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'booked', 'cancelled')),
  booking_id varchar REFERENCES public.bookings(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS getyourguide_reservations_reference ON public.getyourguide_reservations(gyg_booking_reference);
CREATE INDEX IF NOT EXISTS getyourguide_reservations_active
  ON public.getyourguide_reservations (expires_at) WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS bookings_getyourguide_reference
  ON public.bookings(external_reference_id)
  WHERE source = 'getyourguide' AND external_reference_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.getyourguide_activity (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint text NOT NULL,
  product_id text,
  success boolean NOT NULL,
  error_code text,
  diagnostic boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS getyourguide_activity_recent ON public.getyourguide_activity(created_at DESC);
ALTER TABLE public.getyourguide_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.getyourguide_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.getyourguide_reservations, public.getyourguide_activity FROM anon, authenticated;
