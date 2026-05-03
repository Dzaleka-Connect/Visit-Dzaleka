-- Special offers for limited-time discounts shown on the public site
CREATE TABLE IF NOT EXISTS public.special_offers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  offer_type varchar NOT NULL DEFAULT 'standard',
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  activity_start_date date NOT NULL,
  activity_end_date date NOT NULL,
  booking_notice_days integer CHECK (booking_notice_days IS NULL OR booking_notice_days >= 0),
  discounted_seats integer CHECK (discounted_seats IS NULL OR discounted_seats > 0),
  used_seats integer DEFAULT 0 CHECK (used_seats >= 0),
  tour_types text[] DEFAULT ARRAY[]::text[],
  group_sizes text[] DEFAULT ARRAY[]::text[],
  weekdays text[] DEFAULT ARRAY[]::text[],
  time_slots text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  created_by varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT special_offers_date_range CHECK (activity_end_date >= activity_start_date),
  CONSTRAINT special_offers_offer_type CHECK (offer_type IN ('standard', 'early_bird', 'last_minute'))
);

CREATE INDEX IF NOT EXISTS idx_special_offers_active_dates
  ON public.special_offers (is_active, is_public, activity_start_date, activity_end_date);

ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

