-- 1-day GetYourGuide availability queries only need the requested visit window.
CREATE INDEX IF NOT EXISTS bookings_active_visit_date
  ON public.bookings (visit_date)
  WHERE status NOT IN ('cancelled', 'no_show');
