import { storage } from "../storage";
import { sendBookingReminderEmailDetailed, sendTransportQuoteReminderEmailDetailed } from "../email";
import { sendAutomatedTemplateEmail } from "./automated-email";
import { log } from "../app";
import { logError } from "../utils/errors";

/**
 * Event-driven booking and transport reminder system.
 * 
 * Instead of running on a cron schedule, reminders are checked whenever
 * booking-related API endpoints are called. This is ideal for serverless
 * environments like Netlify where persistent processes aren't available.
 * 
 * Call checkAndSendDueReminders() from frequently-used endpoints like:
 * - GET /api/bookings
 * - POST /api/bookings (on creation)
 * - PATCH /api/bookings/:id (on confirmation)
 * - GET /api/transport-partner/requests (for stale transport quote follow-up)
 */

// Track last check to avoid checking too frequently
let lastReminderCheck: Date | null = null;
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between checks
const PUBLIC_APP_URL = (process.env.APP_URL || "https://visit.dzaleka.com").replace(/\/$/, "");
const TRANSPORT_QUOTE_REMINDER_HOURS = Math.max(
  1,
  Number.parseInt(process.env.TRANSPORT_QUOTE_REMINDER_HOURS || "24", 10) || 24,
);

/**
 * Check if any reminders are due and send them.
 * Debounced to avoid excessive checks on every API call.
 * Safe to call frequently - will skip if checked recently.
 */
export async function checkAndSendDueReminders(): Promise<void> {
  try {
    // Skip if checked within the last 5 minutes
    if (lastReminderCheck) {
      const timeSinceLastCheck = Date.now() - lastReminderCheck.getTime();
      if (timeSinceLastCheck < MIN_CHECK_INTERVAL_MS) {
        return; // Debounced - skip this check
      }
    }

    lastReminderCheck = new Date();

    // Run async - don't block the API response
    setImmediate(async () => {
      try {
        await sendUpcomingBookingReminders();
        await sendTransportQuoteReminders();
      } catch (error) {
        logError("[Reminder] Background reminder check failed", error, "system");
      }
    });
  } catch (error) {
    logError("[Reminder] Error initiating reminder check", error, "system");
  }
}

/**
 * Find bookings happening in the next 24-25 hours that haven't received reminders
 * and send reminder emails
 */
