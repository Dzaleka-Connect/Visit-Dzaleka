import cron from "node-cron";
import { storage } from "../storage";
import { sendSystemHtmlEmailDetailed } from "../email";
import { generateVisitorReport, generateRevenueReport, generateIncidentReport } from "./report-templates";
import { logger } from "./logger";
import type { Booking, Incident, ScheduledReport } from "@shared/schema";

type ReportFrequency = "daily" | "weekly" | "monthly";

function getReportWindow(frequency: ReportFrequency) {
  const end = new Date();
  const start = new Date(end);

  if (frequency === "daily") {
    start.setDate(start.getDate() - 1);
  } else if (frequency === "weekly") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }

  const label = frequency === "daily" ? "Last 24 Hours"
    : frequency === "weekly" ? "Last 7 Days"
      : "Last 30 Days";

  return { start, end, label };
}

function dateInWindow(value: string | Date | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date >= start && date <= end;
}

function bookingRevenueDate(booking: Booking) {
  return booking.paymentVerifiedAt || booking.updatedAt || booking.createdAt;
}

function bookingAmount(booking: Booking) {
  return Number(booking.totalAmount || 0);
}

function isRecognizedRevenue(booking: Booking) {
  return booking.status !== "cancelled" && booking.paymentStatus === "paid";
}

function isOpenIncident(incident: Incident) {
  return incident.status !== "resolved" && incident.status !== "closed";
}

export class ReportScheduler {
  private static isRunning = false;

  static init() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run every hour to check for due reports
    cron.schedule("0 * * * *", async () => {
      try {
        await this.processDueReports();
      } catch (error) {
        logger.error("Failed to process scheduled reports", error as Error);
      }
    });

    logger.info("Scheduled Reports Engine initialized");
  }

  static async processDueReports() {
    const reports = await storage.getScheduledReports();
    const now = new Date();

    const dueReports = reports.filter(r => 
      r.status === "active" && new Date(r.nextRunAt) <= now
    );

    for (const report of dueReports) {
      try {
        await this.executeReport(report);
      } catch (error) {
        logger.error(`Failed to execute report ${report.id}`, error as Error);
      }
    }
  }

  static async executeReport(report: ScheduledReport, options: { advanceSchedule?: boolean } = {}) {
    const { advanceSchedule = true } = options;
    logger.info(`Executing scheduled report: ${report.name}`);
    
    // 1. Gather Data based on report type
    let htmlContent = "";
    const frequency = (report.frequency || "weekly") as ReportFrequency;
    const period = getReportWindow(frequency);

    if (report.type === "visitors") {
      const bookings = await storage.getBookings();
      const periodBookings = bookings.filter((booking) => dateInWindow(booking.createdAt, period.start, period.end));
      const checkedInBookings = bookings.filter((booking) => dateInWindow(booking.checkInTime, period.start, period.end));
      htmlContent = generateVisitorReport({
        total: periodBookings.length,
        checkedIn: checkedInBookings.length,
        period: period.label
      });
    } else if (report.type === "revenue") {
      const bookings = await storage.getBookings();
      const paidBookings = bookings.filter((booking) =>
        isRecognizedRevenue(booking) && dateInWindow(bookingRevenueDate(booking), period.start, period.end)
      );
      const pendingBookings = bookings.filter((booking) =>
        booking.status !== "cancelled"
        && booking.paymentStatus !== "paid"
        && dateInWindow(booking.createdAt, period.start, period.end)
      );
      htmlContent = generateRevenueReport({
        total: paidBookings.reduce((sum, booking) => sum + bookingAmount(booking), 0),
        pending: pendingBookings.reduce((sum, booking) => sum + bookingAmount(booking), 0),
        period: period.label
      });
    } else if (report.type === "incidents") {
      const incidents = await storage.getIncidents();
      const newIncidents = incidents.filter((incident) => dateInWindow(incident.createdAt, period.start, period.end)).length;
      const unresolved = incidents.filter(isOpenIncident).length;
      htmlContent = generateIncidentReport({
        newIncidents,
        unresolved,
        period: period.label
      });
    } else {
      throw new Error(`Unsupported scheduled report type: ${report.type}`);
    }

    // 2. Dispatch Emails
    const recipients = report.recipients.split(",").map((e: string) => e.trim()).filter(Boolean);
    for (const email of recipients) {
      await sendSystemHtmlEmailDetailed({
        recipientEmail: email,
        subject: `Dzaleka Report: ${report.name}`,
        html: htmlContent,
      });
    }

    const update: Partial<ScheduledReport> = { lastRunAt: new Date() };

    if (advanceSchedule) {
      const nextRun = new Date(report.nextRunAt);
      const now = new Date();
      while (nextRun <= now) {
        if (frequency === "daily") {
          nextRun.setDate(nextRun.getDate() + 1);
        } else if (frequency === "weekly") {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      update.nextRunAt = nextRun;
    }

    await storage.updateScheduledReport(report.id, update);
    
    logger.info(`Successfully executed report ${report.id}`);
  }
}
