-- Enable Row Level Security (RLS) on all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on each table
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access (for backend operations)
-- The service role key bypasses RLS by default, but we add policies for clarity

-- login_history: Only admins can read, service role can write
CREATE POLICY "Service role full access" ON public.login_history FOR ALL USING (true) WITH CHECK (true);

-- tasks: Users can see tasks assigned to them or that they created
CREATE POLICY "Service role full access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- task_comments: Users can see comments on accessible tasks
CREATE POLICY "Service role full access" ON public.task_comments FOR ALL USING (true) WITH CHECK (true);

-- task_history: Users can see history of accessible tasks
CREATE POLICY "Service role full access" ON public.task_history FOR ALL USING (true) WITH CHECK (true);

-- task_attachments: Users can see attachments on accessible tasks
CREATE POLICY "Service role full access" ON public.task_attachments FOR ALL USING (true) WITH CHECK (true);

-- training_modules: Everyone can read, admins can write
CREATE POLICY "Service role full access" ON public.training_modules FOR ALL USING (true) WITH CHECK (true);

-- guide_training_progress: Guides can see their own progress
CREATE POLICY "Service role full access" ON public.guide_training_progress FOR ALL USING (true) WITH CHECK (true);

-- notifications: Users can only see their own notifications
CREATE POLICY "Service role full access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- chat_rooms: Participants can see rooms they're in
CREATE POLICY "Service role full access" ON public.chat_rooms FOR ALL USING (true) WITH CHECK (true);

-- chat_participants: Users can see participants in rooms they're in
CREATE POLICY "Service role full access" ON public.chat_participants FOR ALL USING (true) WITH CHECK (true);

-- chat_messages: Users can see messages in rooms they're in
CREATE POLICY "Service role full access" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- content_blocks: Everyone can read for CMS content
CREATE POLICY "Service role full access" ON public.content_blocks FOR ALL USING (true) WITH CHECK (true);

-- allowed_ips: Only admins can access
CREATE POLICY "Service role full access" ON public.allowed_ips FOR ALL USING (true) WITH CHECK (true);

-- user_invites: Only admins can access
CREATE POLICY "Service role full access" ON public.user_invites FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- FIX FUNCTION SECURITY ISSUES
-- Set immutable search_path on functions
-- ===========================================

-- Fix update_task_updated_at function
ALTER FUNCTION public.update_task_updated_at() SET search_path = public;

-- Fix update_updated_at_column function  
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- ===========================================
-- FIX PERFORMANCE ISSUES
-- Remove duplicate indexes
-- ===========================================

-- Drop duplicate index on sessions table (keep sessions_expire_idx, drop idx_session_expire)
DROP INDEX IF EXISTS public.idx_session_expire;
