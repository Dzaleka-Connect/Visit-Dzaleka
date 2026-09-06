/** Integration check in an isolated temporary schema; never modifies real bookings. */
import "dotenv/config";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createGygStore, type GygReservationState } from "../server/lib/getyourguide-store";
const schema = `gyg_test_${randomUUID().replaceAll("-", "")}`;
const admin = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require", prepare: false });
const options = { max: 2, ssl: "require" as const, prepare: false, connection: { search_path: `${schema},public` } };
const a = postgres(process.env.DATABASE_URL!, options);
const b = postgres(process.env.DATABASE_URL!, options);
const first = createGygStore(a), second = createGygStore(b);
const hold = (ref: string, count = 1): GygReservationState => ({
  reservationReference: `res_${ref}`, gygBookingReference: ref, productId: "test-tour", dateTime: "2030-01-10T09:00:00+02:00", visitDate: "2030-01-10", visitTime: "09:00", pricingMode: "individual", timeMode: "time_point", participantCount: count, unitCount: count, bookingItems: [{ category: "ADULT", count }], expiresAt: new Date(Date.now() + 3600000), status: "reserved",
});
try {
  await admin.unsafe(`CREATE SCHEMA ${schema}`);
  await admin.unsafe(`CREATE TABLE ${schema}.bookings (LIKE public.bookings INCLUDING ALL)`);
  await admin.unsafe(`CREATE TABLE ${schema}.booking_activity_logs (LIKE public.booking_activity_logs INCLUDING ALL)`);
  const migration = (await readFile("migrations/0026_getyourguide_persistence.sql", "utf8")).replaceAll("public.", `${schema}.`);
  await a.unsafe(migration);
  const reservation = await first.reserve(hold("ONE", 2), 20, 2);
  assert.equal((await second.activeReservations()).length, 1, "another instance reads the hold");
  assert.equal((await second.reserve(hold("ONE", 2), 20, 2)).reservationReference, reservation.reservationReference, "reserve retry reuses hold");
  const booking = { bookingReference: "GYG-TEST-ONE", source: "getyourguide", externalReferenceId: "ONE", visitorName: "Test", visitorEmail: "test@example.invalid", visitorPhone: "none", visitDate: "2030-01-10", visitTime: "09:00", groupSize: "small_group", numberOfPeople: 2, tourType: "standard", paymentMethod: "card", paymentStatus: "paid", status: "confirmed", totalAmount: 3000 };
  await assert.rejects(second.confirm({ ...reservation, productId: "wrong" }, booking), /does not match/);
  const [one, two] = await Promise.all([first.confirm(reservation, booking), second.confirm(reservation, booking)]);
  assert.equal(one.visitDate, "2030-01-10");
  assert.equal(one.id, two.id, "concurrent book retries return the same booking");
  assert.equal((await a`SELECT count(*)::int AS count FROM bookings`)[0].count, 1);
  assert.equal((await a`SELECT count(*)::int AS count FROM booking_activity_logs`)[0].count, 1);
  assert.equal((await second.activeReservations()).length, 0, "booked holds stop consuming additional capacity");
  const attempts = await Promise.allSettled(Array.from({ length: 24 }, (_, i) => (i % 2 ? first : second).reserve(hold(`RACE-${i}`), 20, 2)));
  assert.equal(attempts.filter(r => r.status === "fulfilled").length, 18, "concurrent holds cannot oversell remaining seats");
  const active = await first.activeReservations();
  await second.cancelReservation(active[0].reservationReference, active[0].gygBookingReference);
  await second.cancelReservation(active[0].reservationReference, active[0].gygBookingReference);
  assert.equal((await first.activeReservations()).length, 17, "cancellation is durable and retry-safe");
  await a`UPDATE getyourguide_reservations SET expires_at = now() - interval '1 second' WHERE status = 'reserved'`;
  await assert.rejects(second.confirm(active[1], { ...booking, bookingReference: "EXPIRED" }), /Expired/);
  assert.equal((await first.activeReservations()).length, 0);
  await first.recordActivity("/1/get-availabilities/", "test-tour", true, null, true);
  assert.equal((await second.activity()).lastAvailabilityRequest, null, "diagnostics do not claim live connectivity");
  await first.recordActivity("/1/get-availabilities/", "test-tour", true);
  assert.ok((await second.activity()).lastAvailabilityRequest);
  const change = { ...hold("ONE", 1), reservationReference: "res_CHANGED", dateTime: "2030-01-11T14:00:00+02:00", visitDate: "2030-01-11", visitTime: "14:00" };
  const newHold = await second.reserve(change, 20, 2);
  const changedBooking = await first.confirm(newHold, { ...booking, bookingReference: "GYG-TEST-CHANGED", visitDate: "2030-01-11", visitTime: "14:00", numberOfPeople: 1 });
  assert.notEqual(changedBooking.id, one.id, "booking change creates a distinct supplier booking with the same GYG reference");
  await second.cancelBooking(one.bookingReference, "ONE", null, "2029-01-01");
  assert.equal((await a`SELECT status FROM bookings WHERE id = ${changedBooking.id}`)[0].status, "confirmed", "cancelling the original does not cancel the amendment");
  await assert.rejects(first.cancelBooking(changedBooking.bookingReference, "WRONG", null, "2029-01-01"), /does not exist/);
  await assert.rejects(first.cancelBooking(one.bookingReference, "ONE", null, "2029-01-01"), /already been cancelled/);
  console.log("PASS: booking change and exact cancellation; cross-instance holds, idempotent reserve/book/cancel, inventory race, expiry, reservation binding, atomic activity log, diagnostic separation");
} finally {
  await a.end(); await b.end();
  await admin.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
}
