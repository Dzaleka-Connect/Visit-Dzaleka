import { z } from "zod";
import type { Booking } from "./schema";

const optionalText = (max: number) => z.string().trim().max(max).transform(value => value || null);
export const bookingDetailsEditSchema = z.object({
  visitorName: z.string().trim().min(1, "Enter the visitor’s name.").max(200),
  visitorEmail: z.string().trim().email("Enter a valid email address.").max(254),
  visitorPhone: z.string().trim().max(80),
  visitorCountry: optionalText(100),
  visitorOrganization: optionalText(200),
  specialRequests: optionalText(5000),
  accessibilityNeeds: optionalText(2000),
  expectedUpdatedAt: z.string().nullable(),
}).strict();

export const bookingCorrectionSchema = z.object({
  status: z.enum(["pending", "confirmed", "in_progress"]),
  reason: z.string().trim().min(5, "Explain why the status needs correcting.").max(1000),
  expectedUpdatedAt: z.string().nullable(),
}).strict();

export const bookingRescheduleSchema = z.object({
  visitDate: z.string().refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Choose a valid visit date."),
  visitTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Choose a valid visit time.").optional(),
});

export function bookingCorrectionUpdates(status: z.infer<typeof bookingCorrectionSchema>["status"]): Partial<Booking> {
  return {
    status,
    checkOutTime: null,
    checkOutBy: null,
    ...(status !== "in_progress" ? { checkInTime: null, checkInBy: null } : {}),
    cancelledAt: null,
    cancelledBy: null,
    cancellationCategory: null,
    cancellationReason: null,
    cancellationNote: null,
  };
}
