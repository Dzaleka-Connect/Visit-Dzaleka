-- Dzaleka Visit - Supabase RLS and storage hardening
-- Run after the schema/table migrations.
--
-- The Express API is the authorization boundary for this app. Browser clients
-- should not read/write public tables directly through PostgREST; the backend
-- should use SUPABASE_SERVICE_ROLE_KEY for database access.

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
    'meeting_points'
  ];
BEGIN
  FOREACH table_name IN ARRAY exposed_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

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

DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

COMMIT;
