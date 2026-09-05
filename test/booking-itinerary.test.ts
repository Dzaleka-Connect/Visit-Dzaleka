import { describe, expect, it, vi } from "vitest";
import { bookingItineraryHandler } from "../server/lib/booking-itinerary";

function fixture() {
  const storage = {
    getBooking: vi.fn().mockResolvedValue({ id: "booking-1" }),
    getUser: vi.fn().mockResolvedValue({ id: "user-1", role: "admin" }),
    getItineraryByBookingId: vi.fn().mockResolvedValue(undefined),
  };
  const owns = vi.fn().mockReturnValue(false);
  const response: any = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const run = () => bookingItineraryHandler(storage as any, owns)({ params: {id:"booking-1"},session:{userId:"user-1"} } as any, response);
  return {storage,owns,response,run};
}
describe("booking itinerary lookup", () => {
  it("returns null without an error for a valid booking with no saved itinerary", async () => {
    const f = fixture(); await f.run();
    expect(f.response.json).toHaveBeenCalledWith(null);
    expect(f.response.status).not.toHaveBeenCalled();
    expect(f.response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });
  it("returns an existing itinerary", async () => {
    const f = fixture(); const itinerary = {id:"itinerary-1",content:{version:2}};
    f.storage.getItineraryByBookingId.mockResolvedValue(itinerary); await f.run();
    expect(f.response.json).toHaveBeenCalledWith(itinerary);
  });
  it("keeps missing bookings as 404", async () => {
    const f = fixture(); f.storage.getBooking.mockResolvedValue(undefined); await f.run();
    expect(f.response.status).toHaveBeenCalledWith(404);
    expect(f.storage.getItineraryByBookingId).not.toHaveBeenCalled();
  });
  it("does not look up itineraries for another visitor's booking", async () => {
    const f = fixture(); f.storage.getUser.mockResolvedValue({id:"other",role:"visitor"}); await f.run();
    expect(f.response.status).toHaveBeenCalledWith(403);
    expect(f.storage.getItineraryByBookingId).not.toHaveBeenCalled();
  });
  it("allows the booking owner", async () => {
    const f = fixture(); f.storage.getUser.mockResolvedValue({id:"user-1",role:"visitor"}); f.owns.mockReturnValue(true); await f.run();
    expect(f.response.json).toHaveBeenCalledWith(null);
    expect(f.response.status).not.toHaveBeenCalled();
  });
  it("keeps storage failures distinct from an empty itinerary", async () => {
    const f = fixture(); f.storage.getItineraryByBookingId.mockRejectedValue(new Error("Database unavailable")); await f.run();
    expect(f.response.status).toHaveBeenCalledWith(500);
    expect(f.response.json).toHaveBeenCalledWith({message:"Failed to fetch itinerary"});
  });
});
