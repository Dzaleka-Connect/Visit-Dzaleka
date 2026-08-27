import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const robots = readFileSync(join(process.cwd(), "client", "public", "robots.txt"), "utf-8");

const rules = robots
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^(allow|disallow):/i.test(line))
  .map((line) => {
    const [directive, ...rest] = line.split(":");
    return { directive: directive.trim().toLowerCase(), path: rest.join(":").trim() };
  });

/**
 * Longest-match-wins, the interpretation Google and Bing document. Returns true
 * when a compliant crawler would be permitted to fetch the path.
 */
function isAllowed(path: string): boolean {
  let best: { directive: string; length: number } = { directive: "allow", length: -1 };
  for (const rule of rules) {
    const pattern = rule.path.replace(/\$$/, "");
    const matches = rule.path.endsWith("$") ? path === pattern : path.startsWith(pattern);
    if (!matches) continue;
    if (rule.path.length > best.length) {
      best = { directive: rule.directive, length: rule.path.length };
    }
  }
  return best.directive === "allow";
}

describe("robots.txt", () => {
  it("points at the sitemap", () => {
    expect(robots).toMatch(/^Sitemap: https:\/\/visit\.dzaleka\.com\/sitemap\.xml$/m);
  });

  it("references the agent files in a comment", () => {
    expect(robots).toContain("/llms.txt");
    expect(robots).toContain("/openapi.json");
  });

  it("allows the machine-readable files", () => {
    expect(isAllowed("/llms.txt")).toBe(true);
    expect(isAllowed("/openapi.json")).toBe(true);
    expect(isAllowed("/sitemap.xml")).toBe(true);
    expect(isAllowed("/.well-known/api-catalog")).toBe(true);
  });

  // `Disallow: /developer` (the admin route) prefix-matches `/developers`, so an
  // explicit longer Allow is required or the portal is uncrawlable.
  it("allows the developer portal despite the /developer disallow", () => {
    expect(isAllowed("/developers")).toBe(true);
    expect(isAllowed("/developer")).toBe(false);
  });

  // `Disallow: /api/` would otherwise stop a compliant agent from ever calling
  // the public API this whole change is meant to advertise.
  it("allows the public API but not the protected surface", () => {
    expect(isAllowed("/api/public/pricing")).toBe(true);
    expect(isAllowed("/api/public/zones")).toBe(true);
    expect(isAllowed("/api/blog")).toBe(true);
    expect(isAllowed("/api/community/events")).toBe(true);

    expect(isAllowed("/api/bookings")).toBe(false);
    expect(isAllowed("/api/users")).toBe(false);
    expect(isAllowed("/api/settings/analytics")).toBe(false);
  });

  it("allows the community hub despite the /community disallow", () => {
    expect(isAllowed("/community-hub")).toBe(true);
  });

  it("allows the public trust-anchor pages", () => {
    for (const path of ["/about-us", "/contact", "/privacy"]) {
      expect(isAllowed(path), path).toBe(true);
    }
  });

  it("still protects the authenticated application", () => {
    for (const path of ["/settings", "/revenue", "/users", "/audit-logs", "/admin/webhooks"]) {
      expect(isAllowed(path), path).toBe(false);
    }
  });

  it("allows the public marketing pages", () => {
    for (const path of ["/", "/things-to-do", "/plan-your-trip", "/blog", "/whats-on"]) {
      expect(isAllowed(path), path).toBe(true);
    }
  });
});
