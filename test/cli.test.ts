import { describe, it, expect } from "vitest";
// @ts-expect-error - the CLI is plain ESM JavaScript, published as its own package.
import { run, parseArgs, HELP } from "../cli/src/commands.js";
// @ts-expect-error - see above.
import { ApiError, formatMwk, labelForGroupSize } from "../cli/src/api.js";

/** Stub fetch returning a canned JSON body for any URL. */
function stubFetch(body: unknown, { status = 200, contentType = "application/json" } = {}) {
  const calls: string[] = [];
  const impl = async (url: string) => {
    calls.push(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => contentType },
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    };
  };
  return { impl, calls };
}

const PRICING = [
  { groupSize: "individual", basePrice: 20000, additionalHourPrice: 10000, currency: "MWK" },
  { groupSize: "small_group", basePrice: 55000, additionalHourPrice: 10000, currency: "MWK" },
  { groupSize: "large_group", basePrice: 85000, additionalHourPrice: 10000, currency: "MWK" },
];

describe("parseArgs", () => {
  it("reads the command and positional arguments", () => {
    expect(parseArgs(["verify", "DVS-2024-001"])).toMatchObject({
      command: "verify",
      positional: ["DVS-2024-001"],
    });
  });

  it("defaults to help with no arguments", () => {
    expect(parseArgs([]).command).toBe("help");
  });

  it("reads flags", () => {
    const { flags } = parseArgs(["events", "--upcoming", "--json", "--limit", "5"]);
    expect(flags).toMatchObject({ upcoming: true, json: true, limit: 5 });
  });

  it("reads --base-url", () => {
    expect(parseArgs(["zones", "--base-url", "http://localhost:3000"]).flags.baseUrl).toBe(
      "http://localhost:3000"
    );
  });
});

describe("formatting helpers", () => {
  it("formats MWK with thousands separators and no decimals", () => {
    expect(formatMwk(20000)).toBe("MWK 20,000");
    expect(formatMwk(100000)).toBe("MWK 100,000");
  });

  it("labels group sizes the way the site does", () => {
    expect(labelForGroupSize("small_group")).toBe("Small group (2-5 people)");
    expect(labelForGroupSize("unknown_tier")).toBe("unknown_tier");
  });
});

describe("commands", () => {
  it("help lists the available commands", async () => {
    const lines = await run(["help"]);
    expect(lines.join("\n")).toBe(HELP);
    expect(HELP).toContain("pricing");
    expect(HELP).toContain("verify <reference>");
  });

  it("rejects an unknown command", async () => {
    await expect(run(["frobnicate"])).rejects.toThrow(/Unknown command/);
  });

  it("pricing renders every tier from the live response", async () => {
    const { impl, calls } = stubFetch(PRICING);
    const out = (await run(["pricing"], { fetchImpl: impl })).join("\n");

    expect(calls[0]).toBe("https://visit.dzaleka.com/api/public/pricing");
    expect(out).toContain("Individual (1 person)");
    expect(out).toContain("MWK 20,000");
    expect(out).toContain("MWK 55,000");
    expect(out).toContain("MWK 85,000");
    expect(out).toContain("MWK 10,000");
  });

  it("--json passes the payload through untouched", async () => {
    const { impl } = stubFetch(PRICING);
    const out = (await run(["pricing", "--json"], { fetchImpl: impl })).join("\n");
    expect(JSON.parse(out)).toEqual(PRICING);
  });

  it("--base-url targets another deployment", async () => {
    const { impl, calls } = stubFetch(PRICING);
    await run(["pricing", "--base-url", "http://localhost:5055"], { fetchImpl: impl });
    expect(calls[0]).toBe("http://localhost:5055/api/public/pricing");
  });

  it("events --upcoming drops past events", async () => {
    const { impl } = stubFetch({
      data: {
        events: [
          { id: "a", title: "Past thing", status: "past", date: "2020-01-01T00:00:00Z" },
          { id: "b", title: "Future thing", status: "upcoming", date: "2027-01-01T00:00:00Z" },
        ],
      },
    });
    const out = (await run(["events", "--upcoming"], { fetchImpl: impl })).join("\n");
    expect(out).toContain("Future thing");
    expect(out).not.toContain("Past thing");
  });

  it("--limit truncates the list", async () => {
    const { impl } = stubFetch([
      { name: "Zone A", description: "" },
      { name: "Zone B", description: "" },
      { name: "Zone C", description: "" },
    ]);
    const out = (await run(["zones", "--limit", "2"], { fetchImpl: impl })).join("\n");
    expect(out).toContain("Zone A");
    expect(out).toContain("Zone B");
    expect(out).not.toContain("Zone C");
  });

  it("verify reports a valid reference", async () => {
    const { impl, calls } = stubFetch({ valid: true, status: "confirmed", tourDate: "2026-09-01" });
    const out = (await run(["verify", "DVS-2024-001"], { fetchImpl: impl })).join("\n");
    expect(calls[0]).toContain("/api/public/bookings/verify/DVS-2024-001");
    expect(out).toContain("is valid");
    expect(out).toContain("confirmed");
  });

  it("verify reports an unknown reference", async () => {
    const { impl } = stubFetch({ valid: false });
    const out = (await run(["verify", "DVS-9999-999"], { fetchImpl: impl })).join("\n");
    expect(out).toContain("not a recognised booking reference");
  });

  it("verify without a reference explains what is missing", async () => {
    await expect(run(["verify"], { fetchImpl: stubFetch({}).impl })).rejects.toThrow(/booking reference/);
  });

  it("search encodes the query", async () => {
    const { impl, calls } = stubFetch({ data: {} });
    await run(["search", "live", "music"], { fetchImpl: impl });
    expect(calls[0]).toContain("/api/community/search?q=live%20music");
  });
});

describe("error handling", () => {
  it("surfaces the API's structured code and hint", async () => {
    const { impl } = stubFetch(
      { error: true, code: "rate_limited", message: "Too many requests.", hint: "Slow down." },
      { status: 429 }
    );

    await expect(run(["pricing"], { fetchImpl: impl })).rejects.toMatchObject({
      name: "ApiError",
      status: 429,
      code: "rate_limited",
      hint: "Slow down.",
    });
  });

  // Exactly the failure the audit flagged: an HTML error page an agent cannot parse.
  it("reports clearly when the API returns HTML instead of JSON", async () => {
    const { impl } = stubFetch("<html>404</html>", { status: 404, contentType: "text/html" });
    await expect(run(["pricing"], { fetchImpl: impl })).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("reports a network failure without a stack trace", async () => {
    const impl = async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    };
    await expect(run(["pricing"], { fetchImpl: impl })).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("ApiError carries its metadata", () => {
    const err = new ApiError("boom", { status: 500, code: "internal_error" });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(500);
  });
});
