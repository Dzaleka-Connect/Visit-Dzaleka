import { describe, expect, it, vi } from "vitest";
import { bookingManagementHandler } from "../server/lib/booking-management";
import { bookingCorrectionUpdates, bookingCorrectionSchema, bookingDetailsEditSchema, bookingRescheduleSchema } from "../shared/booking-management";

const updatedAt = "2026-09-06T01:00:00.000Z";
const old = { id: "booking-1", visitorName: "Original", visitorEmail: "old@example.com", visitorPhone: "123", visitorUserId: "old-user", status: "completed", assignedGuideId: "guide-1", guidePayment: 10000, totalAmount: 20000, updatedAt, checkInTime: "2026-09-06T10:00:00Z", checkOutTime: "2026-09-06T12:00:00Z", paymentStatus: "paid" };
const details = { visitorName: "  New Name  ", visitorEmail: " NEW@example.com ", visitorPhone: "456", visitorCountry: " Malawi ", visitorOrganization: "", specialRequests: "", accessibilityNeeds: "", expectedUpdatedAt: updatedAt };
function fixture() {
  const storage = {
    getBooking: vi.fn().mockResolvedValue(old),
    updateBooking: vi.fn().mockImplementation(async (_id, updates) => ({ ...old, ...updates })),
    getUserByEmail: vi.fn().mockResolvedValue({ id: "new-user" }),
    getGuide: vi.fn().mockResolvedValue({ id: "guide-1", totalTours: 3, totalEarnings: 30000 }),
    getGuideByUserId: vi.fn(), updateGuide: vi.fn(), createBookingActivityLog: vi.fn(), createAuditLog: vi.fn(),
    getTransportRequestsByBookingIds: vi.fn().mockResolvedValue([{ id: "transport-1" }]), updateTransportRequest: vi.fn(),
  };
  const response: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const run = (mode: "details" | "correction", body: unknown) => bookingManagementHandler(storage as any, mode)({ params: {id:old.id}, body, session:{userId:"admin-1"}, get:()=>"test", ip:"127.0.0.1" } as any, response);
  return { storage, response, run };
}

describe("booking correction", () => {
  it("reopens accidental completion, clears terminal fields and reverses guide totals", async () => {
    const { storage, response, run } = fixture();
    await run("correction", { status:"confirmed", reason:"Completed before the visitor arrived", expectedUpdatedAt:updatedAt });
    expect(storage.updateBooking).toHaveBeenCalledWith(old.id, expect.objectContaining({ status:"confirmed", checkOutTime:null, checkInTime:null, cancelledAt:null }), updatedAt);
    expect(storage.updateGuide).toHaveBeenCalledWith("guide-1", {totalTours:2,totalEarnings:20000});
    expect(storage.createBookingActivityLog).toHaveBeenCalledWith(expect.objectContaining({action:"status_corrected",oldStatus:"completed",newStatus:"confirmed",userId:"admin-1"}));
    expect(storage.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({entityId:old.id,oldValues:old}));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({status:"confirmed",paymentStatus:"paid"}));
  });
  it("retains check-in when the visit is still in progress", () => {
    expect(bookingCorrectionUpdates("in_progress")).not.toHaveProperty("checkInTime");
    expect(bookingCorrectionUpdates("in_progress").checkOutTime).toBeNull();
  });
  it("does not adjust guide totals when reopening a cancellation", async () => {
    const {storage,run} = fixture(); storage.getBooking.mockResolvedValue({...old,status:"cancelled"});
    await run("correction", {status:"pending",reason:"Cancelled the wrong booking",expectedUpdatedAt:updatedAt});
    expect(storage.updateGuide).not.toHaveBeenCalled();
  });
  it("rejects stale updates before changing totals or logs", async () => {
    const {storage,response,run} = fixture();
    storage.updateBooking.mockRejectedValue(Object.assign(new Error("stale"),{code:"VERSION_CONFLICT"}));
    await run("correction",{status:"confirmed",reason:"Accidental completion",expectedUpdatedAt:updatedAt});
    expect(response.status).toHaveBeenCalledWith(409);
    expect(storage.updateGuide).not.toHaveBeenCalled(); expect(storage.createAuditLog).not.toHaveBeenCalled();
  });
  it("requires an explanation and rejects financial or terminal-state changes", () => {
    expect(bookingCorrectionSchema.safeParse({status:"confirmed",reason:" ",expectedUpdatedAt:updatedAt}).success).toBe(false);
    expect(bookingCorrectionSchema.safeParse({status:"completed",reason:"Mistake",expectedUpdatedAt:updatedAt}).success).toBe(false);
    expect(bookingCorrectionSchema.safeParse({status:"confirmed",reason:"Mistake",expectedUpdatedAt:updatedAt,paymentStatus:"refunded"}).success).toBe(false);
  });
});
describe("visitor editing", () => {
  it("normalizes contact details, updates account access and linked transport contacts", async () => {
    const {storage,response,run}=fixture(); await run("details",details);
    expect(storage.getUserByEmail).toHaveBeenCalledWith("new@example.com");
    expect(storage.updateBooking).toHaveBeenCalledWith(old.id,expect.objectContaining({visitorName:"New Name",visitorEmail:"new@example.com",visitorUserId:"new-user",visitorOrganization:null}),updatedAt);
    expect(storage.updateTransportRequest).toHaveBeenCalledWith("transport-1",{visitorName:"New Name",visitorEmail:"new@example.com",visitorPhone:"456"});
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({status:"completed"}));
  });
  it("removes old account access when the corrected email has no account", async () => {
    const {storage,run}=fixture(); storage.getUserByEmail.mockResolvedValue(undefined); await run("details",details);
    expect(storage.updateBooking).toHaveBeenCalledWith(old.id,expect.objectContaining({visitorUserId:null}),updatedAt);
  });
  it("does not allow contact editing to change status or payment", () => {
    expect(bookingDetailsEditSchema.safeParse({...details,status:"confirmed"}).success).toBe(false);
    expect(bookingDetailsEditSchema.safeParse({...details,totalAmount:1}).success).toBe(false);
  });
  it("returns 404 without writing when the booking is missing", async () => {
    const {storage,response,run}=fixture();storage.getBooking.mockResolvedValue(undefined);await run("details",details);
    expect(response.status).toHaveBeenCalledWith(404);expect(storage.updateBooking).not.toHaveBeenCalled();
  });
});
describe("schedule validation", () => {
  it("rejects impossible dates and times while accepting historical corrections", () => {
    expect(bookingRescheduleSchema.safeParse({visitDate:"2026-02-30",visitTime:"10:00"}).success).toBe(false);
    expect(bookingRescheduleSchema.safeParse({visitDate:"2026-02-28",visitTime:"25:00"}).success).toBe(false);
    expect(bookingRescheduleSchema.safeParse({visitDate:"2026-02-28",visitTime:"10:00"}).success).toBe(true);
  });
});
