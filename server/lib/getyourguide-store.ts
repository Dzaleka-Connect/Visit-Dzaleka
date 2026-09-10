import postgres from "postgres";
import type { Booking } from "@shared/schema";

export interface GygReservationState {
  reservationReference: string;
  gygBookingReference: string;
  productId: string;
  dateTime: string;
  visitDate: string;
  visitTime: string;
  pricingMode: "individual" | "group";
  timeMode: "time_point" | "time_period";
  participantCount: number;
  unitCount: number;
  bookingItems: Array<{ category: string; count: number; groupSize?: number; retailPrice?: number }>;
  expiresAt: Date;
  status: "reserved" | "booked" | "cancelled";
}

// The GYG self-test requires an explicit UTC offset and no fractional seconds.
export function formatGygReservationExpiration(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

export class GygError extends Error {
  constructor(public errorCode: string, message: string) { super(message); }
}

// Prices/contact details may be enriched at checkout; the reserved inventory may not change.
export function reservationMatches(reservation: GygReservationState, data: any) {
  const items = (values: any[]) => JSON.stringify(values.map(item => ({
    category: String(item.category).toUpperCase(), count: item.count, groupSize: item.groupSize || 1,
  })).sort((a, b) => a.category.localeCompare(b.category)));
  return reservation.gygBookingReference === data.gygBookingReference
    && reservation.productId === data.productId
    && new Date(reservation.dateTime).getTime() === new Date(data.dateTime).getTime()
    && Array.isArray(data.bookingItems)
    && items(reservation.bookingItems) === items(data.bookingItems);
}

function camelBooking(row: Record<string, any>): Booking {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), (key === "visit_date" && value instanceof Date ? value.toISOString().slice(0, 10) : value)])) as Booking;
}

