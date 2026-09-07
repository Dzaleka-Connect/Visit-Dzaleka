import { afterEach, describe, expect, it, vi } from "vitest";
import { reservationMatches, formatGygReservationExpiration, type GygReservationState } from "../server/lib/getyourguide-store";
import { getGygInboundCredentials, isGygAuthorizationValid } from "../server/lib/getyourguide-auth";
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


describe("GetYourGuide inbound credentials", () => {
  const env = { GETYOURGUIDE_WEBHOOK_USERNAME: "supplier", GETYOURGUIDE_WEBHOOK_PASSWORD: "inbound", GETYOURGUIDE_API_USERNAME: "supplier", GETYOURGUIDE_API_PASSWORD: "outbound" };
  const basic = (password: string) => `Basic ${Buffer.from(`supplier:${password}`).toString("base64")}`;
  it("accepts the existing portal webhook password independently of outbound credentials", () => {
    expect(isGygAuthorizationValid(basic("inbound"), env)).toBe(true);
    expect(isGygAuthorizationValid(basic("outbound"), env)).toBe(true);
    expect(isGygAuthorizationValid(basic("wrong"), env)).toBe(false);
    expect(isGygAuthorizationValid("Bearer token", env)).toBe(false);
  });
  it("accepts distinct production credentials without disrupting testing", () => {
    const both = { ...env, GETYOURGUIDE_PRODUCTION_USERNAME: "supplier-production", GETYOURGUIDE_PRODUCTION_PASSWORD: "production-secret" };
    const production = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
    expect(isGygAuthorizationValid(production("supplier-production", "production-secret"), both)).toBe(true);
    expect(isGygAuthorizationValid(basic("inbound"), both)).toBe(true);
    expect(isGygAuthorizationValid(production("supplier-production", "inbound"), both)).toBe(false);
    expect(isGygAuthorizationValid(basic("production-secret"), both)).toBe(false);
    expect(isGygAuthorizationValid(production("supplier-production", "production-secret"), { ...both, GETYOURGUIDE_PRODUCTION_PASSWORD: undefined })).toBe(false);
  });
  it("keeps explicit testing precedence when production is configured", () => {
    const both = { ...env, GETYOURGUIDE_SUPPLIER_API_USERNAME: "supplier", GETYOURGUIDE_SUPPLIER_API_PASSWORD: "dedicated", GETYOURGUIDE_PRODUCTION_USERNAME: "production", GETYOURGUIDE_PRODUCTION_PASSWORD: "production-secret" };
    expect(isGygAuthorizationValid(basic("dedicated"), both)).toBe(true);
    expect(isGygAuthorizationValid(basic("inbound"), both)).toBe(false);
    expect(isGygAuthorizationValid(basic("outbound"), both)).toBe(false);
  });
  it("gives explicit inbound credentials precedence and rejects partial configuration", () => {
    const explicit = { ...env, GETYOURGUIDE_SUPPLIER_API_USERNAME: "supplier", GETYOURGUIDE_SUPPLIER_API_PASSWORD: "dedicated" };
    expect(isGygAuthorizationValid(basic("dedicated"), explicit)).toBe(true);
    expect(isGygAuthorizationValid(basic("inbound"), explicit)).toBe(false);
    expect(getGygInboundCredentials({ ...explicit, GETYOURGUIDE_SUPPLIER_API_PASSWORD: undefined })).toEqual([]);
  });
});

it("formats reservation expiry with the explicit offset required by GYG certification", () => {
  expect(formatGygReservationExpiration(new Date("2026-09-06T07:21:57.692Z"))).toBe("2026-09-06T07:21:57+00:00");
});
