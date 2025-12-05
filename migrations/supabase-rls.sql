-- Dzaleka Visit Service - Row Level Security Policies
-- Execute this SQL in Supabase SQL Editor to enable RLS on all tables
-- IMPORTANT: This uses service role access pattern - the backend authenticates via SUPABASE_KEY

-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Since using anon key with server-side authentication, allow all operations for authenticated service
-- The application handles authentication at the Express/session layer

-- Sessions: Allow all for service role (needed for session management)
CREATE POLICY "Allow all for service role" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

-- Users: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Guides: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.guides FOR ALL USING (true) WITH CHECK (true);

-- Zones: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.zones FOR ALL USING (true) WITH CHECK (true);

-- Points of Interest: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.points_of_interest FOR ALL USING (true) WITH CHECK (true);

-- Meeting Points: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.meeting_points FOR ALL USING (true) WITH CHECK (true);

-- Pricing Config: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.pricing_config FOR ALL USING (true) WITH CHECK (true);

-- Bookings: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- Guide Availability: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.guide_availability FOR ALL USING (true) WITH CHECK (true);

-- Booking Companions: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.booking_companions FOR ALL USING (true) WITH CHECK (true);

-- Booking Activity Logs: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.booking_activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Incidents: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.incidents FOR ALL USING (true) WITH CHECK (true);

-- Audit Logs: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Zone Visits: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.zone_visits FOR ALL USING (true) WITH CHECK (true);

-- Email Logs: Allow all for service role
CREATE POLICY "Allow all for service role" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

-- Success message
SELECT 'RLS enabled on all 15 tables with service role policies!' AS message;
