import { afterEach, describe, expect, it, vi } from "vitest";
import { reservationMatches, type GygReservationState } from "../server/lib/getyourguide-store";
import { notifyAvailabilityBatch } from "../server/lib/getyourguide";

const reservation = { gygBookingReference: "GYG-TEST", productId: "tour", dateTime: "2030-01-10T09:00:00+02:00", bookingItems: [{ category: "ADULT", count: 2 }] } as GygReservationState;
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("GetYourGuide reservation binding", () => {
  it("allows checkout price enrichment but binds all reserved inventory", () => {
    expect(reservationMatches(reservation, { ...reservation, bookingItems: [{ category: "ADULT", count: 2, retailPrice: 1500 }] })).toBe(true);
    for (const change of [{ gygBookingReference: "someone-else" }, { productId: "other" }, { dateTime: "2030-01-10T14:00:00+02:00" }, { bookingItems: [{ category: "ADULT", count: 3 }] }, { bookingItems: [] }]) {
      expect(reservationMatches(reservation, { ...reservation, ...change })).toBe(false);
    }
  });
  it("ignores category order and binds group sizes", () => {
    const group = { ...reservation, bookingItems: [{ category: "GROUP", count: 1, groupSize: 4 }] };
    expect(reservationMatches(group, { ...group, bookingItems: [{ category: "GROUP", count: 1, groupSize: 10 }] })).toBe(false);
    const categories = { ...reservation, bookingItems: [{ category: "ADULT", count: 1 }, { category: "CHILD", count: 1 }] };
    expect(reservationMatches(categories, { ...categories, bookingItems: [...categories.bookingItems].reverse() })).toBe(true);
  });
});
describe("GetYourGuide push response", () => {
  it("rejects application errors even when HTTP status is 200", async () => {
    vi.stubEnv("GETYOURGUIDE_API_USERNAME", "test"); vi.stubEnv("GETYOURGUIDE_API_PASSWORD", "test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errorCode: "INVALID_PRODUCT", errorMessage: "Not connected" }), { status: 200 })));
    await expect(notifyAvailabilityBatch("tour", [{ dateTime: reservation.dateTime, vacancies: 10 }], true)).rejects.toThrow("INVALID_PRODUCT");
  });
  it("accepts successful sandbox responses and uses a bounded request", async () => {
    vi.stubEnv("GETYOURGUIDE_API_USERNAME", "test"); vi.stubEnv("GETYOURGUIDE_API_PASSWORD", "test");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 })); vi.stubGlobal("fetch", fetch);
    await expect(notifyAvailabilityBatch("tour", [{ dateTime: reservation.dateTime, vacancies: 10 }], true)).resolves.toMatchObject({ status: 200, availabilityCount: 1 });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/sandbox/"), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
