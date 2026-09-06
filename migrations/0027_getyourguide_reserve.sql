-- Keep the lock, capacity check and insert in one database call. The volatile
-- function takes a fresh snapshot after acquiring the transaction lock.
CREATE OR REPLACE FUNCTION public.reserve_getyourguide(p jsonb, people_capacity integer, group_capacity integer)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  previous jsonb;
  requested_items jsonb;
  used_people integer;
  used_groups integer;
BEGIN
  PERFORM pg_advisory_xact_lock(73492601);
  SELECT jsonb_agg(jsonb_build_object('category', upper(i->>'category'), 'count', i->'count', 'groupSize', coalesce(nullif(i->>'groupSize', '0'), '1')::integer) ORDER BY upper(i->>'category'))
    INTO requested_items FROM jsonb_array_elements(p->'bookingItems') i;
  SELECT r.payload INTO previous FROM public.getyourguide_reservations r
    LEFT JOIN public.bookings b ON b.id = r.booking_id
    WHERE r.gyg_booking_reference = p->>'gygBookingReference'
      AND r.payload->>'productId' = p->>'productId'
      AND (r.payload->>'dateTime')::timestamptz = (p->>'dateTime')::timestamptz
      AND (SELECT jsonb_agg(jsonb_build_object('category', upper(i->>'category'), 'count', i->'count', 'groupSize', coalesce(nullif(i->>'groupSize', '0'), '1')::integer) ORDER BY upper(i->>'category')) FROM jsonb_array_elements(r.payload->'bookingItems') i) = requested_items
      AND ((r.status = 'reserved' AND r.expires_at > clock_timestamp()) OR (r.status = 'booked' AND b.status <> 'cancelled'))
    ORDER BY r.created_at DESC LIMIT 1;
  IF previous IS NOT NULL THEN RETURN previous; END IF;

  SELECT coalesce(sum(people), 0), coalesce(sum(groups), 0) INTO used_people, used_groups FROM (
    SELECT coalesce(b.number_of_people, 1) AS people, 1 AS groups FROM public.bookings b
      WHERE b.visit_date = (p->>'visitDate')::date AND b.status NOT IN ('cancelled', 'no_show')
        AND (p->>'timeMode' = 'time_period' OR left(b.visit_time::text, 5) = p->>'visitTime')
    UNION ALL
    SELECT (r.payload->>'participantCount')::integer, CASE WHEN r.payload->>'pricingMode' = 'group' THEN (r.payload->>'unitCount')::integer ELSE 1 END
      FROM public.getyourguide_reservations r WHERE r.status = 'reserved' AND r.expires_at > clock_timestamp()
        AND r.payload->>'visitDate' = p->>'visitDate'
        AND (p->>'timeMode' = 'time_period' OR r.payload->>'timeMode' = 'time_period' OR left(r.payload->>'visitTime', 5) = p->>'visitTime')
  ) occupancy;
  IF used_people + (p->>'participantCount')::integer > people_capacity
    OR (p->>'pricingMode' = 'group' AND used_groups + (p->>'unitCount')::integer > group_capacity) THEN
    RETURN jsonb_build_object('errorCode', 'NO_AVAILABILITY', 'errorMessage', 'This timeslot no longer has enough availability.');
  END IF;
  INSERT INTO public.getyourguide_reservations (reservation_reference, gyg_booking_reference, payload, expires_at, status)
    VALUES (p->>'reservationReference', p->>'gygBookingReference', p, (p->>'expiresAt')::timestamptz, 'reserved');
  RETURN p;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_getyourguide(jsonb, integer, integer) FROM PUBLIC, anon, authenticated;
