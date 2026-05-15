-- Admin-reviewed guide profile edits and guide post-tour reports.

CREATE TABLE IF NOT EXISTS guide_profile_change_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id varchar NOT NULL REFERENCES guides(id),
  guide_user_id varchar REFERENCES users(id),
  submitted_by_user_id varchar REFERENCES users(id),
  status varchar NOT NULL DEFAULT 'pending',
  current_data jsonb DEFAULT '{}'::jsonb,
  proposed_data jsonb NOT NULL,
  review_notes text,
  reviewed_by_user_id varchar REFERENCES users(id),
  reviewed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS IDX_guide_profile_change_requests_guide
  ON guide_profile_change_requests(guide_id);
CREATE INDEX IF NOT EXISTS IDX_guide_profile_change_requests_status
  ON guide_profile_change_requests(status);
CREATE INDEX IF NOT EXISTS IDX_guide_profile_change_requests_created
  ON guide_profile_change_requests(created_at);

ALTER TABLE guide_profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS guide_tour_reports (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id varchar NOT NULL REFERENCES bookings(id),
  guide_id varchar NOT NULL REFERENCES guides(id),
  guide_user_id varchar REFERENCES users(id),
  summary text NOT NULL,
  visitor_needs text,
  incidents text,
  follow_up_needed boolean DEFAULT false,
  private_notes text,
  status varchar NOT NULL DEFAULT 'submitted',
  admin_review_notes text,
  reviewed_by_user_id varchar REFERENCES users(id),
  reviewed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_guide_tour_reports_booking_guide
  ON guide_tour_reports(booking_id, guide_id);
CREATE INDEX IF NOT EXISTS IDX_guide_tour_reports_guide
  ON guide_tour_reports(guide_id);
CREATE INDEX IF NOT EXISTS IDX_guide_tour_reports_status
  ON guide_tour_reports(status);
CREATE INDEX IF NOT EXISTS IDX_guide_tour_reports_created
  ON guide_tour_reports(created_at);

ALTER TABLE guide_tour_reports ENABLE ROW LEVEL SECURITY;
