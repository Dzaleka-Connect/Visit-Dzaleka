CREATE TYPE notification_type AS ENUM (
  'booking_created', 'booking_confirmed', 'booking_cancelled',
  'booking_completed', 'guide_assigned', 'check_in', 'check_out',
  'payment_received', 'payment_verified', 'system'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  type notification_type NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR,
  related_id VARCHAR,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;