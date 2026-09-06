import type { Booking } from "@shared/schema";

type Visit = Pick<Booking, "status" | "visitDate" | "visitTime" | "paymentStatus" | "paymentMethod" | "paymentReference" | "totalAmount">;

export function visitDateKey(date: string) {
  return /^\d{4}-\d{2}-\d{2}/.exec(date)?.[0] || "";
}

export function getVisitorBookingGroups<T extends Visit>(bookings: T[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Blantyre", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const today = ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-");
  const ascending = (a: T, b: T) => `${visitDateKey(a.visitDate)} ${a.visitTime || "00:00"}`.localeCompare(`${visitDateKey(b.visitDate)} ${b.visitTime || "00:00"}`);
  const scheduled = bookings.filter(b => b.status === "pending" || b.status === "confirmed");
  const upcoming = [
    ...bookings.filter(b => b.status === "in_progress").sort(ascending),
    ...scheduled.filter(b => visitDateKey(b.visitDate) >= today).sort(ascending),
  ];
  return {
    upcoming,
    followUp: scheduled.filter(b => visitDateKey(b.visitDate) < today).sort(ascending),
    completed: bookings.filter(b => b.status === "completed").sort((a, b) => ascending(b, a)),
    nextVisit: upcoming[0],
  };
}

export function visitorPaymentLabel(booking: Visit) {
  if (booking.paymentStatus === "refunded") return "Refunded";
  if (booking.paymentStatus === "paid") return "Paid";
  if (!booking.totalAmount) return "No payment due";
  if (booking.paymentReference) return "Awaiting verification";
  if (!booking.paymentMethod || booking.paymentMethod === "cash") return "Pay on arrival";
  return "Payment due";
}

export function needsVisitorPayment(booking: Visit) {
  return visitorPaymentLabel(booking) === "Payment due";
}
