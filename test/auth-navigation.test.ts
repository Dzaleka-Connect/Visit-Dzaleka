import { describe, expect, it } from "vitest";
import { getPostAuthPath } from "../client/src/lib/authUtils";

describe("authentication return destinations", () => {
  it("preserves a protected deep link, query, and fragment", () => {
    const next = "/bookings/booking-1?tab=transport#quote";
    expect(getPostAuthPath(`next=${encodeURIComponent(next)}`, "admin")).toBe(next);
  });
  it("defaults transport partners to their portal", () => {
    expect(getPostAuthPath("", "transport_partner")).toBe("/transport-partner/dashboard");
    expect(getPostAuthPath("", "visitor")).toBe("/");
  });
  it.each(["https://example.com", "//example.com", "/\\example.com", "/login?next=/login", "/auth", "/foo/../login", "/\n/example.com"])("rejects unsafe or looping destination %s", (next) => {
    expect(getPostAuthPath(`next=${encodeURIComponent(next)}`, "visitor")).toBe("/");
  });
});
