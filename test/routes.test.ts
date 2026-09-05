import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  isKnownAppPath,
  isPublicRoute,
  isProtectedRoute,
  PUBLIC_ROUTE_PREFIXES,
  PROTECTED_ROUTE_PREFIXES,
} from "../shared/routes";

describe("isKnownAppPath", () => {
  it("accepts the homepage", () => {
    expect(isKnownAppPath("/")).toBe(true);
  });

  it("accepts public content routes and their children", () => {
    expect(isKnownAppPath("/things-to-do")).toBe(true);
    expect(isKnownAppPath("/things-to-do/arts-culture")).toBe(true);
    expect(isKnownAppPath("/plan-your-trip/visitor-essentials")).toBe(true);
    expect(isKnownAppPath("/blog/some-published-post")).toBe(true);
  });

  it("accepts the new agent-facing pages", () => {
    expect(isKnownAppPath("/developers")).toBe(true);
    expect(isKnownAppPath("/privacy")).toBe(true);
  });

  it("accepts authenticated app routes", () => {
    expect(isKnownAppPath("/bookings")).toBe(true);
    expect(isKnownAppPath("/settings")).toBe(true);
    expect(isKnownAppPath("/admin/webhooks")).toBe(true);
  });

  it("accepts machine-readable files", () => {
    expect(isKnownAppPath("/llms.txt")).toBe(true);
    expect(isKnownAppPath("/openapi.json")).toBe(true);
    expect(isKnownAppPath("/.well-known/api-catalog")).toBe(true);
  });

  // The regression this whole change exists to prevent: unknown paths used to
  // answer 200 with the app shell, so agents concluded every path existed.
  it("rejects paths the router has no route for", () => {
    expect(isKnownAppPath("/this-path-does-not-exist-12345")).toBe(false);
    expect(isKnownAppPath("/wp-admin")).toBe(false);
    expect(isKnownAppPath("/admin.php")).toBe(false);
    expect(isKnownAppPath("/nope/nested/deep")).toBe(false);
  });

  it("does not treat a prefix collision as a match", () => {
    // `/blogsomething` must not match the `/blog` prefix.
    expect(isKnownAppPath("/blogsomething")).toBe(false);
    expect(isKnownAppPath("/contact-us-please")).toBe(false);
  });

  it("ignores query strings and trailing slashes", () => {
    expect(isKnownAppPath("/things-to-do?utm_source=x")).toBe(true);
    expect(isKnownAppPath("/things-to-do/")).toBe(true);
    expect(isKnownAppPath("/nope?utm_source=x")).toBe(false);
  });

  it("separates public from protected", () => {
    expect(isPublicRoute("/about-us")).toBe(true);
    expect(isProtectedRoute("/about-us")).toBe(false);
    expect(isProtectedRoute("/revenue")).toBe(true);
    expect(isPublicRoute("/revenue")).toBe(false);
  });
});

describe("route manifest stays in sync with the router", () => {
  // shared/routes.ts drives the server 404 and the Netlify redirect table. If a
  // page is added to App.tsx but not here, that page would 404 in production.
  it("covers every public and protected route declared in App.tsx", () => {
    const appSource = readFileSync(join(process.cwd(), "client", "src", "App.tsx"), "utf-8");
    const declared = Array.from(appSource.matchAll(/<(?:ProtectedRoute|Route) path="([^"]+)"/g)).map((m) => m[1]);

    expect(declared.length).toBeGreaterThan(20);

    const uncovered = declared
      // Turn wouter params into a concrete sample path.
      .map((route) => route.replace(/:[^/]+/g, "sample"))
      .filter((route) => !isKnownAppPath(route));

    expect(uncovered).toEqual([]);
  });

  it("has no duplicate prefixes", () => {
    const all = [...PUBLIC_ROUTE_PREFIXES, ...PROTECTED_ROUTE_PREFIXES];
    expect(new Set(all).size).toBe(all.length);
  });
});
