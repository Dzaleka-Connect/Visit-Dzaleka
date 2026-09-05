import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../client/public/sw.js", import.meta.url), "utf8");
const origin = "https://visit.dzaleka.com";
function fixture() {
  const handlers: Record<string, (event: any) => void> = {};
  const cache = { match: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined), addAll: vi.fn().mockResolvedValue(undefined) };
  const caches = { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(true) };
  const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
  const self = { location: { origin }, addEventListener: (name: string, handler: any) => handlers[name] = handler, skipWaiting: vi.fn(), clients: { claim: vi.fn() } };
  runInNewContext(source, { self, caches, fetch, URL, Response });
  const dispatch = (name: string, request?: any) => {
    const pending: Promise<unknown>[] = [];
    const event = { request, respondWith: vi.fn(), waitUntil: (promise: Promise<unknown>) => pending.push(promise) };
    handlers[name](event);
    return { event, pending, response: event.respondWith.mock.calls[0]?.[0] as Promise<Response> | undefined };
  };
  return { cache, caches, fetch, self, dispatch };
}
function request(path: string, overrides = {}) {
  return { url: origin + path, method: "GET", mode: "cors", destination: "script", headers: new Headers(), ...overrides };
}
function networkResponse(body = "fresh") {
  const response = new Response(body);
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

describe("service worker fetch handling", () => {
  it("returns a usable offline document for an uncached booking navigation", async () => {
    const f = fixture();
    const result = await f.dispatch("fetch", request("/bookings/123", { mode: "navigate" })).response;
    expect(result).toBeInstanceOf(Response);
    expect(result?.status).toBe(503);
    expect(await result?.text()).toContain("Try again");
    expect(f.cache.match).not.toHaveBeenCalled();
  });
  it("does not replay previously cached booking HTML while offline", async () => {
    const f = fixture(); f.cache.match.mockResolvedValue(new Response("Private visitor details"));
    const result = await f.dispatch("fetch", request("/bookings/123", { mode: "navigate" })).response;
    expect(await result?.text()).not.toContain("Private visitor details");
  });
  it("keeps fresh navigation responses out of cache, including server errors", async () => {
    const f = fixture(); f.fetch.mockResolvedValue(new Response("Not found", { status: 404 }));
    const result = await f.dispatch("fetch", request("/bookings/123", { mode: "navigate" })).response;
    expect(result?.status).toBe(404);
    expect(f.caches.open).not.toHaveBeenCalled();
  });
  it("returns a Response when an asset is missing from both network and cache", async () => {
    const f = fixture(); const run = f.dispatch("fetch", request("/assets/app.js"));
    expect((await run.response)?.status).toBe(503);
    await Promise.all(run.pending);
  });
  it("serves cached assets when a background refresh fails", async () => {
    const f = fixture(); f.cache.match.mockResolvedValue(new Response("cached"));
    const run = f.dispatch("fetch", request("/assets/app.js"));
    expect(await (await run.response)?.text()).toBe("cached");
    await Promise.all(run.pending);
  });
  it("keeps background cache writes alive and serves the cached asset immediately", async () => {
    const f = fixture(); f.cache.match.mockResolvedValue(new Response("cached")); f.fetch.mockResolvedValue(networkResponse());
    const run = f.dispatch("fetch", request("/assets/app.js"));
    expect(await (await run.response)?.text()).toBe("cached");
    await Promise.all(run.pending);
    expect(f.cache.put).toHaveBeenCalledOnce();
    expect(run.pending).toHaveLength(1);
  });
  it("preserves successful network responses if cache reads or writes fail", async () => {
    const f = fixture(); f.cache.match.mockRejectedValue(new Error("Cache unavailable")); f.cache.put.mockRejectedValue(new Error("Quota exceeded")); f.fetch.mockResolvedValue(networkResponse());
    const run = f.dispatch("fetch", request("/assets/app.js"));
    expect(await (await run.response)?.text()).toBe("fresh");
    await expect(Promise.all(run.pending)).resolves.toBeDefined();
  });
  it.each(["private", "no-store"])("does not cache %s assets", async (directive) => {
    const f = fixture(); const response = networkResponse(); response.headers.set("Cache-Control", directive); f.fetch.mockResolvedValue(response);
    const run = f.dispatch("fetch", request("/assets/app.js"));
    await run.response; await Promise.all(run.pending);
    expect(f.cache.put).not.toHaveBeenCalled();
  });
  it("bypasses APIs, mutations, cross-origin requests and non-static requests", () => {
    const f = fixture();
    for (const req of [request("/api/bookings/123/itinerary"), request("/assets/app.js", {method:"POST"}), request("", {url: origin + ".evil.test/app.js"}), request("/account/export", {destination:""}), request("/video.mp4", {headers:new Headers({Range:"bytes=0-9"})})]) {
      expect(f.dispatch("fetch", req).event.respondWith).not.toHaveBeenCalled();
    }
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("deletes old application caches before claiming clients", async () => {
    const f = fixture(); f.caches.keys.mockResolvedValue(["dzaleka-visit-old", "unrelated", "dzaleka-visit-2026-09-06-v2"]);
    await Promise.all(f.dispatch("activate").pending);
    expect(f.caches.delete).toHaveBeenCalledExactlyOnceWith("dzaleka-visit-old");
    expect(f.self.clients.claim).toHaveBeenCalledOnce();
  });
  it("installs even when cache storage is unavailable", async () => {
    const f = fixture(); f.caches.open.mockRejectedValue(new Error("Unavailable"));
    await Promise.all(f.dispatch("install").pending);
    expect(f.self.skipWaiting).toHaveBeenCalledOnce();
  });
});
