import { afterEach, describe, expect, it, vi } from "vitest";
import { build } from "esbuild";

const store = vi.hoisted(() => ({ inventory: vi.fn(), recordActivity: vi.fn().mockResolvedValue(undefined), reserve: vi.fn(), ping: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../server/lib/getyourguide-store", async importOriginal => ({
  ...await importOriginal<typeof import("../server/lib/getyourguide-store")>(),
  getGygStore: () => store,
}));
import { handler } from "../netlify/functions/getyourguide";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

function request(path: string, options: { authorized?: boolean; body?: unknown; query?: Record<string, string> } = {}) {
  vi.stubEnv("GETYOURGUIDE_PRODUCTION_USERNAME", "production-test");
  vi.stubEnv("GETYOURGUIDE_PRODUCTION_PASSWORD", "test-only");
  const context = { callbackWaitsForEmptyEventLoop: true };
  return (handler({
    httpMethod: options.body ? "POST" : "GET", path,
    headers: { "content-type": "application/json", ...(options.authorized ? { authorization: `Basic ${Buffer.from("production-test:test-only").toString("base64")}` } : {}) },
    queryStringParameters: options.query,
    body: options.body ? JSON.stringify(options.body) : null,
    requestContext: { identity: { sourceIp: "127.0.0.1" } },
  }, context as any) as Promise<{ statusCode: number; body: string; headers: Record<string, string> }>)
    .then(result => {
      expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
      return result;
    });
}

describe("dedicated GetYourGuide runtime", () => {
  it("rejects unauthorized requests before touching inventory", async () => {
    const result = await request("/1/get-availabilities");
    expect(JSON.parse(result.body).errorCode).toBe("AUTHORIZATION_FAILURE");
    expect(store.inventory).not.toHaveBeenCalled();
  });

  it("uses current bookings and holds, persists telemetry, and prevents caching", async () => {
    store.inventory.mockResolvedValue({
      bookings: [{ visitDate: "2030-09-14", visitTime: "10:00", numberOfPeople: 3, status: "confirmed" }],
      reservations: [{ visitDate: "2030-09-14", visitTime: "10:00", timeMode: "time_point", participantCount: 2 }],
    });
    const result = await request("/1/get-availabilities/", { authorized: true, query: {
      productId: "1188868", fromDateTime: "2030-09-14T00:00:00+02:00", toDateTime: "2030-09-14T23:59:59+02:00",
    } });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).data.availabilities).toEqual([
      expect.objectContaining({ dateTime: "2030-09-14T10:00:00+02:00", vacancies: 15 }),
      expect.objectContaining({ dateTime: "2030-09-14T14:00:00+02:00", vacancies: 20 }),
    ]);
    expect(store.inventory).toHaveBeenCalledWith("2030-09-14", "2030-09-14");
    expect(store.recordActivity).toHaveBeenCalledWith("/1/get-availabilities/", "1188868", true, null, false);
    expect(result.headers["cache-control"]).toBe("no-store");
    expect(result.headers["x-dzaleka-supplier-runtime"]).toBe("dedicated");
    expect(result.headers["x-dzaleka-supplier-region"]).toBeTruthy();
    expect(result.headers["server-timing"]).toMatch(/^app;dur=\d+/);
    expect(result.headers["set-cookie"]).toBeUndefined();
  });

  it("does not record warmup availability polls as live activity", async () => {
    store.inventory.mockResolvedValue({ bookings: [], reservations: [] });
    const context = { callbackWaitsForEmptyEventLoop: true };
    vi.stubEnv("GETYOURGUIDE_PRODUCTION_USERNAME", "production-test");
    vi.stubEnv("GETYOURGUIDE_PRODUCTION_PASSWORD", "test-only");
    const result = await handler({
      httpMethod: "GET", path: "/1/get-availabilities/",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from("production-test:test-only").toString("base64")}`,
        "x-dzaleka-warmup": "true",
        "x-dzaleka-diagnostic": "true",
      },
      queryStringParameters: {
        productId: "1188868", fromDateTime: "2030-09-14T00:00:00+02:00", toDateTime: "2030-09-14T23:59:59+02:00",
      },
      body: null,
      requestContext: { identity: { sourceIp: "127.0.0.1" } },
    }, context as any) as { statusCode: number; body: string };
    expect(JSON.parse(result.body).data.availabilities).toHaveLength(2);
    expect(store.recordActivity).not.toHaveBeenCalled();
  });

  it("returns availability without waiting for telemetry", async () => {
    let release = () => {};
    store.inventory.mockResolvedValue({ bookings: [], reservations: [] });
    store.recordActivity.mockReturnValue(new Promise<void>(resolve => { release = resolve; }));
    const result = await Promise.race([
      request("/1/get-availabilities/", { authorized: true, query: {
        productId: "1188868", fromDateTime: "2030-09-14T00:00:00+02:00", toDateTime: "2030-09-14T23:59:59+02:00",
      } }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("availability waited for telemetry")), 500)),
    ]);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).data.availabilities).toHaveLength(2);
    release();
  });

  it("parses reservation JSON and retains the durable reservation flow", async () => {
    store.reserve.mockImplementation(async reservation => reservation);
    const result = await request("/1/reserve", { authorized: true, body: { data: {
      productId: "1188868", dateTime: "2030-09-14T10:00:00+02:00", gygBookingReference: "test-runtime",
      bookingItems: [{ category: "ADULT", count: 2 }],
    } } });
    expect(JSON.parse(result.body).data.reservationReference).toMatch(/^res_/);
    expect(store.reserve).toHaveBeenCalledWith(expect.objectContaining({ participantCount: 2, gygBookingReference: "test-runtime" }), 20, 2);
  });

  it("does not bundle application routes, sessions, email, or reporting into supplier cold starts", async () => {
    const result = await build({ entryPoints: ["netlify/functions/getyourguide.ts"], bundle: true, platform: "node", write: false, metafile: true, logLevel: "silent" });
    const bundled = Object.keys(result.metafile.inputs);
    expect(bundled.filter(path => /server\/(app|routes|storage|email)\.ts|express-session|report-scheduler/.test(path))).toEqual([]);
    expect(bundled.filter(path => /node_modules\/helmet\//.test(path))).toEqual([]);
  });
});
