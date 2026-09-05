import type { Request, Response } from "express";
import type { Booking, User } from "../../shared/schema";
import type { SupabaseStorage } from "../storage";
import { logError } from "../utils/errors";

type ItineraryStorage = Pick<SupabaseStorage, "getBooking" | "getUser" | "getItineraryByBookingId">;

export function bookingItineraryHandler(
  storage: ItineraryStorage,
  ownsBooking: (booking: Booking, user?: User | null) => boolean,
) {
  return async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const user = await storage.getUser(req.session?.userId || "");
      const isStaff = user && (user.role === "admin" || user.role === "coordinator");
      if (!ownsBooking(booking, user) && !isStaff) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // A booking can legitimately have no itinerary yet. Preserve errors for
      // missing bookings, denied access and storage failures; absence is data.
      const itinerary = await storage.getItineraryByBookingId(booking.id);
      return res.json(itinerary ?? null);
    } catch (error) {
      logError("Error fetching itinerary", error, req.requestId);
      return res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  };
}
