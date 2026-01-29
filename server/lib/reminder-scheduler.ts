import { storage } from "../storage";
import { sendBookingReminderEmail } from "../email";
import { log } from "../app";
import { logError } from "../utils/errors";

/**
 * Event-Driven Booking Reminder System
 * 
 * Instead of running on a cron schedule, reminders are checked whenever
 * booking-related API endpoints are called. This is ideal for serverless
 * environments like Netlify where persistent processes aren't available.
 * 
 * Call checkAndSendDueReminders() from frequently-used endpoints like:
 * - GET /api/bookings
 * - POST /api/bookings (on creation)
 * - PATCH /api/bookings/:id (on confirmation)
 */

// Track last check to avoid checking too frequently
let lastReminderCheck: Date | null = null;
const MIN_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between checks

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
        await sendBookingReminderEmail({
          to: booking.visitorEmail,
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          numberOfPeople: booking.numberOfPeople ?? 1,
          tourType: booking.tourType,
          selectedZones: booking.selectedZones,
          specialRequests: booking.specialRequests,
          guideName: guide ? `${guide.firstName} ${guide.lastName}` : null,
          guidePhone: guide?.phone,
          meetingPointName: meetingPoint?.name,
          meetingPointAddress: meetingPoint?.address,
        });

        // Mark reminder as sent
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

/**
 * Manual trigger for testing - can be called via API endpoint
 * This bypasses the debounce check
 */
export async function triggerRemindersManually(): Promise<void> {
  log("[Reminder] Manual trigger initiated", "reminder");
  lastReminderCheck = null; // Reset debounce
  await sendUpcomingBookingReminders();
}

/**
 * @deprecated Use checkAndSendDueReminders() instead
 * Kept for backward compatibility during migration
 */
export function startReminderScheduler(): void {
  // log("[Reminder] Cron scheduler disabled - using event-driven reminders instead", "reminder");
  // No-op: cron is no longer used
}
