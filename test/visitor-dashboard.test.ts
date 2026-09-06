import { describe, expect, it } from "vitest";
import { getVisitorBookingGroups, visitorPaymentLabel, needsVisitorPayment } from "../client/src/lib/visitor-dashboard";
const visit = (id: string, status: string, visitDate: string, visitTime = "10:00") => ({id,status,visitDate,visitTime,paymentStatus:"pending",paymentMethod:"cash",paymentReference:null,totalAmount:20000}) as any;
describe("visitor dashboard booking priorities", () => {
  const now = new Date("2026-09-05T22:30:00Z"); // Already September 6 in Malawi.
  it("puts an in-progress visit first and sorts future visits chronologically", () => {
    const result = getVisitorBookingGroups([visit("later","confirmed","2026-09-08"),visit("soon","pending","2026-09-06T00:00:00Z"),visit("active","in_progress","2026-09-05")],now);
    expect(result.upcoming.map(b=>b.id)).toEqual(["active","soon","later"]);
    expect(result.nextVisit?.id).toBe("active");
  });
  it("keeps overdue uncompleted bookings available for follow-up, not as next visits", () => {
    const result = getVisitorBookingGroups([visit("old","confirmed","2026-09-05"),visit("cancelled","cancelled","2026-09-10")],now);
    expect(result.nextVisit).toBeUndefined(); expect(result.followUp.map(b=>b.id)).toEqual(["old"]);
  });
  it("orders past visits newest first and handles empty accounts", () => {
    expect(getVisitorBookingGroups([visit("old","completed","2025-01-01"),visit("new","completed","2026-01-01")],now).completed.map(b=>b.id)).toEqual(["new","old"]);
    expect(getVisitorBookingGroups([],now).upcoming).toEqual([]);
  });
});
describe("visitor payment guidance", () => {
  const booking = visit("one","confirmed","2026-09-06");
  it("does not demand advance payment for cash on arrival", () => {
    expect(visitorPaymentLabel(booking)).toBe("Pay on arrival"); expect(needsVisitorPayment(booking)).toBe(false);
  });
  it("distinguishes payment due, staff verification, paid, and refunded", () => {
    expect(needsVisitorPayment({...booking,paymentMethod:"card"})).toBe(true);
    expect(visitorPaymentLabel({...booking,paymentReference:"receipt-1"})).toBe("Awaiting verification");
    expect(visitorPaymentLabel({...booking,paymentStatus:"paid"})).toBe("Paid");
    expect(needsVisitorPayment({...booking,paymentMethod:"card",paymentStatus:"refunded"})).toBe(false);
    expect(visitorPaymentLabel({...booking,totalAmount:0})).toBe("No payment due");
  });
});
