ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS selected_community_listings TEXT[] DEFAULT ARRAY[]::TEXT[];