async function sendUpcomingBookingReminders(): Promise<void> {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 25);

    // Get all confirmed bookings
    const allBookings = await storage.getBookings();

    // Filter for bookings happening in next 24-25 hours that need reminders
    const bookingsNeedingReminders = allBookings.filter(booking => {
      // Must be confirmed or pending (not cancelled/completed/no-show)
      if (!["confirmed", "pending"].includes(booking.status || "")) {
        return false;
      }

      // Must not have already sent reminder
      if (booking.reminderSentAt) {
        return false;
      }

      // Check if visit is in the 24-25 hour window
      const visitDateTime = new Date(`${booking.visitDate}T${booking.visitTime}`);
      return visitDateTime >= tomorrow && visitDateTime <= dayAfterTomorrow;
    });

    if (bookingsNeedingReminders.length === 0) {
      return; // No reminders needed
    }

    log(`[Reminder] Found ${bookingsNeedingReminders.length} bookings needing reminders`, "reminder");

    let successCount = 0;
    let failureCount = 0;

    for (const booking of bookingsNeedingReminders) {
      try {
        // Get guide info if assigned
        let guide = null;
        if (booking.assignedGuideId) {
          guide = await storage.getGuide(booking.assignedGuideId);
        }

        // Get meeting point info
        let meetingPoint = null;
        if (booking.meetingPointId) {
          const allMeetingPoints = await storage.getMeetingPoints();
          meetingPoint = allMeetingPoints.find(mp => mp.id === booking.meetingPointId);
        }

        // Send reminder email
        const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "";
        const reminderEmail = await sendAutomatedTemplateEmail({
          templateName: "booking_reminder",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: {
            visitor_name: booking.visitorName,
            visitor_email: booking.visitorEmail,
            booking_id: booking.bookingReference,
            booking_reference: booking.bookingReference,
            visit_date: booking.visitDate,
            visit_time: booking.visitTime,
            tour_type: booking.tourType.replace(/_/g, " "),
            group_size: booking.groupSize,
            number_of_people: booking.numberOfPeople ?? 1,
            meeting_point: meetingPoint?.name,
            guide_name: guideName,
            guide_phone: guide?.phone,
            special_requests: booking.specialRequests,
          },
          fallbackSubject: `Tomorrow: Your Dzaleka Tour at ${booking.visitTime} - ${booking.bookingReference}`,
          fallbackMessage: `Reminder email for ${booking.visitorName} (${booking.bookingReference}).`,
          fallbackSend: () => sendBookingReminderEmailDetailed({
            to: booking.visitorEmail,
            bookingReference: booking.bookingReference,
            visitorName: booking.visitorName,
            visitDate: booking.visitDate,
            visitTime: booking.visitTime,
            numberOfPeople: booking.numberOfPeople ?? 1,
            tourType: booking.tourType,
            selectedZones: booking.selectedZones,
            specialRequests: booking.specialRequests,
            guideName: guideName || null,
            guidePhone: guide?.phone,
            meetingPointName: meetingPoint?.name,
            meetingPointAddress: meetingPoint?.address,
          }),
        });
        const reminderResult = reminderEmail.result;

        await storage.createEmailLog({
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          subject: reminderEmail.subject,
          message: reminderEmail.message,
          templateType: "booking_reminder",
          status: reminderResult.success ? "accepted" : "failed",
          errorMessage: reminderResult.error,
          providerMessageId: reminderResult.messageId,
          relatedEntityType: "booking",
          relatedEntityId: booking.id,
          metadata: {
            bookingReference: booking.bookingReference,
            templateId: reminderEmail.templateId,
            templateSource: reminderEmail.templateSource,
          },
        });

        if (!reminderResult.success) {
          failureCount++;
          log(`[Reminder] Failed to send reminder for booking ${booking.bookingReference}`, "reminder");
          continue;
        }

        // Mark reminder as sent only after delivery request succeeds
        await storage.markReminderSent(booking.id);

        successCount++;
        log(`[Reminder] Sent reminder for booking ${booking.bookingReference}`, "reminder");
      } catch (error) {
        failureCount++;
        logError(`[Reminder] Failed to send reminder for booking ${booking.bookingReference}`, error, "system");
      }
    }

    log(`[Reminder] Completed: ${successCount} sent, ${failureCount} failed`, "reminder");
  } catch (error) {
    logError("[Reminder] Error in sendUpcomingBookingReminders", error, "system");
  }
}

