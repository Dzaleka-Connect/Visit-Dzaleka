-- ================================================
-- MERGE DUPLICATE USERS MIGRATION
-- ================================================
-- Use this script to merge two users when a manual entry was created
-- before the user signed up for the platform.
--
-- INSTRUCTIONS:
-- 1. Run the SELECT query at the bottom to find the two Wilson Dunia users
-- 2. Identify which user ID is the OLD (manual entry, to be deleted)
--    and which is the NEW (real account with password, to keep)
-- 3. Replace OLD_USER_ID and NEW_USER_ID placeholders below
-- 4. Run the migration in your Supabase SQL Editor
-- ================================================

-- First, let's find the duplicate users (run this first)
-- SELECT id, email, first_name, last_name, role, created_at, password IS NOT NULL as has_password
-- FROM users
-- WHERE LOWER(first_name) LIKE '%wilson%' OR LOWER(last_name) LIKE '%dunia%'
-- ORDER BY created_at;

-- ================================================
-- SET THESE VALUES BEFORE RUNNING
-- ================================================
-- Replace these with actual UUIDs after running the SELECT above
-- OLD_USER_ID = the manual entry (no password, older, to be deleted)
-- NEW_USER_ID = the real account (has password, newer, to keep)

DO $$
DECLARE
    old_user_id UUID := 'REPLACE_WITH_OLD_USER_ID';  -- Manual entry to be deleted
    new_user_id UUID := 'REPLACE_WITH_NEW_USER_ID';  -- Real account to keep
    old_user_record RECORD;
    new_user_record RECORD;
BEGIN
    -- Safety check: verify both users exist
    SELECT * INTO old_user_record FROM users WHERE id = old_user_id::text;
    SELECT * INTO new_user_record FROM users WHERE id = new_user_id::text;
    
    IF old_user_record.id IS NULL THEN
        RAISE EXCEPTION 'Old user ID not found: %', old_user_id;
    END IF;
    
    IF new_user_record.id IS NULL THEN
        RAISE EXCEPTION 'New user ID not found: %', new_user_id;
    END IF;
    
    RAISE NOTICE 'Merging user "% %" into "% %"',
        old_user_record.first_name, old_user_record.last_name,
        new_user_record.first_name, new_user_record.last_name;

    -- ================================================
    -- UPDATE ALL REFERENCES TO OLD USER
    -- ================================================
    
    -- 1. Bookings - update visitor references
    UPDATE bookings
    SET visitor_user_id = new_user_id::text
    WHERE visitor_user_id = old_user_id::text;
    RAISE NOTICE 'Updated % booking(s)', ROW_COUNT;
    
    -- 2. Bookings - update check-in/check-out references
    UPDATE bookings
    SET check_in_by = new_user_id::text
    WHERE check_in_by = old_user_id::text;
    
    UPDATE bookings
    SET check_out_by = new_user_id::text
    WHERE check_out_by = old_user_id::text;
    
    UPDATE bookings
    SET payment_verified_by = new_user_id::text
    WHERE payment_verified_by = old_user_id::text;
    
    -- 3. Guides table - update user reference
    UPDATE guides
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated % guide record(s)', ROW_COUNT;
    
    -- 4. Audit logs
    UPDATE audit_logs
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated % audit log(s)', ROW_COUNT;
    
    -- 5. Notifications
    UPDATE notifications
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated % notification(s)', ROW_COUNT;
    
    -- 6. Booking activity logs
    UPDATE booking_activity_logs
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated % booking activity log(s)', ROW_COUNT;
    
    -- 7. Incidents - reported_by and resolved_by
    UPDATE incidents
    SET reported_by = new_user_id::text
    WHERE reported_by = old_user_id::text;
    
    UPDATE incidents
    SET resolved_by = new_user_id::text
    WHERE resolved_by = old_user_id::text;
    RAISE NOTICE 'Updated incident records';
    
    -- 8. Task assignments
    UPDATE tasks
    SET assigned_to = new_user_id::text
    WHERE assigned_to = old_user_id::text;
    
    UPDATE tasks
    SET created_by = new_user_id::text
    WHERE created_by = old_user_id::text;
    RAISE NOTICE 'Updated % task(s)', ROW_COUNT;
    
    -- 9. Task comments
    UPDATE task_comments
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated % task comment(s)', ROW_COUNT;
    
    -- 10. Task attachments
    UPDATE task_attachments
    SET uploaded_by = new_user_id::text
    WHERE uploaded_by = old_user_id::text;
    
    -- 11. Task history
    UPDATE task_history
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    
    -- 12. Email logs
    UPDATE email_logs
    SET sent_by = new_user_id::text
    WHERE sent_by = old_user_id::text;
    
    -- 13. Email templates
    UPDATE email_templates
    SET updated_by = new_user_id::text
    WHERE updated_by = old_user_id::text;
    
    -- 14. User invites
    UPDATE user_invites
    SET invited_by = new_user_id::text
    WHERE invited_by = old_user_id::text;
    
    -- 15. Allowed IPs
    UPDATE allowed_ips
    SET created_by = new_user_id::text
    WHERE created_by = old_user_id::text;
    
    -- 16. Guide training progress
    UPDATE guide_training_progress
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    
    -- 17. Chat rooms - created_by
    UPDATE chat_rooms
    SET created_by = new_user_id::text
    WHERE created_by = old_user_id::text;
    RAISE NOTICE 'Updated chat room created_by references';
    
    -- 18. Chat participants
    -- First check if new user already has participant entry for same room
    -- If so, delete the old one; otherwise update it
    DELETE FROM chat_participants 
    WHERE user_id = old_user_id::text 
    AND room_id IN (
        SELECT room_id FROM chat_participants WHERE user_id = new_user_id::text
    );
    
    UPDATE chat_participants
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    RAISE NOTICE 'Updated chat participant records';
    
    -- 19. Chat messages - sender_id
    UPDATE chat_messages
    SET sender_id = new_user_id::text
    WHERE sender_id = old_user_id::text;
    RAISE NOTICE 'Updated chat message sender references';
    
    -- 20. Payments
    UPDATE payments
    SET verified_by = new_user_id::text
    WHERE verified_by = old_user_id::text;
    
    UPDATE payments
    SET user_id = new_user_id::text
    WHERE user_id = old_user_id::text;
    
    -- ================================================
    -- DELETE THE OLD USER
    -- ================================================
    
    -- Delete any sessions for the old user
    DELETE FROM sessions
    WHERE sess::text LIKE '%' || old_user_id::text || '%';
    
    -- Finally, delete the old user
    DELETE FROM users WHERE id = old_user_id::text;
    
    RAISE NOTICE 'Successfully merged and deleted old user %', old_user_id;
    RAISE NOTICE 'All references now point to user %', new_user_id;
    
END $$;

-- ================================================
-- VERIFICATION QUERY (run after migration)
-- ================================================
-- Check the remaining Wilson Dunia user
-- SELECT id, email, first_name, last_name, role, created_at
-- FROM users
-- WHERE LOWER(first_name) LIKE '%wilson%' OR LOWER(last_name) LIKE '%dunia%';
