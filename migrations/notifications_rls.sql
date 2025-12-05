-- Enable RLS on the notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy: Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid()::text = user_id);

-- Policy: Admins/Service Role can do everything (Implicit with service_role key, but good to be explicit if using authenticated admin users)
-- Note: If you are using the service_role key in your backend, it bypasses RLS automatically.
-- If you want to allow specific admin users (authenticated via UI) to manage all notifications, you'd add:
-- CREATE POLICY "Admins can manage all notifications"
-- ON notifications
-- FOR ALL
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()::text
--     AND users.role = 'admin'
--   )
-- );
