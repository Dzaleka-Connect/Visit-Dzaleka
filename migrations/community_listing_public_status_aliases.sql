BEGIN;

UPDATE community_listings
SET status = 'approved',
    updated_at = now()
WHERE status IN ('live', 'published');

DROP POLICY IF EXISTS select_approved_community_listings ON community_listings;

CREATE POLICY select_approved_community_listings ON community_listings
    FOR SELECT
    USING (status IN ('approved', 'live', 'published') AND deleted_at IS NULL);

COMMIT;
