import { describe, it, expect } from "vitest";
import { shouldDisableCsp, cspOption, CSP_DIRECTIVES } from "../server/csp";

describe("shouldDisableCsp", () => {
  it("applies a policy in production", () => {
    expect(shouldDisableCsp({ NODE_ENV: "production" })).toBe(false);
  });

  it("skips the policy in development so hot reload works", () => {
    expect(shouldDisableCsp({ NODE_ENV: "development" })).toBe(true);
    expect(shouldDisableCsp({})).toBe(true);
  });

  // The prerender crawler must be able to run the app's scripts, or it captures
  // an unhydrated shell — which is what made the homepage look empty to crawlers.
  it("lets the prerender crawler opt out even in production", () => {
    expect(shouldDisableCsp({ NODE_ENV: "production", PRERENDER_DISABLE_CSP: "1" })).toBe(true);
  });

  it("only opts out on an exact 1", () => {
    expect(shouldDisableCsp({ NODE_ENV: "production", PRERENDER_DISABLE_CSP: "0" })).toBe(false);
    expect(shouldDisableCsp({ NODE_ENV: "production", PRERENDER_DISABLE_CSP: "true" })).toBe(false);
  });
});

describe("cspOption", () => {
  it("returns false when disabled", () => {
    expect(cspOption({ NODE_ENV: "development" })).toBe(false);
  });

  it("returns helmet directives in production", () => {
    const option = cspOption({ NODE_ENV: "production" });
    expect(option).not.toBe(false);
    expect((option as any).directives.defaultSrc).toEqual(["'self'"]);
  });
});

describe("CSP directives match what the app loads", () => {
  // Each of these was observed being blocked by helmet's default policy.
  it("permits the inline bootstrap in client/index.html", () => {
    expect(CSP_DIRECTIVES.scriptSrc).toContain("'unsafe-inline'");
  });

  it("permits Google Fonts stylesheets and font files", () => {
    expect(CSP_DIRECTIVES.styleSrc).toContain("https://fonts.googleapis.com");
    expect(CSP_DIRECTIVES.fontSrc).toContain("https://fonts.gstatic.com");
  });

  it("permits analytics", () => {
    expect(CSP_DIRECTIVES.scriptSrc).toContain("https://www.googletagmanager.com");
    expect(CSP_DIRECTIVES.connectSrc).toContain("https://www.google-analytics.com");
  });

  it("permits editorial images from partner domains", () => {
    expect(CSP_DIRECTIVES.imgSrc).toContain("https:");
    expect(CSP_DIRECTIVES.imgSrc).toContain("data:");
  });

  it("permits the Supabase realtime connection", () => {
    expect(CSP_DIRECTIVES.connectSrc).toContain("https://*.supabase.co");
    expect(CSP_DIRECTIVES.connectSrc).toContain("wss://*.supabase.co");
  });

  it("permits embedded YouTube players", () => {
    expect(CSP_DIRECTIVES.frameSrc).toContain("https://www.youtube.com");
  });

  it("still locks down the dangerous directives", () => {
    expect(CSP_DIRECTIVES.objectSrc).toEqual(["'none'"]);
    expect(CSP_DIRECTIVES.frameAncestors).toEqual(["'none'"]);
    expect(CSP_DIRECTIVES.scriptSrcAttr).toEqual(["'none'"]);
    expect(CSP_DIRECTIVES.baseUri).toEqual(["'self'"]);
    expect(CSP_DIRECTIVES.formAction).toEqual(["'self'"]);
  });

  it("does not allow plaintext http: anywhere", () => {
    const all = Object.values(CSP_DIRECTIVES).flat();
    expect(all.some((value) => value.startsWith("http://"))).toBe(false);
  });
});
