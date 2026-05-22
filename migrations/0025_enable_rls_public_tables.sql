-- Enable Row Level Security on public tables flagged by Supabase database linter.
-- Policies were created (e.g. rls_policies_complete.sql) but RLS remained disabled.
-- Express uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS; anon/PostgREST must not read rows.
--
-- Run in Supabase SQL Editor: migrations/0025_enable_rls_public_tables.sql

BEGIN;

DO $$
DECLARE
  table_name text;
  tables_to_harden text[] := ARRAY[
    'allowed_ips',
    'audit_logs',
    'booking_activity_logs',
    'booking_companions',
    'bookings',
    'chat_messages',
    'chat_participants',
    'chat_rooms',
    'community_experience_requests',
    'community_listings',
    'content_blocks',
    'email_logs',
    'events',
    'guide_availability',
    'guide_payments',
    'guide_training_progress',
    'guides',
    'incidents',
    'login_history',
    'meeting_points',
    'notifications',
    'page_views',
    'points_of_interest',
    'pricing_config',
    'sessions',
    'task_attachments',
    'task_comments',
    'task_history',
    'tasks',
    'training_modules',
    'user_invites',
    'users',
    'zone_visits',
    'zones'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_harden LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- Tables exposed without any policy yet
DO $$
BEGIN
  IF to_regclass('public.page_views') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'page_views'
     ) THEN
    CREATE POLICY "No anon access" ON public.page_views
      FOR ALL USING (false);
  END IF;

  IF to_regclass('public.community_experience_requests') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'community_experience_requests'
     ) THEN
    CREATE POLICY "No anon access" ON public.community_experience_requests
      FOR ALL USING (false);
  END IF;

  IF to_regclass('public.guide_payments') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'guide_payments'
     ) THEN
    CREATE POLICY "No anon access" ON public.guide_payments
      FOR ALL USING (false);
  END IF;

  IF to_regclass('public.events') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'events'
     ) THEN
    CREATE POLICY "No anon access" ON public.events
      FOR ALL USING (false);
  END IF;
END $$;

COMMIT;

SELECT 'RLS enabled on public tables; missing deny policies added.' AS message;
