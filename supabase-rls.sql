-- Dzaleka Visit - Supabase RLS and storage hardening
-- Run this in Supabase SQL Editor after schema migrations.
--
-- The application uses Express/session auth and the backend Supabase client should
-- use SUPABASE_SERVICE_ROLE_KEY. These tables should not be queried directly from
-- browser clients through PostgREST.

BEGIN;

DO $$
DECLARE
  table_name text;
  policy_name text;
  exposed_tables text[] := ARRAY[
    'sessions',
    'external_calendars',
    'pricing_config',
    'users',
    'points_of_interest',
    'guide_availability',
    'audit_logs',
    'login_history',
    'booking_activity_logs',
    'incidents',
    'tasks',
    'task_history',
    'task_attachments',
    'zones',
    'booking_companions',
    'email_logs',
    'email_templates',
    'support_tickets',
    'zone_visits',
    'page_views',
    'training_modules',
    'task_comments',
    'help_articles',
    'guide_training_progress',
    'favorite_guides',
    'recurring_bookings',
    'saved_itineraries',
    'guides',
    'itineraries',
    'notifications',
    'analytics_settings',
    'chat_messages',
    'chat_participants',
    'chat_rooms',
    'blog_posts',
    'content_blocks',
    'bookings',
    'api_keys',
    'allowed_ips',
    'guide_payouts',
    'user_invites',
    'events',
    'guide_payments',
    'meeting_points',
    'partner_tour_referrals',
    'transport_partners',
    'transport_requests',
    'guide_profile_change_requests',
    'transport_partner_blackouts',
    'transport_partner_drivers',
    'transport_partner_pricing',
    'transport_partner_vehicles',
    'guide_tour_reports',
    'transport_request_activity',
    'special_offers',
    'tour_reviews',
    'scheduled_reports',
    'webhook_endpoints',
    'webhook_deliveries'
  ];
BEGIN
  FOREACH table_name IN ARRAY exposed_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

      -- Remove existing broad policies from earlier migration attempts. With no
      -- anon/auth policies, PostgREST cannot expose rows; service_role bypasses RLS.
      FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Fix Supabase linter warning 0011: function search_path must not be role-mutable.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'increment_api_key_usage'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn);
  END LOOP;
END $$;

-- Public buckets can still serve public object URLs without a broad SELECT policy.
-- Dropping these policies prevents Storage list endpoints from enumerating avatars.
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

COMMIT;

SELECT 'Supabase RLS hardening complete: public tables are RLS-protected and avatar listing policies were removed.' AS message;
