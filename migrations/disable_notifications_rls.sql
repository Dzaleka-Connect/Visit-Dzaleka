-- Disable Row Level Security on the notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to clean up
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
