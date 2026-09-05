import { z } from "zod";
import { GROUP_SIZES } from "./constants";

export function bookingToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export const embedBookingFieldsSchema = z.object({
  visitorName: z.string().trim().min(1, "Enter your full name."),
  visitorEmail: z.string().trim().email("Enter a valid email address."),
  visitorPhone: z.string().trim(),
  visitorCountry: z.string().trim(),
  visitDate: z.string().refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value && value >= bookingToday();
  }, "Choose today or a future visit date."),
  visitTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid start time."),
  groupSize: z.string(),
  numberOfPeople: z.coerce.number().int().min(1, "Enter at least one visitor."),
}).superRefine((data, context) => {
  const group = GROUP_SIZES.find((item) => item.id === data.groupSize);
  if (!group) {
    context.addIssue({ code: "custom", path: ["groupSize"], message: "Choose a group size." });
  } else if (data.numberOfPeople < group.min || (group.max !== null && data.numberOfPeople > group.max)) {
    context.addIssue({
      code: "custom", path: ["numberOfPeople"],
      message: `Enter ${group.max === null ? `at least ${group.min}` : group.min === group.max ? group.min : `${group.min}–${group.max}`} visitor${group.max === 1 ? "" : "s"} for this group size.`,
    });
  }
});
