import type { Request, Response } from "express";
import type { SupabaseStorage } from "../storage";
import { bookingCorrectionSchema, bookingCorrectionUpdates, bookingDetailsEditSchema } from "../../shared/booking-management";
import { z } from "zod";
import { logError } from "../utils/errors";

type ManagementStorage = Pick<SupabaseStorage, "getBooking" | "updateBooking" | "getUserByEmail" | "getGuide" | "getGuideByUserId" | "updateGuide" | "createBookingActivityLog" | "createAuditLog" | "getTransportRequestsByBookingIds" | "updateTransportRequest">;

export function bookingManagementHandler(storage: ManagementStorage, mode: "details" | "correction") {
  return async (req: Request, res: Response) => {
    try {
      const input = (mode === "details" ? bookingDetailsEditSchema : bookingCorrectionSchema).parse(req.body);
      const old = await storage.getBooking(req.params.id);
      if (!old) return res.status(404).json({ message: "Booking not found" });
      const userId = req.session.userId!;
      let updates;
      if ("reason" in input) {
        if (old.status === input.status) return res.status(400).json({ message: "Choose a different status." });
        updates = bookingCorrectionUpdates(input.status);
      } else {
        const { expectedUpdatedAt: _, ...details } = input;
        updates = { ...details, visitorEmail: details.visitorEmail.toLowerCase() };
        if (updates.visitorEmail !== old.visitorEmail.toLowerCase()) {
          const visitor = await storage.getUserByEmail(updates.visitorEmail);
          Object.assign(updates, { visitorUserId: visitor?.id || null });
        }
      }
      const booking = await storage.updateBooking(old.id, updates, input.expectedUpdatedAt);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // Undo the contribution made by the existing completion/check-out paths.
      if (mode === "correction" && old.status === "completed" && old.assignedGuideId) {
        const guide = await storage.getGuide(old.assignedGuideId) || await storage.getGuideByUserId(old.assignedGuideId);
        if (guide) await storage.updateGuide(guide.id, {
          totalTours: Math.max(0, (guide.totalTours || 0) - 1),
          totalEarnings: Math.max(0, (guide.totalEarnings || 0) - (old.guidePayment && old.guidePayment > 0 ? old.guidePayment : old.totalAmount || 0)),
        });
      }
      if (mode === "details") {
        const requests = await storage.getTransportRequestsByBookingIds([old.id]);
        for (const request of requests) await storage.updateTransportRequest(request.id, {
          visitorName: booking.visitorName, visitorEmail: booking.visitorEmail, visitorPhone: booking.visitorPhone,
        });
      }
      const description = "reason" in input ? input.reason : "Visitor details updated by staff";
      await storage.createBookingActivityLog({
        bookingId: old.id, action: mode === "correction" ? "status_corrected" : "details_updated",
        description, oldStatus: old.status, newStatus: booking.status, userId,
      });
      await storage.createAuditLog({
        userId, action: "update", entityType: "booking", entityId: old.id,
        oldValues: old, newValues: { ...updates, reason: description },
        ipAddress: req.ip || null, userAgent: req.get("user-agent") || null,
      });
      res.json(booking);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0]?.message || "Invalid booking changes", errors: error.issues });
      if (error?.code === "VERSION_CONFLICT") return res.status(409).json({ message: "This booking changed. Close this form, refresh the booking, and try again.", code: "VERSION_CONFLICT" });
      logError("Unable to update booking", error, req.requestId);
      res.status(500).json({ message: "Unable to save all booking changes. Refresh the booking to check its current state before trying again." });
    }
  };
}
