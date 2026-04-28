-- Dzaleka Visit - Complete RLS Policy Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- STEP 1: Enable RLS on all tables that don't have it
-- =============================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendars ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: Drop existing permissive policies
-- =============================================

-- Drop all "Allow all" and "Service role" policies
DROP POLICY IF EXISTS "Allow all for service role" ON public.sessions;
DROP POLICY IF EXISTS "Allow all for service role" ON public.users;
DROP POLICY IF EXISTS "Allow all for service role" ON public.guides;
DROP POLICY IF EXISTS "Allow all for service role" ON public.zones;
DROP POLICY IF EXISTS "Allow all for service role" ON public.points_of_interest;
DROP POLICY IF EXISTS "Allow all for service role" ON public.meeting_points;
DROP POLICY IF EXISTS "Allow all for service role" ON public.pricing_config;
DROP POLICY IF EXISTS "Allow all for service role" ON public.bookings;
DROP POLICY IF EXISTS "Allow all for service role" ON public.guide_availability;
DROP POLICY IF EXISTS "Allow all for service role" ON public.booking_companions;
DROP POLICY IF EXISTS "Allow all for service role" ON public.booking_activity_logs;
DROP POLICY IF EXISTS "Allow all for service role" ON public.incidents;
DROP POLICY IF EXISTS "Allow all for service role" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all for service role" ON public.zone_visits;
DROP POLICY IF EXISTS "Allow all for service role" ON public.email_logs;

DROP POLICY IF EXISTS "Service role full access" ON public.login_history;
DROP POLICY IF EXISTS "Service role full access" ON public.tasks;
DROP POLICY IF EXISTS "Service role full access" ON public.task_comments;
DROP POLICY IF EXISTS "Service role full access" ON public.task_history;
DROP POLICY IF EXISTS "Service role full access" ON public.task_attachments;
DROP POLICY IF EXISTS "Service role full access" ON public.training_modules;
DROP POLICY IF EXISTS "Service role full access" ON public.guide_training_progress;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_rooms;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_participants;
DROP POLICY IF EXISTS "Service role full access" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role full access" ON public.content_blocks;
DROP POLICY IF EXISTS "Service role full access" ON public.allowed_ips;
DROP POLICY IF EXISTS "Service role full access" ON public.user_invites;

-- =============================================
-- STEP 3: Create restrictive policies for SENSITIVE tables
-- These block all anon access (service role bypasses RLS)
-- =============================================

-- Sessions: No anon access
CREATE POLICY "No anon access" ON public.sessions
  FOR ALL USING (false);

-- Users: No anon access (password is sensitive)
CREATE POLICY "No anon access" ON public.users
  FOR ALL USING (false);

-- API Keys: No anon access
CREATE POLICY "No anon access" ON public.api_keys
  FOR ALL USING (false);

-- Audit Logs: No anon access
CREATE POLICY "No anon access" ON public.audit_logs
  FOR ALL USING (false);

-- Login History: No anon access
CREATE POLICY "No anon access" ON public.login_history
  FOR ALL USING (false);

-- User Invites: No anon access
CREATE POLICY "No anon access" ON public.user_invites
  FOR ALL USING (false);

-- Allowed IPs: No anon access
CREATE POLICY "No anon access" ON public.allowed_ips
  FOR ALL USING (false);

-- Bookings: No anon access (has visitor data)
CREATE POLICY "No anon access" ON public.bookings
  FOR ALL USING (false);

-- Incidents: No anon access
CREATE POLICY "No anon access" ON public.incidents
  FOR ALL USING (false);

-- Email Logs: No anon access
CREATE POLICY "No anon access" ON public.email_logs
  FOR ALL USING (false);

-- Tasks: No anon access
CREATE POLICY "No anon access" ON public.tasks
  FOR ALL USING (false);

-- Task Comments: No anon access
CREATE POLICY "No anon access" ON public.task_comments
  FOR ALL USING (false);

