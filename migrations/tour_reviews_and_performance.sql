-- Verified tour reviews and performance opportunity tracking support.

CREATE TABLE IF NOT EXISTS public.tour_reviews (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id varchar NOT NULL,
  booking_reference varchar NOT NULL,
  visitor_name varchar NOT NULL,
  visitor_email varchar NOT NULL,
  guide_id varchar,
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  title varchar,
  comment text,
  tour_guide_name varchar,
  country varchar,
  purpose_of_visit varchar,
  group_size varchar,
  referral_source varchar,
  overall_experience varchar,
  guide_experience varchar,
  enjoyed_most text,
  improvement_suggestions text,
  would_recommend varchar,
  other_comments text,
  would_visit_again varchar,
  consent_photos boolean DEFAULT false,
  consent_testimonial boolean DEFAULT false,
  consent_data_processing boolean DEFAULT false,
  source varchar DEFAULT 'direct',
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  review_token varchar UNIQUE,
  staff_notes text,
  response_text text,
  response_by varchar,
  responded_at timestamp,
  requested_at timestamp,
  submitted_at timestamp,
  published_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_reviews_booking_unique
  ON public.tour_reviews (booking_id);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_reference
  ON public.tour_reviews (booking_reference);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_status
  ON public.tour_reviews (status);

CREATE INDEX IF NOT EXISTS idx_tour_reviews_submitted
  ON public.tour_reviews (submitted_at DESC);

ALTER TABLE public.tour_reviews ENABLE ROW LEVEL SECURITY;

-- The Express API is the authorization boundary for reviews.
-- Backend requests should use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
DROP POLICY IF EXISTS "No anon access" ON public.tour_reviews;
CREATE POLICY "No anon access"
  ON public.tour_reviews
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
