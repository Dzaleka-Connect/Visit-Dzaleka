-- Store structured cancellation context for staff review, visitor emails, and reporting.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_category text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_note text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

CREATE INDEX IF NOT EXISTS bookings_cancellation_category_idx
  ON public.bookings (cancellation_category);
