-- Create community_listings table
CREATE TABLE IF NOT EXISTS community_listings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- 'business' | 'initiative'
    category VARCHAR NOT NULL,
    description TEXT NOT NULL,
    contact_name VARCHAR NOT NULL,
    contact_phone VARCHAR NOT NULL,
    contact_email VARCHAR,
    location VARCHAR NOT NULL,
    image_url TEXT,
    needs TEXT,
    offers_experience BOOLEAN DEFAULT false,
    experience_details TEXT,
    status VARCHAR DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    moderation_notes TEXT,
    submitted_by VARCHAR,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved community listings
CREATE POLICY select_approved_community_listings ON community_listings
    FOR SELECT
    USING (status = 'approved' AND deleted_at IS NULL);

-- Policy: Anyone can insert pending listings (moderation requests)
CREATE POLICY insert_pending_community_listings ON community_listings
    FOR INSERT
    WITH CHECK (status = 'pending' OR status IS NULL);

-- Policy: Admins and coordinators can manage all community listings
CREATE POLICY manage_community_listings_admin ON community_listings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('admin', 'coordinator')
        )
    );
