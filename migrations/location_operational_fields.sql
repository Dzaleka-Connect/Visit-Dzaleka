-- Operational fields for Zones, Points of Interest, and Meeting Points.
-- These columns support visitor-facing visibility, internal guidance, review
-- hygiene, and richer meeting-point instructions.

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS zone_type varchar DEFAULT 'route_area',
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS last_reviewed_at date,
  ADD COLUMN IF NOT EXISTS last_reviewed_by varchar;

UPDATE public.zones
SET
  zone_type = COALESCE(zone_type, 'route_area'),
  is_public = COALESCE(is_public, true),
  sort_order = COALESCE(sort_order, 0);

ALTER TABLE public.points_of_interest
  ADD COLUMN IF NOT EXISTS visitor_description text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS photo_policy varchar DEFAULT 'ask_first',
  ADD COLUMN IF NOT EXISTS mobility_level varchar DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS best_visit_days text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS requires_permission boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_directory_url text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reviewed_at date,
  ADD COLUMN IF NOT EXISTS last_reviewed_by varchar;

UPDATE public.points_of_interest
SET
  visitor_description = COALESCE(visitor_description, description),
  photo_policy = COALESCE(photo_policy, 'ask_first'),
  mobility_level = COALESCE(mobility_level, 'easy'),
  best_visit_days = COALESCE(best_visit_days, ARRAY[]::text[]),
  requires_permission = COALESCE(requires_permission, false),
  is_public = COALESCE(is_public, true);

ALTER TABLE public.meeting_points
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS meeting_instructions text,
  ADD COLUMN IF NOT EXISTS guide_identification_note text,
  ADD COLUMN IF NOT EXISTS arrival_buffer_minutes integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS backup_meeting_point text,
  ADD COLUMN IF NOT EXISTS safety_notes text,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_reviewed_at date,
  ADD COLUMN IF NOT EXISTS last_reviewed_by varchar;

UPDATE public.meeting_points
SET
  arrival_buffer_minutes = COALESCE(arrival_buffer_minutes, 10),
  is_default = COALESCE(is_default, false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'zones_zone_type_check'
  ) THEN
    ALTER TABLE public.zones
      ADD CONSTRAINT zones_zone_type_check
      CHECK (zone_type IN ('residential', 'market', 'education', 'organization', 'viewpoint', 'admin', 'route_area'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'points_of_interest_photo_policy_check'
  ) THEN
    ALTER TABLE public.points_of_interest
      ADD CONSTRAINT points_of_interest_photo_policy_check
      CHECK (photo_policy IN ('allowed', 'ask_first', 'restricted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'points_of_interest_mobility_level_check'
  ) THEN
    ALTER TABLE public.points_of_interest
      ADD CONSTRAINT points_of_interest_mobility_level_check
      CHECK (mobility_level IN ('easy', 'moderate', 'difficult'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meeting_points_latitude_check'
  ) THEN
    ALTER TABLE public.meeting_points
      ADD CONSTRAINT meeting_points_latitude_check
      CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meeting_points_longitude_check'
  ) THEN
    ALTER TABLE public.meeting_points
      ADD CONSTRAINT meeting_points_longitude_check
      CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_zones_operational_sort
  ON public.zones (is_active, is_public, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_points_of_interest_operational
  ON public.points_of_interest (is_active, is_public, category);

CREATE INDEX IF NOT EXISTS idx_meeting_points_default_active
  ON public.meeting_points (is_active, is_default, name);
