-- Additional Visit Dzaleka feedback questions.
-- Run this if tour_reviews was already created before these fields were added.

ALTER TABLE public.tour_reviews
  ADD COLUMN IF NOT EXISTS tour_guide_name varchar,
  ADD COLUMN IF NOT EXISTS country varchar,
  ADD COLUMN IF NOT EXISTS purpose_of_visit varchar,
  ADD COLUMN IF NOT EXISTS group_size varchar,
  ADD COLUMN IF NOT EXISTS referral_source varchar,
  ADD COLUMN IF NOT EXISTS overall_experience varchar,
  ADD COLUMN IF NOT EXISTS guide_experience varchar,
  ADD COLUMN IF NOT EXISTS enjoyed_most text,
  ADD COLUMN IF NOT EXISTS improvement_suggestions text,
  ADD COLUMN IF NOT EXISTS would_recommend varchar,
  ADD COLUMN IF NOT EXISTS other_comments text,
  ADD COLUMN IF NOT EXISTS would_visit_again varchar,
  ADD COLUMN IF NOT EXISTS consent_photos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_testimonial boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_data_processing boolean DEFAULT false;
