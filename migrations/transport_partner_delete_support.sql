-- Allow admins to delete a transport partner record while preserving request and referral history.
-- Historical records are detached from the deleted partner instead of being removed.

ALTER TABLE partner_tour_referrals
  ALTER COLUMN partner_id DROP NOT NULL;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = 'transport_partners'::regclass
      AND conrelid IN (
        'transport_requests'::regclass,
        'partner_tour_referrals'::regclass,
        'transport_partner_drivers'::regclass,
        'transport_partner_vehicles'::regclass,
        'transport_partner_blackouts'::regclass,
        'transport_partner_pricing'::regclass
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.conname);
  END LOOP;
END $$;

ALTER TABLE transport_requests
  ADD CONSTRAINT transport_requests_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE SET NULL;

ALTER TABLE partner_tour_referrals
  ADD CONSTRAINT partner_tour_referrals_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE SET NULL;

ALTER TABLE transport_partner_drivers
  ADD CONSTRAINT transport_partner_drivers_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE CASCADE;

ALTER TABLE transport_partner_vehicles
  ADD CONSTRAINT transport_partner_vehicles_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE CASCADE;

ALTER TABLE transport_partner_blackouts
  ADD CONSTRAINT transport_partner_blackouts_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE CASCADE;

ALTER TABLE transport_partner_pricing
  ADD CONSTRAINT transport_partner_pricing_partner_id_transport_partners_id_fk
  FOREIGN KEY (partner_id)
  REFERENCES transport_partners(id)
  ON DELETE CASCADE;