export function createGygStore(sql: postgres.Sql) {
  const lock = (tx: postgres.TransactionSql) => tx`SELECT pg_advisory_xact_lock(73492601)`;
  return {
    async standardRetailPrice(groupSize: string): Promise<number> {
      const rows = await sql`SELECT group_size, base_price FROM pricing_config`;
      const prices = Object.fromEntries(rows.map(row => [row.group_size, row.base_price]));
      return prices[groupSize] ?? (groupSize === "large_group" ? 85000 : 20000);
    },
    async ping() {
      await sql`SELECT 1`;
    },
    async inventory(fromDate?: string, toDate?: string): Promise<{ bookings: Pick<Booking, "visitDate" | "visitTime" | "numberOfPeople" | "status">[]; reservations: GygReservationState[] }> {
      // One statement gives both sides the same MVCC snapshot and avoids cold-start connections per query.
      // Certification availability checks are 1-day windows; do not aggregate the whole bookings table.
      const [row] = fromDate && toDate
        ? await sql`SELECT
            (SELECT coalesce(jsonb_agg(jsonb_build_object('visitDate', visit_date, 'visitTime', visit_time, 'numberOfPeople', number_of_people, 'status', status)), '[]'::jsonb)
              FROM bookings WHERE status NOT IN ('cancelled', 'no_show') AND visit_date BETWEEN ${fromDate}::date AND ${toDate}::date) AS bookings,
            (SELECT coalesce(jsonb_agg(payload), '[]'::jsonb)
              FROM getyourguide_reservations WHERE status = 'reserved' AND expires_at > now()
              AND payload->>'visitDate' >= ${fromDate} AND payload->>'visitDate' <= ${toDate}) AS reservations`
        : await sql`SELECT
            (SELECT coalesce(jsonb_agg(jsonb_build_object('visitDate', visit_date, 'visitTime', visit_time, 'numberOfPeople', number_of_people, 'status', status)), '[]'::jsonb) FROM bookings WHERE status NOT IN ('cancelled', 'no_show')) AS bookings,
            (SELECT coalesce(jsonb_agg(payload), '[]'::jsonb) FROM getyourguide_reservations WHERE status = 'reserved' AND expires_at > now()) AS reservations`;
      return { bookings: row.bookings, reservations: row.reservations };
    },
    async activeReservations(): Promise<GygReservationState[]> {
      const rows = await sql`SELECT payload FROM getyourguide_reservations WHERE status = 'reserved' AND expires_at > now()`;
      return rows.map(row => row.payload as GygReservationState);
    },
    async reserve(reservation: GygReservationState, peopleCapacity: number, groupCapacity: number): Promise<GygReservationState> {
      const [row] = await sql`SELECT reserve_getyourguide(${sql.json(reservation as any)}, ${peopleCapacity}, ${groupCapacity}) AS result`;
      if (row.result.errorCode) throw new GygError(row.result.errorCode, row.result.errorMessage);
      return { ...row.result, expiresAt: new Date(row.result.expiresAt) } as GygReservationState;
    },
    async cancelReservation(reference: string, gygReference: string) {
      await sql.begin(async tx => {
        await lock(tx);
        const [row] = await tx`SELECT * FROM getyourguide_reservations WHERE reservation_reference = ${reference} AND gyg_booking_reference = ${gygReference}`;
        if (!row || row.status === "booked") throw new GygError("INVALID_RESERVATION", "Reservation does not exist or has already been booked.");
        await tx`UPDATE getyourguide_reservations SET status = 'cancelled' WHERE reservation_reference = ${reference}`;
      });
    },
    async confirm(data: any, booking: Record<string, any>): Promise<Booking> {
      return await sql.begin(async tx => {
        await lock(tx);
        const [row] = await tx`SELECT * FROM getyourguide_reservations WHERE reservation_reference = ${String(data.reservationReference || "")}`;
        if (!row || !reservationMatches(row.payload, data)) throw new GygError("INVALID_RESERVATION", "Reservation does not match the booking details.");
        if (row.status === "booked") {
          const [existing] = await tx`SELECT * FROM bookings WHERE id = ${row.booking_id}`;
          if (!existing || existing.status === "cancelled") throw new GygError("INVALID_BOOKING", "This booking has been cancelled.");
          return camelBooking(existing);
        }
        if (row.status !== "reserved" || new Date(row.expires_at).getTime() <= Date.now()) throw new GygError("INVALID_RESERVATION", "Expired or missing reservation.");
        const values = Object.fromEntries(Object.entries(booking).map(([key, value]) => [key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), value]));
        const [created] = await tx`INSERT INTO bookings ${tx(values)} RETURNING *`;
        await tx`WITH reserved AS (UPDATE getyourguide_reservations SET status = 'booked', booking_id = ${created.id} WHERE reservation_reference = ${row.reservation_reference})
          INSERT INTO booking_activity_logs (booking_id, action, description, new_status) VALUES (${created.id}, 'getyourguide_booking_created', ${`GetYourGuide booking confirmed (${data.gygBookingReference}).`}, 'confirmed')`;
        return camelBooking(created);
      }) as Booking;
    },
    async cancelBooking(bookingReference: string, gygReference: string, reason: string | null, today: string) {
      await sql.begin(async tx => {
        await lock(tx);
        const [row] = await tx`SELECT * FROM bookings WHERE source = 'getyourguide' AND booking_reference = ${bookingReference} AND external_reference_id = ${gygReference} FOR UPDATE`;
        if (!row) throw new GygError("INVALID_BOOKING", "The booking does not exist.");
        if (row.status === "cancelled") throw new GygError("BOOKING_ALREADY_CANCELLED", "The booking has already been cancelled.");
        if (["completed", "in_progress"].includes(row.status)) throw new GygError("BOOKING_REDEEMED", "The booking has already been used.");
        if ((row.visit_date instanceof Date ? row.visit_date.toISOString().slice(0, 10) : String(row.visit_date)) < today) throw new GygError("BOOKING_IN_PAST", "The booking is in the past.");
        await tx`UPDATE bookings SET status = 'cancelled', cancellation_category = 'getyourguide', cancellation_reason = 'Cancelled by GetYourGuide', cancellation_note = ${reason}, cancelled_at = now(), cancelled_by = NULL, updated_at = now(), version = version + 1 WHERE id = ${row.id}`;
        await tx`INSERT INTO booking_activity_logs (booking_id, action, description, old_status, new_status) VALUES (${row.id}, 'getyourguide_booking_cancelled', ${`GetYourGuide cancelled booking ${gygReference}.`}, ${row.status}, 'cancelled')`;
      });
    },
    async recordActivity(endpoint: string, productId: string | null, success: boolean, errorCode: string | null = null, diagnostic = false) {
      await sql`INSERT INTO getyourguide_activity (endpoint, product_id, success, error_code, diagnostic) VALUES (${endpoint}, ${productId}, ${success}, ${errorCode}, ${diagnostic})`;
    },
    async pruneActivity() {
      await sql`DELETE FROM getyourguide_activity WHERE created_at < now() - interval '90 days'`;
    },
    async activity(productId: string | null = null) {
      const rows = await sql`SELECT endpoint, product_id AS "productId", success, error_code AS "errorCode", diagnostic, created_at AS "createdAt" FROM getyourguide_activity ORDER BY created_at DESC LIMIT 20`;
      const [summary] = await sql`SELECT
        max(created_at) FILTER (WHERE endpoint = '/1/get-availabilities/' AND success AND NOT diagnostic) AS "lastAvailabilityRequest",
        max(created_at) FILTER (WHERE endpoint = '/1/book/' AND success AND NOT diagnostic) AS "lastBookingRequest",
        max(created_at) FILTER (WHERE endpoint = 'availability-push' AND success AND NOT diagnostic AND (${productId}::text IS NULL OR product_id = ${productId})) AS "lastSuccessfulPush",
        max(created_at) FILTER (WHERE endpoint = 'availability-push' AND NOT success AND NOT diagnostic AND (${productId}::text IS NULL OR product_id = ${productId})) AS "lastFailedPush"
        FROM getyourguide_activity`;
      const [failed] = await sql`SELECT error_code AS "errorCode" FROM getyourguide_activity
        WHERE endpoint = 'availability-push' AND NOT success AND NOT diagnostic
          AND (${productId}::text IS NULL OR product_id = ${productId})
        ORDER BY created_at DESC LIMIT 1`;
      return {
        lastAvailabilityRequest: summary?.lastAvailabilityRequest as Date | null,
        lastBookingRequest: summary?.lastBookingRequest as Date | null,
        lastSuccessfulPush: summary?.lastSuccessfulPush as Date | null,
        lastFailedPush: summary?.lastFailedPush as Date | null,
        lastFailedPushError: (failed?.errorCode as string | null) || null,
        recent: rows,
      };
    },
  };
}

let instance: ReturnType<typeof createGygStore> | undefined;
export function getGygStore() {
  if (!instance) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for persistent GetYourGuide reservations.");
    instance = createGygStore(postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 60,
      connect_timeout: 8,
      ssl: "require",
      prepare: false,
      fetch_types: false,
    }));
  }
  return instance;
}