-- Task History: No anon access
CREATE POLICY "No anon access" ON public.task_history
  FOR ALL USING (false);

-- Task Attachments: No anon access
CREATE POLICY "No anon access" ON public.task_attachments
  FOR ALL USING (false);

-- Notifications: No anon access
CREATE POLICY "No anon access" ON public.notifications
  FOR ALL USING (false);

-- Chat rooms/messages: No anon access
CREATE POLICY "No anon access" ON public.chat_rooms
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.chat_participants
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.chat_messages
  FOR ALL USING (false);

-- Guide Payouts: No anon access
CREATE POLICY "No anon access" ON public.guide_payouts
  FOR ALL USING (false);

-- Support Tickets: No anon access
CREATE POLICY "No anon access" ON public.support_tickets
  FOR ALL USING (false);

-- Email Templates: No anon access
CREATE POLICY "No anon access" ON public.email_templates
  FOR ALL USING (false);

-- Booking-related: No anon access
CREATE POLICY "No anon access" ON public.booking_companions
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.booking_activity_logs
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.zone_visits
  FOR ALL USING (false);

-- Guide-related (private): No anon access
CREATE POLICY "No anon access" ON public.guide_availability
  FOR ALL USING (false);

CREATE POLICY "No anon access" ON public.guide_training_progress
  FOR ALL USING (false);

-- Recurring bookings: No anon access
CREATE POLICY "No anon access" ON public.recurring_bookings
  FOR ALL USING (false);

-- Analytics Settings: No anon access
CREATE POLICY "No anon access" ON public.analytics_settings
  FOR ALL USING (false);

-- External Calendars: No anon access
CREATE POLICY "No anon access" ON public.external_calendars
  FOR ALL USING (false);

-- Saved Itineraries: No anon access
CREATE POLICY "No anon access" ON public.saved_itineraries
  FOR ALL USING (false);

-- Favorite Guides: No anon access
CREATE POLICY "No anon access" ON public.favorite_guides
  FOR ALL USING (false);

-- Itineraries: No anon access
CREATE POLICY "No anon access" ON public.itineraries
  FOR ALL USING (false);

-- Pricing config: No anon access (business data)
CREATE POLICY "No anon access" ON public.pricing_config
  FOR ALL USING (false);

-- =============================================
-- STEP 4: Create READ-ONLY policies for PUBLIC content
-- =============================================

-- Blog Posts: Anyone can read PUBLISHED posts (uses 'published' boolean)
CREATE POLICY "Public can read published posts" ON public.blog_posts
  FOR SELECT USING (published = true);

-- Zones: Anyone can read active zones
CREATE POLICY "Public can read zones" ON public.zones
  FOR SELECT USING (true);

-- Points of Interest: Anyone can read
CREATE POLICY "Public can read POIs" ON public.points_of_interest
  FOR SELECT USING (true);

-- Meeting Points: Anyone can read active ones
CREATE POLICY "Public can read meeting points" ON public.meeting_points
  FOR SELECT USING (is_active = true);

-- Help Articles: Anyone can read published ones (uses 'is_published')
CREATE POLICY "Public can read help articles" ON public.help_articles
  FOR SELECT USING (is_published = true);

-- Guides: Public can read active guides (profile info only)
CREATE POLICY "Public can read active guides" ON public.guides
  FOR SELECT USING (is_active = true);

-- Training Modules: Public can read
CREATE POLICY "Public can read training" ON public.training_modules
  FOR SELECT USING (true);

-- Content Blocks (CMS): Public can read
CREATE POLICY "Public can read content" ON public.content_blocks
  FOR SELECT USING (true);

-- =============================================
-- STEP 5: Fix function security (if function exists)
-- Note: This function may not exist in all installations
-- =============================================

-- ALTER FUNCTION public.increment_api_key_usage(uuid) SET search_path = public;

-- =============================================
-- Complete!
-- =============================================
SELECT 'RLS policies applied successfully!' AS message;