async function sendTransportQuoteReminders(): Promise<void> {
  try {
    const [requests, existingReminderLogs, users] = await Promise.all([
      storage.getTransportRequests(),
      storage.getEmailLogs({ templateType: "transport_quote_reminder", archived: "all" }),
      storage.getUsers(),
    ]);
    const remindedRequestIds = new Set(existingReminderLogs.map((log) => log.relatedEntityId).filter(Boolean));
    const now = Date.now();
    const reminderCutoffMs = TRANSPORT_QUOTE_REMINDER_HOURS * 60 * 60 * 1000;

    const requestsNeedingReminder = requests.filter((request) => {
      if (!request.partnerId) return false;
      if (remindedRequestIds.has(request.id)) return false;
      if (request.quoteSentAt || request.quotedAmount != null) return false;
      if (["quote_sent", "visitor_approved", "visitor_declined", "confirmed", "completed", "cancelled"].includes(request.status || "")) {
        return false;
      }

      const baseDate = request.assignedAt || request.createdAt;
      if (!baseDate) return false;
      const baseTime = new Date(baseDate as any).getTime();
      return Number.isFinite(baseTime) && now - baseTime >= reminderCutoffMs;
    });

    if (requestsNeedingReminder.length === 0) return;

    log(`[Reminder] Found ${requestsNeedingReminder.length} transport quote reminder(s)`, "reminder");

    const adminRecipients = users.filter((user) =>
      user.email
      && user.emailNotifications !== false
      && user.isActive !== false
      && ["admin", "coordinator"].includes(user.role || "")
    );

    let successCount = 0;
    let failureCount = 0;

    for (const request of requestsNeedingReminder) {
      try {
        const [partner, booking] = await Promise.all([
          request.partnerId ? storage.getTransportPartner(request.partnerId) : Promise.resolve(undefined),
          request.bookingId ? storage.getBooking(request.bookingId) : Promise.resolve(undefined),
        ]);
        const assignedAt = request.assignedAt || request.createdAt;
        const hoursWaiting = assignedAt
          ? (now - new Date(assignedAt as any).getTime()) / (60 * 60 * 1000)
          : TRANSPORT_QUOTE_REMINDER_HOURS;
        const recipients: Array<{ name: string; email: string; audience: "partner" | "admin" }> = [];
        const seen = new Set<string>();

        if (partner?.email) {
          seen.add(partner.email.toLowerCase());
          recipients.push({
            name: partner.contactName || partner.companyName,
            email: partner.email,
            audience: "partner",
          });
        }

        adminRecipients.forEach((admin) => {
          if (!admin.email || seen.has(admin.email.toLowerCase())) return;
          seen.add(admin.email.toLowerCase());
          recipients.push({
            name: [admin.firstName, admin.lastName].filter(Boolean).join(" ").trim() || admin.email,
            email: admin.email,
            audience: "admin",
          });
        });

        for (const recipient of recipients) {
          const result = await sendTransportQuoteReminderEmailDetailed({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            visitorName: request.visitorName,
            visitorEmail: request.visitorEmail,
            visitorPhone: request.visitorPhone,
            bookingReference: booking?.bookingReference || request.bookingId || request.id,
            partnerName: partner?.companyName || null,
            partnerEmail: partner?.email || null,
            route: request.route,
            pickupLocation: request.pickupLocation,
            visitDate: request.visitDate,
            visitTime: request.visitTime,
            notes: request.notes,
            partnerNotes: request.partnerNotes,
            adminNotes: recipient.audience === "admin" ? request.adminNotes : null,
            actionUrl: `${PUBLIC_APP_URL}/transport-partner?tab=requests`,
            actionLabel: recipient.audience === "partner" ? "Send Transport Quote" : "Review Transport Request",
            hoursWaiting,
          });

          await storage.createEmailLog({
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            subject: `Reminder: transport quote needed - ${booking?.bookingReference || request.visitorName || request.id}`,
            message: `Transport request has not been quoted after ${Math.round(hoursWaiting)} hours.`,
            templateType: "transport_quote_reminder",
            status: result.success ? "accepted" : "failed",
            errorMessage: result.error,
            providerMessageId: result.messageId,
            relatedEntityType: "transport_request",
            relatedEntityId: request.id,
            metadata: {
              bookingId: request.bookingId,
              bookingReference: booking?.bookingReference,
              partnerId: request.partnerId,
              partnerName: partner?.companyName,
              audience: recipient.audience,
              hoursWaiting,
              reminderThresholdHours: TRANSPORT_QUOTE_REMINDER_HOURS,
            },
          });

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        }
      } catch (error) {
        failureCount++;
        logError(`[Reminder] Failed to send transport quote reminder for ${request.id}`, error, "system");
      }
    }

    log(`[Reminder] Transport quote reminders completed: ${successCount} sent, ${failureCount} failed`, "reminder");
  } catch (error) {
    logError("[Reminder] Error in sendTransportQuoteReminders", error, "system");
  }
}

/**
 * Manual trigger for testing - can be called via API endpoint
 * This bypasses the debounce check
 */
export async function triggerRemindersManually(): Promise<void> {
  log("[Reminder] Manual trigger initiated", "reminder");
  lastReminderCheck = null; // Reset debounce
  await sendUpcomingBookingReminders();
  await sendTransportQuoteReminders();
}

/**
 * @deprecated Use checkAndSendDueReminders() instead
 * Kept for backward compatibility during migration
 */
export function startReminderScheduler(): void {
  // log("[Reminder] Cron scheduler disabled - using event-driven reminders instead", "reminder");
  // No-op: cron is no longer used
}
