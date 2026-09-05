import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingToday, embedBookingFieldsSchema } from "../client/src/lib/embed-booking";

const fields = {
  visitorName: "  Visitor Example  ", visitorEmail: " visitor@example.com ",
  visitorPhone: "", visitorCountry: "", visitDate: "2026-10-01", visitTime: "10:00",
  groupSize: "individual", numberOfPeople: "1",
};
afterEach(() => vi.useRealTimers());
function parse(overrides = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
  return embedBookingFieldsSchema.safeParse({ ...fields, ...overrides });
}
describe("embedded booking validation", () => {
  it("trims contact fields and converts the visitor count", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ visitorName: "Visitor Example", visitorEmail: "visitor@example.com", numberOfPeople: 1 });
  });
  it.each([
    { visitorName: "  " }, { visitorEmail: "bad" }, { visitDate: "2026-09-05" },
    { visitDate: "2026-02-30" }, { visitTime: "25:00" }, { numberOfPeople: "" },
    { numberOfPeople: "1.5" }, { numberOfPeople: "5" }, { groupSize: "unknown" },
    { groupSize: "small_group", numberOfPeople: "6" },
  ])("rejects invalid or inconsistent booking fields %o", (overrides) => {
    expect(parse(overrides).success).toBe(false);
  });
  it("accepts the selected group range and same-day visits", () => {
    expect(parse({ groupSize: "small_group", numberOfPeople: "5", visitDate: "2026-09-06" }).success).toBe(true);
    expect(parse({ groupSize: "custom", numberOfPeople: "24" }).success).toBe(true);
  });
  it("uses the date at the destination, regardless of the visitor's timezone", () => {
    expect(bookingToday(new Date("2026-09-06T22:30:00Z"))).toBe("2026-09-07");
  });
});
