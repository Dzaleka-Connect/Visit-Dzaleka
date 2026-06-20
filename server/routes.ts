/// <reference path="./types.d.ts" />
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { storage } from "./storage";
import {
  clearSessionCookie,
  establishAuthenticatedSession,
  getOrCreateCsrfToken,
  hashPassword,
  verifyPassword,
} from "./auth";
import {
  insertBookingSchema,
  insertGuideSchema,
  insertZoneSchema,
  insertPointOfInterestSchema,
  insertMeetingPointSchema,
  insertIncidentSchema,
  insertBookingCompanionSchema,
  insertAllowedIpSchema,
  insertAnalyticsSettingsSchema,
  insertBlogPostSchema,
  insertRecurringBookingSchema,
  insertEmailTemplateSchema,
  type UserRole,
  type Booking,
  type SpecialOffer,
  type Guide,
  type GuideProfileChangeRequest,
  type GuideTourReport,
  type RecurringBooking,
  type SupportTicket,
  type User,
  type Incident,
  type Notification as AppNotification,
  type TransportPartner,
  type TransportRequest,
  type TransportRequestStatus,
  type PartnerReferralStatus,
  type PartnerTourReferral,
  type CommunityListing,
  type Task,
  insertCommunityListingSchema,
  insertCommunityExperienceRequestSchema,
} from "@shared/schema";
import { generateIcalFeed, parseIcalFeed } from "./lib/ical";
import { z } from "zod";
import {
  sendBookingConfirmationDetailed,
  sendStatusUpdateDetailed,
  sendCustomEmail,
  sendCustomEmailDetailed,
  sendGuideAssignmentDetailed,
  sendCheckInNotificationDetailed,
  sendPasswordResetDetailed,
  sendInvitationEmailDetailed,
  sendPartnerReferralBookingEmailDetailed,
  sendTransportDriverConfirmedEmailDetailed,
  sendTransportPendingAdminEmailDetailed,
  sendTransportQuoteDecisionEmailDetailed,
  sendTransportQuoteReadyEmailDetailed,
  sendTransportRequestReceivedEmailDetailed,
  sendTransportRequestAssignedEmailDetailed,
  sendTransportStatusChangedEmailDetailed,
  sendItineraryEmailDetailed,
  sendBookingReminderEmailDetailed,
  getResendClient
} from "./email";
import { getStripePaymentConfig } from "./lib/stripe";
import { ReportScheduler } from "./lib/report-scheduler";
import { WebhookDispatcher } from "./lib/webhook-dispatcher";
import { isSafeDestination } from "./utils/ssrf";
import {
  notifyBookingCreated,
  notifyBookingStatusChanged,
  notifyGuideAssigned,
  notifyCheckIn,
  notifyPaymentReceived,
  notifyBookingCancelledByVisitor,
  notifySupportTicketCreated,
  notifyLowRatingReceived,
  notifyIncidentReported,
} from "./notifications";
import { logError } from "./utils/errors";
import { logger } from "./lib/logger";
import { suggestGuides, getTopReason } from "./lib/guide-suggestion";
import { checkAndSendDueReminders } from "./lib/reminder-scheduler";
import { sendAutomatedTemplateEmail } from "./lib/automated-email";
import { createSignedToken, generatePublicToken, hashToken, tokenFingerprint, verifySignedToken } from "./lib/tokens";
import crypto from "crypto";
import { verifyApiKey } from "./middleware/apiKeyAuth";

const dateSortValue = (date: string | Date | null | undefined) =>
  date ? new Date(date).getTime() : 0;

const getBookingGuideEarnings = (booking: Pick<Booking, "guidePayment" | "totalAmount">) => {
  const guidePayment = Number(booking.guidePayment || 0);
  return guidePayment > 0 ? guidePayment : Number(booking.totalAmount || 0);
};

const getRecognizedBookingRevenue = (booking: Pick<Booking, "paymentStatus" | "status" | "totalAmount">) =>
  booking.paymentStatus === "paid" && booking.status !== "cancelled"
    ? Number(booking.totalAmount || 0)
    : 0;

const isBookingAssignedToGuide = (
  booking: Pick<Booking, "assignedGuideId">,
  guide: Pick<Guide, "id" | "userId">
) => booking.assignedGuideId === guide.id || (!!guide.userId && booking.assignedGuideId === guide.userId);

const getGuideBookings = (bookings: Booking[], guide: Pick<Guide, "id" | "userId">) =>
  bookings.filter((booking) => isBookingAssignedToGuide(booking, guide));

const buildGuideLookup = (guides: Guide[]) => {
  const guideMap = new Map<string, Guide>();
  guides.forEach((guide) => {
    guideMap.set(guide.id, guide);
    if (guide.userId) guideMap.set(guide.userId, guide);
  });
  return guideMap;
};

const buildGuideComputedStats = (guide: Guide, bookings: Booking[]) => {
  const guideBookings = getGuideBookings(bookings, guide);
  const totalTours = guideBookings.filter((booking) => booking.status !== "cancelled").length;
  const completedTours = guideBookings.filter((booking) => booking.status === "completed");

  return {
    ...guide,
    totalTours,
    completedTours: completedTours.length,
    totalEarnings: completedTours.reduce((sum, booking) => sum + getBookingGuideEarnings(booking), 0),
  };
};

async function getAssignedGuide(booking: Pick<Booking, "assignedGuideId">) {
  if (!booking.assignedGuideId) return null;
  const directGuide = await storage.getGuide(booking.assignedGuideId);
  if (directGuide) return directGuide;
  return storage.getGuideByUserId(booking.assignedGuideId);
}

const recalculateGuideRating = async (guideId: string, requestId?: string) => {
  try {
    const [reviews, bookings] = await Promise.all([
      storage.getTourReviews(),
      storage.getBookings()
    ]);

    // Filter reviews for this guide that are published
    const guideReviews = reviews.filter(r => r.guideId === guideId && r.status === "published" && r.rating !== null && r.rating !== undefined);

    // Find booking IDs that have reviews
    const reviewedBookingIds = new Set(reviews.map(r => r.bookingId));

    // Filter bookings for this guide that have a rating but no review
    const directBookings = bookings.filter(b =>
      b.assignedGuideId === guideId &&
      b.visitorRating !== null &&
      b.visitorRating !== undefined &&
      !reviewedBookingIds.has(b.id)
    );

    const allRatings: number[] = [
      ...guideReviews.map(r => r.rating!),
      ...directBookings.map(b => b.visitorRating!)
    ];

    const totalRatings = allRatings.length;
    const rating = totalRatings > 0
      ? Math.round(allRatings.reduce((sum, r) => sum + r, 0) / totalRatings)
      : 0;

    await storage.updateGuide(guideId, {
      rating,
      totalRatings
    });
  } catch (error) {
    logError(`Error recalculating rating for guide ${guideId}`, error, requestId);
  }
};


const PUBLIC_APP_URL = (process.env.APP_URL || "https://visit.dzaleka.com").replace(/\/$/, "");
const TRANSPORT_QUOTE_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const TRANSPORT_QUOTE_REVIEW_STATUSES = new Set(["accepted", "quote_sent"]);
const TRANSPORT_QUOTE_DETAIL_FIELDS = [
  "quotedAmount",
  "currency",
  "estimatedPickupTime",
  "driverId",
  "vehicleId",
  "driverName",
  "driverPhone",
  "vehicleDetails",
  "partnerNotes",
] as const;
const API_KEY_ROUTE_SCOPES = {
  bookingsRead: "bookings:read",
  bookingsWrite: "bookings:write",
  guidesRead: "guides:read",
} as const;

const REVIEW_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type ReviewRequestTokenPayload = {
  purpose: "review_request";
  bookingId: string;
  bookingReference: string;
  visitorEmail: string;
};

function buildFeedbackLink(booking: Pick<Booking, "id" | "bookingReference" | "visitorEmail">) {
  const token = createSignedToken({
    purpose: "review_request",
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    visitorEmail: booking.visitorEmail,
  }, REVIEW_TOKEN_TTL_MS);
  return `${PUBLIC_APP_URL}/visit/feedback?token=${encodeURIComponent(token)}`;
}

function verifyReviewRequestToken(token: string): ReviewRequestTokenPayload | null {
  const payload = verifySignedToken<{
    purpose?: string;
    bookingId?: string;
    bookingReference?: string;
    visitorEmail?: string;
  }>(token);
  if (!payload || payload.purpose !== "review_request" || !payload.bookingId || !payload.bookingReference || !payload.visitorEmail) {
    return null;
  }
  return {
    purpose: "review_request",
    bookingId: payload.bookingId,
    bookingReference: payload.bookingReference,
    visitorEmail: payload.visitorEmail,
  };
}

function normalizeReviewEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

async function loadBookingForReviewToken(token: string) {
  const payload = verifyReviewRequestToken(token);
  if (!payload) {
    return { status: 401 as const, message: "Invalid or expired review link" };
  }

  const booking = await storage.getBooking(payload.bookingId);
  const emailMatches = normalizeReviewEmail(booking?.visitorEmail) === normalizeReviewEmail(payload.visitorEmail);
  const referenceMatches = booking?.bookingReference === payload.bookingReference;
  if (!booking || !emailMatches || !referenceMatches) {
    return { status: 404 as const, message: "Review request not found" };
  }

  return { status: 200 as const, booking };
}

function maskEmail(email: string | null | undefined) {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.toLowerCase().split("@");
  const visibleLocal = local.length <= 2 ? local[0] || "" : `${local[0]}${local[local.length - 1]}`;
  return `${visibleLocal}${"*".repeat(Math.max(2, local.length - visibleLocal.length))}@${domain}`;
}

function transportQuoteExpiresAt(request: Pick<TransportRequest, "quoteSentAt" | "updatedAt" | "createdAt">) {
  const sourceDate = request.quoteSentAt || request.updatedAt || request.createdAt;
  if (!sourceDate) return null;
  return new Date(new Date(sourceDate as any).getTime() + TRANSPORT_QUOTE_TOKEN_TTL_MS);
}

function isTransportQuoteExpired(request: Pick<TransportRequest, "quoteSentAt" | "updatedAt" | "createdAt">) {
  const expiresAt = transportQuoteExpiresAt(request);
  return !!expiresAt && expiresAt.getTime() < Date.now();
}

function buildPublicTransportQuoteResponse(
  request: TransportRequest,
  partner?: TransportPartner | null,
) {
  const base = {
    id: request.id,
    partnerName: partner?.companyName || "Transport partner",
    status: request.status,
    quoteDecision: request.quoteDecision,
    quoteDecisionAt: request.quoteDecisionAt,
  };

  if (request.quoteDecision) {
    return base;
  }

  return {
    ...base,
    visitorEmailHint: maskEmail(request.visitorEmail),
    route: request.route,
    pickupLocation: request.pickupLocation,
    visitDate: request.visitDate,
    visitTime: request.visitTime,
    quotedAmount: request.quotedAmount,
    currency: request.currency,
    estimatedPickupTime: request.estimatedPickupTime,
    partnerNotes: request.partnerNotes,
    quoteExpiresAt: transportQuoteExpiresAt(request)?.toISOString() || null,
  };
}

function getBookingStatusCategory(booking: Pick<Booking, "status" | "checkInTime" | "checkOutTime">) {
  if (booking.status === "cancelled" || booking.status === "no_show") return "not_valid";
  if (booking.checkOutTime || booking.status === "completed") return "completed";
  if (booking.checkInTime || booking.status === "in_progress") return "active";
  if (booking.status === "confirmed") return "expected";
  if (booking.status === "pending") return "pending";
  return "unknown";
}

const publicBookingVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    const reference = String(req.params.reference || "").trim().toLowerCase();
    return `${ip}:${tokenFingerprint(reference || "missing")}`;
  },
  handler: (req, res) => {
    logger.warn("Public booking verification rate limit reached", {
      requestId: req.requestId,
      referenceFingerprint: tokenFingerprint(String(req.params.reference || "missing").toLowerCase()),
    });
    res.status(429).json({ message: "Too many verification attempts. Please try again later." });
  },
});

const publicTransportQuoteDecisionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    return `${ip}:${tokenFingerprint(String(req.params.token || "missing"))}`;
  },
  handler: (req, res) => {
    logger.warn("Public transport quote decision rate limit reached", {
      requestId: req.requestId,
      tokenFingerprint: tokenFingerprint(String(req.params.token || "missing")),
    });
    res.status(429).json({ message: "Too many quote response attempts. Please try again later." });
  },
});

const publicTransportQuoteViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    return `${ip}:${tokenFingerprint(String(req.params.token || "missing"))}`;
  },
  handler: (req, res) => {
    logger.warn("Public transport quote view rate limit reached", {
      requestId: req.requestId,
      tokenFingerprint: tokenFingerprint(String(req.params.token || "missing")),
    });
    res.status(429).json({ message: "Too many quote view attempts. Please try again later." });
  },
});

const INTERNAL_NOTIFICATION_LINK_PREFIXES = [
  "/admin",
  "/analytics",
  "/audit-logs",
  "/bookings",
  "/calendar",
  "/cms",
  "/dashboard",
  "/developer-settings",
  "/email-history",
  "/email-settings",
  "/getyourguide",
  "/guide-certificates",
  "/guide-performance",
  "/guides",
  "/help-admin",
  "/live-ops",
  "/operations-manual",
  "/payments",
  "/recurring-bookings",
  "/reports",
  "/revenue",
  "/security",
  "/security-admin",
  "/settings",
  "/task-admin",
  "/training-admin",
  "/users",
  "/zones",
];

const GUIDE_NOTIFICATION_LINK_PREFIXES = [
  "/calendar",
  "/guide-training",
  "/my-availability",
  "/my-earnings",
  "/my-tours",
  "/support",
  "/tasks",
];

const SECURITY_NOTIFICATION_LINK_PREFIXES = [
  "/security",
  "/security-admin",
  "/live-ops",
  "/support",
];

const INTERNAL_NOTIFICATION_TYPES = new Set([
  "booking_created",
  "check_in",
  "check_out",
  "incident_reported",
  "payment_received",
]);

const GUIDE_NOTIFICATION_TYPES = new Set([
  "booking_cancelled",
  "booking_completed",
  "guide_assigned",
  "system",
]);

const VISITOR_NOTIFICATION_TYPES = new Set([
  "booking_cancelled",
  "booking_completed",
  "booking_confirmed",
  "payment_verified",
  "system",
]);

function notificationPath(link: string | null | undefined): string {
  if (!link) return "";

  try {
    return new URL(link, PUBLIC_APP_URL).pathname;
  } catch {
    return link.split("?")[0].split("#")[0];
  }
}

function matchesPathPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isNotificationVisibleToRole(notification: AppNotification, role: UserRole | null | undefined): boolean {
  const notificationType = notification.type;
  const path = notificationPath(notification.link);

  if (role === "admin" || role === "coordinator") {
    return true;
  }

  if (role === "security") {
    if (matchesPathPrefix(path, SECURITY_NOTIFICATION_LINK_PREFIXES)) return true;
    return notificationType === "incident_reported" || notificationType === "system";
  }

  if (role === "guide") {
    if (!GUIDE_NOTIFICATION_TYPES.has(notificationType)) return false;
    if (!path) return true;
    return !matchesPathPrefix(path, INTERNAL_NOTIFICATION_LINK_PREFIXES) ||
      matchesPathPrefix(path, GUIDE_NOTIFICATION_LINK_PREFIXES);
  }

  if (!VISITOR_NOTIFICATION_TYPES.has(notificationType)) return false;
  if (INTERNAL_NOTIFICATION_TYPES.has(notificationType)) return false;
  return !matchesPathPrefix(path, INTERNAL_NOTIFICATION_LINK_PREFIXES);
}

const publicReviewSchema = z.object({
  bookingReference: z.string().min(1),
  token: z.string().min(16),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(3000).optional(),
  tourGuideName: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  purposeOfVisit: z.string().trim().max(120).optional(),
  groupSize: z.string().trim().max(80).optional(),
  referralSource: z.string().trim().max(120).optional(),
  overallExperience: z.string().trim().max(40).optional(),
  guideExperience: z.string().trim().max(40).optional(),
  enjoyedMost: z.string().trim().max(3000).optional(),
  improvementSuggestions: z.string().trim().max(3000).optional(),
  wouldRecommend: z.string().trim().max(40).optional(),
  otherComments: z.string().trim().max(3000).optional(),
  wouldVisitAgain: z.string().trim().max(40).optional(),
  consentPhotos: z.boolean().optional(),
  consentTestimonial: z.boolean().optional(),
  consentDataProcessing: z.literal(true, {
    errorMap: () => ({ message: "Data processing consent is required to submit feedback." }),
  }),
});

const reviewModerationSchema = z.object({
  status: z.enum(["pending", "published", "hidden"]).optional(),
  responseText: z.string().trim().max(3000).optional().nullable(),
  staffNotes: z.string().trim().max(3000).optional().nullable(),
});

const guidePaymentUpdateSchema = z.object({
  guidePayment: z.coerce.number().int().min(0).max(100_000_000),
});

const TEMPLATE_SAMPLE_DATA: Record<string, string> = {
  visitor_name: "Amina Banda",
  visitor_email: "amina@example.com",
  visit_date: "2026-05-15",
  visit_time: "10:00",
  tour_type: "standard tour",
  group_size: "Small group",
  number_of_people: "4",
  meeting_point: "Dzaleka Main Gate",
  guide_name: "Joseph Mwale",
  total_amount: "120,000",
  booking_id: "DVS-2026-SAMPLE",
  booking_reference: "DVS-2026-SAMPLE",
  old_status: "pending",
  new_status: "confirmed",
  admin_notes: "Please arrive 10 minutes early.",
  guide_phone: "+265 999 000 000",
  check_in_time: "09:52",
  old_visit_date: "2026-05-14",
  old_visit_time: "09:00",
  new_visit_date: "2026-05-15",
  new_visit_time: "10:00",
  feedback_link: `${PUBLIC_APP_URL}/visit/feedback?token=sample`,
  visitor_phone: "+265 888 123 456",
  visitor_organization: "Sample University",
  selected_zones: "Market, Education Center",
  special_requests: "Vegetarian lunch preferred",
  accessibility_needs: "Step-free meeting point preferred",
  cancellation_reason: "Visitor schedule changed",
  reschedule_link: `${PUBLIC_APP_URL}/my-bookings`,
  payment_method: "card",
  payment_reference: "pi_sample_123",
  paid_at: "2026-05-15 10:20",
  ticket_id: "TKT-SAMPLE",
  ticket_subject: "Question about arrival time",
  ticket_status: "open",
  support_link: `${PUBLIC_APP_URL}/help`,
  old_guide_name: "Joseph Mwale",
  new_guide_name: "Grace Phiri",
  assignment_change: "Guide assignment updated",
  incident_title: "Late arrival safety concern",
  incident_severity: "high",
  incident_location: "Dzaleka Main Gate",
  incident_reporter: "Amina Banda",
  rating: "3",
  generated_count: "4",
  generated_dates: "2026-05-15, 2026-05-22, 2026-05-29, 2026-06-05",
  training_percentage: "75",
  incomplete_modules: "Safety briefing, visitor care",
  verification_link: `${PUBLIC_APP_URL}/verify-email?token=sample`,
};

const resendEventStatusMap: Record<string, string> = {
  "email.sent": "accepted",
  "email.delivered": "delivered",
  "email.delivery_delayed": "accepted",
  "email.bounced": "bounced",
  "email.complained": "complaint",
  "email.failed": "failed",
};

function renderTemplateText(value: string, data: Record<string, string> = TEMPLATE_SAMPLE_DATA) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => data[key] ?? `{{${key}}}`);
}

function buildBookingTemplateData(
  booking: Booking,
  extras: Record<string, string | number | null | undefined> = {}
) {
  return {
    visitor_name: booking.visitorName,
    visitor_email: booking.visitorEmail,
    booking_id: booking.bookingReference || booking.id,
    booking_reference: booking.bookingReference || booking.id,
    visitor_phone: booking.visitorPhone || "",
    visitor_country: booking.visitorCountry || "",
    visitor_organization: booking.visitorOrganization || "",
    visit_date: booking.visitDate,
    visit_time: booking.visitTime,
    tour_type: String(booking.tourType || "").replace(/_/g, " "),
    group_size: booking.groupSize || "",
    number_of_people: booking.numberOfPeople || 1,
    total_amount: booking.totalAmount || 0,
    status: booking.status || "",
    payment_status: booking.paymentStatus || "",
    selected_zones: Array.isArray(booking.selectedZones) ? booking.selectedZones.join(", ") : "",
    special_requests: booking.specialRequests || "",
    accessibility_needs: booking.accessibilityNeeds || "",
    ...extras,
  };
}

function buildEmailLogMetadata(
  booking: Booking,
  templateInfo: { templateId?: string; templateSource?: string },
  extra: Record<string, unknown> = {}
) {
  return {
    bookingReference: booking.bookingReference,
    templateId: templateInfo.templateId,
    templateSource: templateInfo.templateSource,
    ...extra,
  };
}

async function resolveGuideEmail(guide: Guide) {
  if (guide.email) return guide.email;
  if (!guide.userId) return null;

  const user = await storage.getUser(guide.userId);
  return user?.email || null;
}

function getDisplayName(user?: Pick<User, "firstName" | "lastName" | "email"> | null) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return name || user?.email || "Visit Dzaleka user";
}

function formatMwk(amount?: number | null) {
  return new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

async function getInternalEmailRecipients(roles: UserRole[], routingKey?: typeof OPERATIONS_NOTIFICATION_KEYS[number]) {
  const roleSet = new Set(roles);
  const users = await storage.getUsers();
  const fallbackRecipients = users.filter(
    (user) => user.email
      && roleSet.has((user.role || "visitor") as UserRole)
      && user.emailNotifications !== false
  );

  if (!routingKey) {
    return fallbackRecipients;
  }

  const settings = getOperationsControlFromUsers(users);
  const route = settings.notifications[routingKey];
  if (!route) {
    return fallbackRecipients;
  }

  const routeRoleSet = new Set(route.roleRecipients);
  const routeUserSet = new Set(route.userRecipientIds);
  const routedRecipients = users.filter((user) =>
    user.email
    && user.emailNotifications !== false
    && user.isActive !== false
    && (routeRoleSet.has((user.role || "visitor") as UserRole) || routeUserSet.has(user.id))
  );

  return routedRecipients.length > 0 ? routedRecipients : fallbackRecipients;
}

async function sendLoggedTemplateEmail(options: {
  templateName: string;
  recipientName: string;
  recipientEmail: string;
  data: Record<string, string | number | null | undefined>;
  fallbackSubject: string;
  fallbackMessage: string;
  templateType?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sentBy?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const email = await sendAutomatedTemplateEmail({
    templateName: options.templateName,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    data: options.data,
    fallbackSubject: options.fallbackSubject,
    fallbackMessage: options.fallbackMessage,
    fallbackSend: () => sendCustomEmailDetailed({
      recipientName: options.recipientName,
      recipientEmail: options.recipientEmail,
      subject: options.fallbackSubject,
      message: options.fallbackMessage,
      senderName: "Visit Dzaleka Team",
    }),
  });

  await storage.createEmailLog({
    sentBy: options.sentBy || undefined,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    subject: email.subject,
    message: email.message,
    templateType: options.templateType || options.templateName,
    status: email.result.success ? "accepted" : "failed",
    errorMessage: email.result.error,
    providerMessageId: email.result.messageId,
    relatedEntityType: options.relatedEntityType,
    relatedEntityId: options.relatedEntityId,
    metadata: {
      templateId: email.templateId,
      templateSource: email.templateSource,
      ...options.metadata,
    },
  });

  return email.result;
}

async function sendBookingCancelledEmail(booking: Booking, reason = "Cancelled by staff", sentBy?: string | null) {
  const guide = await getAssignedGuide(booking);
  const meetingPoint = booking.meetingPointId ? await storage.getMeetingPoint(booking.meetingPointId) : null;
  const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "";
  const rescheduleLink = `${PUBLIC_APP_URL}/my-bookings`;

  const visitorResult = await sendLoggedTemplateEmail({
    templateName: "booking_cancelled",
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    data: buildBookingTemplateData(booking, {
      cancellation_reason: reason,
      reschedule_link: rescheduleLink,
      meeting_point: meetingPoint?.name,
      guide_name: guideName,
    }),
    fallbackSubject: `Booking cancelled - ${booking.bookingReference}`,
    fallbackMessage: [
      `Dear ${booking.visitorName},`,
      "",
      `Your Visit Dzaleka booking ${booking.bookingReference} has been cancelled.`,
      `Reason: ${reason}`,
      "",
      `Original date/time: ${booking.visitDate} at ${booking.visitTime}`,
      meetingPoint?.name ? `Meeting point: ${meetingPoint.name}` : "",
      "",
      `To request another time, visit ${rescheduleLink} or reply to this email.`,
      guideName ? `${guideName} has also been released from this assignment.` : "",
      "",
      "Best regards,",
      "Visit Dzaleka Team",
    ].filter(Boolean).join("\n"),
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    sentBy,
    metadata: { bookingReference: booking.bookingReference, reason },
  });

  if (guide) {
    const guideEmail = await resolveGuideEmail(guide);
    if (guideEmail) {
      await sendLoggedTemplateEmail({
        templateName: "booking_cancelled",
        recipientName: guideName,
        recipientEmail: guideEmail,
        data: buildBookingTemplateData(booking, {
          cancellation_reason: reason,
          reschedule_link: `${PUBLIC_APP_URL}/calendar`,
          meeting_point: meetingPoint?.name,
          guide_name: guideName,
        }),
        fallbackSubject: `Tour cancelled - ${booking.bookingReference}`,
        fallbackMessage: [
          `Hello ${guideName},`,
          "",
          `Booking ${booking.bookingReference} has been cancelled and you are released from this assignment.`,
          `Visitor: ${booking.visitorName}`,
          `Original date/time: ${booking.visitDate} at ${booking.visitTime}`,
          `Reason: ${reason}`,
          "",
          "No guide action is needed unless staff contact you.",
        ].join("\n"),
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        sentBy,
        metadata: { bookingReference: booking.bookingReference, reason, audience: "guide" },
      });
    }
  }

  return visitorResult;
}

async function sendPaymentReceiptEmail(booking: Booking, sentBy?: string | null) {
  return sendLoggedTemplateEmail({
    templateName: "payment_receipt",
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    data: buildBookingTemplateData(booking, {
      total_amount: formatMwk(booking.totalAmount || 0),
      payment_method: String(booking.paymentMethod || "cash").replace(/_/g, " "),
      payment_reference: booking.paymentReference || booking.bookingReference,
      paid_at: booking.paymentVerifiedAt ? new Date(booking.paymentVerifiedAt).toLocaleString() : new Date().toLocaleString(),
    }),
    fallbackSubject: `Payment receipt - ${booking.bookingReference}`,
    fallbackMessage: [
      `Dear ${booking.visitorName},`,
      "",
      `We have received payment for booking ${booking.bookingReference}.`,
      `Amount: ${formatMwk(booking.totalAmount || 0)}`,
      `Payment method: ${String(booking.paymentMethod || "cash").replace(/_/g, " ")}`,
      booking.paymentReference ? `Reference: ${booking.paymentReference}` : "",
      "",
      "Thank you for supporting Visit Dzaleka.",
    ].filter(Boolean).join("\n"),
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    sentBy,
    metadata: { bookingReference: booking.bookingReference },
  });
}

async function sendSupportTicketCreatedEmail(ticket: SupportTicket, user: User, sentBy?: string | null) {
  const supportLink = `${PUBLIC_APP_URL}/help`;
  return sendLoggedTemplateEmail({
    templateName: "support_ticket_created",
    recipientName: getDisplayName(user),
    recipientEmail: user.email!,
    data: {
      ticket_id: ticket.id,
      ticket_subject: ticket.subject,
      ticket_status: ticket.status || "open",
      support_link: supportLink,
    },
    fallbackSubject: `Support ticket received - ${ticket.subject}`,
    fallbackMessage: [
      `Hello ${getDisplayName(user)},`,
      "",
      "We received your support ticket and our team will review it.",
      `Subject: ${ticket.subject}`,
      `Status: ${ticket.status || "open"}`,
      "",
      `You can view your tickets here: ${supportLink}`,
    ].join("\n"),
    relatedEntityType: "support_ticket",
    relatedEntityId: ticket.id,
    sentBy,
  });
}

async function sendSupportTicketResolvedEmail(ticket: SupportTicket, user: User, sentBy?: string | null) {
  const supportLink = `${PUBLIC_APP_URL}/help`;
  return sendLoggedTemplateEmail({
    templateName: "support_ticket_resolved",
    recipientName: getDisplayName(user),
    recipientEmail: user.email!,
    data: {
      ticket_id: ticket.id,
      ticket_subject: ticket.subject,
      ticket_status: ticket.status || "resolved",
      admin_notes: ticket.adminNotes || "",
      support_link: supportLink,
    },
    fallbackSubject: `Support ticket resolved - ${ticket.subject}`,
    fallbackMessage: [
      `Hello ${getDisplayName(user)},`,
      "",
      `Your support ticket has been marked ${ticket.status || "resolved"}.`,
      `Subject: ${ticket.subject}`,
      ticket.adminNotes ? `Team note: ${ticket.adminNotes}` : "",
      "",
      `You can review it here: ${supportLink}`,
    ].filter(Boolean).join("\n"),
    relatedEntityType: "support_ticket",
    relatedEntityId: ticket.id,
    sentBy,
  });
}

async function sendIncidentAlertEmail(incident: Incident, reporterName: string, sentBy?: string | null) {
  const recipients = await getInternalEmailRecipients(["admin", "coordinator", "security"], "incident_alerts");
  await Promise.all(recipients.map((recipient) => sendLoggedTemplateEmail({
    templateName: "incident_alert",
    recipientName: getDisplayName(recipient),
    recipientEmail: recipient.email!,
    data: {
      incident_title: incident.title,
      incident_severity: incident.severity || "medium",
      incident_location: incident.location || "",
      incident_reporter: reporterName,
      admin_notes: incident.description,
      support_link: `${PUBLIC_APP_URL}/security`,
    },
    fallbackSubject: `Incident alert: ${incident.severity || "medium"} - ${incident.title}`,
    fallbackMessage: [
      `Incident severity: ${incident.severity || "medium"}`,
      `Title: ${incident.title}`,
      incident.location ? `Location: ${incident.location}` : "",
      `Reported by: ${reporterName}`,
      "",
      incident.description,
      "",
      `${PUBLIC_APP_URL}/security`,
    ].filter(Boolean).join("\n"),
    relatedEntityType: "incident",
    relatedEntityId: incident.id,
    sentBy,
  })));
}

async function sendLowRatingAlertEmail(booking: Booking, guideName: string, rating: number, sentBy?: string | null) {
  const recipients = await getInternalEmailRecipients(["admin", "coordinator"], "guide_reports");
  await Promise.all(recipients.map((recipient) => sendLoggedTemplateEmail({
    templateName: "low_rating_alert",
    recipientName: getDisplayName(recipient),
    recipientEmail: recipient.email!,
    data: buildBookingTemplateData(booking, {
      guide_name: guideName,
      rating,
      support_link: `${PUBLIC_APP_URL}/guide-performance`,
    }),
    fallbackSubject: `Low rating alert - ${guideName}`,
    fallbackMessage: [
      `${guideName} received a ${rating}/5 rating from ${booking.visitorName}.`,
      `Booking: ${booking.bookingReference}`,
      `Visit date: ${booking.visitDate}`,
      "",
      `${PUBLIC_APP_URL}/guide-performance`,
    ].join("\n"),
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    sentBy,
    metadata: { guideName, rating },
  })));
}

async function sendGuideAssignmentChangedEmails(
  booking: Booking,
  oldGuide: Guide | undefined,
  newGuide: Guide | undefined,
  meetingPointName?: string | null,
  sentBy?: string | null
) {
  const oldGuideName = oldGuide ? `${oldGuide.firstName} ${oldGuide.lastName}` : "";
  const newGuideName = newGuide ? `${newGuide.firstName} ${newGuide.lastName}` : "";

  await sendLoggedTemplateEmail({
    templateName: "guide_assignment_changed",
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    data: buildBookingTemplateData(booking, {
      old_guide_name: oldGuideName,
      new_guide_name: newGuideName,
      meeting_point: meetingPointName || "",
      assignment_change: "Your guide assignment changed",
    }),
    fallbackSubject: `Guide updated - ${booking.bookingReference}`,
    fallbackMessage: [
      `Dear ${booking.visitorName},`,
      "",
      `Your guide for booking ${booking.bookingReference} has changed.`,
      oldGuideName ? `Previous guide: ${oldGuideName}` : "",
      newGuideName ? `New guide: ${newGuideName}` : "",
      meetingPointName ? `Meeting point: ${meetingPointName}` : "",
      "",
      "Your date and time remain the same unless we have told you otherwise.",
    ].filter(Boolean).join("\n"),
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    sentBy,
    metadata: { oldGuideId: oldGuide?.id, newGuideId: newGuide?.id, audience: "visitor" },
  });

  if (oldGuide) {
    const oldGuideEmail = await resolveGuideEmail(oldGuide);
    if (oldGuideEmail) {
      await sendLoggedTemplateEmail({
        templateName: "guide_assignment_changed",
        recipientName: oldGuideName,
        recipientEmail: oldGuideEmail,
        data: buildBookingTemplateData(booking, {
          guide_name: oldGuideName,
          old_guide_name: oldGuideName,
          new_guide_name: newGuideName,
          meeting_point: meetingPointName || "",
          assignment_change: "You have been released from this tour",
        }),
        fallbackSubject: `Tour assignment released - ${booking.bookingReference}`,
        fallbackMessage: [
          `Hello ${oldGuideName},`,
          "",
          `You have been released from booking ${booking.bookingReference}.`,
          `Visitor: ${booking.visitorName}`,
          `Date/time: ${booking.visitDate} at ${booking.visitTime}`,
          "",
          "You no longer need to prepare for this assignment.",
        ].join("\n"),
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        sentBy,
        metadata: { oldGuideId: oldGuide.id, newGuideId: newGuide?.id, audience: "old_guide" },
      });
    }
  }
}

async function sendRecurringBookingGeneratedEmails(
  recurring: RecurringBooking,
  bookings: Booking[],
  sentBy?: string | null
) {
  if (bookings.length === 0) return;

  const generatedDates = bookings.map((booking) => `${booking.visitDate} ${booking.visitTime}`).join(", ");
  const recipients = await getInternalEmailRecipients(["admin", "coordinator"], "booking_updates");
  await Promise.all(recipients.map((recipient) => sendLoggedTemplateEmail({
    templateName: "recurring_booking_generated",
    recipientName: getDisplayName(recipient),
    recipientEmail: recipient.email!,
    data: {
      visitor_name: recurring.visitorName,
      visitor_email: recurring.visitorEmail,
      generated_count: bookings.length,
      generated_dates: generatedDates,
      support_link: `${PUBLIC_APP_URL}/recurring-bookings`,
    },
    fallbackSubject: `${bookings.length} recurring booking${bookings.length === 1 ? "" : "s"} generated`,
    fallbackMessage: [
      `${bookings.length} confirmed booking${bookings.length === 1 ? "" : "s"} were generated for ${recurring.visitorName}.`,
      `Schedule: ${recurring.frequency}`,
      `Dates: ${generatedDates}`,
      "",
      `${PUBLIC_APP_URL}/recurring-bookings`,
    ].join("\n"),
    relatedEntityType: "recurring_booking",
    relatedEntityId: recurring.id,
    sentBy,
  })));

  if (recurring.visitorEmail) {
    await sendLoggedTemplateEmail({
      templateName: "recurring_booking_generated",
      recipientName: recurring.visitorName,
      recipientEmail: recurring.visitorEmail,
      data: {
        visitor_name: recurring.visitorName,
        visitor_email: recurring.visitorEmail,
        generated_count: bookings.length,
        generated_dates: generatedDates,
        support_link: `${PUBLIC_APP_URL}/my-bookings`,
      },
      fallbackSubject: `Recurring Visit Dzaleka bookings confirmed`,
      fallbackMessage: [
        `Dear ${recurring.visitorName},`,
        "",
        `${bookings.length} upcoming Visit Dzaleka booking${bookings.length === 1 ? " has" : "s have"} been generated for your recurring schedule.`,
        `Dates: ${generatedDates}`,
        "",
        "Please reply if any of these dates need to change.",
      ].join("\n"),
      relatedEntityType: "recurring_booking",
      relatedEntityId: recurring.id,
      sentBy,
      metadata: { audience: "visitor_or_org" },
    });
  }
}

async function sendGuideTrainingReminderEmail(guide: Guide, sentBy?: string | null) {
  const guideEmail = await resolveGuideEmail(guide);
  if (!guideEmail) return null;

  const [stats, modules, progress] = await Promise.all([
    storage.getGuideTrainingStats(guide.id),
    storage.getTrainingModules(),
    storage.getGuideTrainingProgress(guide.id),
  ]);

  const completedModuleIds = new Set(
    progress
      .filter((item) => item.status === "completed")
      .map((item) => item.moduleId)
  );
  const incompleteModules = modules
    .filter((module) => module.isActive && module.isRequired && (module.targetAudience === "guide" || module.targetAudience === "both"))
    .filter((module) => !completedModuleIds.has(module.id))
    .map((module) => module.title)
    .join(", ");

  const guideName = `${guide.firstName} ${guide.lastName}`.trim();
  return sendLoggedTemplateEmail({
    templateName: "guide_training_reminder",
    recipientName: guideName,
    recipientEmail: guideEmail,
    data: {
      guide_name: guideName,
      training_percentage: stats.percentage,
      incomplete_modules: incompleteModules || "No required modules outstanding",
      support_link: `${PUBLIC_APP_URL}/guide-training`,
    },
    fallbackSubject: "Training reminder - Visit Dzaleka",
    fallbackMessage: [
      `Hello ${guideName},`,
      "",
      `Your required guide training is ${stats.percentage}% complete.`,
      incompleteModules ? `Please complete: ${incompleteModules}.` : "All required modules are complete.",
      "",
      `${PUBLIC_APP_URL}/guide-training`,
    ].join("\n"),
    relatedEntityType: "guide",
    relatedEntityId: guide.id,
    sentBy,
  });
}

async function sendWelcomeOrVerificationEmail(user: User, sentBy?: string | null) {
  if (!user.email) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await storage.setEmailVerificationToken(user.id, token, expires);
  const verificationLink = `${PUBLIC_APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  return sendLoggedTemplateEmail({
    templateName: "welcome_or_email_verification",
    recipientName: getDisplayName(user),
    recipientEmail: user.email,
    data: {
      visitor_name: getDisplayName(user),
      visitor_email: user.email,
      verification_link: verificationLink,
      support_link: `${PUBLIC_APP_URL}/help`,
    },
    fallbackSubject: "Welcome to Visit Dzaleka – Planning Your Visit",
    fallbackMessage: [
      `Hi ${getDisplayName(user)},`,
      "",
      "Thank you for signing up with Visit Dzaleka! We’re excited to share the stories, culture, and community of Dzaleka Refugee Camp with you.",
      "",
      "We’d love to hear if you’re planning a visit soon and help you make the most of your experience. From guided tours to community activities, we can tailor your visit to suit your interests.",
      "",
      "Feel free to reply to this email with your travel plans or any questions you have, and we’ll help you get started.",
      "",
      "Looking forward to welcoming you to Dzaleka!",
      "",
      "You can verify your account here:",
      verificationLink,
      "",
      "Kind regards,",
      "Bakari Mustafa",
      "Visit Dzaleka Team",
    ].join("\n"),
    relatedEntityType: "user",
    relatedEntityId: user.id,
    sentBy,
  });
}

async function sendBookingRescheduledEmail(booking: Booking, oldBooking: Booking, sentBy?: string | null) {
  const meetingPoint = booking.meetingPointId
    ? await storage.getMeetingPoint(booking.meetingPointId)
    : null;
  const guide = await getAssignedGuide(booking);
  const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "";
  const oldVisitTime = oldBooking.visitTime || "";
  const newVisitTime = booking.visitTime || "";

  const email = await sendAutomatedTemplateEmail({
    templateName: "booking_rescheduled",
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    data: buildBookingTemplateData(booking, {
      old_visit_date: oldBooking.visitDate,
      old_visit_time: oldVisitTime,
      new_visit_date: booking.visitDate,
      new_visit_time: newVisitTime,
      meeting_point: meetingPoint?.name,
      guide_name: guideName,
    }),
    fallbackSubject: `Booking Rescheduled - ${booking.bookingReference}`,
    fallbackMessage: [
      `Dear ${booking.visitorName},`,
      "",
      `Your Visit Dzaleka booking ${booking.bookingReference} has been rescheduled.`,
      "",
      `Previous date/time: ${oldBooking.visitDate} at ${oldVisitTime}`,
      `New date/time: ${booking.visitDate} at ${newVisitTime}`,
      meetingPoint?.name ? `Meeting point: ${meetingPoint.name}` : "",
      guideName ? `Guide: ${guideName}` : "",
      "",
      "If this new time does not work for you, please reply to this email as soon as possible.",
      "",
      "Best regards,",
      "Visit Dzaleka Team",
    ].filter(Boolean).join("\n"),
    fallbackSend: () => sendCustomEmailDetailed({
      recipientName: booking.visitorName,
      recipientEmail: booking.visitorEmail,
      subject: `Booking Rescheduled - ${booking.bookingReference}`,
      message: [
        `Your Visit Dzaleka booking ${booking.bookingReference} has been rescheduled.`,
        "",
        `Previous date/time: ${oldBooking.visitDate} at ${oldVisitTime}`,
        `New date/time: ${booking.visitDate} at ${newVisitTime}`,
        meetingPoint?.name ? `Meeting point: ${meetingPoint.name}` : "",
        guideName ? `Guide: ${guideName}` : "",
        "",
        "If this new time does not work for you, please reply to this email as soon as possible.",
      ].filter(Boolean).join("\n"),
      senderName: "Visit Dzaleka Team",
    }),
  });

  await storage.createEmailLog({
    sentBy: sentBy || undefined,
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    subject: email.subject,
    message: email.message,
    templateType: "booking_rescheduled",
    status: email.result.success ? "accepted" : "failed",
    errorMessage: email.result.error,
    providerMessageId: email.result.messageId,
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    metadata: buildEmailLogMetadata(booking, email, {
      oldVisitDate: oldBooking.visitDate,
      oldVisitTime,
      newVisitDate: booking.visitDate,
      newVisitTime,
    }),
  });

  if (guide) {
    const guideEmail = await resolveGuideEmail(guide);
    if (guideEmail) {
      await sendLoggedTemplateEmail({
        templateName: "booking_rescheduled",
        recipientName: guideName,
        recipientEmail: guideEmail,
        data: buildBookingTemplateData(booking, {
          old_visit_date: oldBooking.visitDate,
          old_visit_time: oldVisitTime,
          new_visit_date: booking.visitDate,
          new_visit_time: newVisitTime,
          meeting_point: meetingPoint?.name,
          guide_name: guideName,
        }),
        fallbackSubject: `Tour rescheduled - ${booking.bookingReference}`,
        fallbackMessage: [
          `Hello ${guideName},`,
          "",
          `A tour assigned to you has been rescheduled.`,
          `Visitor: ${booking.visitorName}`,
          `Previous date/time: ${oldBooking.visitDate} at ${oldVisitTime}`,
          `New date/time: ${booking.visitDate} at ${newVisitTime}`,
          meetingPoint?.name ? `Meeting point: ${meetingPoint.name}` : "",
          "",
          "Please review your tour schedule.",
        ].filter(Boolean).join("\n"),
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        sentBy,
        metadata: {
          bookingReference: booking.bookingReference,
          audience: "guide",
          oldVisitDate: oldBooking.visitDate,
          oldVisitTime,
          newVisitDate: booking.visitDate,
          newVisitTime,
        },
      });
    }
  }

  return email.result;
}

async function sendFeedbackRequestEmail(booking: Booking, sentBy?: string | null) {
  const guide = await getAssignedGuide(booking);
  const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "";
  const feedbackLink = buildFeedbackLink(booking);

  const email = await sendAutomatedTemplateEmail({
    templateName: "feedback_request",
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    data: buildBookingTemplateData(booking, {
      guide_name: guideName,
      feedback_link: feedbackLink,
    }),
    fallbackSubject: "How was your Visit Dzaleka experience?",
    fallbackMessage: [
      `Dear ${booking.visitorName},`,
      "",
      `Thank you for visiting Dzaleka Refugee Camp on ${booking.visitDate}.`,
      "",
      "We hope you had a meaningful experience. Your feedback helps us improve and support future visitors.",
      guideName ? `We would especially appreciate your thoughts about your guide, ${guideName}.` : "",
      "",
      `Share feedback: ${feedbackLink}`,
      "",
      "Warm regards,",
      "Visit Dzaleka Team",
    ].filter(Boolean).join("\n"),
    fallbackSend: () => sendCustomEmailDetailed({
      recipientName: booking.visitorName,
      recipientEmail: booking.visitorEmail,
      subject: "How was your Visit Dzaleka experience?",
      message: [
        `Thank you for visiting Dzaleka Refugee Camp on ${booking.visitDate}.`,
        "",
        "We hope you had a meaningful experience. Your feedback helps us improve and support future visitors.",
        guideName ? `We would especially appreciate your thoughts about your guide, ${guideName}.` : "",
        "",
        `Share feedback: ${feedbackLink}`,
      ].filter(Boolean).join("\n"),
      senderName: "Visit Dzaleka Team",
    }),
  });

  await storage.createEmailLog({
    sentBy: sentBy || undefined,
    recipientName: booking.visitorName,
    recipientEmail: booking.visitorEmail,
    subject: email.subject,
    message: email.message,
    templateType: "feedback_request",
    status: email.result.success ? "accepted" : "failed",
    errorMessage: email.result.error,
    providerMessageId: email.result.messageId,
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    metadata: buildEmailLogMetadata(booking, email, { feedbackLink }),
  });

  return email.result;
}

async function sendGuideTourAssignmentEmail(
  booking: Booking,
  guide: Guide,
  meetingPointName?: string | null,
  sentBy?: string | null
) {
  const guideEmail = await resolveGuideEmail(guide);
  if (!guideEmail) return null;

  const guideName = `${guide.firstName} ${guide.lastName}`;
  const email = await sendAutomatedTemplateEmail({
    templateName: "guide_tour_assignment",
    recipientName: guideName,
    recipientEmail: guideEmail,
    data: buildBookingTemplateData(booking, {
      guide_name: guideName,
      guide_phone: guide.phone,
      meeting_point: meetingPointName || "",
    }),
    fallbackSubject: `New Tour Assignment - ${booking.bookingReference}`,
    fallbackMessage: [
      `Hello ${guideName},`,
      "",
      "You have been assigned to a Visit Dzaleka tour.",
      "",
      `Reference: ${booking.bookingReference}`,
      `Visitor: ${booking.visitorName}`,
      `Date: ${booking.visitDate}`,
      `Time: ${booking.visitTime}`,
      `Group size: ${booking.numberOfPeople || 1}`,
      meetingPointName ? `Meeting point: ${meetingPointName}` : "",
      booking.specialRequests ? `Special requests: ${booking.specialRequests}` : "",
      booking.accessibilityNeeds ? `Accessibility needs: ${booking.accessibilityNeeds}` : "",
      "",
      "Please review the booking details before the tour.",
    ].filter(Boolean).join("\n"),
    fallbackSend: () => sendCustomEmailDetailed({
      recipientName: guideName,
      recipientEmail: guideEmail,
      subject: `New Tour Assignment - ${booking.bookingReference}`,
      message: [
        "You have been assigned to a Visit Dzaleka tour.",
        "",
        `Reference: ${booking.bookingReference}`,
        `Visitor: ${booking.visitorName}`,
        `Date: ${booking.visitDate}`,
        `Time: ${booking.visitTime}`,
        `Group size: ${booking.numberOfPeople || 1}`,
        meetingPointName ? `Meeting point: ${meetingPointName}` : "",
        booking.specialRequests ? `Special requests: ${booking.specialRequests}` : "",
        booking.accessibilityNeeds ? `Accessibility needs: ${booking.accessibilityNeeds}` : "",
        "",
        "Please review the booking details before the tour.",
      ].filter(Boolean).join("\n"),
      senderName: "Visit Dzaleka Team",
    }),
  });

  await storage.createEmailLog({
    sentBy: sentBy || undefined,
    recipientName: guideName,
    recipientEmail: guideEmail,
    subject: email.subject,
    message: email.message,
    templateType: "guide_tour_assignment",
    status: email.result.success ? "accepted" : "failed",
    errorMessage: email.result.error,
    providerMessageId: email.result.messageId,
    relatedEntityType: "booking",
    relatedEntityId: booking.id,
    metadata: buildEmailLogMetadata(booking, email, { guideId: guide.id, audience: "guide" }),
  });

  return email.result;
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSvixSecretBuffer(secret: string) {
  return secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : Buffer.from(secret, "utf8");
}

function hasMatchingSvixSignature(signatureHeader: string, expectedDigest: Buffer) {
  return signatureHeader.split(" ").some((signaturePart) => {
    const signature = signaturePart.includes(",")
      ? signaturePart.split(",")[1]
      : signaturePart.includes("=")
        ? signaturePart.split("=")[1]
        : signaturePart;
    if (!signature) return false;

    const actualDigest = Buffer.from(signature, "base64");
    return actualDigest.length === expectedDigest.length
      && crypto.timingSafeEqual(actualDigest, expectedDigest);
  });
}

function verifyResendWebhookSignature(req: Request, secret: string) {
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const svixId = getHeaderValue(req.headers["svix-id"]);
  const svixTimestamp = getHeaderValue(req.headers["svix-timestamp"]);
  const svixSignature = getHeaderValue(req.headers["svix-signature"]);

  if (!rawBody || !svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const timestampMs = Number(svixTimestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody.toString("utf8")}`;
  const expectedDigest = crypto
    .createHmac("sha256", getSvixSecretBuffer(secret))
    .update(signedPayload)
    .digest();

  return hasMatchingSvixSignature(svixSignature, expectedDigest);
}

// Auth schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const visitorPreferencesSchema = z.object({
  country: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  preferredLanguage: z.string().trim().max(80).optional().nullable(),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional().nullable(),
  accessibilityNeeds: z.string().trim().max(2000).optional().nullable(),
  dietaryNotes: z.string().trim().max(2000).optional().nullable(),
  emergencyContactName: z.string().trim().max(160).optional().nullable(),
  emergencyContactPhone: z.string().trim().max(80).optional().nullable(),
});

const visitorResourceProgressSchema = z.object({
  status: z.enum(["completed", "not_started"]).default("completed"),
});

const bookingMessageContactSchema = z.object({
  target: z.enum(["admin", "guide"]),
});

const communityHighlightsSchema = z.object({
  selectedCommunityListings: z.array(z.string().trim().min(1)).max(50).default([]),
});
const publicCommunityListingStatuses = ["approved", "live", "published"];
const normalizeCommunityListingStatus = (status?: string | null) =>
  publicCommunityListingStatuses.includes(String(status || "")) ? "approved" : status;
const isPublicCommunityListing = (listing: Pick<CommunityListing, "status">) =>
  publicCommunityListingStatuses.includes(String(listing.status || ""));

const VALID_USER_ROLES: UserRole[] = ["admin", "coordinator", "guide", "security", "visitor", "transport_partner"];
const OPERATIONS_WORKFLOW_KEYS = [
  "payments",
  "transport",
  "guide_profile_reviews",
  "tour_reports",
  "visitor_messages",
  "support_tickets",
] as const;
const OPERATIONS_NOTIFICATION_KEYS = [
  "booking_updates",
  "payment_updates",
  "transport_updates",
  "incident_alerts",
  "guide_reports",
  "support_tickets",
] as const;

const operationWorkflowDefinitions = [
  {
    key: "payments",
    label: "Payments",
    description: "Payment verification, reconciliation, and payment follow-up.",
    ownerRoles: ["admin", "coordinator"] as UserRole[],
    defaultEscalationHours: 24,
  },
  {
    key: "transport",
    label: "Transport",
    description: "Transport requests, quotes, partner assignment, and driver details.",
    ownerRoles: ["admin", "coordinator"] as UserRole[],
    defaultEscalationHours: 12,
  },
  {
    key: "guide_profile_reviews",
    label: "Guide profile reviews",
    description: "Approval queue for guide profile changes.",
    ownerRoles: ["admin", "coordinator"] as UserRole[],
    defaultEscalationHours: 48,
  },
  {
    key: "tour_reports",
    label: "Tour reports",
    description: "Guide post-tour reports and follow-up actions.",
    ownerRoles: ["admin", "coordinator"] as UserRole[],
    defaultEscalationHours: 48,
  },
  {
    key: "visitor_messages",
    label: "Visitor messages",
    description: "Booking-specific messages from visitors to Visit Dzaleka.",
    ownerRoles: ["admin"] as UserRole[],
    defaultEscalationHours: 8,
  },
  {
    key: "support_tickets",
    label: "Support tickets",
    description: "Help Center tickets and visitor support follow-up.",
    ownerRoles: ["admin", "coordinator"] as UserRole[],
    defaultEscalationHours: 24,
  },
] as const;

const approvalDefinitions = [
  { key: "pricing_changes", label: "Pricing changes", description: "Require explicit admin approval before tour pricing changes." },
  { key: "partner_deletion", label: "Deleting partners", description: "Require approval before transport partners are deleted or deactivated." },
  { key: "payment_mark_paid", label: "Marking payments paid", description: "Require approval before manually marking a booking as paid." },
  { key: "bulk_email_send", label: "Bulk email sends", description: "Require approval before sending bulk or role-wide email/notification messages." },
  { key: "webhook_changes", label: "Webhook changes", description: "Require approval before creating, disabling, or deleting outgoing webhooks." },
] as const;

const notificationDefinitions = [
  { key: "booking_updates", label: "Booking updates", defaultRoles: ["admin", "coordinator"] as UserRole[] },
  { key: "payment_updates", label: "Payment updates", defaultRoles: ["admin"] as UserRole[] },
  { key: "transport_updates", label: "Transport updates", defaultRoles: ["admin", "coordinator"] as UserRole[] },
  { key: "incident_alerts", label: "Incident alerts", defaultRoles: ["admin", "coordinator", "security"] as UserRole[] },
  { key: "guide_reports", label: "Guide reports", defaultRoles: ["admin", "coordinator"] as UserRole[] },
  { key: "support_tickets", label: "Support tickets", defaultRoles: ["admin"] as UserRole[] },
] as const;

const operationWorkflowSettingSchema = z.object({
  ownerUserId: z.string().trim().optional().nullable(),
  assignedToUserId: z.string().trim().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  internalStatus: z.enum(["active", "watching", "paused", "escalated"]).default("active"),
  escalationHours: z.coerce.number().int().min(1).max(720).default(24),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const operationsControlSettingsSchema = z.object({
  workflows: z.record(operationWorkflowSettingSchema).default({}),
  approvals: z.record(z.string(), z.boolean()).default({}),
  notifications: z.record(z.object({
    roleRecipients: z.array(z.enum(VALID_USER_ROLES as [UserRole, ...UserRole[]])).default([]),
    userRecipientIds: z.array(z.string().trim()).default([]),
  })).default({}),
});

const transportRequestPayloadSchema = z.object({
  transportRequested: z.boolean().optional(),
  transportRoute: z.string().trim().max(120).optional(),
  transportPartnerId: z.string().trim().max(120).optional(),
  transportPickup: z.string().trim().max(1000).optional(),
  transportNotes: z.string().trim().max(3000).optional(),
});

function buildPublicTransportPartnerProfile(partner?: TransportPartner | null) {
  if (!partner) return null;

  return {
    id: partner.id,
    companyName: partner.companyName,
    contactName: partner.contactName,
    email: partner.email,
    phone: partner.phone,
    whatsapp: partner.whatsapp,
    baseLocation: partner.baseLocation,
    preferredContactMethod: partner.preferredContactMethod,
    serviceAreas: partner.serviceAreas,
    publicNotes: partner.publicNotes,
  };
}

function buildVisitorTransportRequestSummary(request?: TransportRequest | null, partner?: TransportPartner | null) {
  if (!request) return null;

  return {
    id: request.id,
    bookingId: request.bookingId,
    partnerId: request.partnerId,
    route: request.route,
    pickupLocation: request.pickupLocation,
    notes: request.notes,
    status: request.status,
    quotedAmount: request.quotedAmount,
    currency: request.currency,
    quoteSentAt: request.quoteSentAt,
    quoteDecision: request.quoteDecision,
    quoteDecisionAt: request.quoteDecisionAt,
    quoteDecisionNotes: request.quoteDecisionNotes,
    estimatedPickupTime: request.estimatedPickupTime,
    requestedPickupTime: request.requestedPickupTime,
    requestedVisitDate: request.requestedVisitDate,
    rescheduleNotes: request.rescheduleNotes,
    driverName: request.driverName,
    driverPhone: request.driverPhone,
    vehicleDetails: request.vehicleDetails,
    partnerNotes: request.partnerNotes,
    cancellationReason: request.cancellationReason,
    cancelledAt: request.cancelledAt,
    partnerRespondedAt: request.partnerRespondedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    partner: buildPublicTransportPartnerProfile(partner),
  };
}

async function attachVisitorTransportSummaries<T extends Booking>(bookings: T[]) {
  if (bookings.length === 0) return bookings.map((booking) => ({ ...booking, transportRequest: null }));

  const transportRequests = await storage.getTransportRequestsByBookingIds(bookings.map((booking) => booking.id));
  const partnerIds = Array.from(new Set(
    transportRequests.map((request) => request.partnerId).filter(Boolean) as string[]
  ));
  const partners = partnerIds.length
    ? await Promise.all(partnerIds.map((partnerId) => storage.getTransportPartner(partnerId)))
    : [];
  const partnerMap = new Map(
    partners
      .filter(Boolean)
      .map((partner) => [partner!.id, partner!])
  );

  return bookings.map((booking) => {
    const transportRequest = transportRequests
      .filter((request) => request.bookingId === booking.id)
      .sort((a, b) => dateSortValue(b.updatedAt || b.createdAt) - dateSortValue(a.updatedAt || a.createdAt))[0] || null;
    const partner = transportRequest?.partnerId
      ? partnerMap.get(transportRequest.partnerId) || null
      : null;

    return {
      ...booking,
      transportRequest: buildVisitorTransportRequestSummary(transportRequest, partner),
    };
  });
}

function getUserPreferences(user?: Pick<User, "preferences"> | null): Record<string, any> {
  return user?.preferences && typeof user.preferences === "object" && !Array.isArray(user.preferences)
    ? user.preferences as Record<string, any>
    : {};
}

type OperationsControlSettings = z.infer<typeof operationsControlSettingsSchema>;

function buildDefaultOperationsControlSettings(users: User[] = []): OperationsControlSettings {
  const activeAdmins = users.filter((user) => user.role === "admin" && user.isActive !== false);
  const activeOperators = users.filter((user) => (user.role === "admin" || user.role === "coordinator") && user.isActive !== false);
  const visitorMessageOwner = activeAdmins.find((user) => getUserPreferences(user).visitorMessageOwner === true) || activeAdmins[0];
  const defaultOperator = activeOperators[0] || visitorMessageOwner;

  return {
    workflows: Object.fromEntries(operationWorkflowDefinitions.map((definition) => {
      const owner = definition.key === "visitor_messages" ? visitorMessageOwner : defaultOperator;
      return [
        definition.key,
        {
          ownerUserId: owner?.id || null,
          assignedToUserId: null,
          priority: definition.key === "transport" || definition.key === "visitor_messages" ? "high" : "normal",
          internalStatus: "active",
          escalationHours: definition.defaultEscalationHours,
          notes: "",
        },
      ];
    })) as OperationsControlSettings["workflows"],
    approvals: Object.fromEntries(approvalDefinitions.map((definition) => [definition.key, true])),
    notifications: Object.fromEntries(notificationDefinitions.map((definition) => [
      definition.key,
      {
        roleRecipients: definition.defaultRoles,
        userRecipientIds: [],
      },
    ])) as OperationsControlSettings["notifications"],
  };
}

function getOperationsControlFromUsers(users: User[] = []) {
  const stored = users
    .map((user) => getUserPreferences(user).operationsControl)
    .find((value) => value && typeof value === "object" && !Array.isArray(value));

  return normalizeOperationsControlSettings(stored, users);
}

function normalizeOperationsControlSettings(raw: unknown, users: User[] = []): OperationsControlSettings {
  const defaults = buildDefaultOperationsControlSettings(users);
  const parsed = operationsControlSettingsSchema.safeParse(raw || {});
  const settings = parsed.success ? parsed.data : { workflows: {}, approvals: {}, notifications: {} };
  const usersById = new Map(users.map((user) => [user.id, user]));

  const workflows = { ...defaults.workflows };
  for (const definition of operationWorkflowDefinitions) {
    const incoming = settings.workflows?.[definition.key];
    if (!incoming) continue;

    const owner = incoming.ownerUserId ? usersById.get(incoming.ownerUserId) : null;
    const assigned = incoming.assignedToUserId ? usersById.get(incoming.assignedToUserId) : null;
    workflows[definition.key] = {
      ...defaults.workflows[definition.key],
      ...incoming,
      ownerUserId: owner && definition.ownerRoles.includes((owner.role || "visitor") as UserRole) && owner.isActive !== false
        ? owner.id
        : defaults.workflows[definition.key]?.ownerUserId || null,
      assignedToUserId: assigned && definition.ownerRoles.includes((assigned.role || "visitor") as UserRole) && assigned.isActive !== false
        ? assigned.id
        : null,
      notes: incoming.notes || "",
    };
  }

  const approvals = { ...defaults.approvals };
  for (const definition of approvalDefinitions) {
    if (settings.approvals?.[definition.key] !== undefined) {
      approvals[definition.key] = Boolean(settings.approvals[definition.key]);
    }
  }

  const notifications = { ...defaults.notifications };
  for (const definition of notificationDefinitions) {
    const incoming = settings.notifications?.[definition.key];
    if (!incoming) continue;
    notifications[definition.key] = {
      roleRecipients: incoming.roleRecipients.filter((role) => VALID_USER_ROLES.includes(role)),
      userRecipientIds: incoming.userRecipientIds.filter((userId) => {
        const user = usersById.get(userId);
        return Boolean(user?.email && user.isActive !== false);
      }),
    };
  }

  return { workflows, approvals, notifications };
}

function buildOperationsUserSummary(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profileImageUrl: user.profileImageUrl,
  };
}

async function getOperationsQueueSummary() {
  const [
    bookings,
    transportRequests,
    guideProfileRequests,
    tourReports,
    supportTickets,
  ] = await Promise.all([
    storage.getBookings(),
    storage.getTransportRequests(),
    storage.getGuideProfileChangeRequests("pending"),
    storage.getGuideTourReports(),
    storage.getSupportTickets(),
  ]);

  return {
    payments: {
      openCount: bookings.filter((booking) => booking.status !== "cancelled" && booking.paymentStatus !== "paid").length,
      urgentCount: bookings.filter((booking) => booking.status === "confirmed" && booking.paymentStatus !== "paid").length,
      label: "unpaid bookings",
    },
    transport: {
      openCount: transportRequests.filter((request) => !["completed", "cancelled", "declined"].includes(request.status || "")).length,
      urgentCount: transportRequests.filter((request) => ["pending", "assigned", "quoted"].includes(request.status || "")).length,
      label: "active transport requests",
    },
    guide_profile_reviews: {
      openCount: guideProfileRequests.length,
      urgentCount: guideProfileRequests.length,
      label: "pending profile changes",
    },
    tour_reports: {
      openCount: tourReports.filter((report) => report.status === "submitted").length,
      urgentCount: tourReports.filter((report) => report.status === "submitted" && report.followUpNeeded).length,
      label: "submitted reports",
    },
    visitor_messages: {
      openCount: 0,
      urgentCount: 0,
      label: "routing rule",
    },
    support_tickets: {
      openCount: supportTickets.filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed").length,
      urgentCount: supportTickets.filter((ticket) => ticket.priority === "high" || ticket.priority === "urgent").length,
      label: "open tickets",
    },
  };
}

type ApprovalKey = typeof approvalDefinitions[number]["key"];

async function requireOperationApproval(req: Request, res: Response, key: ApprovalKey, label: string) {
  const users = await storage.getUsers();
  const settings = getOperationsControlFromUsers(users);
  const approvalRequired = settings.approvals[key] !== false;
  const approvalConfirmed = req.body?.approvalConfirmed === true
    || req.body?.approvalConfirmed === "true"
    || req.query.approvalConfirmed === "true";

  if (approvalRequired && !approvalConfirmed) {
    res.status(409).json({
      message: `${label} requires approval confirmation in Operations Control.`,
      approvalRequired: true,
      approvalKey: key,
    });
    return false;
  }

  return true;
}

function buildAssignedGuideSummary(guide?: Guide | null) {
  if (!guide) return null;

  return {
    id: guide.id,
    firstName: guide.firstName,
    lastName: guide.lastName,
    phone: guide.phone,
    profileImageUrl: guide.profileImageUrl,
    languages: guide.languages,
    bio: guide.bio,
    specialties: guide.specialties,
    rating: guide.rating,
    userId: guide.userId,
  };
}

function buildSafeBookingForRole(booking: Booking, role?: UserRole | null) {
  const guideDeliveryFields = {
    id: booking.id,
    bookingReference: booking.bookingReference,
    source: booking.source,
    visitorName: booking.visitorName,
    visitDate: booking.visitDate,
    visitTime: booking.visitTime,
    groupSize: booking.groupSize,
    numberOfPeople: booking.numberOfPeople,
    tourType: booking.tourType,
    customDuration: booking.customDuration,
    meetingPointId: booking.meetingPointId,
    status: booking.status,
    selectedZones: booking.selectedZones,
    selectedInterests: booking.selectedInterests,
    selectedCommunityListings: booking.selectedCommunityListings,
    specialRequests: booking.specialRequests,
    accessibilityNeeds: booking.accessibilityNeeds,
    assignedGuideId: booking.assignedGuideId,
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
    visitorRating: booking.visitorRating,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };

  const shared = {
    ...guideDeliveryFields,
    visitorEmail: booking.visitorEmail,
    visitorPhone: booking.visitorPhone,
    visitorCountry: booking.visitorCountry,
    visitorUserId: booking.visitorUserId,
    paymentStatus: booking.paymentStatus,
    cancellationCategory: booking.cancellationCategory,
    cancellationReason: booking.cancellationReason,
    cancellationNote: booking.cancellationNote,
    cancelledAt: booking.cancelledAt,
    referralSource: booking.referralSource,
    visitorOrganization: booking.visitorOrganization,
    recurringBookingId: booking.recurringBookingId,
  };

  if (role === "visitor") {
    return {
      ...shared,
      paymentMethod: booking.paymentMethod,
      paymentReference: booking.paymentReference,
      totalAmount: booking.totalAmount,
    };
  }

  if (role === "guide") {
    return guideDeliveryFields;
  }

  return booking;
}

const transportPartnerPayloadSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(180),
  contactName: z.string().trim().max(160).optional().nullable(),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().max(80).optional().nullable(),
  whatsapp: z.string().trim().max(80).optional().nullable(),
  baseLocation: z.string().trim().max(160).optional().nullable(),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).default("whatsapp"),
  serviceAreas: z.array(z.string().trim().min(1).max(80)).default([]),
  paymentTerms: z.string().trim().max(3000).optional().nullable(),
  publicNotes: z.string().trim().max(3000).optional().nullable(),
  internalNotes: z.string().trim().max(3000).optional().nullable(),
  defaultCurrency: z.string().trim().max(8).default("MWK"),
  pricingNotes: z.string().trim().max(3000).optional().nullable(),
  status: z.enum(["active", "paused", "inactive"]).default("active"),
  notes: z.string().trim().max(3000).optional().nullable(),
});

const transportPartnerSelfUpdateSchema = transportPartnerPayloadSchema
  .pick({
    companyName: true,
    contactName: true,
    phone: true,
    whatsapp: true,
    baseLocation: true,
    preferredContactMethod: true,
    serviceAreas: true,
    publicNotes: true,
    notes: true,
  })
  .partial();

const transportRequestUpdateSchema = z.object({
  partnerId: z.string().trim().max(120).nullable().optional(),
  route: z.string().trim().max(120).optional(),
  pickupLocation: z.string().trim().max(1000).nullable().optional(),
  notes: z.string().trim().max(3000).nullable().optional(),
  status: z.enum(["pending", "sent_to_partner", "quote_sent", "accepted", "visitor_approved", "visitor_declined", "confirmed", "reschedule_requested", "completed", "cancelled"]).optional(),
  quotedAmount: z.coerce.number().int().min(0).max(100000000).nullable().optional(),
  currency: z.string().trim().max(8).optional(),
  estimatedPickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Pickup time must use HH:mm").nullable().optional(),
  requestedPickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Pickup time must use HH:mm").nullable().optional(),
  requestedVisitDate: z.string().nullable().optional(),
  rescheduleNotes: z.string().trim().max(3000).nullable().optional(),
  driverId: z.string().trim().max(120).nullable().optional(),
  vehicleId: z.string().trim().max(120).nullable().optional(),
  driverName: z.string().trim().max(160).nullable().optional(),
  driverPhone: z.string().trim().max(80).nullable().optional(),
  vehicleDetails: z.string().trim().max(1000).nullable().optional(),
  partnerNotes: z.string().trim().max(3000).nullable().optional(),
  adminNotes: z.string().trim().max(3000).nullable().optional(),
  cancellationReason: z.string().trim().max(3000).nullable().optional(),
});

const transportPartnerRequestUpdateSchema = z.object({
  status: z.enum(["sent_to_partner", "quote_sent", "declined", "reschedule_requested"]).optional(),
  quotedAmount: z.coerce.number().int().min(0).max(100000000).nullable().optional(),
  currency: z.string().trim().max(8).optional(),
  requestedPickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Pickup time must use HH:mm").nullable().optional(),
  requestedVisitDate: z.string().nullable().optional(),
  rescheduleNotes: z.string().trim().max(3000).nullable().optional(),
  driverId: z.string().trim().max(120).nullable().optional(),
  vehicleId: z.string().trim().max(120).nullable().optional(),
  driverName: z.string().trim().max(160).nullable().optional(),
  driverPhone: z.string().trim().max(80).nullable().optional(),
  vehicleDetails: z.string().trim().max(1000).nullable().optional(),
  partnerNotes: z.string().trim().max(3000).nullable().optional(),
  cancellationReason: z.string().trim().max(3000).nullable().optional(),
});

const transportPartnerPricingSchema = z.object({
  partnerId: z.string().trim().max(120).optional(),
  route: z.string().trim().min(1, "Route is required").max(120),
  label: z.string().trim().min(1, "Label is required").max(160),
  basePrice: z.coerce.number().int().min(0).max(100000000),
  currency: z.string().trim().max(8).default("MWK"),
  pricingType: z.enum(["per_trip", "per_person", "per_day", "custom"]).default("per_trip"),
  priceIncludes: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const legacyTransportRouteIds: Record<string, string> = {
  lilongwe_dzaleka: "lilongwe-dzaleka",
  airport_dzaleka: "airport-dzaleka",
  lilongwe_dzaleka_lake_malawi: "lilongwe-dzaleka-lake-malawi",
  custom: "custom-route",
  custom_route: "custom-route",
};

function normalizeTransportRouteId(route: string | null | undefined) {
  const routeId = (route || "").trim();
  return legacyTransportRouteIds[routeId] || routeId;
}

const transportRosterDriverSchema = z.object({
  partnerId: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1, "Driver name is required").max(160),
  phone: z.string().trim().max(80).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  licenseNumber: z.string().trim().max(120).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const transportRosterVehicleSchema = z.object({
  partnerId: z.string().trim().max(120).optional(),
  label: z.string().trim().min(1, "Vehicle label is required").max(160),
  vehicleType: z.string().trim().max(120).optional().nullable(),
  plateNumber: z.string().trim().max(80).optional().nullable(),
  capacity: z.coerce.number().int().min(1).max(100).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const transportBlackoutBaseSchema = z.object({
  partnerId: z.string().trim().max(120).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["active", "cancelled"]).default("active"),
});

const transportBlackoutSchema = transportBlackoutBaseSchema.superRefine((data, ctx) => {
  if (new Date(data.endDate) < new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be on or after start date",
    });
  }
});

const quoteDecisionSchema = z.object({
  decision: z.enum(["approved", "declined"]),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const publicQuoteDecisionSchema = quoteDecisionSchema.extend({
  confirmationEmail: z.string().trim().email("Enter the email used for this transport request"),
});

const scheduledReportPayloadSchema = z.object({
  name: z.string().trim().min(2, "Report name is required").max(160),
  type: z.enum(["visitors", "revenue", "incidents"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.string().trim().min(3, "At least one recipient is required").max(2000)
    .refine((value) => value.split(",").every((email) => z.string().email().safeParse(email.trim()).success), {
      message: "Recipients must be valid comma-separated email addresses",
    }),
  nextRunAt: z.coerce.date(),
  status: z.enum(["active", "paused"]).default("active"),
});

const webhookEventNames = ["booking.created", "booking.updated", "incident.reported"] as const;

const webhookEndpointPayloadSchema = z.object({
  description: z.string().trim().min(2, "Description is required").max(180),
  url: z.string().trim().url("Use a valid endpoint URL").max(2000)
    .refine((value) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, {
      message: "Webhook URL must use HTTP or HTTPS",
    }),
  events: z.array(z.enum(webhookEventNames)).min(1, "Choose at least one event"),
  secret: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().min(12, "Secret must be at least 12 characters").max(255).nullable().optional(),
  ),
  status: z.enum(["active", "failing", "disabled"]).default("active"),
});

function redactWebhookSecret<T extends object | null | undefined>(endpoint: T) {
  if (!endpoint) {
    return endpoint;
  }
  const record = endpoint as Record<string, unknown>;

  return {
    ...endpoint,
    secret: record.secret ? "[set]" : null,
  };
}

const partnerReferralSchema = z.object({
  visitorName: z.string().trim().min(1, "Visitor name is required").max(160),
  visitorEmail: z.string().trim().email("Valid email is required"),
  visitorPhone: z.string().trim().max(80).optional().default(""),
  visitDate: z.string().min(1, "Visit date is required"),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/, "Visit time must use HH:mm"),
  groupSize: z.enum(["individual", "small_group", "large_group", "custom"]).default("individual"),
  numberOfPeople: z.coerce.number().int().min(1).max(500).default(1),
  tourType: z.enum(["standard", "extended", "custom"]).default("standard"),
  notes: z.string().trim().max(3000).optional().default(""),
});

const partnerReferralStatusSchema = z.object({
  status: z.enum(["submitted", "contacted", "booked", "completed", "cancelled"]),
});

const partnerReferralUpdateSchema = z.object({
  status: z.enum(["submitted", "contacted", "booked", "completed", "cancelled"]).optional(),
});

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedProfileImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const profileImageUploadSchema = z.object({
  purpose: z.enum(["user_avatar", "guide_profile"]).default("user_avatar"),
  fileName: z.string().trim().max(255).optional(),
  contentType: z.string().trim().max(80),
  size: z.coerce.number().int().min(1).max(MAX_PROFILE_IMAGE_BYTES),
  dataUrl: z.string().max(8_000_000),
});

const optionalUrlField = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().trim().url().max(1000).nullable().optional(),
);

const guideSelfProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  email: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().email().max(255).nullable().optional(),
  ),
  phone: z.string().trim().min(1).max(80).optional(),
  profileImageUrl: optionalUrlField,
  bio: z.string().trim().max(2000).nullable().optional(),
  languages: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  specialties: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  availableDays: z.array(z.string().trim().min(1).max(40)).max(7).optional(),
  preferredTimes: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
});

const guideProfileReviewDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(3000).optional().nullable(),
});

const visitorRescheduleRequestSchema = z.object({
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().trim().max(3000).optional().nullable(),
});

const guideTourReportSchema = z.object({
  summary: z.string().trim().min(10, "Summary is required").max(5000),
  visitorNeeds: z.string().trim().max(3000).optional().nullable(),
  incidents: z.string().trim().max(3000).optional().nullable(),
  followUpNeeded: z.boolean().default(false),
  privateNotes: z.string().trim().max(3000).optional().nullable(),
});

const guideTourReportReviewSchema = z.object({
  status: z.enum(["reviewed", "action_required"]),
  notes: z.string().trim().max(3000).optional().nullable(),
});

function uniqueStringList(values?: string[]) {
  if (!values) return undefined;
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

const guideProfileEditableFields: Array<keyof Guide> = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "profileImageUrl",
  "bio",
  "languages",
  "specialties",
  "availableDays",
  "preferredTimes",
];

function buildGuideProfileSnapshot(guide: Guide) {
  return Object.fromEntries(
    guideProfileEditableFields.map((field) => [field, (guide as any)[field] ?? null])
  );
}

function extractApprovedGuideProfileUpdates(request: GuideProfileChangeRequest) {
  const proposedData = request.proposedData && typeof request.proposedData === "object"
    ? request.proposedData as Record<string, unknown>
    : {};
  const updates: Partial<Guide> = {};

  for (const field of guideProfileEditableFields) {
    if (Object.prototype.hasOwnProperty.call(proposedData, field)) {
      (updates as any)[field] = proposedData[field];
    }
  }

  return updates;
}

async function enrichGuideProfileChangeRequest(request: GuideProfileChangeRequest) {
  const [guide, submittedBy, reviewedBy] = await Promise.all([
    storage.getGuide(request.guideId),
    request.submittedByUserId ? storage.getUser(request.submittedByUserId) : Promise.resolve(undefined),
    request.reviewedByUserId ? storage.getUser(request.reviewedByUserId) : Promise.resolve(undefined),
  ]);

  return {
    ...request,
    guide: guide
      ? {
          id: guide.id,
          firstName: guide.firstName,
          lastName: guide.lastName,
          email: guide.email,
          phone: guide.phone,
          profileImageUrl: guide.profileImageUrl,
        }
      : null,
    submittedBy: submittedBy
      ? {
          id: submittedBy.id,
          firstName: submittedBy.firstName,
          lastName: submittedBy.lastName,
          email: submittedBy.email,
        }
      : null,
    reviewedBy: reviewedBy
      ? {
          id: reviewedBy.id,
          firstName: reviewedBy.firstName,
          lastName: reviewedBy.lastName,
          email: reviewedBy.email,
        }
      : null,
  };
}

async function enrichGuideTourReport(report: GuideTourReport) {
  const [guide, booking, reviewedBy] = await Promise.all([
    storage.getGuide(report.guideId),
    storage.getBooking(report.bookingId),
    report.reviewedByUserId ? storage.getUser(report.reviewedByUserId) : Promise.resolve(undefined),
  ]);

  return {
    ...report,
    guide: guide
      ? {
          id: guide.id,
          firstName: guide.firstName,
          lastName: guide.lastName,
          phone: guide.phone,
          email: guide.email,
        }
      : null,
    booking: booking
      ? {
          id: booking.id,
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          status: booking.status,
        }
      : null,
    reviewedBy: reviewedBy
      ? {
          id: reviewedBy.id,
          firstName: reviewedBy.firstName,
          lastName: reviewedBy.lastName,
          email: reviewedBy.email,
        }
      : null,
  };
}

function parseProfileImageDataUrl(dataUrl: string, contentType: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  const dataUrlContentType = match[1].toLowerCase();
  if (dataUrlContentType !== contentType.toLowerCase()) {
    throw new Error("Image content type mismatch");
  }

  return Buffer.from(match[2].replace(/\s/g, ""), "base64");
}

function hasApiKeyAuthorization(req: Request) {
  return req.headers.authorization?.startsWith("Bearer dvz_") === true;
}

// Browser/session authentication only. API keys must be enabled explicitly
// through authenticateSessionOrApiKey(...) with route-specific scopes.
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}

function authenticateSessionOrApiKey(...requiredScopes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userId) {
      return next();
    }

    if (!hasApiKeyAuthorization(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await verifyApiKey(req, requiredScopes);
    if (result.ok) {
      (req as any).currentUser = result.user;
      (req as any).apiKey = result.apiKey;
      return next();
    }

    return res.status(result.status).json({
      error: result.code,
      message: result.message,
    });
  };
}

function authenticateApiKeyIfPresent(...requiredScopes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!hasApiKeyAuthorization(req)) return next();

    const result = await verifyApiKey(req, requiredScopes);
    if (result.ok) {
      (req as any).currentUser = result.user;
      (req as any).apiKey = result.apiKey;
      return next();
    }

    return res.status(result.status).json({
      error: result.code,
      message: result.message,
    });
  };
}

// Admin role middleware (with DB fallback for old sessions)
async function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Check session first
  if (req.session?.userRole === "admin") {
    return next();
  }

  // Fallback: fetch from DB if session doesn't have role
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user?.role === "admin") {
        // Update session with role for future requests
        req.session.userRole = user.role;
        return next();
      }
    } catch (error) {
      logError("Error checking admin role", error, req.requestId);
    }
  }

  res.status(403).json({ message: "Admin access required" });
}

// Pricing calculation helper - fetches from database
type PricingMap = Record<string, { basePrice: number; additionalHourPrice: number }>;

async function getPricingMap(): Promise<PricingMap> {
  const configs = await storage.getPricingConfigs();
  const map: PricingMap = {};
  for (const config of configs) {
    map[config.groupSize] = {
      basePrice: config.basePrice,
      additionalHourPrice: config.additionalHourPrice ?? 10000,
    };
  }
  return map;
}

// Default fallback prices if database is empty
const DEFAULT_PRICING: PricingMap = {
  individual: { basePrice: 15000, additionalHourPrice: 10000 },
  small_group: { basePrice: 50000, additionalHourPrice: 10000 },
  large_group: { basePrice: 80000, additionalHourPrice: 10000 },
  custom: { basePrice: 100000, additionalHourPrice: 10000 },
};

async function calculateTotalAmount(groupSize: string, tourType: string, customDuration?: number): Promise<number> {
  const pricingMap = await getPricingMap();
  const pricing = pricingMap[groupSize] || DEFAULT_PRICING[groupSize] || DEFAULT_PRICING.individual;
  const basePrice = pricing.basePrice;
  const additionalHourPrice = pricing.additionalHourPrice;

  if (tourType === "extended") {
    return basePrice + additionalHourPrice * 2;
  } else if (tourType === "custom" && customDuration) {
    const extraHours = Math.max(0, customDuration - 2);
    return basePrice + additionalHourPrice * extraHours;
  }

  return basePrice;
}

const specialOfferFieldsSchema = z.object({
  name: z.string().trim().min(2, "Offer name is required"),
  description: z.string().trim().optional().nullable(),
  offerType: z.enum(["standard", "early_bird", "last_minute"]).default("standard"),
  discountPercent: z.coerce.number().int().min(1).max(90),
  activityStartDate: z.string().min(1),
  activityEndDate: z.string().min(1),
  bookingNoticeDays: z.coerce.number().int().min(0).nullable().optional(),
  discountedSeats: z.coerce.number().int().min(1).nullable().optional(),
  tourTypes: z.array(z.enum(["standard", "extended", "custom"])).default([]),
  groupSizes: z.array(z.enum(["individual", "small_group", "large_group", "custom"])).default([]),
  weekdays: z.array(z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"])).default([]),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

const specialOfferRequestSchema = specialOfferFieldsSchema.superRefine((data, ctx) => {
  if (new Date(data.activityEndDate) < new Date(data.activityStartDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["activityEndDate"],
      message: "End date must be on or after the start date",
    });
  }
  if ((data.offerType === "early_bird" || data.offerType === "last_minute") && data.bookingNoticeDays == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bookingNoticeDays"],
      message: "Booking notice days are required for early-bird and last-minute offers",
    });
  }
});

const specialOfferUpdateSchema = specialOfferFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.activityStartDate && data.activityEndDate && new Date(data.activityEndDate) < new Date(data.activityStartDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["activityEndDate"],
      message: "End date must be on or after the start date",
    });
  }
});

function applySpecialOfferAmount(baseAmount: number, offer?: SpecialOffer) {
  if (!offer) {
    return { totalAmount: baseAmount, discountAmount: 0 };
  }
  const discountAmount = Math.round(baseAmount * ((offer.discountPercent || 0) / 100));
  return {
    totalAmount: Math.max(0, baseAmount - discountAmount),
    discountAmount,
  };
}

// Role-based access control middleware (session-based)
function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = (req as any).currentUser as User | undefined;
    if (currentUser) {
      if (!currentUser.role) {
        return res.status(403).json({ message: "Access denied - no role assigned" });
      }
      if (!allowedRoles.includes(currentUser.role as UserRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      (req as any).userRole = currentUser.role;
      return next();
    }

    const userId = req.session?.userId;

    // Early return if not authenticated - this prevents 500 errors
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        // Session exists but user not found - clear invalid session
        return res.status(401).json({ message: "Session expired" });
      }

      if (!user.role) {
        return res.status(403).json({ message: "Access denied - no role assigned" });
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      (req as any).userRole = user.role;
      (req as any).currentUser = user;
      next();
    } catch (error) {
      logError("Role check error", error, req.requestId);
      res.status(500).json({ message: "Authorization error" });
    }
  };
}

function requireActivePartnerIfPartner() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getRequestUser(req);
      if (user && user.role === "transport_partner") {
        const partner = await storage.getTransportPartnerByUserId(user.id);
        if (!partner || partner.status !== "active") {
          return res.status(403).json({ message: "Transport partner account is inactive or pending approval." });
        }
      }
      next();
    } catch (error) {
      logError("Active partner check error", error, req.requestId);
      res.status(500).json({ message: "Authorization error" });
    }
  };
}

function isClosedRequestForPartner(status: string): boolean {
  return ["completed", "cancelled", "visitor_declined", "declined"].includes(status);
}

function isValidTransitionForPartner(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true;
  const partnerTargetStatuses = ["sent_to_partner", "quote_sent", "declined", "reschedule_requested"];
  if (!partnerTargetStatuses.includes(newStatus)) return false;
  const terminalOrControlledStatuses = ["accepted", "visitor_approved", "visitor_declined", "confirmed", "completed", "cancelled", "declined"];
  if (terminalOrControlledStatuses.includes(currentStatus)) return false;
  return true;
}

type TaskAccessResult =
  | { status: 200; task: Task; user: User }
  | { status: 403 }
  | { status: 404 };

async function getRequestUser(req: Request): Promise<User | undefined> {
  const currentUser = (req as any).currentUser as User | undefined;
  if (currentUser) return currentUser;
  return req.session?.userId ? storage.getUser(req.session.userId) : undefined;
}

async function requireTaskAccess(taskId: string, userId?: string | null): Promise<TaskAccessResult> {
  if (!userId) return { status: 404 };

  const [task, user] = await Promise.all([
    storage.getTask(taskId),
    storage.getUser(userId),
  ]);

  if (!task || !user) return { status: 404 };

  const canAccess =
    user.role === "admin" ||
    user.role === "coordinator" ||
    task.assignedTo === userId ||
    task.assignedBy === userId;

  return canAccess ? { status: 200, task, user } : { status: 403 };
}

function sendTaskAccessError(res: Response, access: Exclude<TaskAccessResult, { status: 200 }>) {
  if (access.status === 404) {
    return res.status(404).json({ message: "Task not found" });
  }
  return res.status(403).json({ message: "You do not have access to this task" });
}

async function requireGuideOwnerOrStaff(req: Request, guideId: string) {
  const user = await getRequestUser(req);
  if (!user) return false;
  if (user.role === "admin" || user.role === "coordinator") return true;
  if (user.role !== "guide") return false;
  const guide = await storage.getGuideByUserId(user.id);
  return guide?.id === guideId;
}

async function getBookingsForCalendarFeed(calendar: { feedOwnerUserId?: string | null; feedAudience?: string | null }) {
  const bookings = await storage.getBookings();
  if (!calendar.feedOwnerUserId) {
    return [];
  }

  const owner = await storage.getUser(calendar.feedOwnerUserId);
  if (!owner) return [];
  if (owner.role === "admin" || owner.role === "coordinator" || owner.role === "security") return bookings;
  if (owner.role === "guide") {
    const guide = await storage.getGuideByUserId(owner.id);
    return guide ? bookings.filter((booking) => isBookingAssignedToGuide(booking, guide)) : [];
  }
  if (owner.role === "visitor") {
    return bookings.filter((booking) => visitorOwnsBooking(booking, owner));
  }

  return [];
}

// Audit logging helper
async function createAuditLog(
  userId: string,
  action: "create" | "update" | "delete" | "login" | "logout" | "check_in" | "check_out" | "verify" | "impersonate" | "stop_impersonate" | "mark_no_show",
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  req?: Request
) {
  try {
    await storage.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req?.ip || null,
      userAgent: req?.get("user-agent") || null,
    });
  } catch (error) {
    logError("Audit log error", error, req?.requestId);
  }
}

async function userCanAccessBooking(userId: string, booking: Booking): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user) return false;

  if (["admin", "coordinator", "security"].includes(user.role || "")) {
    return true;
  }

  if (user.role === "visitor") {
    return visitorOwnsBooking(booking, user);
  }

  if (user.role === "guide") {
    const guide = await storage.getGuideByUserId(user.id);
    return !!guide && guide.id === booking.assignedGuideId;
  }

  return false;
}

async function getCurrentTransportPartner(user: User) {
  let partner = await storage.getTransportPartnerByUserId(user.id);
  if (partner) return partner;

  partner = await storage.getTransportPartnerByEmail(user.email);
  if (partner) {
    return (await storage.updateTransportPartner(partner.id, { userId: user.id })) || partner;
  }

  return storage.createTransportPartner({
    userId: user.id,
    companyName: `${user.firstName || "Transport"} ${user.lastName || "Partner"}`.trim(),
    contactName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
    email: user.email,
    phone: user.phone || null,
    whatsapp: user.phone || null,
    serviceAreas: [],
    status: "pending",
    notes: "Created automatically from transport partner login.",
  });
}

async function resolveTransportPartnerScope(user: User, requestedPartnerId?: string | null) {
  if (user.role === "transport_partner") {
    return getCurrentTransportPartner(user);
  }

  if (requestedPartnerId) {
    return storage.getTransportPartner(requestedPartnerId);
  }

  return null;
}

async function ensureUserInvite(email: string, role: UserRole, invitedBy?: string | null) {
  const normalizedEmail = email.toLowerCase();
  const existingInvite = await storage.getInviteByEmail(normalizedEmail);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (existingInvite) {
    const isExpired = new Date(existingInvite.expiresAt) <= new Date();
    if (!isExpired && existingInvite.role === role) {
      return { invite: existingInvite, mode: "existing_invite" as const };
    }

    await storage.deleteInvite(existingInvite.id);
  }

  const invite = await storage.createInvite({
    email: normalizedEmail,
    role,
    inviteToken: crypto.randomBytes(32).toString("hex"),
    invitedBy: invitedBy || undefined,
    expiresAt,
  });

  return {
    invite,
    mode: existingInvite ? "renewed_invite" as const : "new_invite" as const,
  };
}

async function ensureVisitorInvite(email: string, invitedBy?: string | null) {
  return ensureUserInvite(email, "visitor", invitedBy);
}

function transportStatusLabel(status?: string | null) {
  return String(status || "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function transportPortalUrl() {
  return `${PUBLIC_APP_URL}/transport-partner?tab=requests`;
}

function transportReference(request: TransportRequest, booking?: Booking | null) {
  return booking?.bookingReference || request.bookingId || request.id;
}

function buildTransportEmailData(options: {
  request: TransportRequest;
  partner?: TransportPartner | null;
  booking?: Booking | null;
  recipientName: string;
  recipientEmail: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  includeInternalNotes?: boolean;
}) {
  const { request, partner, booking, includeInternalNotes = true } = options;
  return {
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    visitorName: request.visitorName,
    visitorEmail: request.visitorEmail,
    visitorPhone: request.visitorPhone,
    bookingReference: transportReference(request, booking),
    partnerName: partner?.companyName || null,
    partnerEmail: partner?.email || null,
    route: request.route,
    pickupLocation: request.pickupLocation,
    visitDate: request.visitDate,
    visitTime: request.visitTime,
    quotedAmount: request.quotedAmount,
    currency: request.currency,
    estimatedPickupTime: request.estimatedPickupTime,
    requestedVisitDate: request.requestedVisitDate,
    requestedPickupTime: request.requestedPickupTime,
    driverName: request.driverName,
    driverPhone: request.driverPhone,
    vehicleDetails: request.vehicleDetails,
    notes: request.notes,
    partnerNotes: request.partnerNotes,
    adminNotes: includeInternalNotes ? request.adminNotes : null,
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel,
  };
}

async function logTransportWorkflowEmail(options: {
  result: { success: boolean; error?: string; messageId?: string };
  sentBy?: string | null;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  templateType: string;
  request: TransportRequest;
  metadata?: Record<string, unknown>;
}) {
  await storage.createEmailLog({
    sentBy: options.sentBy || undefined,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    subject: options.subject,
    message: options.message,
    templateType: options.templateType,
    status: options.result.success ? "accepted" : "failed",
    errorMessage: options.result.error,
    providerMessageId: options.result.messageId,
    relatedEntityType: "transport_request",
    relatedEntityId: options.request.id,
    metadata: {
      bookingId: options.request.bookingId,
      partnerId: options.request.partnerId,
      transportStatus: options.request.status,
      ...options.metadata,
    },
  });
}

async function getTransportAdminEmailRecipients(excludeEmails: Set<string> = new Set()) {
  const admins = await getInternalEmailRecipients(["admin", "coordinator"], "transport_updates");
  return admins.filter((admin) => !excludeEmails.has(admin.email.toLowerCase()));
}

async function sendTransportRequestReceivedEmail(
  request: TransportRequest,
  booking?: Booking | null,
  partner?: TransportPartner | null,
  sentBy?: string | null
) {
  const result = await sendTransportRequestReceivedEmailDetailed({
    visitorName: request.visitorName,
    visitorEmail: request.visitorEmail,
    bookingReference: transportReference(request, booking),
    partnerName: partner?.companyName || null,
    route: request.route,
    pickupLocation: request.pickupLocation,
    visitDate: request.visitDate,
    visitTime: request.visitTime,
    manageBookingUrl: `${PUBLIC_APP_URL}/my-bookings`,
  });

  await logTransportWorkflowEmail({
    result,
    sentBy,
    recipientName: request.visitorName,
    recipientEmail: request.visitorEmail,
    subject: `Transport quote request received - ${transportReference(request, booking)}`,
    message: "Visitor transport quote request was received. No transport payment has been taken.",
    templateType: "transport_request_received",
    request,
    metadata: {
      audience: "visitor",
      partnerName: partner?.companyName || null,
    },
  });

  return result;
}

async function sendTransportPendingAdminEmails(
  request: TransportRequest,
  booking?: Booking | null,
  actor?: User | null
) {
  const recipients = await getTransportAdminEmailRecipients();
  const results = [];

  for (const recipient of recipients) {
    const result = await sendTransportPendingAdminEmailDetailed({
      ...buildTransportEmailData({
        request,
        booking,
        recipientName: getDisplayName(recipient),
        recipientEmail: recipient.email,
        actionUrl: transportPortalUrl(),
        actionLabel: "Assign Transport Partner",
      }),
    });

    await logTransportWorkflowEmail({
      result,
      sentBy: actor?.id,
      recipientName: getDisplayName(recipient),
      recipientEmail: recipient.email,
      subject: `Transport request needs partner - ${transportReference(request, booking)}`,
      message: "A visitor requested transport, but no partner has been assigned yet.",
      templateType: "transport_pending_admin",
      request,
      metadata: {
        audience: "admin",
      },
    });

    results.push({ ...result, recipientEmail: recipient.email, audience: "admin" });
  }

  return results;
}

async function sendTransportAssignmentEmail(
  request: TransportRequest,
  partner: TransportPartner,
  booking?: Booking | null,
  actor?: User | null
) {
  if (!partner.email) return null;

  const recipientName = partner.contactName || partner.companyName;
  const result = await sendTransportRequestAssignedEmailDetailed({
    ...buildTransportEmailData({
      request,
      partner,
      booking,
      recipientName,
      recipientEmail: partner.email,
      actionUrl: transportPortalUrl(),
      actionLabel: "Open Transport Request",
    }),
    assignedByName: actor ? getDisplayName(actor) : "Visit Dzaleka",
  });

  await logTransportWorkflowEmail({
    result,
    sentBy: actor?.id,
    recipientName,
    recipientEmail: partner.email,
    subject: `New transport request assigned - ${transportReference(request, booking)}`,
    message: "A transport request was assigned to this partner.",
    templateType: "transport_request_assigned",
    request,
    metadata: {
      audience: "partner",
      assignedBy: actor?.id || null,
    },
  });

  return result;
}

async function sendTransportQuoteDecisionEmails(options: {
  request: TransportRequest;
  partner?: TransportPartner | null;
  booking?: Booking | null;
  decision: "approved" | "declined";
  decisionNotes?: string | null;
  actor?: User | null;
}) {
  const recipients: Array<{ name: string; email: string; audience: "partner" | "admin" }> = [];
  const seen = new Set<string>();

  if (options.partner?.email) {
    seen.add(options.partner.email.toLowerCase());
    recipients.push({
      name: options.partner.contactName || options.partner.companyName,
      email: options.partner.email,
      audience: "partner",
    });
  }

  const admins = await getTransportAdminEmailRecipients(seen);
  admins.forEach((admin) => {
    seen.add(admin.email.toLowerCase());
    recipients.push({
      name: getDisplayName(admin),
      email: admin.email,
      audience: "admin",
    });
  });

  const results = [];
  for (const recipient of recipients) {
    const result = await sendTransportQuoteDecisionEmailDetailed({
      ...buildTransportEmailData({
        request: options.request,
        partner: options.partner,
        booking: options.booking,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        actionUrl: transportPortalUrl(),
        actionLabel: "Review Transport Request",
      }),
      decision: options.decision,
      decisionNotes: options.decisionNotes,
      decisionAt: options.request.quoteDecisionAt ? new Date(options.request.quoteDecisionAt as any).toISOString() : null,
    });

    await logTransportWorkflowEmail({
      result,
      sentBy: options.actor?.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      subject: `Transport quote ${options.decision} - ${transportReference(options.request, options.booking)}`,
      message: `${options.request.visitorName} ${options.decision} the transport quote.`,
      templateType: "transport_quote_decision",
      request: options.request,
      metadata: {
        audience: recipient.audience,
        decision: options.decision,
      },
    });

    results.push({ ...result, audience: recipient.audience, recipientEmail: recipient.email });
  }

  return results;
}

function transportStatusMessage(status: string, request: TransportRequest, audience: "visitor" | "partner" | "admin") {
  const visitorTarget = audience === "visitor" ? "Your transport request" : `Transport request for ${request.visitorName}`;

  switch (status) {
    case "quote_sent":
      return `A transport quote has been sent for ${request.visitorName}.`;
    case "accepted":
      return `The transport partner accepted the request for ${request.visitorName}.`;
    case "confirmed":
      return `${visitorTarget} is now confirmed.`;
    case "reschedule_requested":
      return `${visitorTarget} has a reschedule request.`;
    case "completed":
      return `${visitorTarget} has been marked completed.`;
    case "cancelled":
      return `${visitorTarget} has been cancelled.`;
    default:
      return `${visitorTarget} changed to ${transportStatusLabel(status)}.`;
  }
}

async function sendTransportStatusEmails(options: {
  request: TransportRequest;
  previousStatus?: string | null;
  partner?: TransportPartner | null;
  booking?: Booking | null;
  actor?: User | null;
  audiences: Array<"visitor" | "partner" | "admin">;
}) {
  const recipients: Array<{ name: string; email: string; audience: "visitor" | "partner" | "admin" }> = [];
  const seen = new Set<string>();

  if (options.audiences.includes("visitor") && options.request.visitorEmail) {
    seen.add(normalizedEmail(options.request.visitorEmail));
    recipients.push({
      name: options.request.visitorName,
      email: options.request.visitorEmail,
      audience: "visitor",
    });
  }

  if (options.audiences.includes("partner") && options.partner?.email && !seen.has(normalizedEmail(options.partner.email))) {
    seen.add(normalizedEmail(options.partner.email));
    recipients.push({
      name: options.partner.contactName || options.partner.companyName,
      email: options.partner.email,
      audience: "partner",
    });
  }

  if (options.audiences.includes("admin")) {
    const admins = await getTransportAdminEmailRecipients(seen);
    admins.forEach((admin) => {
      seen.add(admin.email.toLowerCase());
      recipients.push({
        name: getDisplayName(admin),
        email: admin.email,
        audience: "admin",
      });
    });
  }

  const results = [];
  const status = options.request.status || "pending";
  for (const recipient of recipients) {
    const result = await sendTransportStatusChangedEmailDetailed({
      ...buildTransportEmailData({
        request: options.request,
        partner: options.partner,
        booking: options.booking,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        actionUrl: recipient.audience === "visitor" ? `${PUBLIC_APP_URL}/my-bookings` : transportPortalUrl(),
        actionLabel: recipient.audience === "visitor" ? "Manage Booking" : "Open Transport Request",
        includeInternalNotes: recipient.audience !== "visitor",
      }),
      status,
      previousStatus: options.previousStatus,
      statusMessage: transportStatusMessage(status, options.request, recipient.audience),
      changedByName: options.actor ? getDisplayName(options.actor) : null,
    });

    await logTransportWorkflowEmail({
      result,
      sentBy: options.actor?.id,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      subject: `Transport request ${transportStatusLabel(status).toLowerCase()} - ${transportReference(options.request, options.booking)}`,
      message: transportStatusMessage(status, options.request, recipient.audience),
      templateType: "transport_status_update",
      request: options.request,
      metadata: {
        audience: recipient.audience,
        previousStatus: options.previousStatus,
      },
    });

    results.push({ ...result, audience: recipient.audience, recipientEmail: recipient.email });
  }

  return results;
}

type GygPricingMode = "individual" | "group";
type GygTimeMode = "time_point" | "time_period";
type GygAvailabilityMode = "total" | "by_category";

interface GygProductConfig {
  productId: string;
  pricingMode: GygPricingMode;
  timeMode: GygTimeMode;
  availabilityMode: GygAvailabilityMode;
}

interface GygReservationState {
  reservationReference: string;
  gygBookingReference: string;
  productId: string;
  dateTime: string;
  visitDate: string;
  visitTime: string;
  pricingMode: GygPricingMode;
  timeMode: GygTimeMode;
  participantCount: number;
  unitCount: number;
  bookingItems: any[];
  expiresAt: Date;
  status: "reserved" | "booked" | "cancelled";
}

const gygReservations = new Map<string, GygReservationState>();
const GYG_TIMEZONE_OFFSET = "+02:00";
const GYG_PRODUCT_TITLE = "Dzaleka Refugee Camp Guided Walking Tour";
const GYG_SUPPLIER_ID = process.env.GETYOURGUIDE_SUPPLIER_ID || "visit-dzaleka";
const GYG_SUPPLIER_NAME = process.env.GETYOURGUIDE_SUPPLIER_NAME || "Visit Dzaleka";
const GYG_DEFAULT_START_TIMES = (process.env.GETYOURGUIDE_START_TIMES || "09:00,14:00")
  .split(",")
  .map((time) => time.trim())
  .filter(Boolean);
const GYG_SUPPORTED_INDIVIDUAL_CATEGORIES = (process.env.GETYOURGUIDE_INDIVIDUAL_CATEGORIES || "ADULT,CHILD")
  .split(",")
  .map((category) => category.trim().toUpperCase())
  .filter(Boolean);
const GYG_BLOCKED_DATES = new Set(
  (process.env.GETYOURGUIDE_UNAVAILABLE_DATES || "2026-05-27,2026-05-28")
    .split(",")
    .map((date) => date.trim())
    .filter(Boolean)
);
const GYG_MAX_PEOPLE_PER_SLOT = Number(process.env.GETYOURGUIDE_MAX_CAPACITY || 20);
const GYG_MAX_GROUPS_PER_SLOT = Number(process.env.GETYOURGUIDE_MAX_GROUPS_PER_SLOT || 2);
const GYG_CUTOFF_SECONDS = Number(process.env.GETYOURGUIDE_CUTOFF_SECONDS || 3600);
const GYG_CURRENCY = process.env.GETYOURGUIDE_CURRENCY || "USD";
const GYG_PRODUCT_TIMEZONE = process.env.GETYOURGUIDE_PRODUCT_TIMEZONE || "Africa/Blantyre";

function getGygBaseProductId() {
  return process.env.GETYOURGUIDE_EXTERNAL_PRODUCT_ID
    || process.env.GETYOURGUIDE_PRODUCT_ID
    || "dzaleka-refugee-camp-guided-walking-tour";
}

function getGygAvailabilityPushProductId() {
  return process.env.GETYOURGUIDE_AVAILABILITY_PRODUCT_ID
    || process.env.GETYOURGUIDE_NOTIFY_PRODUCT_ID
    || process.env.GETYOURGUIDE_CONNECTED_PRODUCT_ID
    || "";
}

function isLikelyPublicGygActivityId(productId: string) {
  return /^\d+$/.test(productId.trim());
}

function getGygSelfTestProductIds() {
  const base = getGygBaseProductId();
  return {
    timePointIndividual: `${base}-time-point-individual`,
    timePointIndividualByCategory: `${base}-time-point-individual-by-category`,
    timePointGroup: `${base}-time-point-group`,
    timePeriodIndividual: `${base}-time-period-individual`,
    timePeriodIndividualByCategory: `${base}-time-period-individual-by-category`,
    timePeriodGroup: `${base}-time-period-group`,
  };
}

function resolveGygProduct(productId?: string): GygProductConfig | null {
  const rawProductId = (productId || "").trim();
  if (!rawProductId || rawProductId.includes("%")) return null;

  const base = getGygBaseProductId().toLowerCase();
  const raw = rawProductId.toLowerCase();
  const aliases = new Set([
    base,
    String(process.env.GETYOURGUIDE_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_ACTIVITY_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_AVAILABILITY_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_NOTIFY_PRODUCT_ID || "").toLowerCase(),
    String(process.env.GETYOURGUIDE_CONNECTED_PRODUCT_ID || "").toLowerCase(),
    "1188868",
  ].filter(Boolean));

  const isKnownProduct = aliases.has(raw) || raw.startsWith(`${base}-`);
  if (!isKnownProduct) return null;

  return {
    productId: rawProductId,
    pricingMode: raw.includes("group")
      ? "group"
      : process.env.GETYOURGUIDE_DEFAULT_PRICING_MODE === "group"
        ? "group"
        : "individual",
    timeMode: raw.includes("period")
      ? "time_period"
      : process.env.GETYOURGUIDE_DEFAULT_TIME_MODE === "time_period"
        ? "time_period"
        : "time_point",
    availabilityMode: raw.includes("category") || process.env.GETYOURGUIDE_AVAILABILITY_MODE === "by_category"
      ? "by_category"
      : "total",
  };
}

function gygError(errorCode: string, errorMessage: string, extra: Record<string, unknown> = {}) {
  return { errorCode, errorMessage, ...extra };
}

function sendGygResponse(res: Response, payload: unknown) {
  return res.status(200).type("application/json").json(payload);
}

function isGygAuthorized(req: Request) {
  const expectedUsername = process.env.GETYOURGUIDE_SUPPLIER_API_USERNAME || process.env.GETYOURGUIDE_API_USERNAME;
  const expectedPassword = process.env.GETYOURGUIDE_SUPPLIER_API_PASSWORD || process.env.GETYOURGUIDE_API_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;

  const authHeader = req.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("basic ")) return false;

  try {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    return username === expectedUsername && password === expectedPassword;
  } catch {
    return false;
  }
}

function requireGygAuth(req: Request, res: Response) {
  if (isGygAuthorized(req)) return true;
  sendGygResponse(res, gygError("AUTHORIZATION_FAILURE", "The provided authentication credentials are not valid."));
  return false;
}

function gygDateParts(dateTime?: string) {
  const value = (dateTime || "").trim().replace(" ", "+");
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return null;
  return { date: match[1], time: match[2], normalized: value };
}

function formatGygDateTime(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}${GYG_TIMEZONE_OFFSET}`;
}

function addDaysToDateString(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function getGygLocalDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GYG_PRODUCT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getGygDateRange(fromDateTime?: string, toDateTime?: string) {
  const from = gygDateParts(fromDateTime);
  const to = gygDateParts(toDateTime);
  if (!from || !to) return null;

  const dates: string[] = [];
  let cursor = from.date;
  let guard = 0;
  while (cursor <= to.date && guard < 370) {
    dates.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
    guard += 1;
  }
  return dates;
}

function activeGygReservations() {
  const now = Date.now();
  for (const [reference, reservation] of Array.from(gygReservations.entries())) {
    if (reservation.expiresAt.getTime() <= now && reservation.status === "reserved") {
      gygReservations.delete(reference);
    }
  }

  return Array.from(gygReservations.values()).filter(
    (reservation) => reservation.status === "reserved" && reservation.expiresAt.getTime() > now
  );
}

function getGygParticipantCount(bookingItems: any[] = []) {
  return bookingItems.reduce((total, item) => {
    const count = Math.max(0, Number(item?.count || 0));
    if (item?.category === "GROUP") {
      return total + count * Math.max(1, Number(item?.groupSize || 1));
    }
    return total + count;
  }, 0);
}

function getGygUnitCount(config: GygProductConfig, bookingItems: any[] = []) {
  if (config.pricingMode === "group") {
    return bookingItems.reduce((total, item) => total + Math.max(0, Number(item?.count || 0)), 0);
  }

  return getGygParticipantCount(bookingItems);
}

function validateGygBookingItems(config: GygProductConfig, bookingItems: any[] = []) {
  if (!Array.isArray(bookingItems) || bookingItems.length === 0) {
    return gygError("VALIDATION_FAILURE", "bookingItems must contain at least one ticket category.");
  }

  const allowedCategories = config.pricingMode === "group" ? ["GROUP"] : GYG_SUPPORTED_INDIVIDUAL_CATEGORIES;
  const invalidCategory = bookingItems.find((item) => !allowedCategories.includes(String(item?.category || "").toUpperCase()));
  if (invalidCategory) {
    return gygError(
      "INVALID_TICKET_CATEGORY",
      `The ticket category ${invalidCategory.category} is not sellable for this product.`,
      { ticketCategory: invalidCategory.category }
    );
  }

  const participantCount = getGygParticipantCount(bookingItems);
  if (participantCount < 1 || participantCount > GYG_MAX_PEOPLE_PER_SLOT) {
    return gygError(
      "INVALID_PARTICIPANTS_CONFIGURATION",
      `The activity requires between 1 and ${GYG_MAX_PEOPLE_PER_SLOT} participants.`,
      { participantsConfiguration: { min: 1, max: GYG_MAX_PEOPLE_PER_SLOT } }
    );
  }

  if (config.pricingMode === "group") {
    const groupCount = getGygUnitCount(config, bookingItems);
    if (groupCount < 1 || groupCount > GYG_MAX_GROUPS_PER_SLOT) {
      return gygError(
        "INVALID_PARTICIPANTS_CONFIGURATION",
        `The activity can be booked for up to ${GYG_MAX_GROUPS_PER_SLOT} groups per timeslot.`,
        {
          participantsConfiguration: { min: 1, max: GYG_MAX_PEOPLE_PER_SLOT },
          groupConfiguration: { max: GYG_MAX_GROUPS_PER_SLOT },
        }
      );
    }
  }

  return null;
}

async function getGygRetailPrice(config: GygProductConfig) {
  const configuredPrice = config.pricingMode === "group"
    ? process.env.GETYOURGUIDE_GROUP_PRICE || process.env.GETYOURGUIDE_PRICE
    : process.env.GETYOURGUIDE_ADULT_PRICE || process.env.GETYOURGUIDE_PRICE;
  if (configuredPrice && Number.isFinite(Number(configuredPrice))) {
    return Number(configuredPrice);
  }

  if (GYG_CURRENCY === "USD") {
    return config.pricingMode === "group" ? 8000 : 1500;
  }

  const groupSize = config.pricingMode === "group" ? "large_group" : "individual";
  return calculateTotalAmount(groupSize, "standard");
}

async function getGygRetailPrices(config: GygProductConfig) {
  const basePrice = await getGygRetailPrice(config);
  if (config.pricingMode === "group") {
    return [{ category: "GROUP", price: basePrice }];
  }

  return GYG_SUPPORTED_INDIVIDUAL_CATEGORIES.map((category) => ({
    category,
    price: category === "CHILD"
      ? Number(process.env.GETYOURGUIDE_CHILD_PRICE || process.env.GETYOURGUIDE_PRICE || basePrice)
      : basePrice,
  }));
}

async function getGygAvailabilityUnits(config: GygProductConfig, visitDate: string, visitTime: string) {
  if (GYG_BLOCKED_DATES.has(visitDate)) {
    return 0;
  }

  const bookings = await storage.getBookings();
  const matchingBookings = bookings.filter((booking) => {
    if (booking.status === "cancelled" || booking.status === "no_show") return false;
    if (booking.visitDate !== visitDate) return false;
    if (config.timeMode === "time_period") return true;
    return String(booking.visitTime || "").slice(0, 5) === visitTime;
  });

  const matchingReservations = activeGygReservations().filter((reservation) => {
    if (reservation.visitDate !== visitDate) return false;
    if (config.timeMode === "time_period") return true;
    return reservation.visitTime === visitTime;
  });

  if (config.pricingMode === "group") {
    const reservedGroups = matchingReservations.reduce((total, reservation) => total + reservation.unitCount, 0);
    return Math.max(0, GYG_MAX_GROUPS_PER_SLOT - matchingBookings.length - reservedGroups);
  }

  const bookedPeople = matchingBookings.reduce((total, booking) => total + (booking.numberOfPeople || 1), 0);
  const reservedPeople = matchingReservations.reduce((total, reservation) => total + reservation.participantCount, 0);
  return Math.max(0, GYG_MAX_PEOPLE_PER_SLOT - bookedPeople - reservedPeople);
}

async function buildGygAvailability(config: GygProductConfig, visitDate: string, visitTime: string) {
  const vacancies = await getGygAvailabilityUnits(config, visitDate, visitTime);
  const availability: Record<string, unknown> = {
    dateTime: config.timeMode === "time_period"
      ? formatGygDateTime(visitDate, "00:00")
      : formatGygDateTime(visitDate, visitTime),
    productId: config.productId,
    cutoffSeconds: GYG_CUTOFF_SECONDS,
    currency: GYG_CURRENCY,
    pricesByCategory: {
      retailPrices: await getGygRetailPrices(config),
    },
  };

  if (config.pricingMode === "individual" && config.availabilityMode === "by_category") {
    availability.vacanciesByCategory = GYG_SUPPORTED_INDIVIDUAL_CATEGORIES.map((category) => ({
      category,
      vacancies,
    }));
  } else {
    availability.vacancies = vacancies;
  }

  if (config.timeMode === "time_period") {
    availability.openingTimes = [{ fromTime: "09:00", toTime: "17:00" }];
  }

  return availability;
}

function makeGygReservationReference() {
  return `res_${crypto.randomBytes(8).toString("hex")}`;
}

function makeGygBookingReference() {
  return `GYG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function buildGygTickets(bookingReference: string, bookingItems: any[] = []) {
  const tickets: Array<{ category: string; ticketCode: string; ticketCodeType: "QR_CODE" }> = [];
  let index = 1;

  bookingItems.forEach((item) => {
    const count = Math.max(1, Number(item?.count || 1));
    for (let i = 0; i < count; i += 1) {
      tickets.push({
        category: item?.category || "ADULT",
        ticketCode: `${bookingReference}-${String(index).padStart(2, "0")}`,
        ticketCodeType: "QR_CODE",
      });
      index += 1;
    }
  });

  return tickets.length > 0 ? tickets : [{
    category: "COLLECTIVE",
    ticketCode: `${bookingReference}-01`,
    ticketCodeType: "QR_CODE" as const,
  }];
}

function gygBookingMatches(booking: Booking, data: any) {
  const parts = gygDateParts(data?.dateTime);
  if (!parts) return false;
  return booking.visitDate === parts.date
    && String(booking.visitTime || "").slice(0, 5) === (parts.time === "00:00" ? "09:00" : parts.time)
    && (booking.numberOfPeople || 1) === getGygParticipantCount(data?.bookingItems || []);
}

function registerGetYourGuideSupplierApiRoutes(app: Express) {
  app.get("/1/get-availabilities/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const productId = String(req.query.productId || "");
      logger.info("GetYourGuide get-availabilities request", {
        productId,
        fromDateTime: req.query.fromDateTime,
        toDateTime: req.query.toDateTime,
      });
      const config = resolveGygProduct(productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const dates = getGygDateRange(String(req.query.fromDateTime || ""), String(req.query.toDateTime || ""));
      if (!dates) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "fromDateTime and toDateTime must be valid ISO 8601 datetime values."));
      }

      const availabilities = [];
      for (const date of dates) {
        if (config.timeMode === "time_period") {
          availabilities.push(await buildGygAvailability(config, date, "09:00"));
        } else {
          for (const time of GYG_DEFAULT_START_TIMES) {
            availabilities.push(await buildGygAvailability(config, date, time));
          }
        }
      }

      return sendGygResponse(res, { data: { availabilities } });
    } catch (error: any) {
      logError("GetYourGuide availability endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError("INTERNAL_SYSTEM_FAILURE", error.message || "Failed to fetch availability."));
    }
  });

  app.post("/1/reserve/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide reserve request", {
        productId: data.productId,
        dateTime: data.dateTime,
        gygBookingReference: data.gygBookingReference,
        bookingItems: data.bookingItems,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const parts = gygDateParts(data.dateTime);
      if (!parts || !data.gygBookingReference) {
        return sendGygResponse(res, gygError("VALIDATION_FAILURE", "productId, dateTime, bookingItems, and gygBookingReference are required."));
      }

      const itemError = validateGygBookingItems(config, data.bookingItems);
      if (itemError) return sendGygResponse(res, itemError);

      const visitTime = config.timeMode === "time_period" ? "09:00" : parts.time;
      const requestedUnits = getGygUnitCount(config, data.bookingItems);
      const availableUnits = await getGygAvailabilityUnits(config, parts.date, visitTime);
      if (requestedUnits > availableUnits) {
        return sendGygResponse(res, gygError("NO_AVAILABILITY", `This activity is sold out; requested ${requestedUnits}; available ${availableUnits}.`));
      }

      const reservationReference = makeGygReservationReference();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      gygReservations.set(reservationReference, {
        reservationReference,
        gygBookingReference: data.gygBookingReference,
        productId: config.productId,
        dateTime: data.dateTime,
        visitDate: parts.date,
        visitTime,
        pricingMode: config.pricingMode,
        timeMode: config.timeMode,
        participantCount: getGygParticipantCount(data.bookingItems),
        unitCount: requestedUnits,
        bookingItems: data.bookingItems,
        expiresAt,
        status: "reserved",
      });

      return sendGygResponse(res, {
        data: {
          reservationReference,
          reservationExpiration: expiresAt.toISOString(),
        },
      });
    } catch (error: any) {
      logError("GetYourGuide reserve endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError("INTERNAL_SYSTEM_FAILURE", error.message || "Failed to reserve availability."));
    }
  });

  app.post("/1/cancel-reservation/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide cancel-reservation request", {
        reservationReference: data.reservationReference,
        gygBookingReference: data.gygBookingReference,
      });
      const reservation = gygReservations.get(data.reservationReference);
      if (!reservation || reservation.gygBookingReference !== data.gygBookingReference || reservation.status !== "reserved") {
        return sendGygResponse(res, gygError("INVALID_RESERVATION", "Reservation does not exist or is not in a valid state."));
      }

      reservation.status = "cancelled";
      gygReservations.delete(data.reservationReference);
      return sendGygResponse(res, { data: {} });
    } catch (error: any) {
      logError("GetYourGuide cancel-reservation endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError("INTERNAL_SYSTEM_FAILURE", error.message || "Failed to cancel reservation."));
    }
  });

  app.post("/1/book/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide book request", {
        productId: data.productId,
        dateTime: data.dateTime,
        reservationReference: data.reservationReference,
        gygBookingReference: data.gygBookingReference,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const parts = gygDateParts(data.dateTime);
      const itemError = validateGygBookingItems(config, data.bookingItems);
      if (!parts || itemError) {
        return sendGygResponse(res, itemError || gygError("VALIDATION_FAILURE", "A valid dateTime and bookingItems are required."));
      }

      const existingBookings = await storage.getBookings();
      const existingBooking = existingBookings.find((booking) =>
        booking.source === "getyourguide"
        && booking.externalReferenceId === data.gygBookingReference
        && booking.status !== "cancelled"
        && gygBookingMatches(booking, data)
      );
      if (existingBooking) {
        return sendGygResponse(res, {
          data: {
            bookingReference: existingBooking.bookingReference,
            tickets: buildGygTickets(existingBooking.bookingReference, data.bookingItems),
          },
        });
      }

      const reservation = gygReservations.get(data.reservationReference);
      if (!reservation || reservation.status !== "reserved" || reservation.expiresAt.getTime() <= Date.now()) {
        return sendGygResponse(res, gygError("INVALID_RESERVATION", "Expired or missing reservation."));
      }

      const traveler = data.travelers?.[0] || {};
      const visitorName = [traveler.firstName, traveler.lastName].filter(Boolean).join(" ").trim() || "GetYourGuide Traveler";
      const participantCount = getGygParticipantCount(data.bookingItems);
      const visitTime = config.timeMode === "time_period" ? "09:00" : parts.time;
      const totalAmount = (data.bookingItems || []).reduce(
        (total: number, item: any) => total + Math.max(0, Number(item.retailPrice || 0)) * Math.max(1, Number(item.count || 1)),
        0
      ) || await getGygRetailPrice(config);
      const bookingReference = makeGygBookingReference();

      const booking = await storage.createBooking({
        bookingReference,
        source: "getyourguide",
        externalReferenceId: data.gygBookingReference,
        visitorName,
        visitorEmail: traveler.email || `gyg-${data.gygBookingReference}@getyourguide.invalid`,
        visitorPhone: traveler.phoneNumber || "Not provided",
        visitorCountry: traveler.country || traveler.countryCode || data.country || null,
        visitDate: parts.date,
        visitTime,
        groupSize: participantCount > 5 ? "large_group" : participantCount > 1 ? "small_group" : "individual",
        numberOfPeople: participantCount,
        tourType: "standard",
        paymentMethod: "card",
        paymentStatus: "paid",
        status: "confirmed",
        totalAmount,
        specialRequests: [
          data.comment || "",
          "Created by GetYourGuide Supplier API.",
          `GYG booking reference: ${data.gygBookingReference}`,
          `Reservation reference: ${data.reservationReference}`,
          data.language ? `Language: ${data.language}` : "",
          data.travelerHotel ? `Traveler hotel: ${data.travelerHotel}` : "",
        ].filter(Boolean).join("\n"),
      });

      reservation.status = "booked";
      await storage.createBookingActivityLog({
        bookingId: booking.id,
        action: "getyourguide_booking_created",
        description: `GetYourGuide booking confirmed (${data.gygBookingReference}).`,
        newStatus: "confirmed",
      });

      return sendGygResponse(res, {
        data: {
          bookingReference: booking.bookingReference,
          tickets: buildGygTickets(booking.bookingReference, data.bookingItems),
        },
      });
    } catch (error: any) {
      logError("GetYourGuide book endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError("INTERNAL_SYSTEM_FAILURE", error.message || "Failed to create booking."));
    }
  });

  app.post("/1/cancel-booking/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    try {
      const data = req.body?.data || {};
      logger.info("GetYourGuide cancel-booking request", {
        productId: data.productId,
        bookingReference: data.bookingReference,
        gygBookingReference: data.gygBookingReference,
      });
      const config = resolveGygProduct(data.productId);
      if (!config) {
        return sendGygResponse(res, gygError("INVALID_PRODUCT", "This activity should be deactivated; not sellable."));
      }

      const bookings = await storage.getBookings();
      const booking = bookings.find((item) =>
        item.bookingReference === data.bookingReference
        || (item.source === "getyourguide" && item.externalReferenceId === data.gygBookingReference)
      );

      if (!booking) {
        return sendGygResponse(res, gygError("INVALID_BOOKING", "The booking does not exist."));
      }

      if (booking.status === "cancelled") {
        return sendGygResponse(res, gygError("BOOKING_ALREADY_CANCELED", "The booking has been cancelled already."));
      }

      const nowDate = new Date().toISOString().slice(0, 10);
      if (booking.status === "completed" || booking.status === "in_progress") {
        return sendGygResponse(res, gygError("BOOKING_REDEEMED", "The booking has already been used."));
      }
      if (booking.visitDate < nowDate) {
        return sendGygResponse(res, gygError("BOOKING_IN_PAST", "The booking is in the past and cannot be cancelled."));
      }

      await storage.updateBookingStatus(booking.id, "cancelled");
      await storage.updateBooking(booking.id, {
        cancellationCategory: "getyourguide",
        cancellationReason: "Cancelled by GetYourGuide",
        cancellationNote: typeof data.cancellationReason === "string"
          ? data.cancellationReason
          : typeof data.reason === "string"
            ? data.reason
            : null,
        cancelledAt: new Date(),
        cancelledBy: null,
      });
      await storage.createBookingActivityLog({
        bookingId: booking.id,
        action: "getyourguide_booking_cancelled",
        description: `GetYourGuide cancelled booking ${data.gygBookingReference}.`,
        oldStatus: booking.status,
        newStatus: "cancelled",
      });

      return sendGygResponse(res, { data: {} });
    } catch (error: any) {
      logError("GetYourGuide cancel-booking endpoint failed", error, req.requestId);
      return sendGygResponse(res, gygError("INTERNAL_SYSTEM_FAILURE", error.message || "Failed to cancel booking."));
    }
  });

  app.get("/1/products/:productId/pricing-categories/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    const retailPrices = await getGygRetailPrices(config);
    return sendGygResponse(res, {
      data: {
        pricingCategories: retailPrices.map(({ category, price }) => ({
          category,
          minTicketAmount: 1,
          maxTicketAmount: config.pricingMode === "group" ? GYG_MAX_GROUPS_PER_SLOT : GYG_MAX_PEOPLE_PER_SLOT,
          groupSizeMin: config.pricingMode === "group" ? 1 : null,
          groupSizeMax: config.pricingMode === "group" ? GYG_MAX_PEOPLE_PER_SLOT : null,
          ageFrom: category === "ADULT" ? 18 : category === "CHILD" ? 0 : null,
          ageTo: category === "ADULT" ? 99 : category === "CHILD" ? 17 : null,
          bookingCategory: "STANDARD",
          price: [{ priceType: "RETAIL_PRICE", price, currency: GYG_CURRENCY }],
        })),
      },
    });
  });

  app.get("/1/products/:productId/addons/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    return sendGygResponse(res, { data: { addons: [] } });
  });

  app.get("/1/products/:productId", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    const config = resolveGygProduct(req.params.productId);
    if (!config) {
      return sendGygResponse(res, gygError("INVALID_PRODUCT", "This product does not exist."));
    }

    return sendGygResponse(res, {
      data: {
        supplierId: GYG_SUPPLIER_ID,
        productTitle: GYG_PRODUCT_TITLE,
        productDescription: "A guided walking tour of Dzaleka Refugee Camp led by local community guides.",
        destinationLocation: {
          city: "Dowa",
          country: "MWI",
        },
        configuration: {
          participantsConfiguration: {
            min: 1,
            max: GYG_MAX_PEOPLE_PER_SLOT,
          },
        },
      },
    });
  });

  app.get("/1/suppliers/:supplierId/products/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;

    if (req.params.supplierId !== GYG_SUPPLIER_ID) {
      return sendGygResponse(res, gygError("INVALID_SUPPLIER", "Supplier does not exist in the system."));
    }

    const ids = getGygSelfTestProductIds();
    return sendGygResponse(res, {
      data: {
        supplierId: GYG_SUPPLIER_ID,
        supplierName: GYG_SUPPLIER_NAME,
        products: [
          { productId: ids.timePointIndividual, productTitle: `${GYG_PRODUCT_TITLE} - Fixed time individual` },
          { productId: ids.timePointGroup, productTitle: `${GYG_PRODUCT_TITLE} - Fixed time group` },
          { productId: ids.timePeriodIndividual, productTitle: `${GYG_PRODUCT_TITLE} - Operating hours individual` },
          { productId: ids.timePeriodGroup, productTitle: `${GYG_PRODUCT_TITLE} - Operating hours group` },
        ],
      },
    });
  });

  app.post("/1/notify/", async (req, res) => {
    if (!requireGygAuth(req, res)) return;
    logger.warn("GetYourGuide product notification received", req.body?.data || {});
    return sendGygResponse(res, { data: {} });
  });
}

async function ensureAssignedGuideCanManageBooking(
  req: Request,
  res: Response,
  booking: Booking
): Promise<boolean> {
  if ((req as any).currentUser?.role !== "guide") {
    return true;
  }

  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }

  const guide = await storage.getGuideByUserId(userId);
  if (!guide) {
    res.status(404).json({ message: "Guide profile not found" });
    return false;
  }

  if (!isBookingAssignedToGuide(booking, guide)) {
    res.status(403).json({ message: "You are not assigned to this booking" });
    return false;
  }

  return true;
}

async function getChatRoomForParticipant(roomId: string, userId: string) {
  const room = await storage.getChatRoom(roomId);
  if (!room) {
    return { status: 404 as const, message: "Chat room not found" };
  }

  const participants = await storage.getChatParticipants(roomId);
  const isParticipant = participants.some((participant) => participant.userId === userId);
  if (!isParticipant) {
    return { status: 403 as const, message: "You are not a participant of this chat" };
  }

  const canAccessRoom = await canUserAccessChatParticipants(userId, participants);
  if (!canAccessRoom) {
    return { status: 403 as const, message: "You do not have access to this chat" };
  }

  return { status: 200 as const, room, participants };
}

function normalizedEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

function visitorOwnsBooking(
  booking: Pick<Booking, "visitorUserId" | "visitorEmail">,
  visitor?: Pick<User, "id" | "email"> | null
): boolean {
  if (!visitor) return false;
  const visitorEmail = normalizedEmail(visitor.email);
  return booking.visitorUserId === visitor.id || (!!visitorEmail && normalizedEmail(booking.visitorEmail) === visitorEmail);
}

async function getTransportPartnerForUser(user: User) {
  const byUserId = await storage.getTransportPartnerByUserId(user.id);
  if (byUserId) return byUserId;
  const email = normalizedEmail(user.email);
  return email ? await storage.getTransportPartnerByEmail(email) : undefined;
}

async function getTransportPartnerLinkedVisitorEmails(partnerId: string): Promise<Set<string>> {
  const [requests, referrals, bookings] = await Promise.all([
    storage.getTransportRequests(partnerId),
    storage.getPartnerTourReferrals(partnerId),
    storage.getBookings(),
  ]);

  const emails = new Set<string>();
  for (const request of requests) {
    const email = normalizedEmail(request.visitorEmail);
    if (email) emails.add(email);
  }
  for (const referral of referrals) {
    const email = normalizedEmail(referral.visitorEmail);
    if (email) emails.add(email);
  }
  for (const booking of bookings) {
    if (booking.referralSource === partnerId) {
      const email = normalizedEmail(booking.visitorEmail);
      if (email) emails.add(email);
    }
  }
  return emails;
}

async function isVisitorLinkedToTransportPartner(visitor: User, partnerId: string): Promise<boolean> {
  const visitorEmail = normalizedEmail(visitor.email);
  if (!visitorEmail) return false;
  const linkedEmails = await getTransportPartnerLinkedVisitorEmails(partnerId);
  return linkedEmails.has(visitorEmail);
}

async function getVisitorAssignedGuideUserIds(visitor: User): Promise<Set<string>> {
  const visitorEmail = normalizedEmail(visitor.email);
  const allBookings = await storage.getBookings();
  const guideProfileIds = Array.from(new Set(
    allBookings
      .filter((booking) => booking.visitorUserId === visitor.id || normalizedEmail(booking.visitorEmail) === visitorEmail)
      .map((booking) => booking.assignedGuideId)
      .filter(Boolean) as string[]
  ));

  const guides = await Promise.all(guideProfileIds.map((guideId) => storage.getGuide(guideId)));
  return new Set(
    guides
      .map((guide) => guide?.userId)
      .filter(Boolean) as string[]
  );
}

async function isGuideAssignedToVisitor(guideUser: User, visitorUser: User): Promise<boolean> {
  const guide = await storage.getGuideByUserId(guideUser.id);
  if (!guide) return false;
  const visitorEmail = normalizedEmail(visitorUser.email);
  const allBookings = await storage.getBookings();
  return allBookings.some((booking) =>
    booking.assignedGuideId === guide.id &&
    (booking.visitorUserId === visitorUser.id || (visitorEmail && normalizedEmail(booking.visitorEmail) === visitorEmail))
  );
}

async function isVisitorActiveToday(visitorUser: User): Promise<boolean> {
  const visitorEmail = normalizedEmail(visitorUser.email);
  const todaysBookings = await storage.getTodaysBookings();
  return todaysBookings.some((booking) =>
    !["cancelled", "declined", "visitor_declined"].includes(booking.status || "") &&
    (booking.visitorUserId === visitorUser.id || (visitorEmail && normalizedEmail(booking.visitorEmail) === visitorEmail))
  );
}

async function canUsersStartDirectChat(currentUser: User, otherUser: User): Promise<boolean> {
  if (currentUser.id === otherUser.id) return false;

  // 1. Staff (admin, coordinator) can chat with anyone
  if (currentUser.role === "admin" || currentUser.role === "coordinator") {
    return true;
  }
  if (otherUser.role === "admin" || otherUser.role === "coordinator") {
    return true;
  }

  // 2. Transport Partner: can only chat with linked visitors
  if (currentUser.role === "transport_partner") {
    if (otherUser.role !== "visitor") return false;
    const partner = await getTransportPartnerForUser(currentUser);
    return partner ? await isVisitorLinkedToTransportPartner(otherUser, partner.id) : false;
  }
  if (otherUser.role === "transport_partner") {
    if (currentUser.role !== "visitor") return false;
    const partner = await getTransportPartnerForUser(otherUser);
    return partner ? await isVisitorLinkedToTransportPartner(currentUser, partner.id) : false;
  }

  // 3. Visitor: can only chat with assigned guides (and linked transport partners - handled above)
  if (currentUser.role === "visitor") {
    if (otherUser.role === "guide") {
      const assignedGuideUserIds = await getVisitorAssignedGuideUserIds(currentUser);
      return assignedGuideUserIds.has(otherUser.id);
    }
    return false;
  }

  // 4. Guide: can only chat with assigned visitors
  if (currentUser.role === "guide") {
    if (otherUser.role === "visitor") {
      return isGuideAssignedToVisitor(currentUser, otherUser);
    }
    return false;
  }

  // 5. Security: can only chat with active-day visitors
  if (currentUser.role === "security") {
    if (otherUser.role === "visitor") {
      return isVisitorActiveToday(otherUser);
    }
    return false;
  }
  if (otherUser.role === "security") {
    if (currentUser.role === "visitor") {
      return isVisitorActiveToday(currentUser);
    }
    return false;
  }

  // 6. Default deny other role pairs
  return false;
}

async function canUserAccessChatParticipants(userId: string, participants: Array<{ userId?: string | null; user_id?: string | null }>): Promise<boolean> {
  const currentUser = await storage.getUser(userId);
  if (!currentUser) return false;

  const otherParticipantIds = participants
    .map((participant) => participant.userId || participant.user_id)
    .filter((participantUserId): participantUserId is string => Boolean(participantUserId && participantUserId !== userId));

  for (const participantUserId of otherParticipantIds) {
    const otherUser = await storage.getUser(participantUserId);
    if (!otherUser || !(await canUsersStartDirectChat(currentUser, otherUser))) {
      return false;
    }
  }

  return true;
}

async function filterChatRoomsForUser(userId: string, rooms: any[]) {
  const allowedRooms = [];
  for (const room of rooms) {
    const participants = room.chatParticipants || room.chat_participants || await storage.getChatParticipants(room.id);
    if (await canUserAccessChatParticipants(userId, participants)) {
      allowedRooms.push(room);
    }
  }
  return allowedRooms;
}

async function logTransportRequestActivity(
  requestId: string,
  action: string,
  actor: User | null,
  details: Record<string, any> = {},
  oldStatus?: string | null,
  newStatus?: string | null
) {
  try {
    await storage.createTransportRequestActivity({
      requestId,
      action,
      actorUserId: actor?.id || null,
      actorRole: actor?.role || null,
      oldStatus: oldStatus || null,
      newStatus: newStatus || null,
      details,
    });
  } catch (error) {
    logError("Failed to create transport request activity", error);
  }
}

type HealthComponentStatus = "operational" | "degraded" | "down" | "not_configured";

type HealthComponent = {
  status: HealthComponentStatus;
  checkedAt: string;
  message: string;
  remediationUrl?: string;
  metrics?: Record<string, unknown>;
};

function isRecentDate(value: string | Date | null | undefined, windowMs: number) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time <= windowMs;
}

async function buildIntegrationHealth(): Promise<Record<string, HealthComponent>> {
  const checkedAt = new Date().toISOString();
  const dayMs = 24 * 60 * 60 * 1000;
  const components: Record<string, HealthComponent> = {};

  try {
    const resendClient = getResendClient();
    const emailLogs = await storage.getEmailLogs({ archived: "all" });
    const recentFailed = emailLogs.filter((log) =>
      isRecentDate(log.createdAt, dayMs) && ["failed", "bounced"].includes((log.status || "").toLowerCase())
    ).length;
    components.resend = {
      status: !resendClient ? "not_configured" : recentFailed > 0 ? "degraded" : "operational",
      checkedAt,
      message: !resendClient
        ? "RESEND_API_KEY is not configured."
        : recentFailed > 0
          ? `${recentFailed} email delivery failure${recentFailed === 1 ? "" : "s"} recorded in the last 24 hours.`
          : "Resend is configured and no recent delivery failures were found.",
      remediationUrl: "/email-settings",
      metrics: {
        recentFailures: recentFailed,
        checkedEmailLogs: emailLogs.length,
      },
    };
  } catch (error: any) {
    components.resend = {
      status: "down",
      checkedAt,
      message: error?.message || "Email delivery health could not be checked.",
      remediationUrl: "/email-settings",
    };
  }

  try {
    const stripeConfig = getStripePaymentConfig();
    const missing = [
      !stripeConfig.secretKeyConfigured ? "secret key" : null,
      !stripeConfig.webhookConfigured ? "webhook secret" : null,
      !stripeConfig.usdConversionConfigured ? "USD conversion rate" : null,
    ].filter(Boolean);
    components.stripe = {
      status: !stripeConfig.secretKeyConfigured ? "not_configured" : missing.length > 0 ? "degraded" : "operational",
      checkedAt,
      message: missing.length > 0
        ? `Stripe configuration is missing ${missing.join(", ")}.`
        : `Stripe is configured for ${stripeConfig.currency} checkout.`,
      remediationUrl: "/payments",
      metrics: {
        currency: stripeConfig.currency,
        liveMode: stripeConfig.isLiveMode,
        webhookConfigured: stripeConfig.webhookConfigured,
      },
    };
  } catch (error: any) {
    components.stripe = {
      status: "down",
      checkedAt,
      message: error?.message || "Stripe health could not be checked.",
      remediationUrl: "/payments",
    };
  }

  try {
    const hasCredentials = Boolean(process.env.GETYOURGUIDE_API_USERNAME && process.env.GETYOURGUIDE_API_PASSWORD);
    const hasAvailabilityProduct = Boolean(process.env.GETYOURGUIDE_AVAILABILITY_PRODUCT_ID);
    components.getyourguide = {
      status: hasCredentials && hasAvailabilityProduct ? "operational" : hasCredentials ? "degraded" : "not_configured",
      checkedAt,
      message: hasCredentials && hasAvailabilityProduct
        ? "GetYourGuide supplier API and availability push settings are configured."
        : hasCredentials
          ? "GetYourGuide credentials exist, but availability push product mapping is missing."
          : "GetYourGuide outbound API credentials are not configured.",
      remediationUrl: "/getyourguide",
      metrics: {
        credentialsConfigured: hasCredentials,
        availabilityProductConfigured: hasAvailabilityProduct,
      },
    };
  } catch (error: any) {
    components.getyourguide = {
      status: "down",
      checkedAt,
      message: error?.message || "GetYourGuide health could not be checked.",
      remediationUrl: "/getyourguide",
    };
  }

  try {
    const storageStatus = await storage.checkStorageConnectivity();
    components.supabaseStorage = {
      status: "operational",
      checkedAt,
      message: "Supabase Storage bucket listing succeeded.",
      remediationUrl: "/developer",
      metrics: storageStatus,
    };
  } catch (error: any) {
    components.supabaseStorage = {
      status: "down",
      checkedAt,
      message: error?.message || "Supabase Storage health could not be checked.",
      remediationUrl: "/developer",
    };
  }

  try {
    const reports = await storage.getScheduledReports();
    const activeReports = reports.filter((report) => report.status !== "paused" && report.status !== "disabled");
    const overdueReports = activeReports.filter((report) => new Date(report.nextRunAt).getTime() < Date.now());
    components.scheduledReports = {
      status: overdueReports.length > 0 ? "degraded" : "operational",
      checkedAt,
      message: overdueReports.length > 0
        ? `${overdueReports.length} scheduled report${overdueReports.length === 1 ? " is" : "s are"} past the next-run time.`
        : "Scheduled report configuration loaded successfully.",
      remediationUrl: "/admin/scheduled-reports",
      metrics: {
        totalReports: reports.length,
        activeReports: activeReports.length,
        overdueReports: overdueReports.length,
      },
    };
  } catch (error: any) {
    components.scheduledReports = {
      status: "down",
      checkedAt,
      message: error?.message || "Scheduled report health could not be checked.",
      remediationUrl: "/admin/scheduled-reports",
    };
  }

  try {
    const [pendingDeliveries, recentDeliveries] = await Promise.all([
      storage.getPendingWebhookDeliveries(),
      storage.getWebhookDeliveries(),
    ]);
    const recentFailed = recentDeliveries.filter((delivery) =>
      isRecentDate(delivery.timestamp, dayMs) && ["failed", "error"].includes((delivery.status || "").toLowerCase())
    ).length;
    components.webhookQueue = {
      status: pendingDeliveries.length > 25 || recentFailed > 0 ? "degraded" : "operational",
      checkedAt,
      message: recentFailed > 0
        ? `${recentFailed} webhook delivery failure${recentFailed === 1 ? "" : "s"} recorded in the last 24 hours.`
        : pendingDeliveries.length > 25
          ? `${pendingDeliveries.length} webhook deliveries are pending.`
          : "Webhook delivery queue loaded successfully.",
      remediationUrl: "/developer?tab=webhooks",
      metrics: {
        pendingDeliveries: pendingDeliveries.length,
        recentFailures: recentFailed,
      },
    };
  } catch (error: any) {
    components.webhookQueue = {
      status: "down",
      checkedAt,
      message: error?.message || "Webhook delivery health could not be checked.",
      remediationUrl: "/developer?tab=webhooks",
    };
  }

  return components;
}

function summarizeHealthStatus(databaseConnected: boolean, integrations: Record<string, HealthComponent>) {
  const statuses = Object.values(integrations).map((component) => component.status);
  if (!databaseConnected || statuses.includes("down")) return "unhealthy";
  if (statuses.some((status) => status === "degraded" || status === "not_configured")) return "degraded";
  return "healthy";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint - exempt from IP whitelist for monitoring
  app.get("/api/health", async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
      // Test database connectivity with a lightweight query
      const zones = await storage.getZones();
      const integrations = await buildIntegrationHealth();
      const status = summarizeHealthStatus(true, integrations);
      res.json({
        status,
        timestamp,
        database: "connected",
        zonesCount: zones.length,
        integrations,
      });
    } catch (error) {
      logError("Health check failed", error, req.requestId);
      res.status(503).json({
        status: "unhealthy",
        timestamp,
        database: "disconnected",
        integrations: {},
      });
    }
  });

  registerGetYourGuideSupplierApiRoutes(app);

  // IP Whitelist Middleware
  app.use("/api", async (req, res, next) => {
    // Skip IP check for health endpoint (needed for monitoring)
    if (req.path === "/health") {
      return next();
    }

    const isProduction = process.env.NODE_ENV === "production";

    try {
      const ip = req.ip || req.socket.remoteAddress || "";
      const isAllowed = await storage.checkIpAllowed(ip);

      if (!isAllowed) {
        logError(`Blocked access from unauthorized IP: ${ip}, path: ${req.path}`, null, req.requestId);
        return res.status(403).json({ message: "Access denied: Unauthorized IP address" });
      }
      next();
    } catch (error) {
      // Log the error for monitoring/alerting
      logError("IP Check error", error, req.requestId);

      if (isProduction) {
        // In production: fail-closed for security
        // Rate limiting from app.ts still provides some protection
        logError("Denying request due to IP check failure in production", null, req.requestId);
        return res.status(503).json({ message: "Service temporarily unavailable" });
      } else {
        // In development: fail-open to avoid lockouts during setup
        next();
      }
    }
  });

  // Admin: Send custom notification to specific users or all users
  app.post("/api/notifications/send", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { title, message, link, userIds, sendToAll, role } = req.body;

      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }

      let targetUsers: { id: string }[] = [];

      if (sendToAll) {
        // Send to all users
        const allUsers = await storage.getUsers();
        targetUsers = allUsers.filter(u => u.isActive);
      } else if (role) {
        // Send to all users of a specific role
        const allUsers = await storage.getUsers();
        targetUsers = allUsers.filter(u => u.role === role && u.isActive);
      } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        // Send to specific users
        targetUsers = userIds.map((id: string) => ({ id }));
      } else {
        return res.status(400).json({ message: "Specify userIds, role, or sendToAll" });
      }

      if ((sendToAll || role) && !(await requireOperationApproval(req, res, "bulk_email_send", "Bulk notification sends"))) {
        return;
      }

      let successCount = 0;
      for (const user of targetUsers) {
        try {
          await storage.createNotification({
            userId: user.id,
            type: "system",
            title,
            message,
            link: link || undefined,
          });
          successCount++;
        } catch (e) {
          logError(`Failed to send notification to user ${user.id}`, e, req.requestId);
        }
      }

      // Log the action
      await createAuditLog(
        req.session.userId!,
        "create",
        "notification",
        undefined,
        undefined,
        { title, message, recipientCount: successCount },
        req
      );

      res.json({ success: true, sentCount: successCount, totalTargeted: targetUsers.length });
    } catch (error) {
      logError("Error sending notifications", error, req.requestId);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // CRM: Get Customers (Visitors with stats)
  app.get("/api/customers", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const bookings = await storage.getBookings();

      const visitors = users.filter(u => u.role === "visitor");
      const customerStats = visitors.map(user => {
        const userBookings = bookings.filter(b => visitorOwnsBooking(b, user));
        const totalVisits = userBookings.filter(b => b.status === "completed").length;
        const totalSpend = userBookings.reduce((sum, b) => sum + getRecognizedBookingRevenue(b), 0);
        const lastVisit = userBookings
          .filter(b => b.visitDate)
          .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0]?.visitDate;
        const latestCountry = user.country || userBookings
          .filter(b => b.visitorCountry)
          .sort((a, b) => dateSortValue(b.createdAt) - dateSortValue(a.createdAt))[0]?.visitorCountry || null;

        return {
          ...user,
          country: latestCountry,
          stats: {
            totalVisits,
            totalSpend,
            lastVisit,
            bookingCount: userBookings.length
          }
        };
      });

      res.json(customerStats);
    } catch (error) {
      logError("Error fetching customers", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // CRM: Get Customer Details
  app.get("/api/customers/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "Customer not found" });

      const bookings = await storage.getBookings();
      const userBookings = bookings.filter(b => visitorOwnsBooking(b, user));

      const stats = {
        totalVisits: userBookings.filter(b => b.status === "completed").length,
        totalSpend: userBookings.reduce((sum, b) => sum + getRecognizedBookingRevenue(b), 0),
        lastVisit: userBookings
          .filter(b => b.visitDate)
          .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0]?.visitDate
      };

      res.json({ user, bookings: userBookings, stats });
    } catch (error) {
      logError("Error fetching customer details", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch customer details" });
    }
  });

  // CRM: Update Customer (Notes, Preferences, Tags, Personal Info)
  app.patch("/api/customers/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const {
        preferences,
        adminNotes,
        tags,
        dateOfBirth,
        address,
        country,
        preferredLanguage,
        preferredContactMethod,
        marketingConsent
      } = req.body;

      const user = await storage.updateUser(req.params.id, {
        preferences,
        adminNotes,
        tags,
        dateOfBirth,
        address,
        country,
        preferredLanguage,
        preferredContactMethod,
        marketingConsent
      });
      res.json(user);
    } catch (error) {
      logError("Error updating customer", error, req.requestId);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });
  app.get("/api/auth/csrf", (req, res) => {
    const csrfToken = getOrCreateCsrfToken(req);
    res.set("X-CSRF-Token", csrfToken);
    res.json({ csrfToken });
  });

  const sessionStatusHandler = (req: Request, res: Response) => {
    res.json({
      hasSession: !!req.session,
      hasUserId: !!req.session?.userId,
      cookieSettings: {
        secure: req.session?.cookie?.secure,
        sameSite: req.session?.cookie?.sameSite,
        httpOnly: req.session?.cookie?.httpOnly,
      },
    });
  };

  if (process.env.NODE_ENV === "production") {
    app.get("/api/auth/session-status", isAuthenticated, requireRole("admin"), sessionStatusHandler);
  } else {
    app.get("/api/auth/session-status", sessionStatusHandler);
  }

  // Email/Password Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser(email, hashedPassword, firstName, lastName, "visitor");

      const csrfToken = await establishAuthenticatedSession(req, user);
      res.set("X-CSRF-Token", csrfToken);

      // Audit log
      await createAuditLog(user.id, "create", "user", user.id, null, { email, firstName, lastName }, req);

      try {
        await sendWelcomeOrVerificationEmail(user, user.id);
      } catch (emailError) {
        logger.error("Failed to send welcome/verification email", emailError);
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        logError("Registration error", error, req.requestId);
        res.status(500).json({ message: "Failed to register" });
      }
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const userAgent = req.get("user-agent") || "";
      const ipAddress = req.ip || req.socket.remoteAddress || "";

      // Parse user agent for device info
      const deviceType = /mobile/i.test(userAgent) ? "mobile" :
        /tablet/i.test(userAgent) ? "tablet" : "desktop";
      const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s]?(\d+)/i);
      const browser = browserMatch ? browserMatch[1] : "Unknown";
      const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/i);
      const os = osMatch ? osMatch[1] : "Unknown";

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        // Record failed login attempt
        await storage.createLoginRecord({
          userId: null,
          email,
          ipAddress,
          userAgent,
          deviceType,
          browser,
          os,
          success: false,
          failureReason: "user_not_found"
        });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        await storage.createLoginRecord({
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          deviceType,
          browser,
          os,
          success: false,
          failureReason: "account_disabled"
        });
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        await storage.createLoginRecord({
          userId: user.id,
          email,
          ipAddress,
          userAgent,
          deviceType,
          browser,
          os,
          success: false,
          failureReason: "invalid_password"
        });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Record successful login
      await storage.createLoginRecord({
        userId: user.id,
        email,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        success: true,
        failureReason: null
      });

      const csrfToken = await establishAuthenticatedSession(req, user);
      res.set("X-CSRF-Token", csrfToken);

      // Update last login
      await storage.updateLastLogin(user.id);

      // Audit log
      await createAuditLog(user.id, "login", "user", user.id, null, null, req);

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        logError("Login error", error, req.requestId);
        res.status(500).json({ message: "Failed to login" });
      }
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session?.userId;
    if (userId) {
      // Fire and forget audit log - don't block logout on audit log failure
      createAuditLog(userId, "logout", "user", userId, null, null, req).catch((err) => {
        logError("Audit log error during logout", err, req.requestId);
      });
    }
    req.session.destroy((err) => {
      if (err) {
        logError("Logout error", err, req.requestId);
        return res.status(500).json({ message: "Failed to logout" });
      }
      clearSessionCookie(res);
      res.json({ message: "Logged out successfully" });
    });
  });

  // Admin create user endpoint
  app.post("/api/auth/create-user", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, password, first name, and last name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const validRole = VALID_USER_ROLES.includes(role) ? role : "visitor";
      const user = await storage.createUser(email, hashedPassword, firstName, lastName, validRole);

      // Audit log
      await createAuditLog(req.session?.userId, "create", "user", user.id, null, { email, firstName, lastName, role: validRole }, req);

      try {
        await sendWelcomeOrVerificationEmail(user, req.session?.userId);
      } catch (emailError) {
        logger.error("Failed to send welcome/verification email", emailError);
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      logError("Create user error", error, req.requestId);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Forgot password - sends reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, we've sent password reset instructions." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in user record
      await storage.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email
      const resetUrl = `${PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

      try {
        const passwordResetResult = await sendPasswordResetDetailed({
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          userEmail: user.email,
          resetToken,
          resetUrl,
        });
        await storage.createEmailLog({
          recipientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          recipientEmail: user.email,
          subject: "Password Reset Request - Visit Dzaleka",
          message: "Password reset instructions sent.",
          templateType: "password_reset",
          status: passwordResetResult.success ? "accepted" : "failed",
          errorMessage: passwordResetResult.error,
          providerMessageId: passwordResetResult.messageId,
          relatedEntityType: "user",
          relatedEntityId: user.id,
          metadata: { userId: user.id },
        });
      } catch (emailError) {
        logError("Failed to send password reset email", emailError, req.requestId);
        // Don't fail the request if email fails - user can retry
      }

      res.json({ message: "If an account exists with that email, we've sent password reset instructions." });
    } catch (error) {
      logError("Forgot password error", error, req.requestId);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token has expired
      if (user.passwordResetExpires && new Date() > new Date(user.passwordResetExpires)) {
        return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Clear the reset token
      await storage.clearPasswordResetToken(user.id);

      // Log the action
      await createAuditLog(user.id, "update", "user", user.id,
        {}, { action: "password_reset_completed" }, req);

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      logError("Reset password error", error, req.requestId);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Public verify email endpoint (for clicking email links)
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by email verification token
      const user = await storage.getUserByEmailVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Verify the email
      await storage.verifyEmail(user.id);

      // Clear the verification token
      await storage.clearEmailVerificationToken(user.id);

      // Log the action
      await createAuditLog(user.id, "verify", "user", user.id,
        { emailVerified: false }, { emailVerified: true }, req);

      res.json({ message: "Email verified successfully!" });
    } catch (error) {
      logError("Verify email error", error, req.requestId);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Get current user (session-based)
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.json(null);
      }

      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        // Session exists but user not found
        return res.json(null);
      }

      // Sync session role with database (handles role changes by admin)
      if (user.role && req.session.userRole !== user.role) {
        req.session.userRole = user.role;
      }

      // Return user without password
      const { password: _, ...safeUser } = user;

      // Include impersonation info
      const response: any = { ...safeUser };
      if (req.session.isImpersonating && req.session.originalAdminId) {
        response.isImpersonating = true;
        response.originalAdminId = req.session.originalAdminId;
      }

      res.json(response);
    } catch (error) {
      logError("Error fetching user", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin impersonation - start impersonating a user
  app.post("/api/admin/impersonate/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const adminId = req.session.userId!;

      // Prevent impersonating self
      if (targetUserId === adminId) {
        return res.status(400).json({ message: "Cannot impersonate yourself" });
      }

      // Get target user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent impersonating other admins
      if (targetUser.role === "admin") {
        return res.status(403).json({ message: "Cannot impersonate other administrators" });
      }

      // Store original admin session info
      req.session.originalAdminId = adminId;
      req.session.originalAdminRole = req.session.userRole;
      req.session.isImpersonating = true;

      // Switch to target user
      req.session.userId = targetUserId;
      req.session.userRole = targetUser.role || "visitor";

      // Log the impersonation
      await createAuditLog(adminId, "impersonate", "user", targetUserId, null, {
        targetUserEmail: targetUser.email,
        targetUserName: `${targetUser.firstName} ${targetUser.lastName}`,
      }, req);

      const { password: _, ...safeUser } = targetUser;
      res.json({
        message: "Now impersonating user",
        user: safeUser,
        isImpersonating: true,
      });
    } catch (error) {
      logError("Error starting impersonation", error, req.requestId);
      res.status(500).json({ message: "Failed to start impersonation" });
    }
  });

  // Admin impersonation - stop impersonating
  app.post("/api/admin/stop-impersonation", isAuthenticated, async (req, res) => {
    try {
      if (!req.session.isImpersonating || !req.session.originalAdminId) {
        return res.status(400).json({ message: "Not currently impersonating" });
      }

      const impersonatedUserId = req.session.userId;
      const originalAdminId = req.session.originalAdminId;

      // Restore original admin session
      req.session.userId = originalAdminId;
      req.session.userRole = req.session.originalAdminRole || "admin";
      req.session.isImpersonating = false;
      delete req.session.originalAdminId;
      delete req.session.originalAdminRole;

      // Get admin user
      const adminUser = await storage.getUser(originalAdminId);
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      // Log the end of impersonation
      await createAuditLog(originalAdminId, "stop_impersonate", "user", impersonatedUserId!, null, {}, req);

      const { password: _, ...safeUser } = adminUser;
      res.json({
        message: "Stopped impersonating",
        user: safeUser,
        isImpersonating: false,
      });
    } catch (error) {
      logError("Error stopping impersonation", error, req.requestId);
      res.status(500).json({ message: "Failed to stop impersonation" });
    }
  });

  // Update user profile
  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { firstName, lastName, phone, profileImageUrl, emailNotifications } = req.body;

      // Build update object, filtering out undefined values
      const updates: Record<string, any> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
      if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
      if (req.body.country !== undefined) updates.country = req.body.country;
      if (req.body.preferredLanguage !== undefined) updates.preferredLanguage = req.body.preferredLanguage;
      if (req.body.preferredContactMethod !== undefined) updates.preferredContactMethod = req.body.preferredContactMethod;

      const visitorPreferenceFields = [
        "accessibilityNeeds",
        "dietaryNotes",
        "emergencyContactName",
        "emergencyContactPhone",
      ];

      if (currentUser.role === "visitor" && visitorPreferenceFields.some((field) => req.body[field] !== undefined)) {
        const visitorPreferences = visitorPreferencesSchema.parse({
          country: req.body.country,
          phone: req.body.phone,
          preferredLanguage: req.body.preferredLanguage,
          preferredContactMethod: req.body.preferredContactMethod,
          accessibilityNeeds: req.body.accessibilityNeeds,
          dietaryNotes: req.body.dietaryNotes,
          emergencyContactName: req.body.emergencyContactName,
          emergencyContactPhone: req.body.emergencyContactPhone,
        });
        const existingPreferences = getUserPreferences(currentUser);
        const existingVisitorPreferences = existingPreferences.visitor || {};
        const nextVisitorPreferences = { ...existingVisitorPreferences };
        for (const field of visitorPreferenceFields) {
          if (visitorPreferences[field as keyof typeof visitorPreferences] !== undefined) {
            nextVisitorPreferences[field] = visitorPreferences[field as keyof typeof visitorPreferences] || "";
          }
        }

        updates.preferences = {
          ...existingPreferences,
          visitor: nextVisitorPreferences,
        };
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile update", errors: error.errors });
      }
      logError("Error updating profile", error, req.requestId);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/uploads/avatar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Session expired" });
      }

      const payload = profileImageUploadSchema.parse(req.body);
      if (payload.purpose === "guide_profile" && !["admin", "coordinator", "guide"].includes(user.role || "")) {
        return res.status(403).json({ message: "You do not have permission to upload guide photos" });
      }

      const contentType = payload.contentType.toLowerCase();
      const extension = allowedProfileImageTypes.get(contentType);
      if (!extension) {
        return res.status(400).json({ message: "Please upload a JPG, PNG, WEBP, or GIF image" });
      }

      const imageBuffer = parseProfileImageDataUrl(payload.dataUrl, contentType);
      if (imageBuffer.length === 0 || imageBuffer.length > MAX_PROFILE_IMAGE_BYTES) {
        return res.status(400).json({ message: "Please upload an image smaller than 5 MB" });
      }

      const folder = payload.purpose === "guide_profile" ? "guide-images" : "profile-images";
      const filePath = `${folder}/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
      const uploaded = await storage.uploadPublicStorageObject("avatars", filePath, imageBuffer, {
        contentType,
        cacheControl: "31536000",
      });

      await createAuditLog(userId, "update", "storage_object", uploaded.path, null, {
        bucket: "avatars",
        purpose: payload.purpose,
        contentType,
        size: imageBuffer.length,
      }, req);

      res.status(201).json(uploaded);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid image upload", errors: error.errors });
      }

      logError("Error uploading avatar image", error, req.requestId);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload image" });
    }
  });

  // Change password
  app.post("/api/auth/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      // Get user with password
      const user = await storage.getUser(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const validPassword = await verifyPassword(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);

      // Create audit log
      await createAuditLog(userId, "update", "user", userId, null, { action: "password_change" }, req);

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      logError("Error changing password", error, req.requestId);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Admin: Create user with specific role
  app.post("/api/auth/admin/create-user", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser(email, hashedPassword, firstName, lastName, role || "visitor");

      // Audit log
      const adminId = req.session.userId!;
      await createAuditLog(adminId, "create", "user", user.id, null, { email, firstName, lastName, role }, req);

      try {
        await sendWelcomeOrVerificationEmail(user, adminId);
      } catch (emailError) {
        logger.error("Failed to send welcome/verification email", emailError);
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      logError("Create user error", error, req.requestId);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Stats endpoint - admin and coordinator only
  app.get("/api/stats", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      logError("Error fetching stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/visitor-countries", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const countryCounts = new Map<string, number>();

      for (const booking of bookings) {
        const country = (booking.visitorCountry || "").trim();
        if (!country) continue;
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }

      const countries = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

      res.json({
        countries,
        knownCountries: countries.length,
        bookingsWithCountry: countries.reduce((sum, item) => sum + item.count, 0),
        totalBookings: bookings.length,
      });
    } catch (error) {
      logError("Error fetching visitor country stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch visitor country stats" });
    }
  });

  // Weekly booking trends for charts
  app.get("/api/stats/weekly", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const today = new Date();
      const weekData = [];

      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Compare dates by normalizing both to YYYY-MM-DD
        const dayBookings = bookings.filter(b => {
          if (!b.visitDate) return false;
          const bookingDate = b.visitDate.includes('T')
            ? b.visitDate.split('T')[0]
            : b.visitDate;
          return bookingDate === dateStr;
        });
        const revenue = dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        weekData.push({
          date: dayName,
          bookings: dayBookings.length,
          revenue
        });
      }

      // If no bookings in last 7 days, show counts by created date instead
      const hasData = weekData.some(d => d.bookings > 0);
      if (!hasData && bookings.length > 0) {
        // Count bookings by creation date instead
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

          const dayBookings = bookings.filter(b => {
            if (!b.createdAt) return false;
            const createdDate = new Date(b.createdAt).toISOString().split('T')[0];
            return createdDate === dateStr;
          });
          weekData[6 - i] = {
            date: dayName,
            bookings: dayBookings.length,
            revenue: dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
          };
        }
      }

      res.json(weekData);
    } catch (error) {
      logError("Error fetching weekly stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Popular zones for pie chart
  app.get("/api/stats/zones", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const zones = await storage.getZones();
      const zoneCounts: Record<string, number> = {};

      bookings.forEach(booking => {
        if (booking.selectedZones && Array.isArray(booking.selectedZones)) {
          booking.selectedZones.forEach(zoneId => {
            zoneCounts[zoneId] = (zoneCounts[zoneId] || 0) + 1;
          });
        }
      });

      const zoneData = Object.entries(zoneCounts)
        .map(([zoneId, visits]) => {
          const zone = zones.find(z => z.id === zoneId);
          return { name: zone?.name || zoneId.slice(0, 8), visits };
        })
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 6);

      // Return actual data only - no fake placeholder data
      res.json(zoneData);
    } catch (error) {
      logError("Error fetching zone stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch zone stats" });
    }
  });

  // Guide performance for bar chart
  app.get("/api/stats/guide-performance", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const guides = await storage.getGuides();
      const bookings = await storage.getBookings();

      const guideStats = guides
        .filter(g => g.isActive)
        .map(guide => {
          const allGuideTours = getGuideBookings(bookings, guide);
          const guideTours = allGuideTours.filter(b => b.status === 'completed');
          return {
            name: `${guide.firstName} ${guide.lastName.charAt(0)}.`,
            tours: guideTours.length || allGuideTours.length,
            rating: guide.rating || 0
          };
        })
        .sort((a, b) => b.tours - a.tours)
        .slice(0, 5);

      // Return actual data only - no fake placeholder data
      res.json(guideStats);
    } catch (error) {
      logError("Error fetching guide performance", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide performance" });
    }
  });

  app.get("/api/stats/heatmap", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      // Initialize 24x7 grid
      const data: { day: string; hour: number; value: number }[] = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          data.push({
            day: days[day],
            hour: hour,
            value: 0
          });
        }
      }

      // Fill with data
      let processedCount = 0;
      bookings.forEach(booking => {
        if (!booking.visitDate || !booking.visitTime) return;
        const date = new Date(booking.visitDate);
        const dayIndex = date.getDay();

        // Handle various time formats (HH:mm:ss or HH:mm)
        const timeStr = booking.visitTime.toString().trim();
        const hour = parseInt(timeStr.split(':')[0]);

        if (!isNaN(date.getTime()) && !isNaN(dayIndex) && !isNaN(hour) && hour >= 0 && hour < 24) {
          const index = dayIndex * 24 + hour;
          if (data[index]) {
            data[index].value++;
            processedCount++;
          }
        }
      });
      logger.debug("Heatmap stats processed", { totalBookings: bookings.length, processedCount });

      // Filter out zero values to reduce payload size if desired, but grid is better for heatmap
      res.json(data);
    } catch (error) {
      logError("Error fetching heatmap stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch heatmap stats" });
    }
  });

  app.get("/api/stats/seasonal", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const currentYear = new Date().getFullYear();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize months
      const data = months.map(m => ({ month: m, bookings: 0, revenue: 0 }));

      bookings.forEach(booking => {
        if (!booking.visitDate) return;
        const date = new Date(booking.visitDate);

        if (!isNaN(date.getTime())) {
          // Aggregate ALL years to show true seasonal trends
          const monthIndex = date.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].bookings++;
            // Add revenue if completed/confirmed
            if ((booking.status === 'completed' || booking.status === 'confirmed') && booking.totalAmount) {
              data[monthIndex].revenue += Number(booking.totalAmount);
            }
          }
        }
      });

      const totalBookings = data.reduce((acc, curr) => acc + curr.bookings, 0);
      logger.debug("Seasonal stats processed", { totalBookings });

      res.json(data);
    } catch (error) {
      logError("Error fetching seasonal stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch seasonal stats" });
    }
  });

  // Status Breakdown Stats (Cancellations, Completed, Pending, etc.)
  app.get("/api/stats/status-breakdown", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const statusCounts: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
      };

      bookings.forEach(booking => {
        const status = booking.status || "pending";
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        } else {
          statusCounts[status] = 1;
        }
      });

      const breakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0,
      }));

      res.json({
        total: bookings.length,
        breakdown,
        cancellationRate: bookings.length > 0 ? Math.round((statusCounts.cancelled / bookings.length) * 100) : 0,
        completionRate: bookings.length > 0 ? Math.round((statusCounts.completed / bookings.length) * 100) : 0,
      });
    } catch (error) {
      logError("Error fetching status breakdown", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch status breakdown" });
    }
  });

  // Total Participants Stats
  app.get("/api/stats/participants", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const totalParticipants = bookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0);
      const confirmedParticipants = bookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + (b.numberOfPeople || 1), 0);
      const averageGroupSize = bookings.length > 0 ? Math.round((totalParticipants / bookings.length) * 10) / 10 : 0;

      // Monthly breakdown
      const monthlyData: Record<string, number> = {};
      bookings.forEach(booking => {
        if (booking.visitDate) {
          const month = new Date(booking.visitDate).toISOString().slice(0, 7);
          monthlyData[month] = (monthlyData[month] || 0) + (booking.numberOfPeople || 1);
        }
      });

      res.json({
        totalParticipants,
        confirmedParticipants,
        averageGroupSize,
        totalBookings: bookings.length,
        monthlyBreakdown: Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, participants]) => ({ month, participants })),
      });
    } catch (error) {
      logError("Error fetching participant stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch participant stats" });
    }
  });

  // POI/Zone Selection Frequency
  app.get("/api/stats/poi-frequency", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const zones = await storage.getZones();
      const pois = await storage.getPointsOfInterest();

      const zoneCounts: Record<string, number> = {};
      const poiCounts: Record<string, number> = {};
      let bookingsWithZones = 0;
      let bookingsWithPois = 0;

      bookings.forEach(booking => {
        const selectedZones = booking.selectedZones as string[] | null;
        const selectedInterests = booking.selectedInterests as string[] | null;

        if (selectedZones && selectedZones.length > 0) {
          bookingsWithZones++;
          selectedZones.forEach(zoneId => {
            zoneCounts[zoneId] = (zoneCounts[zoneId] || 0) + 1;
          });
        }

        if (selectedInterests && selectedInterests.length > 0) {
          bookingsWithPois++;
          selectedInterests.forEach(poiId => {
            poiCounts[poiId] = (poiCounts[poiId] || 0) + 1;
          });
        }
      });

      const zoneFrequency = zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        count: zoneCounts[zone.id] || 0,
        percentage: bookings.length > 0 ? Math.round(((zoneCounts[zone.id] || 0) / bookings.length) * 100) : 0,
      })).sort((a, b) => b.count - a.count);

      const poiFrequency = pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        count: poiCounts[poi.id] || 0,
        percentage: bookings.length > 0 ? Math.round(((poiCounts[poi.id] || 0) / bookings.length) * 100) : 0,
      })).sort((a, b) => b.count - a.count);

      res.json({
        zones: zoneFrequency,
        pointsOfInterest: poiFrequency,
        bookingsWithZones,
        bookingsWithPois,
        totalBookings: bookings.length,
      });
    } catch (error) {
      logError("Error fetching POI frequency", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch POI frequency" });
    }
  });

  // Guide Utilization Stats
  app.get("/api/stats/guide-utilization", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const guides = await storage.getGuides();

      const guideStats: Record<string, { assigned: number; completed: number; cancelled: number }> = {};
      const guideIdAliases = new Map<string, string>();

      // Initialize all guides
      guides.forEach(guide => {
        guideStats[guide.id] = { assigned: 0, completed: 0, cancelled: 0 };
        guideIdAliases.set(guide.id, guide.id);
        if (guide.userId) guideIdAliases.set(guide.userId, guide.id);
      });

      // Count bookings per guide
      bookings.forEach(booking => {
        const canonicalGuideId = booking.assignedGuideId ? guideIdAliases.get(booking.assignedGuideId) : undefined;
        if (canonicalGuideId && guideStats[canonicalGuideId]) {
          guideStats[canonicalGuideId].assigned++;
          if (booking.status === "completed") {
            guideStats[canonicalGuideId].completed++;
          } else if (booking.status === "cancelled") {
            guideStats[canonicalGuideId].cancelled++;
          }
        }
      });

      const utilization = guides.map(guide => ({
        id: guide.id,
        name: `${guide.firstName} ${guide.lastName}`,
        assignedTours: guideStats[guide.id]?.assigned || 0,
        completedTours: guideStats[guide.id]?.completed || 0,
        cancelledTours: guideStats[guide.id]?.cancelled || 0,
        completionRate: guideStats[guide.id]?.assigned > 0
          ? Math.round((guideStats[guide.id].completed / guideStats[guide.id].assigned) * 100)
          : 0,
        isActive: guide.isActive !== false,
      })).sort((a, b) => b.assignedTours - a.assignedTours);

      const totalAssigned = utilization.reduce((sum, g) => sum + g.assignedTours, 0);
      const activeGuides = utilization.filter(g => g.isActive).length;

      res.json({
        guides: utilization,
        summary: {
          totalGuides: guides.length,
          activeGuides,
          totalAssignedTours: totalAssigned,
          averageToursPerGuide: activeGuides > 0 ? Math.round((totalAssigned / activeGuides) * 10) / 10 : 0,
        },
      });
    } catch (error) {
      logError("Error fetching guide utilization", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide utilization" });
    }
  });

  // Bookings endpoints - admin, coordinator, security can view all bookings; guides see only their assigned bookings
  app.get("/api/bookings", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.bookingsRead), requireRole("admin", "coordinator", "security", "guide"), async (req: any, res) => {
    try {
      // Trigger reminder check (debounced, runs in background)
      checkAndSendDueReminders();

      // Support optional pagination via query params
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      let bookingsList: Booking[];
      let paginationMeta;

      if (page !== undefined) {
        // Use paginated endpoint
        const result = await storage.getBookingsPaginated({ page, limit });
        bookingsList = result.data;
        paginationMeta = { total: result.total, page: result.page, limit: result.limit, hasMore: result.hasMore };
      } else {
        // Original behavior - return all
        bookingsList = await storage.getBookings();
      }

      // If user is a guide, filter to only their assigned bookings
      const currentUser = req.currentUser;
      if (currentUser?.role === "guide") {
        // Find the guide profile for this user
        const guideProfile = await storage.getGuideByUserId(currentUser.id);
        if (guideProfile) {
          bookingsList = bookingsList.filter(b => isBookingAssignedToGuide(b, guideProfile));
        } else {
          // No guide profile - return empty list
          bookingsList = [];
        }
      }

      const guides = await storage.getGuides();
      const guidesMap = buildGuideLookup(guides);

      const role = currentUser?.role as UserRole | undefined;
      const bookingsWithGuides = bookingsList.map(booking => {
        const guide = booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null;
        return {
          ...buildSafeBookingForRole(booking, role),
          guide: role === "admin" || role === "coordinator" || role === "security" ? guide : buildAssignedGuideSummary(guide),
        };
      });

      if (paginationMeta) {
        res.json({ data: bookingsWithGuides, ...paginationMeta });
      } else {
        res.json(bookingsWithGuides);
      }
    } catch (error) {
      logError("Error fetching bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Search bookings endpoint
  app.get("/api/bookings/search", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const query = (req.query.q as string) || "";
      const status = req.query.status as string | undefined;
      const paymentStatus = req.query.paymentStatus as string | undefined;

      if (!query.trim()) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const bookings = await storage.searchBookings(query.trim(), {
        status: status as any,
        paymentStatus: paymentStatus as any
      });

      const guides = await storage.getGuides();
      const guidesMap = buildGuideLookup(guides);

      const bookingsWithGuides = bookings.map(booking => ({
        ...booking,
        guide: booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null
      }));

      res.json(bookingsWithGuides);
    } catch (error) {
      logError("Error searching bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to search bookings" });
    }
  });

  app.get("/api/bookings/recent", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const recentBookings = await storage.getRecentBookings(10);

      const guides = await storage.getGuides();
      const guidesMap = buildGuideLookup(guides);

      const bookingsWithGuides = recentBookings.map(booking => ({
        ...booking,
        guide: booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null
      }));

      res.json(bookingsWithGuides);
    } catch (error) {
      logError("Error fetching recent bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch recent bookings" });
    }
  });

  app.get("/api/bookings/today", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.bookingsRead), requireRole("admin", "coordinator", "security", "guide"), async (req, res) => {
    try {
      let todaysBookings = await storage.getTodaysBookings();
      const currentUser = (req as any).currentUser;

      if (currentUser?.role === "guide") {
        const guide = await storage.getGuideByUserId(currentUser.id);
        todaysBookings = guide
          ? todaysBookings.filter((booking) => isBookingAssignedToGuide(booking, guide))
          : [];
      }

      // Use the full guide list so legacy assignments saved by guide user ID still resolve.
      const guides = await storage.getGuides();
      const guidesMap = buildGuideLookup(guides);

      const role = currentUser?.role as UserRole | undefined;
      const bookingsWithGuides = todaysBookings.map(booking => {
        const guide = booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null;
        return {
          ...buildSafeBookingForRole(booking, role),
          guide: role === "admin" || role === "coordinator" || role === "security" ? guide : buildAssignedGuideSummary(guide),
        };
      });

      res.json(bookingsWithGuides);
    } catch (error) {
      logError("Error fetching today's bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch today's bookings" });
    }
  });

  // Active visits (checked in but not checked out) - security, admin, coordinator
  app.get("/api/bookings/active", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const activeVisits = await storage.getActiveVisits();

      const guides = await storage.getGuides();
      const guidesMap = buildGuideLookup(guides);

      const bookingsWithGuides = activeVisits.map(booking => ({
        ...booking,
        guide: booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null
      }));

      res.json(bookingsWithGuides);
    } catch (error) {
      logError("Error fetching active visits", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch active visits" });
    }
  });

  // Visitor's own bookings - visitor role (with guide info)
  app.get("/api/bookings/my-bookings", isAuthenticated, requireRole("visitor"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get bookings by visitor user ID or email
      const allBookings = await storage.getBookings();
      const myBookings = allBookings.filter(b => visitorOwnsBooking(b, user));

      // Add guide and visitor-safe transport details to each booking
      const bookingIds = myBookings.map((booking) => booking.id);
      const [guides, transportRequests] = await Promise.all([
        storage.getGuides(),
        storage.getTransportRequestsByBookingIds(bookingIds),
      ]);
      const transportPartnerIds = Array.from(new Set(
        transportRequests.map((request) => request.partnerId).filter(Boolean) as string[]
      ));
      const transportPartners = transportPartnerIds.length
        ? await Promise.all(transportPartnerIds.map((partnerId) => storage.getTransportPartner(partnerId)))
        : [];
      const transportPartnerMap = new Map(
        transportPartners
          .filter(Boolean)
          .map((partner) => [partner!.id, partner!])
      );
      const guideMap = buildGuideLookup(guides);
      const bookingsWithGuide = myBookings.map(booking => {
        const guide = booking.assignedGuideId
          ? guideMap.get(booking.assignedGuideId)
          : null;
        const transportRequest = transportRequests
          .filter((request) => request.bookingId === booking.id)
          .sort((a, b) => dateSortValue(b.updatedAt || b.createdAt) - dateSortValue(a.updatedAt || a.createdAt))[0] || null;
        const partner = transportRequest?.partnerId
          ? transportPartnerMap.get(transportRequest.partnerId) || null
          : null;
        return {
          ...buildSafeBookingForRole(booking, "visitor"),
          guide: buildAssignedGuideSummary(guide),
          transportRequest: buildVisitorTransportRequestSummary(transportRequest, partner),
        };
      });

      res.json(bookingsWithGuide);
    } catch (error) {
      logError("Error fetching my bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // ==================== VISITOR FEATURES ====================

  // Saved Itineraries - List
  app.get("/api/visitors/saved-itineraries", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const itineraries = await storage.getSavedItineraries(userId);
      res.json(itineraries);
    } catch (error) {
      logError("Error fetching saved itineraries", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch saved itineraries" });
    }
  });

  // Saved Itineraries - Create
  app.post("/api/visitors/saved-itineraries", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const { name, tourType, groupSize, numberOfPeople, selectedZones, selectedInterests, customDuration, meetingPointId, specialRequests } = req.body;

      const itinerary = await storage.createSavedItinerary({
        userId,
        name,
        tourType,
        groupSize,
        numberOfPeople,
        selectedZones,
        selectedInterests,
        customDuration,
        meetingPointId,
        specialRequests,
      });

      res.status(201).json(itinerary);
    } catch (error) {
      logError("Error saving itinerary", error, req.requestId);
      res.status(500).json({ message: "Failed to save itinerary" });
    }
  });

  // Saved Itineraries - Delete
  app.delete("/api/visitors/saved-itineraries/:id", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const itineraryId = req.params.id;

      await storage.deleteSavedItinerary(itineraryId, userId);
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting saved itinerary", error, req.requestId);
      res.status(500).json({ message: "Failed to delete itinerary" });
    }
  });

  // Favorite Guides - List
  app.get("/api/visitors/favorite-guides", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const favorites = await storage.getFavoriteGuides(userId);

      // Get full guide details for each favorite
      const guideIds = favorites.map(f => f.guideId);
      const guides = await storage.getGuidesByIds(guideIds);

      const result = favorites.map(fav => ({
        ...fav,
        guide: guides.find(g => g.id === fav.guideId) || null,
      }));

      res.json(result);
    } catch (error) {
      logError("Error fetching favorite guides", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch favorite guides" });
    }
  });

  // Favorite Guides - Add
  app.post("/api/visitors/favorite-guides/:guideId", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const guideId = req.params.guideId;

      // Check if already favorited
      const existing = await storage.getFavoriteGuide(userId, guideId);
      if (existing) {
        return res.status(400).json({ message: "Guide already in favorites" });
      }

      const favorite = await storage.createFavoriteGuide({ userId, guideId });
      res.status(201).json(favorite);
    } catch (error) {
      logError("Error adding favorite guide", error, req.requestId);
      res.status(500).json({ message: "Failed to add favorite guide" });
    }
  });

  // Favorite Guides - Remove
  app.delete("/api/visitors/favorite-guides/:guideId", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const guideId = req.params.guideId;

      await storage.deleteFavoriteGuide(userId, guideId);
      res.json({ success: true });
    } catch (error) {
      logError("Error removing favorite guide", error, req.requestId);
      res.status(500).json({ message: "Failed to remove favorite guide" });
    }
  });

  // Visit History Export (simple JSON for now, frontend will generate PDF)
  app.get("/api/visitors/export-history", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all completed bookings for this user
      const allBookings = await storage.getBookings();
      const completedBookings = allBookings.filter(b =>
        visitorOwnsBooking(b, user) &&
        b.status === "completed"
      );

      // Get guide details
      const guides = await storage.getGuides();
      const guideMap = buildGuideLookup(guides);
      const zones = await storage.getZones();

      const exportData = {
        visitor: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        exportDate: new Date().toISOString(),
        totalVisits: completedBookings.length,
        visits: completedBookings.map(booking => {
          const guide = booking.assignedGuideId
            ? guideMap.get(booking.assignedGuideId)
            : null;
          const zoneNames = (booking.selectedZones || [])
            .map(zId => zones.find(z => z.id === zId)?.name)
            .filter(Boolean);

          return {
            bookingReference: booking.bookingReference,
            visitDate: booking.visitDate,
            visitTime: booking.visitTime,
            tourType: booking.tourType,
            numberOfPeople: booking.numberOfPeople,
            zones: zoneNames,
            guide: guide ? `${guide.firstName} ${guide.lastName}` : null,
            totalAmount: booking.totalAmount,
            rating: booking.visitorRating,
          };
        }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()),
      };

      res.json(exportData);
    } catch (error) {
      logError("Error exporting visit history", error, req.requestId);
      res.status(500).json({ message: "Failed to export visit history" });
    }
  });


  // Guide's assigned tours - guide role
  app.get("/api/bookings/my-tours", isAuthenticated, requireRole("guide"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the guide associated with this user
      const guides = await storage.getGuides();
      const myGuide = guides.find(g => g.userId === userId || g.email === user.email);

      if (!myGuide) {
        return res.json([]); // No guide profile for this user
      }

      // Get bookings assigned to this guide
      const allBookings = await storage.getBookings();
      const myTours = allBookings.filter(b => isBookingAssignedToGuide(b, myGuide));
      res.json(myTours.map((booking) => buildSafeBookingForRole(booking, "guide")));
    } catch (error) {
      logError("Error fetching my tours", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  // Public booking verification returns only coarse validity information.
  app.get("/api/public/bookings/verify/:reference", publicBookingVerifyLimiter, async (req, res) => {
    try {
      const reference = String(req.params.reference || "").trim();
      const booking = await storage.getBookingByReference(reference);
      if (!booking) {
        logger.warn("Public booking verification failed", {
          requestId: req.requestId,
          referenceFingerprint: tokenFingerprint(reference.toLowerCase()),
        });
        return res.status(404).json({ valid: false, statusCategory: "not_found" });
      }

      res.json({
        valid: true,
        statusCategory: getBookingStatusCategory(booking),
      });
    } catch (error) {
      logError("Error verifying public booking", error, req.requestId);
      res.status(500).json({ message: "Failed to verify booking" });
    }
  });

  // Security gate verification with full details.
  app.get("/api/bookings/verify/:reference", isAuthenticated, requireRole("security", "admin", "coordinator"), async (req, res) => {
    try {
      const booking = await storage.getBookingByReference(req.params.reference);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      // Return limited info for security verification
      res.json({
        id: booking.id,
        bookingReference: booking.bookingReference,
        visitorName: booking.visitorName,
        visitDate: booking.visitDate,
        visitTime: booking.visitTime,
        numberOfPeople: booking.numberOfPeople,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        checkInTime: booking.checkInTime,
        checkOutTime: booking.checkOutTime,
      });
    } catch (error) {
      logError("Error verifying booking", error, req.requestId);
      res.status(500).json({ message: "Failed to verify booking" });
    }
  });

  app.get("/api/bookings/:id/itinerary", isAuthenticated, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check ownership or admin role
      const user = await storage.getUser(req.session?.userId || "");
      const isOwner = visitorOwnsBooking(booking, user);
      const isAdmin = user && (user.role === "admin" || user.role === "coordinator");

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const itinerary = await storage.getItineraryByBookingId(bookingId);
      if (!itinerary) {
        return res.status(404).json({ message: "Itinerary not found" });
      }

      res.json(itinerary);
    } catch (error) {
      logError("Error fetching itinerary", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch itinerary" });
    }
  });

  app.get("/api/my-itineraries", isAuthenticated, async (req, res) => {
    try {
      if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
      const itineraries = await storage.getItinerariesByUser(req.session.userId);
      res.json(itineraries);
    } catch (error) {
      logError("Error fetching user itineraries", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch itineraries" });
    }
  });

  // Get single booking by ID
  app.get("/api/bookings/:id", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.bookingsRead), async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Authorization check
      const user = await getRequestUser(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isVisitor = user.role === "visitor";
      const isGuide = user.role === "guide";
      const isAdminOrCoord = ["admin", "coordinator", "security"].includes(user.role || "");

      if (isVisitor && !visitorOwnsBooking(booking, user)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (isGuide) {
        const guide = await storage.getGuideByUserId(user.id);
        if (!guide || !isBookingAssignedToGuide(booking, guide)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // If not admin/coord and access not granted above, block (though logic above handles visitor/guide specific checks)
      // Actually simpler:
      if (!isAdminOrCoord) {
        if (isVisitor && !visitorOwnsBooking(booking, user)) {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (isGuide) {
          const guide = await storage.getGuideByUserId(user.id);
          if (!guide || !isBookingAssignedToGuide(booking, guide)) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
        if (!isVisitor && !isGuide) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Fetch guide and meeting point details for assigned booking views.
      const guide = await getAssignedGuide(booking);
      const meetingPoint = booking.meetingPointId
        ? await storage.getMeetingPoint(booking.meetingPointId)
        : null;

      const transportRequests = await storage.getTransportRequestsByBookingIds([booking.id]);
      const transportRequest = transportRequests
        .sort((a, b) => dateSortValue(b.updatedAt || b.createdAt) - dateSortValue(a.updatedAt || a.createdAt))[0] || null;
      const transportPartner = transportRequest?.partnerId
        ? await storage.getTransportPartner(transportRequest.partnerId)
        : null;

      const bookingForResponse = buildSafeBookingForRole(booking, user.role as UserRole);
      const canSeeAdminTransportDetails = user.role === "admin" || user.role === "coordinator";
      const transportRequestPayload = transportRequest
        ? canSeeAdminTransportDetails
          ? { ...transportRequest, partner: transportPartner }
          : buildVisitorTransportRequestSummary(transportRequest, transportPartner)
        : null;

	      res.json({
	        ...bookingForResponse,
	        guide: isAdminOrCoord ? guide : buildAssignedGuideSummary(guide),
	        meetingPoint,
	        transportRequest: transportRequestPayload,
	      });
	    } catch (error) {
	      logError("Error fetching booking details", error, req.requestId);
	      res.status(500).json({ message: "Failed to fetch booking details" });
	    }
	  });

	  app.patch("/api/bookings/:id/community-highlights", isAuthenticated, async (req: any, res) => {
	    try {
	      const { id } = req.params;
	      const payload = communityHighlightsSchema.parse(req.body);
	      const booking = await storage.getBooking(id);
	      const user = await storage.getUser(req.session.userId!);

	      if (!booking) {
	        return res.status(404).json({ message: "Booking not found" });
	      }
	      if (!user) {
	        return res.status(401).json({ message: "Unauthorized" });
	      }

	      const isOwner = user.role === "visitor" && visitorOwnsBooking(booking, user);
	      const canManage = user.role === "admin" || user.role === "coordinator";
	      if (!isOwner && !canManage) {
	        return res.status(403).json({ message: "Only the booking visitor or staff can update community highlights" });
	      }

	      const selectedCommunityListings = Array.from(new Set(payload.selectedCommunityListings));
	      if (selectedCommunityListings.length > 0) {
	        const approvedListings = await storage.getCommunityListings({ status: publicCommunityListingStatuses });
	        const approvedIds = new Set(approvedListings.map((listing) => listing.id));
	        const invalidIds = selectedCommunityListings.filter((listingId) => !approvedIds.has(listingId));
	        if (invalidIds.length > 0) {
	          return res.status(400).json({ message: "One or more community listings are not available" });
	        }
	      }

	      const updated = await storage.updateBooking(id, { selectedCommunityListings });
	      if (!updated) {
	        return res.status(500).json({ message: "Failed to update community highlights" });
	      }

	      await storage.createBookingActivityLog({
	        bookingId: id,
	        userId: user.id,
	        action: "community_highlights_updated",
	        description: `${user.role === "visitor" ? "Visitor" : "Staff"} updated Community Hub highlights.`,
	      });

	      await createAuditLog(
	        user.id,
	        "update",
	        "booking",
	        id,
	        { selectedCommunityListings: booking.selectedCommunityListings || [] },
	        { selectedCommunityListings },
	        req
	      );

	      res.json(buildSafeBookingForRole(updated, user.role as UserRole));
	    } catch (error) {
	      if (error instanceof z.ZodError) {
	        return res.status(400).json({ message: "Invalid community highlights", errors: error.errors });
	      }
	      logError("Error updating community highlights", error, req.requestId);
	      res.status(500).json({ message: "Failed to update community highlights" });
	    }
	  });

  app.post("/api/bookings", authenticateApiKeyIfPresent(API_KEY_ROUTE_SCOPES.bookingsWrite), async (req, res) => {
    try {
      const transportPayload = transportRequestPayloadSchema.parse(req.body);
      const bookingData = insertBookingSchema.parse(req.body);
      const bookingVisitorEmail = normalizedEmail(bookingData.visitorEmail) || bookingData.visitorEmail.trim();
      const linkedVisitor = bookingVisitorEmail ? await storage.getUserByEmail(bookingVisitorEmail) : undefined;
      const baseTotalAmount = await calculateTotalAmount(
        bookingData.groupSize,
        bookingData.tourType,
        bookingData.customDuration || undefined
      );
      const specialOffer = await storage.findApplicableSpecialOffer({
        groupSize: bookingData.groupSize,
        tourType: bookingData.tourType,
        visitDate: bookingData.visitDate,
        visitTime: bookingData.visitTime,
        seats: bookingData.numberOfPeople || 1,
      });
      const { totalAmount, discountAmount } = applySpecialOfferAmount(baseTotalAmount, specialOffer);
      const booking = await storage.createBooking({
        ...bookingData,
        visitorEmail: bookingVisitorEmail,
        visitorUserId: bookingData.visitorUserId || linkedVisitor?.id || null,
        totalAmount,
        paymentDetails: {
          ...(bookingData.paymentDetails as Record<string, unknown> | null || {}),
          ...(specialOffer ? {
            specialOffer: {
              id: specialOffer.id,
              name: specialOffer.name,
              discountPercent: specialOffer.discountPercent,
              originalAmount: baseTotalAmount,
              discountAmount,
            }
          } : {}),
        },
      });

      if (specialOffer) {
        await storage.incrementSpecialOfferUsage(specialOffer.id, bookingData.numberOfPeople || 1);
      }

      if (transportPayload.transportRequested) {
        let partnerId: string | null = null;
        let assignedPartner: TransportPartner | null = null;
        if (transportPayload.transportPartnerId) {
          const partner = await storage.getTransportPartner(transportPayload.transportPartnerId);
          assignedPartner = partner || null;
          partnerId = assignedPartner?.id || null;
        }

        const transportRequest = await storage.createTransportRequest({
          bookingId: booking.id,
          partnerId,
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          visitorPhone: booking.visitorPhone,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          route: transportPayload.transportRoute || "lilongwe-dzaleka",
          pickupLocation: transportPayload.transportPickup || null,
          notes: transportPayload.transportNotes || null,
          status: partnerId ? "sent_to_partner" : "pending",
          createdByUserId: req.session?.userId || null,
        });

        try {
          await sendTransportRequestReceivedEmail(
            transportRequest,
            booking,
            assignedPartner,
            req.session?.userId || null
          );
        } catch (emailError) {
          logError("Failed to send transport request acknowledgement email", emailError, req.requestId);
        }

        if (assignedPartner) {
          try {
            const actor = req.session?.userId ? await storage.getUser(req.session.userId) : null;
            await sendTransportAssignmentEmail(transportRequest, assignedPartner, booking, actor || null);
          } catch (emailError) {
            logError("Failed to send transport assignment email", emailError, req.requestId);
          }
        } else {
          try {
            const actor = req.session?.userId ? await storage.getUser(req.session.userId) : null;
            await sendTransportPendingAdminEmails(transportRequest, booking, actor || null);
          } catch (emailError) {
            logError("Failed to send pending transport admin email", emailError, req.requestId);
          }
        }
      }

      // Send confirmation email
      const meetingPoint = bookingData.meetingPointId
        ? await storage.getMeetingPoint(bookingData.meetingPointId)
        : null;

      const requestEmail = await sendAutomatedTemplateEmail({
        templateName: "booking_request_received",
        recipientName: booking.visitorName,
        recipientEmail: booking.visitorEmail,
        data: buildBookingTemplateData(booking, {
          meeting_point: meetingPoint?.name,
        }),
        fallbackSubject: `Booking Request Received - ${booking.bookingReference}`,
        fallbackMessage: `Booking request received for ${booking.visitorName} (${booking.bookingReference}).`,
        fallbackSend: () => sendBookingConfirmationDetailed({
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          bookingReference: booking.bookingReference!,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          tourType: booking.tourType,
          numberOfPeople: booking.numberOfPeople || 1,
          totalAmount: booking.totalAmount || 0,
          meetingPoint: meetingPoint?.name,
        }),
      });

      await storage.createEmailLog({
        recipientName: booking.visitorName,
        recipientEmail: booking.visitorEmail,
        subject: requestEmail.subject,
        message: requestEmail.message,
        templateType: "booking_request_received",
        status: requestEmail.result.success ? "accepted" : "failed",
        errorMessage: requestEmail.result.error,
        providerMessageId: requestEmail.result.messageId,
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        metadata: buildEmailLogMetadata(booking, requestEmail),
      });

      // Notify admins/coordinators
      await notifyBookingCreated(
        booking.id,
        booking.visitorName,
        booking.visitDate
      );

      // Dispatch Webhook
      WebhookDispatcher.dispatch("booking.created", booking);

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        logError("Error creating booking", error, req.requestId);
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  app.use("/api/transport-partner", isAuthenticated, requireActivePartnerIfPartner());

  app.get("/api/transport-partner/me", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), requireActivePartnerIfPartner(), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      if (user.role === "admin" || user.role === "coordinator") {
        const partners = await storage.getTransportPartners();
        return res.json({ user, partner: null, partners });
      }

      const partner = await getCurrentTransportPartner(user);
      res.json({ user, partner });
    } catch (error) {
      logError("Error fetching transport partner profile", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch transport partner profile" });
    }
  });

  app.get("/api/public/transport-partners", async (_req, res) => {
    try {
      const partners = await storage.getTransportPartners();
      res.json(partners
        .filter((partner) => partner.status === "active")
        .map((partner) => ({
          id: partner.id,
          companyName: partner.companyName,
          contactName: partner.contactName,
          serviceAreas: partner.serviceAreas || [],
          publicNotes: partner.publicNotes || partner.notes || null,
          baseLocation: partner.baseLocation || null,
        })));
    } catch (error) {
      logError("Error fetching public transport partners", error);
      res.status(500).json({ message: "Failed to fetch transport partners" });
    }
  });

  app.get("/api/public/transport-quotes/:token", publicTransportQuoteViewLimiter, async (req, res) => {
    try {
      const request = await storage.getTransportRequestByQuoteToken(req.params.token);
      if (!request) {
        return res.status(404).json({ message: "Transport quote not found" });
      }
      if (!request.quoteDecision && (!TRANSPORT_QUOTE_REVIEW_STATUSES.has(request.status || "") || isTransportQuoteExpired(request))) {
        return res.status(410).json({ message: "This transport quote link has expired" });
      }
      const partner = request.partnerId ? await storage.getTransportPartner(request.partnerId) : undefined;
      res.json(buildPublicTransportQuoteResponse(request, partner));
    } catch (error) {
      logError("Error fetching public transport quote", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch transport quote" });
    }
  });

  app.post("/api/public/transport-quotes/:token/decision", publicTransportQuoteDecisionLimiter, async (req, res) => {
    try {
      const payload = publicQuoteDecisionSchema.parse(req.body);
      const request = await storage.getTransportRequestByQuoteToken(req.params.token);
      if (!request) {
        return res.status(404).json({ message: "Transport quote not found" });
      }
      if (request.quoteDecision) {
        return res.status(409).json({ message: "This transport quote has already been answered" });
      }
      if (request.status === "cancelled" || request.status === "completed") {
        return res.status(409).json({ message: "This transport quote can no longer be changed" });
      }
      if (!TRANSPORT_QUOTE_REVIEW_STATUSES.has(request.status || "") || request.quotedAmount == null) {
        return res.status(409).json({ message: "This transport quote is not ready for visitor approval" });
      }
      if (isTransportQuoteExpired(request)) {
        return res.status(410).json({ message: "This transport quote link has expired" });
      }
      if (normalizedEmail(payload.confirmationEmail) !== normalizedEmail(request.visitorEmail)) {
        logger.warn("Transport quote email confirmation failed", {
          requestId: req.requestId,
          requestIdHash: tokenFingerprint(request.id),
        });
        return res.status(403).json({ message: "The email does not match this transport request" });
      }

      const newStatus = payload.decision === "approved" ? "visitor_approved" : "visitor_declined";
      const updated = await storage.updateTransportRequest(request.id, {
        status: newStatus as TransportRequestStatus,
        quoteDecision: payload.decision,
        quoteDecisionAt: new Date() as any,
        quoteDecisionNotes: payload.notes || null,
      });
      if (!updated) {
        return res.status(404).json({ message: "Transport quote not found" });
      }

      await logTransportRequestActivity(
        request.id,
        payload.decision === "approved" ? "visitor_approved_quote" : "visitor_declined_quote",
        null,
        { notes: payload.notes || null },
        request.status,
        newStatus
      );

      let notificationEmails: Array<{ sent?: boolean; success?: boolean; error?: string; audience?: string; recipientEmail?: string }> = [];
      try {
        const [partner, booking] = await Promise.all([
          updated.partnerId ? storage.getTransportPartner(updated.partnerId) : Promise.resolve(undefined),
          updated.bookingId ? storage.getBooking(updated.bookingId) : Promise.resolve(undefined),
        ]);
        notificationEmails = await sendTransportQuoteDecisionEmails({
          request: updated,
          partner,
          booking,
          decision: payload.decision,
          decisionNotes: payload.notes || null,
        });
      } catch (emailError) {
        logError("Failed to send transport quote decision emails", emailError, req.requestId);
      }

      const partner = updated.partnerId ? await storage.getTransportPartner(updated.partnerId) : undefined;
      res.json({
        ...buildPublicTransportQuoteResponse(updated, partner),
        notificationsSent: notificationEmails.some((email) => email.sent || email.success),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote decision", errors: error.errors });
      }
      logError("Error saving transport quote decision", error, req.requestId);
      res.status(500).json({ message: "Failed to save quote decision" });
    }
  });

  app.post("/api/transport-partners", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = transportPartnerPayloadSchema.parse(req.body);
      const partner = await storage.createTransportPartner({
        ...payload,
        email: payload.email.toLowerCase(),
      });
      await createAuditLog(req.session.userId, "create", "transport_partner", partner.id, null, payload, req);
      res.status(201).json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transport partner", errors: error.errors });
      }
      logError("Error creating transport partner", error, req.requestId);
      res.status(500).json({ message: "Failed to create transport partner" });
    }
  });

  app.patch("/api/transport-partners/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = transportPartnerPayloadSchema.partial().parse(req.body);
      const existing = await storage.getTransportPartner(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Transport partner not found" });
      }

      const partner = await storage.updateTransportPartner(req.params.id, {
        ...payload,
        ...(payload.email ? { email: payload.email.toLowerCase() } : {}),
      });
      await createAuditLog(req.session.userId, "update", "transport_partner", req.params.id, existing, payload, req);
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transport partner update", errors: error.errors });
      }
      logError("Error updating transport partner", error, req.requestId);
      res.status(500).json({ message: "Failed to update transport partner" });
    }
  });

  app.patch("/api/transport-partners/:id/link-user", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = z.object({
        userId: z.string().trim().min(1).nullable().optional(),
      }).parse(req.body);
      const existing = await storage.getTransportPartner(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Transport partner not found" });
      }

      const partner = await storage.updateTransportPartner(req.params.id, {
        userId: payload.userId || null,
      });
      await createAuditLog(req.session.userId, "update", "transport_partner", req.params.id, existing, { userId: payload.userId || null }, req);
      res.json(partner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid linked user update", errors: error.errors });
      }
      logError("Error updating transport partner linked user", error, req.requestId);
      res.status(500).json({ message: "Failed to update linked user" });
    }
  });

  app.post("/api/transport-partners/:id/send-invite", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = await storage.getTransportPartner(req.params.id);
      if (!partner) {
        return res.status(404).json({ message: "Transport partner not found" });
      }

      const partnerEmail = partner.email.toLowerCase();
      const existingUser = await storage.getUserByEmail(partnerEmail);
      if (existingUser) {
        if (existingUser.role !== "transport_partner") {
          return res.status(409).json({
            message: `A user already exists for ${partner.email} with the ${existingUser.role || "visitor"} role. Update that user role before linking this partner account.`,
          });
        }

        const linked = partner.userId === existingUser.id
          ? partner
          : await storage.updateTransportPartner(partner.id, { userId: existingUser.id });

        await createAuditLog(user.id, "update", "transport_partner", partner.id, partner, { userId: existingUser.id }, req);
        return res.json({
          mode: "existing_user",
          sent: false,
          linkedUserId: existingUser.id,
          partner: linked || partner,
        });
      }

      const inviteResult = await ensureUserInvite(partnerEmail, "transport_partner", user.id);
      const inviteUrl = `${PUBLIC_APP_URL}/accept-invite?token=${inviteResult.invite.inviteToken}`;
      const emailResult = await sendInvitationEmailDetailed({
        email: partnerEmail,
        role: "transport_partner",
        inviteUrl,
        inviterName: getDisplayName(user),
      });

      await storage.createEmailLog({
        sentBy: user.id,
        recipientName: partner.contactName || partner.companyName,
        recipientEmail: partnerEmail,
        subject: "You have been invited to Visit Dzaleka",
        message: "Transport partner portal invitation sent.",
        templateType: "transport_partner_invite",
        status: emailResult.success ? "accepted" : "failed",
        errorMessage: emailResult.error,
        providerMessageId: emailResult.messageId,
        relatedEntityType: "transport_partner",
        relatedEntityId: partner.id,
        metadata: {
          inviteId: inviteResult.invite.id,
          inviteMode: inviteResult.mode,
          role: "transport_partner",
        },
      });

      await createAuditLog(user.id, "create", "user_invite", inviteResult.invite.id, null, { email: partnerEmail, role: "transport_partner", partnerId: partner.id }, req);

      res.json({
        mode: inviteResult.mode,
        sent: emailResult.success,
        error: emailResult.error,
        inviteId: inviteResult.invite.id,
      });
    } catch (error) {
      logError("Error sending transport partner invite", error, req.requestId);
      res.status(500).json({ message: "Failed to send transport partner invite" });
    }
  });

  app.delete("/api/transport-partners/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const existing = await storage.getTransportPartner(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Transport partner not found" });
      }
      if (!(await requireOperationApproval(req, res, "partner_deletion", "Deleting transport partners"))) {
        return;
      }

      await storage.deleteTransportPartner(req.params.id);
      await createAuditLog(req.session.userId, "delete", "transport_partner", req.params.id, existing, null, req);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting transport partner", error, req.requestId);
      res.status(500).json({ message: "Failed to delete transport partner" });
    }
  });

  app.patch("/api/transport-partner/me", isAuthenticated, requireRole("transport_partner"), requireActivePartnerIfPartner(), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = transportPartnerSelfUpdateSchema.parse(req.body);
      const partner = await getCurrentTransportPartner(user);
      const updated = await storage.updateTransportPartner(partner.id, payload);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile update", errors: error.errors });
      }
      logError("Error updating transport partner profile", error, req.requestId);
      res.status(500).json({ message: "Failed to update transport partner profile" });
    }
  });

  app.get("/api/transport-partner/requests", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), requireActivePartnerIfPartner(), async (req: any, res) => {
    try {
      checkAndSendDueReminders();

      const user = (req as any).currentUser as User;
      const partner = user.role === "transport_partner" ? await getCurrentTransportPartner(user) : null;
      const requests = await storage.getTransportRequests(partner?.id);
      res.json(requests);
    } catch (error) {
      logError("Error fetching transport requests", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch transport requests" });
    }
  });

  app.get("/api/transport-partner/requests/:id/activity", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), requireActivePartnerIfPartner(), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const request = await storage.getTransportRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Transport request not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (request.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only view activity for your assigned requests" });
        }
      }
      const activity = await storage.getTransportRequestActivity(req.params.id);
      res.json(activity);
    } catch (error) {
      logError("Error fetching transport request activity", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch transport activity" });
    }
  });

  app.get("/api/transport-partner/drivers", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = await resolveTransportPartnerScope(user, req.query.partnerId as string | undefined);
      const drivers = await storage.getTransportPartnerDrivers(partner?.id);
      res.json(drivers);
    } catch (error) {
      logError("Error fetching transport drivers", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.post("/api/transport-partner/drivers", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = transportRosterDriverSchema.parse(req.body);
      const partner = await resolveTransportPartnerScope(user, payload.partnerId);
      if (!partner) {
        return res.status(400).json({ message: "Choose a transport partner" });
      }
      const driver = await storage.createTransportPartnerDriver({
        partnerId: partner.id,
        name: payload.name,
        phone: payload.phone || null,
        email: payload.email || null,
        licenseNumber: payload.licenseNumber || null,
        status: payload.status,
        notes: payload.notes || null,
      });
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver", errors: error.errors });
      }
      logError("Error creating transport driver", error, req.requestId);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.patch("/api/transport-partner/drivers/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerDriver(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Driver not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only update your own drivers" });
        }
      }
      const payload = transportRosterDriverSchema.partial().parse(req.body);
      const driver = await storage.updateTransportPartnerDriver(req.params.id, {
        ...payload,
        email: payload.email || null,
      });
      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver", errors: error.errors });
      }
      logError("Error updating transport driver", error, req.requestId);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/api/transport-partner/drivers/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerDriver(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Driver not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only delete your own drivers" });
        }
      }
      await storage.deleteTransportPartnerDriver(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting transport driver", error, req.requestId);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  app.get("/api/transport-partner/vehicles", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = await resolveTransportPartnerScope(user, req.query.partnerId as string | undefined);
      const vehicles = await storage.getTransportPartnerVehicles(partner?.id);
      res.json(vehicles);
    } catch (error) {
      logError("Error fetching transport vehicles", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/transport-partner/vehicles", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = transportRosterVehicleSchema.parse(req.body);
      const partner = await resolveTransportPartnerScope(user, payload.partnerId);
      if (!partner) {
        return res.status(400).json({ message: "Choose a transport partner" });
      }
      const vehicle = await storage.createTransportPartnerVehicle({
        partnerId: partner.id,
        label: payload.label,
        vehicleType: payload.vehicleType || null,
        plateNumber: payload.plateNumber || null,
        capacity: payload.capacity || null,
        color: payload.color || null,
        status: payload.status,
        notes: payload.notes || null,
      });
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle", errors: error.errors });
      }
      logError("Error creating transport vehicle", error, req.requestId);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch("/api/transport-partner/vehicles/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerVehicle(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only update your own vehicles" });
        }
      }
      const payload = transportRosterVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateTransportPartnerVehicle(req.params.id, payload);
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle", errors: error.errors });
      }
      logError("Error updating transport vehicle", error, req.requestId);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/transport-partner/vehicles/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerVehicle(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only delete your own vehicles" });
        }
      }
      await storage.deleteTransportPartnerVehicle(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting transport vehicle", error, req.requestId);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.get("/api/transport-partner/blackouts", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = await resolveTransportPartnerScope(user, req.query.partnerId as string | undefined);
      const blackouts = await storage.getTransportPartnerBlackouts(partner?.id);
      res.json(blackouts);
    } catch (error) {
      logError("Error fetching transport blackouts", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/transport-partner/blackouts", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = transportBlackoutSchema.parse(req.body);
      const partner = await resolveTransportPartnerScope(user, payload.partnerId);
      if (!partner) {
        return res.status(400).json({ message: "Choose a transport partner" });
      }
      const blackout = await storage.createTransportPartnerBlackout({
        partnerId: partner.id,
        startDate: payload.startDate,
        endDate: payload.endDate,
        reason: payload.reason || null,
        status: payload.status,
        createdByUserId: user.id,
      });
      res.status(201).json(blackout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability block", errors: error.errors });
      }
      logError("Error creating transport blackout", error, req.requestId);
      res.status(500).json({ message: "Failed to save availability" });
    }
  });

  app.patch("/api/transport-partner/blackouts/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerBlackout(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Availability block not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only update your own availability" });
        }
      }
      const payload = transportBlackoutBaseSchema.partial().parse(req.body);
      const blackout = await storage.updateTransportPartnerBlackout(req.params.id, payload);
      res.json(blackout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability block", errors: error.errors });
      }
      logError("Error updating transport blackout", error, req.requestId);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.delete("/api/transport-partner/blackouts/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerBlackout(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Availability block not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only delete your own availability" });
        }
      }
      await storage.deleteTransportPartnerBlackout(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting transport blackout", error, req.requestId);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  app.get("/api/transport-partner/pricing", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = await resolveTransportPartnerScope(user, req.query.partnerId as string | undefined);
      const pricing = await storage.getTransportPartnerPricing(partner?.id);
      res.json(pricing);
    } catch (error) {
      logError("Error fetching transport partner pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch partner pricing" });
    }
  });

  app.post("/api/transport-partner/pricing", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = transportPartnerPricingSchema.parse(req.body);
      const partner = await resolveTransportPartnerScope(user, payload.partnerId);
      if (!partner) {
        return res.status(400).json({ message: "Choose a transport partner" });
      }
      const pricing = await storage.createTransportPartnerPricing({
        partnerId: partner.id,
        route: normalizeTransportRouteId(payload.route),
        label: payload.label,
        basePrice: payload.basePrice,
        currency: payload.currency.toUpperCase(),
        pricingType: payload.pricingType,
        priceIncludes: payload.priceIncludes || null,
        notes: payload.notes || null,
        status: payload.status,
      });
      res.status(201).json(pricing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid partner pricing", errors: error.errors });
      }
      logError("Error creating transport partner pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to save partner pricing" });
    }
  });

  app.patch("/api/transport-partner/pricing/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerPricingItem(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Pricing item not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only update your own pricing" });
        }
      }
      const payload = transportPartnerPricingSchema.partial().parse(req.body);
      const pricing = await storage.updateTransportPartnerPricing(req.params.id, {
        ...payload,
        route: payload.route ? normalizeTransportRouteId(payload.route) : undefined,
        currency: payload.currency?.toUpperCase(),
      });
      res.json(pricing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid partner pricing", errors: error.errors });
      }
      logError("Error updating transport partner pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to update partner pricing" });
    }
  });

  app.delete("/api/transport-partner/pricing/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const existing = await storage.getTransportPartnerPricingItem(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Pricing item not found" });
      }
      if (user.role === "transport_partner") {
        const partner = await getCurrentTransportPartner(user);
        if (existing.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only delete your own pricing" });
        }
      }
      await storage.deleteTransportPartnerPricing(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting transport partner pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to delete partner pricing" });
    }
  });

  app.patch("/api/transport-partner/requests/:id", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), requireActivePartnerIfPartner(), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const isPartner = user.role === "transport_partner";
      const payload = isPartner
        ? transportPartnerRequestUpdateSchema.parse(req.body)
        : transportRequestUpdateSchema.parse(req.body);
      const request = await storage.getTransportRequest(req.params.id);

      if (!request) {
        return res.status(404).json({ message: "Transport request not found" });
      }

      if (isPartner) {
        if (isClosedRequestForPartner(request.status || "pending")) {
          return res.status(403).json({ message: "Cannot edit a closed transport request" });
        }
        if (payload.status !== undefined && !isValidTransitionForPartner(request.status || "pending", payload.status)) {
          return res.status(403).json({ message: `Unauthorized status transition from ${request.status || "pending"} to ${payload.status}` });
        }
      }

      const isAdminOrCoordinator = user.role === "admin" || user.role === "coordinator";
      let updatePayload: Partial<typeof request> = {};
      const targetPartnerId = (payload as any).partnerId === undefined ? request.partnerId : (payload as any).partnerId;
      const selectedDriver = payload.driverId ? await storage.getTransportPartnerDriver(payload.driverId) : undefined;
      const selectedVehicle = payload.vehicleId ? await storage.getTransportPartnerVehicle(payload.vehicleId) : undefined;

      if (selectedDriver && targetPartnerId && selectedDriver.partnerId !== targetPartnerId) {
        return res.status(400).json({ message: "Selected driver does not belong to the assigned partner" });
      }
      if (selectedVehicle && targetPartnerId && selectedVehicle.partnerId !== targetPartnerId) {
        return res.status(400).json({ message: "Selected vehicle does not belong to the assigned partner" });
      }

      if (isPartner) {
        const partner = await getCurrentTransportPartner(user);
        if (request.partnerId !== partner.id) {
          return res.status(403).json({ message: "You can only update requests assigned to your account" });
        }

        const partnerPayload = payload as z.infer<typeof transportPartnerRequestUpdateSchema>;
        updatePayload = {
          status: partnerPayload.status as TransportRequestStatus | undefined,
          quotedAmount: partnerPayload.quotedAmount ?? undefined,
          currency: partnerPayload.currency || undefined,
          requestedPickupTime: partnerPayload.requestedPickupTime ?? undefined,
          requestedVisitDate: partnerPayload.requestedVisitDate ?? undefined,
          rescheduleNotes: partnerPayload.rescheduleNotes ?? undefined,
          driverId: partnerPayload.driverId === undefined ? undefined : partnerPayload.driverId,
          vehicleId: partnerPayload.vehicleId === undefined ? undefined : partnerPayload.vehicleId,
          driverName: selectedDriver?.name ?? partnerPayload.driverName ?? undefined,
          driverPhone: selectedDriver?.phone ?? partnerPayload.driverPhone ?? undefined,
          vehicleDetails: selectedVehicle
            ? [selectedVehicle.label, selectedVehicle.vehicleType, selectedVehicle.plateNumber, selectedVehicle.color]
                .filter(Boolean)
                .join(" | ")
            : partnerPayload.vehicleDetails ?? undefined,
          partnerNotes: partnerPayload.partnerNotes ?? undefined,
          cancellationReason: partnerPayload.cancellationReason ?? undefined,
          partnerRespondedAt: new Date() as any,
        };
      } else if (isAdminOrCoordinator) {
        const adminPayload = payload as z.infer<typeof transportRequestUpdateSchema>;
        updatePayload = {
          partnerId: adminPayload.partnerId === undefined ? undefined : adminPayload.partnerId,
          route: adminPayload.route,
          pickupLocation: adminPayload.pickupLocation ?? undefined,
          notes: adminPayload.notes ?? undefined,
          status: adminPayload.status as TransportRequestStatus | undefined,
          quotedAmount: adminPayload.quotedAmount ?? undefined,
          currency: adminPayload.currency || undefined,
          estimatedPickupTime: adminPayload.estimatedPickupTime ?? undefined,
          requestedPickupTime: adminPayload.requestedPickupTime ?? undefined,
          requestedVisitDate: adminPayload.requestedVisitDate ?? undefined,
          rescheduleNotes: adminPayload.rescheduleNotes ?? undefined,
          driverId: adminPayload.driverId === undefined ? undefined : adminPayload.driverId,
          vehicleId: adminPayload.vehicleId === undefined ? undefined : adminPayload.vehicleId,
          driverName: selectedDriver?.name ?? adminPayload.driverName ?? undefined,
          driverPhone: selectedDriver?.phone ?? adminPayload.driverPhone ?? undefined,
          vehicleDetails: selectedVehicle
            ? [selectedVehicle.label, selectedVehicle.vehicleType, selectedVehicle.plateNumber, selectedVehicle.color]
                .filter(Boolean)
                .join(" | ")
            : adminPayload.vehicleDetails ?? undefined,
          partnerNotes: adminPayload.partnerNotes ?? undefined,
          adminNotes: adminPayload.adminNotes ?? undefined,
          cancellationReason: adminPayload.cancellationReason ?? undefined,
          ...(adminPayload.partnerId !== undefined && adminPayload.partnerId !== request.partnerId
            ? {
                assignedByUserId: user.id,
                assignedAt: new Date() as any,
                status: adminPayload.status || (adminPayload.partnerId ? "sent_to_partner" : "pending"),
              }
            : {}),
        };
      }

      const nextStatus = (updatePayload.status as string | undefined) || request.status || "pending";
      const shouldRotateQuoteToken =
        TRANSPORT_QUOTE_REVIEW_STATUSES.has(nextStatus) &&
        (!request.quoteApprovalToken ||
          !TRANSPORT_QUOTE_REVIEW_STATUSES.has(request.status || "") ||
          TRANSPORT_QUOTE_DETAIL_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(updatePayload, field)));
      const quoteApprovalTokenForEmail = shouldRotateQuoteToken ? generatePublicToken(32) : null;
      if (quoteApprovalTokenForEmail) {
        updatePayload.quoteApprovalToken = hashToken(quoteApprovalTokenForEmail);
        updatePayload.quoteSentAt = new Date() as any;
      }
      if (nextStatus === "cancelled" && request.status !== "cancelled") {
        updatePayload.cancelledAt = new Date() as any;
        updatePayload.cancellationRequestedBy = user.id;
      }
      Object.keys(updatePayload).forEach((key) => (updatePayload as any)[key] === undefined && delete (updatePayload as any)[key]);

      const updated = await storage.updateTransportRequest(req.params.id, updatePayload);
      if (!updated) {
        return res.status(404).json({ message: "Transport request not found" });
      }

      let driverDetailsEmail: {
        sent: boolean;
        error?: string;
        messageId?: string;
        accountEmailMode?: "existing_account" | "existing_invite" | "new_invite" | "renewed_invite";
        inviteId?: string;
      } | null = null;
      let partnerAssignmentEmail: { success: boolean; error?: string; messageId?: string } | null = null;
      let workflowEmails: Array<{ success: boolean; error?: string; messageId?: string; audience?: string; recipientEmail?: string }> = [];

      const previousStatus = request.status || "pending";
      const updatedStatus = updated.status || previousStatus;
      const quoteDetailsChanged =
        TRANSPORT_QUOTE_REVIEW_STATUSES.has(updatedStatus) &&
        TRANSPORT_QUOTE_DETAIL_FIELDS.some((field) =>
          Object.prototype.hasOwnProperty.call(updatePayload, field) &&
          (updated as any)[field] !== (request as any)[field]
        );
      const confirmedDetailsChanged =
        updatedStatus === "confirmed" &&
        TRANSPORT_QUOTE_DETAIL_FIELDS.some((field) =>
          Object.prototype.hasOwnProperty.call(updatePayload, field) &&
          (updated as any)[field] !== (request as any)[field]
        );
      const shouldNotifyVisitorQuoteReady =
        (TRANSPORT_QUOTE_REVIEW_STATUSES.has(updatedStatus) && !TRANSPORT_QUOTE_REVIEW_STATUSES.has(previousStatus)) ||
        quoteDetailsChanged;
      const shouldNotifyVisitorDriverConfirmed =
        (updatedStatus === "confirmed" && previousStatus !== "confirmed") ||
        confirmedDetailsChanged;

      if (shouldNotifyVisitorQuoteReady || shouldNotifyVisitorDriverConfirmed) {
        try {
          const [partner, booking] = await Promise.all([
            updated.partnerId ? storage.getTransportPartner(updated.partnerId) : Promise.resolve(undefined),
            updated.bookingId ? storage.getBooking(updated.bookingId) : Promise.resolve(undefined),
          ]);
          const visitorEmail = normalizedEmail(updated.visitorEmail);
          const existingVisitor = await storage.getUserByEmail(visitorEmail);
          const inviteResult = existingVisitor ? null : await ensureVisitorInvite(visitorEmail, user.id);
          const quoteReviewUrl = quoteApprovalTokenForEmail
            ? `${PUBLIC_APP_URL}/transport-quote/${quoteApprovalTokenForEmail}`
            : null;
          const manageBookingUrl = existingVisitor
            ? `${PUBLIC_APP_URL}/my-bookings`
            : `${PUBLIC_APP_URL}/accept-invite?token=${inviteResult!.invite.inviteToken}`;
          const transportEmailData = {
            visitorName: updated.visitorName,
            visitorEmail,
            bookingReference: booking?.bookingReference || updated.bookingId || null,
            partnerName: partner?.companyName || null,
            partnerEmail: partner?.email || null,
            partnerPhone: partner?.phone || null,
            partnerWhatsapp: partner?.whatsapp || null,
            route: updated.route,
            pickupLocation: updated.pickupLocation,
            visitDate: updated.visitDate,
            visitTime: updated.visitTime,
            quotedAmount: updated.quotedAmount,
            currency: updated.currency,
            estimatedPickupTime: updated.estimatedPickupTime,
            driverName: updated.driverName,
            driverPhone: updated.driverPhone,
            vehicleDetails: updated.vehicleDetails,
            partnerNotes: updated.partnerNotes,
          };
          const emailResult = shouldNotifyVisitorDriverConfirmed
            ? await sendTransportDriverConfirmedEmailDetailed({
                ...transportEmailData,
                manageBookingUrl,
                accountActionLabel: existingVisitor ? "Manage Booking" : "Create Account and Manage Booking",
                accountActionText: existingVisitor
                  ? "Your driver and pickup details are confirmed. Use your account to review transport updates."
                  : "Your driver and pickup details are confirmed. You can also create your visitor account to manage this and future bookings.",
              })
            : await sendTransportQuoteReadyEmailDetailed({
                ...transportEmailData,
                manageBookingUrl: quoteReviewUrl || manageBookingUrl,
                accountActionLabel: quoteReviewUrl ? "Review Transport Quote" : existingVisitor ? "Manage Booking" : "Create Account and Manage Booking",
                accountActionText: existingVisitor
                  ? "Review the transport quote, approve it, or decline it before final confirmation."
                  : "Review the transport quote, approve it, or decline it before final confirmation. You can also create your visitor account to manage this and future bookings.",
              });

          driverDetailsEmail = {
            sent: emailResult.success,
            error: emailResult.error,
            messageId: emailResult.messageId,
            accountEmailMode: existingVisitor ? "existing_account" : inviteResult!.mode,
            inviteId: inviteResult?.invite.id,
          };

          await storage.createEmailLog({
            sentBy: user.id,
            recipientName: updated.visitorName,
            recipientEmail: visitorEmail,
            subject: shouldNotifyVisitorDriverConfirmed
              ? booking?.bookingReference
                ? `Your driver and pickup details are confirmed - ${booking.bookingReference}`
                : "Your driver and pickup details are confirmed"
              : booking?.bookingReference
                ? `Your transport quote is ready - ${booking.bookingReference}`
                : "Your transport quote is ready",
            message: shouldNotifyVisitorDriverConfirmed
              ? "Driver and pickup details were sent to the visitor."
              : "Transport quote review details were sent to the visitor.",
            templateType: shouldNotifyVisitorDriverConfirmed ? "transport_driver_confirmed" : "transport_quote_ready",
            status: emailResult.success ? "accepted" : "failed",
            errorMessage: emailResult.error,
            providerMessageId: emailResult.messageId,
            relatedEntityType: "transport_request",
            relatedEntityId: updated.id,
            metadata: {
              partnerId: updated.partnerId,
              partnerName: partner?.companyName,
              bookingId: updated.bookingId,
              bookingReference: booking?.bookingReference,
              transportStatus: updatedStatus,
              accountEmailMode: existingVisitor ? "existing_account" : inviteResult!.mode,
              inviteId: inviteResult?.invite.id,
              quoteReviewUrl,
            },
          });
        } catch (emailError: any) {
          driverDetailsEmail = {
            sent: false,
            error: emailError?.message || "Failed to send transport visitor email",
          };
          logError("Failed to send transport visitor email", emailError, req.requestId);
        }
      }

      const partnerAssignmentChanged = !!updated.partnerId && updated.partnerId !== request.partnerId;
      const statusChanged = updatedStatus !== previousStatus;
      if (partnerAssignmentChanged || statusChanged) {
        try {
          const [partner, booking] = await Promise.all([
            updated.partnerId ? storage.getTransportPartner(updated.partnerId) : Promise.resolve(undefined),
            updated.bookingId ? storage.getBooking(updated.bookingId) : Promise.resolve(undefined),
          ]);

          if (partnerAssignmentChanged && partner) {
            partnerAssignmentEmail = await sendTransportAssignmentEmail(updated, partner, booking, user);
          }

          if (statusChanged) {
            if (["quote_sent", "accepted"].includes(updatedStatus)) {
              workflowEmails = await sendTransportStatusEmails({
                request: updated,
                previousStatus,
                partner,
                booking,
                actor: user,
                audiences: ["admin"],
              });
            } else if (updatedStatus === "confirmed") {
              workflowEmails = await sendTransportStatusEmails({
                request: updated,
                previousStatus,
                partner,
                booking,
                actor: user,
                audiences: ["partner", "admin"],
              });
            } else if (["reschedule_requested", "completed", "cancelled"].includes(updatedStatus)) {
              workflowEmails = await sendTransportStatusEmails({
                request: updated,
                previousStatus,
                partner,
                booking,
                actor: user,
                audiences: ["visitor", "partner", "admin"],
              });
            }
          }
        } catch (emailError) {
          logError("Failed to send transport workflow emails", emailError, req.requestId);
        }
      }

      await logTransportRequestActivity(
        updated.id,
        "transport_request_updated",
        user,
        { changedFields: Object.keys(updatePayload), driverDetailsEmail, partnerAssignmentEmail, workflowEmails },
        request.status,
        updated.status
      );

      res.json({
        ...updated,
        ...(driverDetailsEmail ? { driverDetailsEmail } : {}),
        ...(partnerAssignmentEmail ? { partnerAssignmentEmail } : {}),
        ...(workflowEmails.length ? { workflowEmails } : {}),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transport request update", errors: error.errors });
      }
      logError("Error updating transport request", error, req.requestId);
      res.status(500).json({ message: "Failed to update transport request" });
    }
  });

  app.get("/api/transport-partner/referrals", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const partner = user.role === "transport_partner" ? await getCurrentTransportPartner(user) : null;
      const referrals = await storage.getPartnerTourReferrals(partner?.id);
      res.json(referrals);
    } catch (error) {
      logError("Error fetching partner tour referrals", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch partner referrals" });
    }
  });

  app.post("/api/transport-partner/referrals", isAuthenticated, requireRole("transport_partner", "admin", "coordinator"), async (req: any, res) => {
    try {
      const user = (req as any).currentUser as User;
      const payload = partnerReferralSchema.parse(req.body);
      const visitorEmail = normalizedEmail(payload.visitorEmail);
      const existingVisitor = await storage.getUserByEmail(visitorEmail);
      const partner = user.role === "transport_partner"
        ? await getCurrentTransportPartner(user)
        : req.body.partnerId
          ? await storage.getTransportPartner(String(req.body.partnerId))
          : null;

      if (!partner) {
        return res.status(400).json({ message: "Choose a transport partner before submitting this referral" });
      }

      const totalAmount = await calculateTotalAmount(payload.groupSize, payload.tourType, undefined);
      const referralNotes = [
        "[Transport partner referral]",
        `Partner: ${partner.companyName}`,
        payload.notes ? `Partner notes: ${payload.notes}` : null,
      ].filter(Boolean).join("\n");

      const booking = await storage.createBooking({
        visitorName: payload.visitorName,
        visitorEmail,
        visitorPhone: payload.visitorPhone || "",
        visitorUserId: existingVisitor?.id || null,
        visitDate: payload.visitDate,
        visitTime: payload.visitTime,
        groupSize: payload.groupSize,
        numberOfPeople: payload.numberOfPeople,
        tourType: payload.tourType,
        paymentMethod: "cash",
        selectedZones: [],
        selectedInterests: [],
        source: "transport_partner",
        referralSource: partner.id,
        specialRequests: referralNotes,
        totalAmount,
      });

      const referral = await storage.createPartnerTourReferral({
        partnerId: partner.id,
        bookingId: booking.id,
        visitorName: payload.visitorName,
        visitorEmail,
        visitorPhone: payload.visitorPhone || null,
        visitDate: payload.visitDate,
        visitTime: payload.visitTime,
        groupSize: payload.groupSize,
        numberOfPeople: payload.numberOfPeople,
        tourType: payload.tourType,
        notes: payload.notes || null,
        status: "submitted",
      });

      let accountEmail: {
        mode: "existing_account" | "existing_invite" | "new_invite" | "renewed_invite";
        sent: boolean;
        error?: string;
        inviteId?: string;
      } | null = null;

      try {
        const inviteResult = existingVisitor ? null : await ensureVisitorInvite(visitorEmail, user.id);
        const accountUrl = existingVisitor
          ? `${PUBLIC_APP_URL}/my-bookings`
          : `${PUBLIC_APP_URL}/accept-invite?token=${inviteResult!.invite.inviteToken}`;
        const emailResult = await sendPartnerReferralBookingEmailDetailed({
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          partnerName: partner.companyName,
          bookingReference: booking.bookingReference!,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          tourType: booking.tourType,
          numberOfPeople: booking.numberOfPeople || 1,
          totalAmount: booking.totalAmount || 0,
          accountUrl,
          accountActionLabel: existingVisitor ? "Sign in to manage booking" : "Create account and manage booking",
          accountActionText: existingVisitor
            ? "You already have a Visit Dzaleka account. Sign in to view updates, reschedule, cancel, or manage future bookings."
            : "Create your visitor account to view updates, reschedule, cancel, or manage future Visit Dzaleka bookings. This secure invitation link is valid for 7 days.",
        });

        accountEmail = {
          mode: existingVisitor ? "existing_account" : inviteResult!.mode,
          sent: emailResult.success,
          error: emailResult.error,
          inviteId: inviteResult?.invite.id,
        };

        await storage.createEmailLog({
          sentBy: user.id,
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          subject: `Your Visit Dzaleka tour referral - ${booking.bookingReference}`,
          message: existingVisitor
            ? "Partner referral booking email sent with manage-booking sign-in link."
            : "Partner referral booking email sent with visitor account invitation link.",
          templateType: "partner_referral_booking",
          status: emailResult.success ? "accepted" : "failed",
          errorMessage: emailResult.error,
          providerMessageId: emailResult.messageId,
          relatedEntityType: "booking",
          relatedEntityId: booking.id,
          metadata: {
            referralId: referral.id,
            partnerId: partner.id,
            partnerName: partner.companyName,
            accountEmailMode: existingVisitor ? "existing_account" : inviteResult!.mode,
            inviteId: inviteResult?.invite.id,
          },
        });
      } catch (emailError: any) {
        accountEmail = {
          mode: existingVisitor ? "existing_account" : "new_invite",
          sent: false,
          error: emailError?.message || "Failed to send referral email",
        };
        logError("Failed to send partner referral visitor email", emailError, req.requestId);
      }

      await notifyBookingCreated(booking.id, booking.visitorName, booking.visitDate);

      res.status(201).json({ booking, referral, accountEmail });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid referral data", errors: error.errors });
      }
      logError("Error creating partner referral", error, req.requestId);
      res.status(500).json({ message: "Failed to create partner referral" });
    }
  });

  app.patch("/api/transport-partner/referrals/:id/status", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = partnerReferralStatusSchema.parse(req.body);
      const referral = await storage.updatePartnerTourReferralStatus(
        req.params.id,
        payload.status as PartnerReferralStatus
      );
      res.json(referral);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid referral status", errors: error.errors });
      }
      logError("Error updating partner referral status", error, req.requestId);
      res.status(500).json({ message: "Failed to update partner referral status" });
    }
  });

  app.patch("/api/transport-partner/referrals/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = partnerReferralUpdateSchema.parse(req.body);
      const updatePayload: Partial<PartnerTourReferral> = {
        status: payload.status as PartnerReferralStatus | undefined,
      };
      Object.keys(updatePayload).forEach((key) => (updatePayload as any)[key] === undefined && delete (updatePayload as any)[key]);
      const referral = await storage.updatePartnerTourReferral(req.params.id, updatePayload);
      res.json(referral);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid referral update", errors: error.errors });
      }
      logError("Error updating partner referral", error, req.requestId);
      res.status(500).json({ message: "Failed to update partner referral" });
    }
  });

  // Create historical booking (admin only) - for importing past visits
  app.post("/api/bookings/historical", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const {
        visitorName,
        visitorEmail,
        visitorPhone,
        visitorCountry,
        visitDate,
        visitTime,
        groupSize,
        numberOfPeople,
        tourType,
        paymentMethod,
        paymentStatus,
        meetingPointId,
        assignedGuideId,
        totalAmount,
        adminNotes,
        selectedZones,
      } = req.body;

      const normalizedVisitorEmail = normalizedEmail(visitorEmail);

      // Validate required fields
      if (!visitorName || !normalizedVisitorEmail || !visitDate) {
        return res.status(400).json({ message: "Visitor name, email, and visit date are required" });
      }

      // Validate that the date is in the past
      const visitDateObj = new Date(visitDate);
      if (visitDateObj > new Date()) {
        return res.status(400).json({ message: "Historical bookings must have a past date" });
      }

      // Calculate amount if not provided
      const existingVisitor = normalizedVisitorEmail ? await storage.getUserByEmail(normalizedVisitorEmail) : undefined;
      const finalAmount = totalAmount || await calculateTotalAmount(
        groupSize || "individual",
        tourType || "standard",
        undefined
      );

      // Create the booking with completed status
      const booking = await storage.createBooking({
        visitorName,
        visitorEmail: normalizedVisitorEmail,
        visitorUserId: existingVisitor?.id || null,
        visitorPhone: visitorPhone || "",
        visitorCountry: visitorCountry || null,
        visitDate,
        visitTime: visitTime || "09:00",
        groupSize: groupSize || "individual",
        numberOfPeople: numberOfPeople || 1,
        tourType: tourType || "standard",
        paymentMethod: paymentMethod || "cash",
        meetingPointId: meetingPointId || null,
        selectedZones: selectedZones || [],
        selectedInterests: [],
        totalAmount: finalAmount,
        status: "completed", // Historical bookings are always completed
        paymentStatus: paymentStatus || "paid", // Default to paid for historical
        assignedGuideId: assignedGuideId || null,
        adminNotes: `[HISTORICAL IMPORT] ${adminNotes || ""}`.trim(),
        checkInTime: visitDateObj, // Set check-in time to visit date
        checkOutTime: new Date(visitDateObj.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      } as any);

      // Update guide stats if a guide was assigned
      if (assignedGuideId) {
        const guide = await storage.getGuide(assignedGuideId);
        if (guide) {
          await storage.updateGuide(assignedGuideId, {
            totalTours: (guide.totalTours || 0) + 1,
            totalEarnings: (guide.totalEarnings || 0) + getBookingGuideEarnings(booking),
          });
        }
      }

      // Create audit log
      await createAuditLog(req.session.userId, "create", "booking", booking.id,
        null, { type: "historical_import", visitDate, visitorName }, req);

      res.status(201).json(booking);
    } catch (error) {
      logError("Error creating historical booking", error, req.requestId);
      res.status(500).json({ message: "Failed to create historical booking" });
    }
  });

  app.patch("/api/bookings/:id/status", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.bookingsWrite), requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, version } = req.body;
      const cancellationCategory = typeof req.body?.cancellationCategory === "string"
        ? req.body.cancellationCategory.trim()
        : "";
      const cancellationReason = typeof req.body?.cancellationReason === "string"
        ? req.body.cancellationReason.trim()
        : typeof req.body?.reason === "string"
          ? req.body.reason.trim()
          : "";
      const cancellationNote = typeof req.body?.cancellationNote === "string"
        ? req.body.cancellationNote.trim()
        : "";
      const actor = await getRequestUser(req);
      const actorId = actor?.id || null;
      const oldBooking = await storage.getBooking(id);

      // Use optimistic locking if version is provided
      let booking = await storage.updateBookingStatus(id, status, version);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (status === "cancelled") {
        const resolvedCancellationReason = cancellationReason
          || booking.cancellationReason
          || booking.adminNotes
          || "Cancelled by staff";

        const cancellationUpdate = await storage.updateBooking(id, {
          cancellationCategory: cancellationCategory || null,
          cancellationReason: resolvedCancellationReason,
          cancellationNote: cancellationNote || null,
          cancelledAt: new Date(),
          cancelledBy: actorId,
        });
        booking = cancellationUpdate || booking;

        await sendBookingCancelledEmail(booking, resolvedCancellationReason, actorId);
      } else {
        // Send status update email
        const statusTemplateName = status === "confirmed" ? "booking_confirmation" : "status_update";
        const statusBooking = booking;
        const statusEmail = await sendAutomatedTemplateEmail({
          templateName: statusTemplateName,
          recipientName: statusBooking.visitorName,
          recipientEmail: statusBooking.visitorEmail,
          data: buildBookingTemplateData(statusBooking, {
            old_status: oldBooking?.status || "pending",
            new_status: status,
            admin_notes: statusBooking.adminNotes || "",
          }),
          fallbackSubject: status === "confirmed"
            ? `Booking Confirmed - ${statusBooking.bookingReference}`
            : `Booking ${String(status).replace(/_/g, " ")} - ${statusBooking.bookingReference}`,
          fallbackMessage: `Booking status email sent for ${statusBooking.visitorName}. New status: ${status}.`,
          fallbackSend: () => sendStatusUpdateDetailed({
            visitorName: statusBooking.visitorName,
            visitorEmail: statusBooking.visitorEmail,
            bookingReference: statusBooking.bookingReference!,
            oldStatus: oldBooking?.status || "pending",
            newStatus: status,
            visitDate: statusBooking.visitDate,
            adminNotes: statusBooking.adminNotes || undefined,
          }),
        });

        await storage.createEmailLog({
          sentBy: actorId,
          recipientName: statusBooking.visitorName,
          recipientEmail: statusBooking.visitorEmail,
          subject: statusEmail.subject,
          message: statusEmail.message,
          templateType: statusTemplateName,
          status: statusEmail.result.success ? "accepted" : "failed",
          errorMessage: statusEmail.result.error,
          providerMessageId: statusEmail.result.messageId,
          relatedEntityType: "booking",
          relatedEntityId: statusBooking.id,
          metadata: buildEmailLogMetadata(statusBooking, statusEmail, { status }),
        });
      }

      // Create audit log
      if (actorId) {
        await createAuditLog(actorId, "update", "booking", id,
          { status: oldBooking?.status }, {
            status,
            cancellationCategory: cancellationCategory || undefined,
            cancellationReason: cancellationReason || undefined,
            cancellationNote: cancellationNote || undefined,
          }, req);
      }

      // Send in-app notification to visitor if they have an account
      if (booking.visitorUserId) {
        await notifyBookingStatusChanged(
          booking.id,
          booking.visitorUserId,
          status,
          booking.bookingReference || booking.id.slice(0, 8)
        );
      }

      // Dispatch Webhook
      WebhookDispatcher.dispatch("booking.updated", booking);

      res.json(booking);
    } catch (error: any) {
      // Handle version conflict (optimistic locking failure)
      if (error?.code === 'VERSION_CONFLICT') {
        return res.status(409).json({
          message: "Booking was modified by another user. Please refresh and try again.",
          code: "VERSION_CONFLICT"
        });
      }
      logError("Error updating booking status", error, req.requestId);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Reschedule booking (for calendar drag-and-drop)
  app.patch("/api/bookings/:id/reschedule", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { visitDate, visitTime } = req.body;

      if (!visitDate) {
        return res.status(400).json({ message: "Visit date is required" });
      }

      const oldBooking = await storage.getBooking(id);
      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = await storage.rescheduleBooking(id, visitDate, visitTime || oldBooking.visitTime);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Create audit log
      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "booking", id,
          { visitDate: oldBooking.visitDate, visitTime: oldBooking.visitTime },
          { visitDate, visitTime: visitTime || oldBooking.visitTime },
          req
        );
      }

      // Create activity log
      await storage.createBookingActivityLog({
        bookingId: id,
        action: "rescheduled",
        description: `Rescheduled from ${oldBooking.visitDate} to ${visitDate}`,
        oldStatus: oldBooking.status || null,
        newStatus: oldBooking.status || null,
        userId: userId || null,
      });

      await sendBookingRescheduledEmail(booking, oldBooking, userId || null);

      res.json(booking);
    } catch (error) {
      logError("Error rescheduling booking", error, req.requestId);
      res.status(500).json({ message: "Failed to reschedule booking" });
    }
  });

  app.post("/api/bookings/:id/visitor-reschedule-request", isAuthenticated, async (req: any, res) => {
    try {
      const payload = visitorRescheduleRequestSchema.parse(req.body);
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      const booking = await storage.getBooking(req.params.id);
      if (!user || !booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const visitorOwnsBooking = booking.visitorUserId === user.id || normalizedEmail(booking.visitorEmail) === normalizedEmail(user.email);
      if (!visitorOwnsBooking) {
        return res.status(403).json({ message: "You can only request changes for your own bookings" });
      }

      if (!["pending", "confirmed"].includes(booking.status || "pending")) {
        return res.status(409).json({ message: "Only pending or confirmed bookings can be rescheduled by request" });
      }

      const note = payload.note?.trim();
      const description = `Visitor requested reschedule from ${booking.visitDate} ${booking.visitTime || ""} to ${payload.visitDate} ${payload.visitTime}.`;
      const adminNote = [
        `[${new Date().toISOString()}] ${description}`,
        note ? `Visitor note: ${note}` : null,
      ].filter(Boolean).join("\n");

      const updatedBooking = await storage.updateBooking(booking.id, {
        adminNotes: [booking.adminNotes, adminNote].filter(Boolean).join("\n\n"),
      });

      await storage.createBookingActivityLog({
        bookingId: booking.id,
        userId,
        action: "visitor_reschedule_requested",
        description: note ? `${description} Note: ${note}` : description,
        oldStatus: booking.status || null,
        newStatus: booking.status || null,
      });

      const transportRequests = await storage.getTransportRequestsByBookingIds([booking.id]);
      const activeTransportRequests = transportRequests.filter(
        (request) => !["cancelled", "completed"].includes(request.status || "")
      );
      await Promise.all(activeTransportRequests.map(async (request) => {
        const updatedRequest = await storage.updateTransportRequest(request.id, {
          status: "reschedule_requested" as TransportRequestStatus,
          requestedVisitDate: payload.visitDate,
          requestedPickupTime: payload.visitTime,
          rescheduleNotes: note || `Visitor requested booking reschedule to ${payload.visitDate} ${payload.visitTime}.`,
        });
        await logTransportRequestActivity(
          request.id,
          "visitor_reschedule_requested",
          user,
          { visitDate: payload.visitDate, visitTime: payload.visitTime, note: note || null },
          request.status,
          updatedRequest?.status || "reschedule_requested"
        );
      }));

      await createAuditLog(userId, "update", "booking", booking.id,
        { visitDate: booking.visitDate, visitTime: booking.visitTime },
        { requestedVisitDate: payload.visitDate, requestedVisitTime: payload.visitTime, note: note || null },
        req
      );

      res.json({
        booking: updatedBooking || booking,
        transportRequestsUpdated: activeTransportRequests.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reschedule request", errors: error.errors });
      }
      logError("Error requesting visitor reschedule", error, req.requestId);
      res.status(500).json({ message: "Failed to request reschedule" });
    }
  });

  app.post("/api/bookings/:id/transport-quote-decision", isAuthenticated, async (req: any, res) => {
    try {
      const payload = quoteDecisionSchema.parse(req.body);
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const [user, booking] = await Promise.all([
        storage.getUser(userId),
        storage.getBooking(req.params.id),
      ]);
      if (!user || !booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const visitorOwnsBooking = booking.visitorUserId === user.id || normalizedEmail(booking.visitorEmail) === normalizedEmail(user.email);
      if (!visitorOwnsBooking) {
        return res.status(403).json({ message: "You can only respond to transport quotes for your own bookings" });
      }

      const transportRequests = await storage.getTransportRequestsByBookingIds([booking.id]);
      const request = transportRequests
        .filter((item) => !["cancelled", "completed"].includes(item.status || ""))
        .sort((a, b) => dateSortValue(b.updatedAt) - dateSortValue(a.updatedAt))[0];

      if (!request) {
        return res.status(404).json({ message: "Transport quote not found for this booking" });
      }
      if (request.quoteDecision) {
        return res.status(409).json({ message: "This transport quote has already been answered" });
      }
      if (request.quotedAmount == null || !["quote_sent", "accepted"].includes(request.status || "")) {
        return res.status(409).json({ message: "Transport partner has not sent a quote for review yet" });
      }

      const newStatus = payload.decision === "approved" ? "visitor_approved" : "visitor_declined";
      const updated = await storage.updateTransportRequest(request.id, {
        status: newStatus as TransportRequestStatus,
        quoteDecision: payload.decision,
        quoteDecisionAt: new Date() as any,
        quoteDecisionNotes: payload.notes || null,
      });
      if (!updated) {
        return res.status(404).json({ message: "Transport quote not found" });
      }

      await logTransportRequestActivity(
        request.id,
        payload.decision === "approved" ? "visitor_approved_quote" : "visitor_declined_quote",
        user,
        { notes: payload.notes || null },
        request.status,
        newStatus
      );

      let notificationEmails: Array<{ sent?: boolean; success?: boolean; error?: string; audience?: string; recipientEmail?: string }> = [];
      try {
        const partner = updated.partnerId ? await storage.getTransportPartner(updated.partnerId) : undefined;
        notificationEmails = await sendTransportQuoteDecisionEmails({
          request: updated,
          partner,
          booking,
          decision: payload.decision,
          decisionNotes: payload.notes || null,
          actor: user,
        });
      } catch (emailError) {
        logError("Failed to send authenticated transport quote decision emails", emailError, req.requestId);
      }

      res.json({ ...updated, notificationEmails });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quote decision", errors: error.errors });
      }
      logError("Error saving visitor transport quote decision", error, req.requestId);
      res.status(500).json({ message: "Failed to save quote decision" });
    }
  });

  // Get booking activity log (timeline)
  app.get("/api/bookings/:id/activity", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const canAccess = await userCanAccessBooking(req.session.userId!, booking);
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const activities = await storage.getBookingActivityLogs(id);
      res.json(activities);
    } catch (error) {
      logError("Error fetching booking activity", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch booking activity" });
    }
  });

  app.get("/api/bookings/:id/email-timeline", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const canAccess = await userCanAccessBooking(req.session.userId!, booking);
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const logs = await storage.getEmailLogsForBooking(id, booking.bookingReference);
      res.json(logs);
    } catch (error) {
      logError("Error fetching booking email timeline", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch booking email timeline" });
    }
  });

  app.get("/api/bookings/:id/visitor-timeline", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const canAccess = await userCanAccessBooking(req.session.userId!, booking);
      if (!canAccess) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const [activities, emailLogs, transportRequests] = await Promise.all([
        storage.getBookingActivityLogs(id),
        storage.getEmailLogsForBooking(id, booking.bookingReference),
        storage.getTransportRequestsByBookingIds([id]),
      ]);
      const transportRequest = transportRequests
        .sort((a, b) => dateSortValue(b.updatedAt || b.createdAt) - dateSortValue(a.updatedAt || a.createdAt))[0] || null;

      const events: Array<{
        id: string;
        type: string;
        title: string;
        description: string | null;
        occurredAt: string | Date | null;
        status?: string | null;
      }> = [];

      events.push({
        id: `booking-created-${booking.id}`,
        type: "booking_created",
        title: "Booking request created",
        description: booking.bookingReference ? `Reference ${booking.bookingReference}` : null,
        occurredAt: booking.createdAt,
        status: booking.status,
      });

      for (const activity of activities) {
        const actionTitleMap: Record<string, string> = {
          getyourguide_booking_created: "Booking confirmed by GetYourGuide",
          getyourguide_booking_cancelled: "Booking cancelled by GetYourGuide",
          rescheduled: "Visit rescheduled",
          visitor_reschedule_requested: "Reschedule requested",
          payment_reported: "Payment reported",
          visitor_cancelled: "Booking cancelled",
          guide_assigned: "Guide assigned",
          assigned: "Guide assigned",
          status_updated: "Booking status updated",
          check_in: "Visitor checked in",
          check_out: "Visitor checked out",
          no_show: "Marked no-show",
        };
        events.push({
          id: `activity-${activity.id}`,
          type: activity.action,
          title: actionTitleMap[activity.action] || activity.action.replace(/_/g, " "),
          description: activity.description,
          occurredAt: activity.createdAt,
          status: activity.newStatus || activity.oldStatus,
        });
      }

      if (booking.assignedGuideId && !events.some((event) => event.type === "guide_assigned" || event.type === "assigned")) {
        events.push({
          id: `guide-assigned-${booking.id}`,
          type: "guide_assigned",
          title: "Guide assigned",
          description: "A guide has been assigned to your visit.",
          occurredAt: booking.updatedAt || booking.createdAt,
          status: booking.status,
        });
      }

      if ((booking.paymentReference || booking.paymentStatus === "paid") && !events.some((event) => event.type === "payment_reported")) {
        events.push({
          id: `payment-reported-${booking.id}`,
          type: "payment_reported",
          title: "Payment reported",
          description: booking.paymentReference ? `Reference ${booking.paymentReference}` : "Payment status updated",
          occurredAt: booking.updatedAt || booking.createdAt,
          status: booking.paymentStatus,
        });
      }

      for (const email of emailLogs) {
        events.push({
          id: `email-${email.id}`,
          type: "email_sent",
          title: "Email sent",
          description: email.subject,
          occurredAt: email.lastEventAt || email.deliveredAt || email.createdAt,
          status: email.status,
        });
      }

      if (transportRequest) {
        events.push({
          id: `transport-created-${transportRequest.id}`,
          type: "transport_request_created",
          title: "Transport request created",
          description: transportRequest.pickupLocation || transportRequest.route,
          occurredAt: transportRequest.createdAt,
          status: transportRequest.status,
        });
        if (transportRequest.quoteSentAt) {
          events.push({
            id: `transport-quote-${transportRequest.id}`,
            type: "transport_quote_sent",
            title: "Transport quote sent",
            description: transportRequest.quotedAmount != null
              ? `${transportRequest.currency || "MWK"} ${transportRequest.quotedAmount}`
              : "Quote sent for review",
            occurredAt: transportRequest.quoteSentAt,
            status: transportRequest.status,
          });
        }
        if (transportRequest.driverName || transportRequest.driverPhone || transportRequest.vehicleDetails) {
          events.push({
            id: `transport-driver-${transportRequest.id}`,
            type: "transport_driver_assigned",
            title: "Driver details added",
            description: [transportRequest.driverName, transportRequest.driverPhone, transportRequest.vehicleDetails].filter(Boolean).join(" - "),
            occurredAt: transportRequest.partnerRespondedAt || transportRequest.updatedAt,
            status: transportRequest.status,
          });
        }
        if (transportRequest.quoteDecisionAt) {
          events.push({
            id: `transport-decision-${transportRequest.id}`,
            type: "transport_quote_decision",
            title: transportRequest.quoteDecision === "approved" ? "Transport quote approved" : "Transport quote declined",
            description: transportRequest.quoteDecisionNotes,
            occurredAt: transportRequest.quoteDecisionAt,
            status: transportRequest.status,
          });
        }
      }

      res.json(
        events
          .filter((event) => event.occurredAt)
          .sort((a, b) => dateSortValue(b.occurredAt) - dateSortValue(a.occurredAt))
      );
    } catch (error) {
      logError("Error fetching visitor booking timeline", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch booking timeline" });
    }
  });

  app.post("/api/bookings/:id/message-contact", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const payload = bookingMessageContactSchema.parse(req.body);
      const userId = req.session.userId!;
      const booking = await storage.getBooking(id);
      const currentUser = await storage.getUser(userId);
      if (!booking || !currentUser) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const canAccess = await userCanAccessBooking(userId, booking);
      if (!canAccess || currentUser.role !== "visitor") {
        return res.status(403).json({ message: "Forbidden" });
      }

      let targetUser: User | undefined;
      if (payload.target === "guide") {
        const guide = await getAssignedGuide(booking);
        if (!guide?.userId) {
          return res.status(404).json({ message: "No assigned guide is available for messaging yet" });
        }
        targetUser = await storage.getUser(guide.userId);
      } else {
        const users = await storage.getUsers();
        const activeAdmins = users.filter((user) => user.role === "admin" && user.isActive !== false);
        targetUser = activeAdmins.find((user) => getUserPreferences(user).visitorMessageOwner === true)
          || activeAdmins[0];
      }

      if (!targetUser) {
        return res.status(404).json({ message: "No active admin is available for visitor messages" });
      }

      const room = await storage.getOrCreateDirectRoom(userId, targetUser.id);
      res.json({
        room,
        target: {
          id: targetUser.id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          email: targetUser.email,
          role: targetUser.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message target", errors: error.errors });
      }
      logError("Error opening booking message contact", error, req.requestId);
      res.status(500).json({ message: "Failed to open booking message contact" });
    }
  });

  app.post("/api/bookings/:id/resend-email", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const type = String(req.body?.type || "");
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const meetingPoint = booking.meetingPointId
        ? await storage.getMeetingPoint(booking.meetingPointId)
        : null;
      const guide = await getAssignedGuide(booking);

      if (type === "feedback_request") {
        const result = await sendFeedbackRequestEmail(booking, req.session?.userId || null);
        if (!result.success) {
          return res.status(500).json({ message: result.error || "Failed to resend feedback request" });
        }
        return res.json({ success: true, message: "Feedback request email resent" });
      }

      if (type === "guide_tour_assignment") {
        if (!guide) {
          return res.status(400).json({ message: "No guide assigned to this booking" });
        }

        const result = await sendGuideTourAssignmentEmail(
          booking,
          guide,
          meetingPoint?.name,
          req.session?.userId || null
        );

        if (!result) {
          return res.status(400).json({ message: "Assigned guide does not have an email address" });
        }

        if (!result.success) {
          return res.status(500).json({ message: result.error || "Failed to resend guide tour assignment" });
        }

        return res.json({ success: true, message: "Guide tour assignment email resent" });
      }

      if (type === "booking_cancelled") {
        const result = await sendBookingCancelledEmail(booking, booking.adminNotes || "Cancellation notice resent", req.session?.userId || null);
        if (!result.success) {
          return res.status(500).json({ message: result.error || "Failed to resend cancellation email" });
        }
        return res.json({ success: true, message: "Cancellation email resent" });
      }

      if (type === "payment_receipt") {
        if (booking.paymentStatus !== "paid") {
          return res.status(400).json({ message: "Payment receipt can only be sent for paid bookings" });
        }
        const result = await sendPaymentReceiptEmail(booking, req.session?.userId || null);
        if (!result.success) {
          return res.status(500).json({ message: result.error || "Failed to resend payment receipt" });
        }
        return res.json({ success: true, message: "Payment receipt resent" });
      }

      let sendResult: { success: boolean; error?: string; messageId?: string } = { success: false };
      let subject = "";
      let message = "";
      let templateType = type;
      let templateInfo: { templateId?: string; templateSource?: string } = {};

      if (type === "request_received") {
        templateType = "booking_request_received";
        const email = await sendAutomatedTemplateEmail({
          templateName: "booking_request_received",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, { meeting_point: meetingPoint?.name }),
          fallbackSubject: `Booking Request Received - ${booking.bookingReference}`,
          fallbackMessage: `Booking request received for ${booking.visitorName} (${booking.bookingReference}).`,
          fallbackSend: () => sendBookingConfirmationDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            visitDate: booking.visitDate,
            visitTime: booking.visitTime,
            tourType: booking.tourType,
            numberOfPeople: booking.numberOfPeople || 1,
            totalAmount: booking.totalAmount || 0,
            meetingPoint: meetingPoint?.name,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "booking_confirmation") {
        templateType = "booking_confirmation";
        const email = await sendAutomatedTemplateEmail({
          templateName: "booking_confirmation",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            old_status: "pending",
            new_status: "confirmed",
            meeting_point: meetingPoint?.name,
            guide_name: guide ? `${guide.firstName} ${guide.lastName}` : "",
            guide_phone: guide?.phone,
          }),
          fallbackSubject: `Booking Confirmed - ${booking.bookingReference}`,
          fallbackMessage: `Booking confirmation resent for ${booking.visitorName} (${booking.bookingReference}).`,
          fallbackSend: () => sendStatusUpdateDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            oldStatus: "pending",
            newStatus: "confirmed",
            visitDate: booking.visitDate,
            adminNotes: booking.adminNotes || undefined,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "status_update") {
        templateType = "status_update";
        const email = await sendAutomatedTemplateEmail({
          templateName: "status_update",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            old_status: booking.status || "pending",
            new_status: booking.status || "pending",
            admin_notes: booking.adminNotes || "",
          }),
          fallbackSubject: `Booking ${String(booking.status || "status").replace(/_/g, " ")} - ${booking.bookingReference}`,
          fallbackMessage: `Booking status email resent for ${booking.visitorName}. Current status: ${booking.status}.`,
          fallbackSend: () => sendStatusUpdateDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            oldStatus: booking.status || "pending",
            newStatus: booking.status || "pending",
            visitDate: booking.visitDate,
            adminNotes: booking.adminNotes || undefined,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "reminder") {
        templateType = "booking_reminder";
        const email = await sendAutomatedTemplateEmail({
          templateName: "booking_reminder",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            meeting_point: meetingPoint?.name,
            guide_name: guide ? `${guide.firstName} ${guide.lastName}` : "",
            guide_phone: guide?.phone,
            special_requests: booking.specialRequests,
          }),
          fallbackSubject: `Tomorrow: Your Dzaleka Tour at ${booking.visitTime} - ${booking.bookingReference}`,
          fallbackMessage: `Reminder resent for ${booking.visitorName} (${booking.bookingReference}).`,
          fallbackSend: () => sendBookingReminderEmailDetailed({
            to: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            visitorName: booking.visitorName,
            visitDate: booking.visitDate,
            visitTime: booking.visitTime,
            numberOfPeople: booking.numberOfPeople || 1,
            tourType: booking.tourType,
            selectedZones: booking.selectedZones,
            specialRequests: booking.specialRequests,
            guideName: guide ? `${guide.firstName} ${guide.lastName}` : null,
            guidePhone: guide?.phone,
            meetingPointName: meetingPoint?.name,
            meetingPointAddress: meetingPoint?.address,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "guide_assignment") {
        if (!guide) {
          return res.status(400).json({ message: "No guide assigned to this booking" });
        }
        templateType = "guide_assignment";
        const guideName = `${guide.firstName} ${guide.lastName}`;
        const email = await sendAutomatedTemplateEmail({
          templateName: "guide_assignment",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            meeting_point: meetingPoint?.name,
            guide_name: guideName,
            guide_phone: guide.phone,
          }),
          fallbackSubject: `Guide Assigned - ${booking.bookingReference}`,
          fallbackMessage: `Guide assignment resent for ${guideName}.`,
          fallbackSend: () => sendGuideAssignmentDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            guideName,
            guidePhone: guide.phone,
            visitDate: booking.visitDate,
            visitTime: booking.visitTime,
            meetingPoint: meetingPoint?.name,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "check_in") {
        templateType = "check_in_notification";
        const checkInTime = booking.checkInTime ? new Date(booking.checkInTime).toLocaleTimeString() : new Date().toLocaleTimeString();
        const email = await sendAutomatedTemplateEmail({
          templateName: "check_in_notification",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            check_in_time: checkInTime,
            guide_name: guide ? `${guide.firstName} ${guide.lastName}` : "",
          }),
          fallbackSubject: `Check-in Confirmed - ${booking.bookingReference}`,
          fallbackMessage: `Check-in notification resent for ${booking.visitorName}.`,
          fallbackSend: () => sendCheckInNotificationDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference!,
            checkInTime,
            guideName: guide ? `${guide.firstName} ${guide.lastName}` : undefined,
          }),
        });
        ({ result: sendResult, subject, message } = email);
        templateInfo = email;
      } else if (type === "itinerary") {
        const itinerary = await storage.getItineraryByBookingId(id);
        if (!itinerary) {
          return res.status(400).json({ message: "No itinerary saved for this booking" });
        }

        const content = itinerary.content as any;
        subject = "Your Visit Dzaleka Itinerary";
        message = `Itinerary resent for ${booking.visitorName} (${booking.bookingReference}).`;
        templateType = "itinerary";
        sendResult = await sendItineraryEmailDetailed({
          ...content,
          recipientEmail: booking.visitorEmail,
          recipientName: booking.visitorName,
          bookingReference: booking.bookingReference,
          date: content.date || booking.visitDate,
          duration: content.duration || "",
          items: content.items || [],
          senderName: "Visit Dzaleka Team",
        });
      } else {
        return res.status(400).json({ message: "Unsupported email type" });
      }

      await storage.createEmailLog({
        sentBy: req.session?.userId,
        recipientName: booking.visitorName,
        recipientEmail: booking.visitorEmail,
        subject,
        message,
        templateType,
        status: sendResult.success ? "accepted" : "failed",
        errorMessage: sendResult.error,
        providerMessageId: sendResult.messageId,
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        metadata: buildEmailLogMetadata(booking, templateInfo, { resendType: type }),
      });

      if (!sendResult.success) {
        return res.status(500).json({ message: "Failed to resend booking email" });
      }

      res.json({ success: true, message: "Booking email resent" });
    } catch (error) {
      logError("Error resending booking email", error, req.requestId);
      res.status(500).json({ message: "Failed to resend booking email" });
    }
  });

  // Payment verification endpoint - admin and coordinator only
  app.patch("/api/bookings/:id/payment", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentReference } = req.body;
      const userId = req.session?.userId;
      if (paymentStatus === "paid" && !(await requireOperationApproval(req, res, "payment_mark_paid", "Marking payments as paid"))) {
        return;
      }

      const oldBooking = await storage.getBooking(id);
      let booking = await storage.updateBookingPaymentStatus(id, paymentStatus, userId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (paymentReference !== undefined) {
        booking = await storage.updateBooking(id, { paymentReference: String(paymentReference || "").trim() || null }) || booking;
      }

      // Create audit log
      if (userId) {
        await createAuditLog(userId, "verify", "payment", id,
          { paymentStatus: oldBooking?.paymentStatus },
          { paymentStatus, paymentReference }, req);
      }

      if (paymentStatus === "paid" && oldBooking?.paymentStatus !== "paid") {
        await notifyPaymentReceived(
          booking.id,
          booking.visitorName,
          booking.totalAmount || 0,
          String(booking.paymentMethod || "cash").replace(/_/g, " ")
        );
        await sendPaymentReceiptEmail(booking, userId || null);
      }

      res.json(booking);
    } catch (error) {
      logError("Error updating payment status", error, req.requestId);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  app.patch("/api/bookings/:id/guide-payment", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const payload = guidePaymentUpdateSchema.parse(req.body);
      const oldBooking = await storage.getBooking(id);

      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!oldBooking.assignedGuideId) {
        return res.status(400).json({ message: "Assign a guide before setting guide earnings" });
      }

      const booking = await storage.updateBooking(id, { guidePayment: payload.guidePayment });
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (req.session?.userId) {
        await createAuditLog(req.session.userId, "update", "booking", id,
          { guidePayment: oldBooking.guidePayment || null },
          { guidePayment: payload.guidePayment },
          req
        );
      }

      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid guide payment", errors: error.errors });
      }
      logError("Error updating guide payment", error, req.requestId);
      res.status(500).json({ message: "Failed to update guide payment" });
    }
  });

  // Visitor can report payment for staff verification. Staff still mark it paid.
  app.patch("/api/bookings/:id/visitor-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod, paymentReference, note } = req.body;
      const userId = req.session?.userId;

      // Get booking and verify ownership
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = userId ? await storage.getUser(userId) : null;
      // Verify this booking belongs to the current user
      if (!visitorOwnsBooking(booking, user)) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }

      if (booking.paymentStatus === "paid") {
        return res.status(400).json({ message: "This booking is already marked as paid" });
      }

      const allowedMethods = new Set(["cash", "airtel_money", "tnm_mpamba", "card"]);
      const reportedMethod = String(paymentMethod || booking.paymentMethod || "cash");
      if (!allowedMethods.has(reportedMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      const trimmedReference = String(paymentReference || "").trim();
      const trimmedNote = String(note || "").trim();
      const reportedAt = new Date().toISOString();
      const reportLines = [
        `[PAYMENT REPORTED ${reportedAt}] Visitor reported payment by ${reportedMethod.replace(/_/g, " ")}.`,
        trimmedReference ? `Reference: ${trimmedReference}` : null,
        trimmedNote ? `Visitor note: ${trimmedNote}` : null,
        "Staff verification required before marking paid.",
      ].filter(Boolean);

      const updated = await storage.updateBooking(id, {
        paymentMethod: reportedMethod as any,
        paymentReference: trimmedReference || booking.paymentReference || null,
        adminNotes: [booking.adminNotes, reportLines.join(" ")].filter(Boolean).join("\n"),
      });

      await storage.createBookingActivityLog({
        bookingId: id,
        userId: userId || null,
        action: "payment_reported",
        description: `Visitor reported payment by ${reportedMethod.replace(/_/g, " ")}. Staff verification required.`,
        oldStatus: booking.paymentStatus || null,
        newStatus: booking.paymentStatus || null,
      });

      // Create audit log
      if (userId) {
        await createAuditLog(userId, "update", "payment", id,
          { paymentStatus: booking.paymentStatus, paymentMethod: booking.paymentMethod, paymentReference: booking.paymentReference },
          { paymentStatus: booking.paymentStatus, paymentMethod: reportedMethod, paymentReference: trimmedReference || null, reported: true }, req);
      }

      res.json({
        ...updated,
        paymentReportReceived: true,
        message: "Payment reported. Staff will verify it before marking the booking as paid.",
      });
    } catch (error) {
      logError("Error updating visitor payment status", error, req.requestId);
      res.status(500).json({ message: "Failed to report payment" });
    }
  });

  // Visitor can cancel their own pending booking
  app.post("/api/bookings/:id/visitor-cancel", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      // Get booking and verify ownership
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify this booking belongs to the current user
      const user = await storage.getUser(userId);
      if (!visitorOwnsBooking(booking, user)) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Only allow cancellation of pending or confirmed bookings
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return res.status(400).json({ message: "Only pending or confirmed bookings can be cancelled" });
      }

      // Update booking status
      let updated = await storage.updateBookingStatus(id, "cancelled");
      const cancellationUpdate = await storage.updateBooking(id, {
        cancellationCategory: "visitor_requested",
        cancellationReason: "Cancelled by visitor",
        cancellationNote: typeof req.body?.reason === "string" ? req.body.reason.trim() || null : null,
        cancelledAt: new Date(),
        cancelledBy: userId,
      });
      updated = cancellationUpdate || updated;

      // Get guideUserId if assigned
      let guideUserId;
      if (booking.assignedGuideId) {
        const guide = await getAssignedGuide(booking);
        if (guide) guideUserId = guide.userId;
      }

      // Notify Admins and Guide
      await notifyBookingCancelledByVisitor(id, booking.visitorName, booking.bookingReference!, guideUserId || undefined);

      await sendBookingCancelledEmail(updated || booking, "Cancelled by visitor", userId);

      // Create activity log
      await storage.createBookingActivityLog({
        bookingId: id,
        userId: userId,
        action: "visitor_cancelled",
        description: "Booking cancelled by visitor",
        oldStatus: booking.status,
        newStatus: "cancelled",
      });

      // Create audit log
      await createAuditLog(userId, "update", "booking", id,
        { status: booking.status },
        { status: "cancelled", cancellationCategory: "visitor_requested", cancellationReason: "Cancelled by visitor" }, req);

      res.json(updated);
    } catch (error) {
      logError("Error cancelling booking", error, req.requestId);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Visitor can rate their guide after a completed tour
  app.post("/api/bookings/:id/rate-guide", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.session?.userId;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Get booking and verify ownership
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking belongs to current user
      const user = await storage.getUser(userId);
      if (!visitorOwnsBooking(booking, user)) {
        return res.status(403).json({ message: "Not authorized to rate this booking" });
      }

      // Check if booking is completed
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Can only rate completed tours" });
      }

      // Check if guide is assigned
      if (!booking.assignedGuideId) {
        return res.status(400).json({ message: "No guide assigned to this booking" });
      }

      // Check if already rated
      if (booking.visitorRating) {
        return res.status(400).json({ message: "You have already rated this tour" });
      }

      // Save rating on booking
      await storage.updateBookingRating(id, rating);

      // Update guide rating
      const guide = buildGuideLookup(await storage.getGuides()).get(booking.assignedGuideId);
      if (guide) {
        await recalculateGuideRating(guide.id, req.requestId);
      }

      // Create audit log
      await createAuditLog(userId, "create", "guide_rating", guide?.id || booking.assignedGuideId,
        null, { rating, bookingId: id }, req);

      // Notify admins if rating is low (<= 3)
      if (rating <= 3) {
        const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "Unknown Guide";
        await notifyLowRatingReceived(id, guideName, rating, booking.visitorName);
        await sendLowRatingAlertEmail(booking, guideName, rating, userId || null);
      }

      res.json({ success: true, message: "Guide rated successfully", rating });
    } catch (error) {
      logError("Error rating guide", error, req.requestId);
      res.status(500).json({ message: "Failed to rate guide" });
    }
  });

  app.patch("/api/bookings/:id/assign", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { guideId } = req.body;
      const oldBooking = await storage.getBooking(id);
      const booking = await storage.assignGuideToBooking(id, guideId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get guide info and send email
      const guide = await storage.getGuide(guideId);
      const oldGuide = oldBooking ? await getAssignedGuide(oldBooking) : undefined;
      const meetingPoint = booking.meetingPointId
        ? await storage.getMeetingPoint(booking.meetingPointId)
        : null;

      let guideAssignmentEmailResult: { success: boolean; error?: string; messageId?: string } = { success: false };
      if (guide) {
        if (oldGuide && oldGuide.id !== guideId) {
          await sendGuideAssignmentChangedEmails(
            booking,
            oldGuide,
            guide,
            meetingPoint?.name,
            req.session?.userId || null
          );
        } else {
          const guideName = `${guide.firstName} ${guide.lastName}`;
          const guideAssignmentEmail = await sendAutomatedTemplateEmail({
            templateName: "guide_assignment",
            recipientName: booking.visitorName,
            recipientEmail: booking.visitorEmail,
            data: buildBookingTemplateData(booking, {
              meeting_point: meetingPoint?.name,
              guide_name: guideName,
              guide_phone: guide.phone,
            }),
            fallbackSubject: `Guide Assigned - ${booking.bookingReference}`,
            fallbackMessage: `Guide assignment email sent for ${guideName}.`,
            fallbackSend: () => sendGuideAssignmentDetailed({
              visitorName: booking.visitorName,
              visitorEmail: booking.visitorEmail,
              bookingReference: booking.bookingReference!,
              guideName,
              guidePhone: guide.phone,
              visitDate: booking.visitDate,
              visitTime: booking.visitTime,
              meetingPoint: meetingPoint?.name,
            }),
          });
          guideAssignmentEmailResult = guideAssignmentEmail.result;

          await storage.createEmailLog({
            sentBy: req.session?.userId,
            recipientName: booking.visitorName,
            recipientEmail: booking.visitorEmail,
            subject: guideAssignmentEmail.subject,
            message: guideAssignmentEmail.message,
            templateType: "guide_assignment",
            status: guideAssignmentEmailResult.success ? "accepted" : "failed",
            errorMessage: guideAssignmentEmailResult.error,
            providerMessageId: guideAssignmentEmailResult.messageId,
            relatedEntityType: "booking",
            relatedEntityId: booking.id,
            metadata: buildEmailLogMetadata(booking, guideAssignmentEmail, { guideId }),
          });
        }

        await sendGuideTourAssignmentEmail(
          booking,
          guide,
          meetingPoint?.name,
          req.session?.userId || null
        );

        if (guide.userId) {
          await notifyGuideAssigned(booking.id, guide.userId, booking.visitorName, booking.visitDate);
        }
      }

      // Create audit log
      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "booking", id,
          { assignedGuideId: oldBooking?.assignedGuideId || null }, { assignedGuideId: guideId }, req);
      }

      res.json(booking);
    } catch (error) {
      logError("Error assigning guide", error, req.requestId);
      res.status(500).json({ message: "Failed to assign guide" });
    }
  });

  app.patch("/api/bookings/:id/notes", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const booking = await storage.updateBookingNotes(id, adminNotes);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      logError("Error updating notes", error, req.requestId);
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  // Check-in endpoint (Security module) - security, admin, coordinator
  app.post("/api/bookings/:id/check-in", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      const booking = await storage.checkInVisitor(id, userId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get guide info for email
      let guideName: string | undefined;
      if (booking.assignedGuideId) {
        const guide = await getAssignedGuide(booking);
        if (guide) {
          guideName = `${guide.firstName} ${guide.lastName}`;
        }
      }

      // Send check-in notification
      const checkInTime = new Date().toLocaleTimeString();
      const checkInEmail = await sendAutomatedTemplateEmail({
        templateName: "check_in_notification",
        recipientName: booking.visitorName,
        recipientEmail: booking.visitorEmail,
        data: buildBookingTemplateData(booking, {
          check_in_time: checkInTime,
          guide_name: guideName || "",
        }),
        fallbackSubject: `Check-in Confirmed - ${booking.bookingReference}`,
        fallbackMessage: `Check-in notification sent for ${booking.visitorName}.`,
        fallbackSend: () => sendCheckInNotificationDetailed({
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          bookingReference: booking.bookingReference!,
          checkInTime,
          guideName,
        }),
      });

      await storage.createEmailLog({
        sentBy: userId,
        recipientName: booking.visitorName,
        recipientEmail: booking.visitorEmail,
        subject: checkInEmail.subject,
        message: checkInEmail.message,
        templateType: "check_in_notification",
        status: checkInEmail.result.success ? "accepted" : "failed",
        errorMessage: checkInEmail.result.error,
        providerMessageId: checkInEmail.result.messageId,
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        metadata: buildEmailLogMetadata(booking, checkInEmail),
      });

      // Create audit log
      await createAuditLog(userId, "check_in", "booking", id, null,
        { checkInTime: booking.checkInTime }, req);

      res.json(booking);
    } catch (error) {
      logError("Error checking in visitor", error, req.requestId);
      res.status(500).json({ message: "Failed to check in visitor" });
    }
  });

  // Check-out endpoint (Security module) - security, admin, coordinator
  app.post("/api/bookings/:id/check-out", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      const booking = await storage.checkOutVisitor(id, userId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Create audit log
      await createAuditLog(userId, "check_out", "booking", id, null,
        { checkOutTime: booking.checkOutTime }, req);

      res.json(booking);
    } catch (error) {
      logError("Error checking out visitor", error, req.requestId);
      res.status(500).json({ message: "Failed to check out visitor" });
    }
  });

  // No-Show endpoint (Security module) - security, admin, coordinator
  app.post("/api/bookings/:id/no-show", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only confirmed bookings can be marked as no-show
      if (booking.status !== "confirmed") {
        return res.status(400).json({ message: "Only confirmed bookings can be marked as no-show" });
      }

      // Update status to no_show
      const updatedBooking = await storage.updateBookingStatus(id, "no_show");

      // Create audit log
      await createAuditLog(userId, "mark_no_show", "booking", id,
        { status: booking.status }, { status: "no_show" }, req);

      res.json(updatedBooking ? buildSafeBookingForRole(updatedBooking, "guide") : null);
    } catch (error) {
      logError("Error marking visitor as no-show", error, req.requestId);
      res.status(500).json({ message: "Failed to mark visitor as no-show" });
    }
  });

  // Start tour endpoint - transition from confirmed to in_progress
  app.post("/api/bookings/:id/start", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      const oldBooking = await storage.getBooking(id);
      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (oldBooking.status !== "confirmed") {
        return res.status(400).json({ message: "Booking must be confirmed to start tour" });
      }

      const canManage = await ensureAssignedGuideCanManageBooking(req, res, oldBooking);
      if (!canManage) return;

      const booking = await storage.updateBookingStatus(id, "in_progress");

      // Create activity log
      await storage.createBookingActivityLog({
        bookingId: id,
        userId: userId || null,
        action: "tour_started",
        description: "Tour has started",
        oldStatus: oldBooking.status,
        newStatus: "in_progress",
      });

      res.json(booking);
    } catch (error) {
      logError("Error starting tour", error, req.requestId);
      res.status(500).json({ message: "Failed to start tour" });
    }
  });

  // Complete tour endpoint - transition from in_progress to completed
  app.post("/api/bookings/:id/complete", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.session?.userId;

      const oldBooking = await storage.getBooking(id);
      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (oldBooking.status !== "in_progress") {
        return res.status(400).json({ message: "Tour must be in progress to complete" });
      }

      const canManage = await ensureAssignedGuideCanManageBooking(req, res, oldBooking);
      if (!canManage) return;

      const booking = await storage.updateBookingStatus(id, "completed");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update guide rating if assigned
      if (oldBooking.assignedGuideId) {
        if (rating && rating >= 1 && rating <= 5) {
          const guide = await getAssignedGuide(oldBooking);
          if (guide) {
            await storage.updateGuideRating(guide.id, rating);
          }
        }
      }

      // Create activity log
      await storage.createBookingActivityLog({
        bookingId: id,
        userId: userId || null,
        action: "tour_completed",
        description: rating ? `Tour completed with rating ${rating}/5` : "Tour completed",
        oldStatus: oldBooking.status,
        newStatus: "completed",
      });

      await sendFeedbackRequestEmail(booking, userId || null);

      res.json(booking);
    } catch (error) {
      logError("Error completing tour", error, req.requestId);
      res.status(500).json({ message: "Failed to complete tour" });
    }
  });

  // Booking companions endpoints
  app.get("/api/bookings/:id/companions", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const companions = await storage.getBookingCompanions(req.params.id);
      res.json(companions);
    } catch (error) {
      logError("Error fetching companions", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch companions" });
    }
  });

  app.post("/api/bookings/:id/companions", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const companionData = insertBookingCompanionSchema.parse({
        ...req.body,
        bookingId: req.params.id,
      });
      const companion = await storage.createBookingCompanion(companionData);
      res.status(201).json(companion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        logError("Error creating companion", error, req.requestId);
        res.status(500).json({ message: "Failed to create companion" });
      }
    }
  });

  app.delete("/api/bookings/:bookingId/companions/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteBookingCompanion(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting companion", error, req.requestId);
      res.status(500).json({ message: "Failed to delete companion" });
    }
  });

  // Guides endpoints - admin and coordinator can view all, guides can view their own
  app.get("/api/guides/me", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const allBookings = await storage.getBookings();
      const assignedBookings = getGuideBookings(allBookings, guide).filter(
        (booking) => booking.status !== "cancelled"
      );
      const completedBookings = assignedBookings.filter((booking) => booking.status === "completed");
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + getBookingGuideEarnings(booking), 0);

      res.json({
        ...guide,
        totalTours: assignedBookings.length,
        completedTours: completedBookings.length,
        totalEarnings,
      });
    } catch (error) {
      logError("Error fetching guide profile", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide profile" });
    }
  });

  app.patch("/api/guides/me", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const payload = guideSelfProfileSchema.parse(req.body);
      const proposedData: Partial<Guide> = {};

      if (payload.firstName !== undefined) proposedData.firstName = payload.firstName;
      if (payload.lastName !== undefined) proposedData.lastName = payload.lastName;
      if (payload.email !== undefined) proposedData.email = payload.email;
      if (payload.phone !== undefined) proposedData.phone = payload.phone;
      if (payload.profileImageUrl !== undefined) proposedData.profileImageUrl = payload.profileImageUrl;
      if (payload.bio !== undefined) proposedData.bio = payload.bio;

      const languages = uniqueStringList(payload.languages);
      const specialties = uniqueStringList(payload.specialties);
      const availableDays = uniqueStringList(payload.availableDays);
      const preferredTimes = uniqueStringList(payload.preferredTimes);

      if (languages !== undefined) proposedData.languages = languages;
      if (specialties !== undefined) proposedData.specialties = specialties;
      if (availableDays !== undefined) proposedData.availableDays = availableDays;
      if (preferredTimes !== undefined) proposedData.preferredTimes = preferredTimes;

      if (Object.keys(proposedData).length === 0) {
        return res.status(400).json({ message: "No guide profile changes submitted" });
      }

      const changeRequest = await storage.createGuideProfileChangeRequest({
        guideId: guide.id,
        guideUserId: guide.userId || userId,
        submittedByUserId: userId,
        status: "pending",
        currentData: buildGuideProfileSnapshot(guide),
        proposedData,
      } as any);

      await createAuditLog(userId, "update", "guide_profile_change_request", changeRequest.id, null, {
        guideId: guide.id,
        proposedData,
      }, req);

      res.status(202).json({
        guide,
        changeRequest,
        message: "Your guide profile changes were submitted for admin review.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid guide profile", errors: error.errors });
      }

      logError("Error updating guide self profile", error, req.requestId);
      res.status(500).json({ message: "Failed to update guide profile" });
    }
  });

  app.get("/api/guides/me/profile-change-requests", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const requests = await storage.getGuideProfileChangeRequestsByGuide(guide.id);
      res.json(requests);
    } catch (error) {
      logError("Error fetching guide profile change requests", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch profile change requests" });
    }
  });

  app.get("/api/admin/guide-profile-change-requests", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const status = typeof req.query.status === "string" && req.query.status !== "all"
        ? req.query.status
        : undefined;
      const requests = await storage.getGuideProfileChangeRequests(status);
      res.json(await Promise.all(requests.map(enrichGuideProfileChangeRequest)));
    } catch (error) {
      logError("Error fetching admin guide profile change requests", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide profile review queue" });
    }
  });

  app.get("/api/admin/guide-profile-change-requests/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const request = await storage.getGuideProfileChangeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Guide profile change request not found" });
      }

      res.json(await enrichGuideProfileChangeRequest(request));
    } catch (error) {
      logError("Error fetching guide profile change request", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide profile review" });
    }
  });

  app.post("/api/admin/guide-profile-change-requests/:id/decision", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = guideProfileReviewDecisionSchema.parse(req.body);
      const reviewerId = req.session?.userId;
      const request = await storage.getGuideProfileChangeRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Guide profile change request not found" });
      }

      if (request.status !== "pending") {
        return res.status(409).json({ message: "This guide profile change has already been reviewed" });
      }

      let updatedGuide: Guide | undefined;
      if (payload.decision === "approved") {
        const guideUpdates = extractApprovedGuideProfileUpdates(request);
        if (Object.keys(guideUpdates).length === 0) {
          return res.status(400).json({ message: "No approved guide profile fields found" });
        }

        updatedGuide = await storage.updateGuide(request.guideId, guideUpdates);
        if (!updatedGuide) {
          return res.status(404).json({ message: "Guide profile not found" });
        }

        if (updatedGuide.userId) {
          const userProfileUpdates: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            profileImageUrl?: string;
          } = {};
          if (typeof guideUpdates.firstName === "string") userProfileUpdates.firstName = guideUpdates.firstName;
          if (typeof guideUpdates.lastName === "string") userProfileUpdates.lastName = guideUpdates.lastName;
          if (typeof guideUpdates.phone === "string") userProfileUpdates.phone = guideUpdates.phone;
          if (typeof guideUpdates.profileImageUrl === "string") userProfileUpdates.profileImageUrl = guideUpdates.profileImageUrl;
          if (Object.keys(userProfileUpdates).length > 0) {
            await storage.updateUserProfile(updatedGuide.userId, userProfileUpdates);
          }
        }
      }

      const reviewedRequest = await storage.updateGuideProfileChangeRequest(request.id, {
        status: payload.decision,
        reviewNotes: payload.notes || null,
        reviewedByUserId: reviewerId || null,
        reviewedAt: new Date() as any,
      });

      if (reviewerId) {
        await createAuditLog(reviewerId, "update", "guide_profile_change_request", request.id,
          { status: request.status, proposedData: request.proposedData },
          { status: payload.decision, notes: payload.notes || null },
          req
        );
      }

      res.json({
        request: reviewedRequest ? await enrichGuideProfileChangeRequest(reviewedRequest) : null,
        guide: updatedGuide || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review decision", errors: error.errors });
      }
      logError("Error reviewing guide profile change request", error, req.requestId);
      res.status(500).json({ message: "Failed to review guide profile change" });
    }
  });

  // Guide earnings endpoint
  app.get("/api/guides/me/earnings", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      // Get all completed bookings for this guide
      const allBookings = await storage.getBookings();
      const guideBookings = getGuideBookings(allBookings, guide).filter(b => b.status === "completed");

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalEarnings = guideBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0);
      const weeklyEarnings = guideBookings
        .filter(b => new Date(b.visitDate) >= startOfWeek)
        .reduce((sum, b) => sum + getBookingGuideEarnings(b), 0);
      const monthlyEarnings = guideBookings
        .filter(b => new Date(b.visitDate) >= startOfMonth)
        .reduce((sum, b) => sum + getBookingGuideEarnings(b), 0);
      const payouts = await storage.getPayouts({ guideId: guide.id });
      const pendingPayouts = payouts.filter((payout) => payout.status === "pending");
      const paidPayouts = payouts.filter((payout) => payout.status === "paid");
      const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
      const paidPayoutAmount = paidPayouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
      const lastPaidPayout = paidPayouts
        .filter((payout) => payout.paidAt)
        .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())[0];

      // Get detailed earnings list
      const earningsList = guideBookings.map(b => ({
        id: b.id,
        visitorName: b.visitorName,
        visitDate: b.visitDate,
        tourType: b.tourType,
        numberOfPeople: b.numberOfPeople,
        guidePayment: getBookingGuideEarnings(b),
        totalAmount: b.totalAmount || 0,
      })).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

      res.json({
        totalEarnings,
        weeklyEarnings,
        monthlyEarnings,
        totalTours: guideBookings.length,
        payoutSummary: {
          pendingAmount: pendingPayoutAmount,
          pendingCount: pendingPayouts.length,
          paidAmount: paidPayoutAmount,
          paidCount: paidPayouts.length,
          lastPaidAt: lastPaidPayout?.paidAt || null,
          status: pendingPayouts.length > 0 ? "pending" : paidPayouts.length > 0 ? "paid" : "not_started",
        },
        earnings: earningsList,
      });
    } catch (error) {
      logError("Error fetching guide earnings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Guide's assigned tours (upcoming, in-progress, completed)
  app.get("/api/guides/me/tours", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const allBookings = await storage.getBookings();
      const guideBookings = allBookings
        .filter(b => isBookingAssignedToGuide(b, guide))
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

      res.json(guideBookings.map((booking) => buildSafeBookingForRole(booking, "guide")));
    } catch (error) {
      logError("Error fetching guide tours", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  app.get("/api/guides/me/tour-reports", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const reports = await storage.getGuideTourReports({ guideId: guide.id });
      res.json(reports);
    } catch (error) {
      logError("Error fetching guide tour reports", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tour reports" });
    }
  });

  // Guide check-in visitor
  app.post("/api/bookings/:id/guide-check-in", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session?.userId;

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!isBookingAssignedToGuide(booking, guide)) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      // Update status to in_progress
      const updatedBooking = await storage.updateBookingStatus(bookingId, "in_progress");

      // Log check-in with check-in time (note: checkInTime would need to be handled separately or via admin notes)
      await createAuditLog(userId, "check_in", "booking", bookingId,
        { status: booking.status }, { status: "in_progress" }, req);

      res.json(updatedBooking ? buildSafeBookingForRole(updatedBooking, "guide") : null);
    } catch (error) {
      logError("Error checking in visitor", error, req.requestId);
      res.status(500).json({ message: "Failed to check in visitor" });
    }
  });

  // Guide check-out visitor
  app.post("/api/bookings/:id/guide-check-out", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session?.userId;

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!isBookingAssignedToGuide(booking, guide)) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      // Update status to completed
      const updatedBooking = await storage.updateBookingStatus(bookingId, "completed");

      // Keep denormalized legacy stats from drifting on repeat check-outs.
      if (booking.status !== "completed") {
        await storage.updateGuide(guide.id, {
          completedTours: (guide.completedTours || 0) + 1,
        });
      }

      await createAuditLog(userId, "check_out", "booking", bookingId,
        { status: booking.status }, { status: "completed" }, req);

      if (updatedBooking) {
        await sendFeedbackRequestEmail(updatedBooking, userId || null);
      }

      res.json(updatedBooking ? buildSafeBookingForRole(updatedBooking, "guide") : null);
    } catch (error) {
      logError("Error checking out visitor", error, req.requestId);
      res.status(500).json({ message: "Failed to check out visitor" });
    }
  });

  // Guide mark visitor as no-show
  app.post("/api/bookings/:id/guide-no-show", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.session?.userId;

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!isBookingAssignedToGuide(booking, guide)) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      // Only confirmed bookings can be marked as no-show
      if (booking.status !== "confirmed") {
        return res.status(400).json({ message: "Only confirmed bookings can be marked as no-show" });
      }

      // Update status to no_show
      const updatedBooking = await storage.updateBookingStatus(bookingId, "no_show");

      await createAuditLog(userId, "mark_no_show", "booking", bookingId,
        { status: booking.status }, { status: "no_show" }, req);

      res.json(updatedBooking);
    } catch (error) {
      logError("Error marking visitor as no-show", error, req.requestId);
      res.status(500).json({ message: "Failed to mark visitor as no-show" });
    }
  });

  app.post("/api/bookings/:id/guide-report", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const payload = guideTourReportSchema.parse(req.body);
      const bookingId = req.params.id;
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!isBookingAssignedToGuide(booking, guide)) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      if (booking.status !== "completed") {
        return res.status(409).json({ message: "Post-tour reports can only be submitted after checkout" });
      }

      const existingReport = await storage.getGuideTourReportByBookingAndGuide(booking.id, guide.id);
      const reportPayload = {
        bookingId: booking.id,
        guideId: guide.id,
        guideUserId: userId,
        summary: payload.summary,
        visitorNeeds: payload.visitorNeeds || null,
        incidents: payload.incidents || null,
        followUpNeeded: payload.followUpNeeded,
        privateNotes: payload.privateNotes || null,
        status: "submitted",
        reviewedByUserId: null,
        reviewedAt: null,
        adminReviewNotes: null,
      };

      const report = existingReport
        ? await storage.updateGuideTourReport(existingReport.id, reportPayload as Partial<GuideTourReport>)
        : await storage.createGuideTourReport(reportPayload as any);

      if (!report) {
        return res.status(500).json({ message: "Failed to save tour report" });
      }

      await storage.createBookingActivityLog({
        bookingId: booking.id,
        userId,
        action: existingReport ? "guide_tour_report_updated" : "guide_tour_report_submitted",
        description: existingReport
          ? `Guide updated post-tour report for ${booking.bookingReference || booking.id}.`
          : `Guide submitted post-tour report for ${booking.bookingReference || booking.id}.`,
        oldStatus: booking.status || null,
        newStatus: booking.status || null,
      });

      await createAuditLog(userId, existingReport ? "update" : "create", "guide_tour_report", report.id,
        existingReport || null,
        report,
        req
      );

      res.status(existingReport ? 200 : 201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tour report", errors: error.errors });
      }
      logError("Error saving guide tour report", error, req.requestId);
      res.status(500).json({ message: "Failed to save tour report" });
    }
  });

  app.get("/api/admin/guide-tour-reports", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const status = typeof req.query.status === "string" && req.query.status !== "all"
        ? req.query.status
        : undefined;
      const reports = await storage.getGuideTourReports({ status });
      res.json(await Promise.all(reports.map(enrichGuideTourReport)));
    } catch (error) {
      logError("Error fetching admin guide tour reports", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide tour reports" });
    }
  });

  app.get("/api/admin/guide-tour-reports/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const reports = await storage.getGuideTourReports();
      const report = reports.find((item) => item.id === req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Guide tour report not found" });
      }

      res.json(await enrichGuideTourReport(report));
    } catch (error) {
      logError("Error fetching guide tour report", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide tour report" });
    }
  });

  app.post("/api/admin/guide-tour-reports/:id/review", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = guideTourReportReviewSchema.parse(req.body);
      const reviewerId = req.session?.userId;
      const existingReports = await storage.getGuideTourReports();
      const report = existingReports.find((item) => item.id === req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Guide tour report not found" });
      }

      const updated = await storage.updateGuideTourReport(report.id, {
        status: payload.status,
        adminReviewNotes: payload.notes || null,
        reviewedByUserId: reviewerId || null,
        reviewedAt: new Date() as any,
      });
      if (!updated) {
        return res.status(404).json({ message: "Guide tour report not found" });
      }

      if (reviewerId) {
        await createAuditLog(reviewerId, "update", "guide_tour_report", updated.id,
          { status: report.status, adminReviewNotes: report.adminReviewNotes || null },
          { status: updated.status, adminReviewNotes: updated.adminReviewNotes || null },
          req
        );
      }

      res.json(await enrichGuideTourReport(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report review", errors: error.errors });
      }
      logError("Error reviewing guide tour report", error, req.requestId);
      res.status(500).json({ message: "Failed to review guide tour report" });
    }
  });

  // Get guide availability
  app.get("/api/guides/me/availability", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      // Return guide's availability settings
      res.json({
        guideId: guide.id,
        availability: guide.availability || {},
        workingHours: guide.workingHours || { start: "08:00", end: "17:00" },
        isActive: guide.isActive,
      });
    } catch (error) {
      logError("Error fetching guide availability", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Update guide availability
  app.patch("/api/guides/me/availability", isAuthenticated, requireRole("guide"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const { availability, workingHours } = req.body;

      const updates: any = {};
      if (availability !== undefined) updates.availability = availability;
      if (workingHours !== undefined) updates.workingHours = workingHours;

      const updatedGuide = await storage.updateGuide(guide.id, updates);

      await createAuditLog(userId, "update", "guide", guide.id,
        { availability: guide.availability, workingHours: guide.workingHours },
        updates, req);

      res.json({
        guideId: updatedGuide?.id,
        availability: updatedGuide?.availability || {},
        workingHours: updatedGuide?.workingHours || { start: "08:00", end: "17:00" },
        isActive: updatedGuide?.isActive,
      });
    } catch (error) {
      logError("Error updating guide availability", error, req.requestId);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.get("/api/guides", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.guidesRead), requireRole("admin", "coordinator", "guide", "security"), async (req: any, res) => {
    try {
      const guidesList = await storage.getGuides();
      const bookings = await storage.getBookings();
      const guidesWithStats = guidesList.map((guide) => buildGuideComputedStats(guide, bookings));
      const currentUser = req.currentUser as User | undefined;
      const canViewFullGuideRecords = currentUser?.role === "admin" || currentUser?.role === "coordinator";

      if (canViewFullGuideRecords) {
        return res.json(guidesWithStats);
      }

      const publicGuideDirectory = guidesWithStats
        .filter((guide) => guide.isActive || guide.userId === currentUser?.id)
        .map((guide) => ({
          id: guide.id,
          userId: guide.userId,
          firstName: guide.firstName,
          lastName: guide.lastName,
          phone: guide.phone,
          profileImageUrl: guide.profileImageUrl,
          bio: guide.bio,
          languages: guide.languages,
          specialties: guide.specialties,
          assignedZones: guide.assignedZones,
          availableDays: guide.availableDays,
          preferredTimes: guide.preferredTimes,
          isActive: guide.isActive,
          rating: guide.rating,
          totalRatings: guide.totalRatings,
          totalTours: guide.totalTours,
          completedTours: guide.completedTours,
          availability: guide.availability,
          workingHours: guide.workingHours,
        }));

      res.json(publicGuideDirectory);
    } catch (error) {
      logError("Error fetching guides", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guides" });
    }
  });

  // Get guide by URL slug (firstname-lastname format)
  app.get("/api/guides/slug/:slug", isAuthenticated, requireRole("admin", "coordinator", "guide", "security"), async (req, res) => {
    try {
      const slug = req.params.slug.toLowerCase().trim();

      const guides = await storage.getGuides();

      // Normalize function to create consistent slugs
      const normalizeSlug = (str: string) => str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')  // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters

      // Find guide by matching slug (firstname-lastname)
      const guide = guides.find(g => {
        const guideSlug = normalizeSlug(`${g.firstName}-${g.lastName}`);
        return guideSlug === slug;
      });

      if (!guide) {
        logger.debug("Guide not found for slug", { slug, requestId: req.requestId });
        return res.status(404).json({ message: "Guide not found" });
      }

      const user = await getRequestUser(req);
      const isStaff = user?.role === "admin" || user?.role === "coordinator" || user?.role === "security";
      if (!isStaff && !(await requireGuideOwnerOrStaff(req, guide.id))) {
        return res.status(403).json({ message: "You can only access your own guide profile" });
      }

      const bookings = await storage.getBookings();
      res.json(buildGuideComputedStats(guide, bookings));
    } catch (error) {
      logError("Error fetching guide by slug", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide" });
    }
  });

  // Get bookings for a specific guide
  app.get("/api/guides/:id/bookings", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const guide = await storage.getGuide(req.params.id);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }
      if (!(await requireGuideOwnerOrStaff(req, guide.id))) {
        return res.status(403).json({ message: "You can only access your own guide bookings" });
      }
      const bookings = await storage.getBookings();
      const guideBookings = getGuideBookings(bookings, guide);
      const user = await getRequestUser(req);
      res.json(guideBookings.map((booking) => buildSafeBookingForRole(booking, user?.role as UserRole)));
    } catch (error) {
      logError("Error fetching guide bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide bookings" });
    }
  });

  // Get reviews for a specific guide
  app.get("/api/guides/:id/reviews", isAuthenticated, requireRole("admin", "coordinator", "guide", "security"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getTourReviews();
      const user = await getRequestUser(req);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isStaff = user.role === "admin" || user.role === "coordinator";
      let isOwnProfile = false;
      if (user.role === "guide") {
        const guide = await storage.getGuideByUserId(user.id);
        if (guide && guide.id === id) {
          isOwnProfile = true;
        }
      }
      if (user.role === "guide" && !isOwnProfile) {
        return res.status(403).json({ message: "You can only access your own guide reviews" });
      }

      let guideReviews = reviews.filter(r => r.guideId === id);

      // If not staff and not their own profile, only show published reviews
      if (!isStaff && !isOwnProfile) {
        guideReviews = guideReviews.filter(r => r.status === "published");
      }

      res.json(guideReviews);
    } catch (error) {
      logError("Error fetching guide reviews", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide reviews" });
    }
  });

  // Guide matching - recommends guides for a booking
  // NOTE: This must be defined BEFORE /api/guides/:id to prevent route conflicts
  app.get("/api/guides/suggest", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { visitDate, visitTime, selectedZones, excludeGuideIds } = req.query;

      if (!visitDate || !visitTime) {
        return res.status(400).json({ message: "visitDate and visitTime are required" });
      }

      const zones = selectedZones
        ? (Array.isArray(selectedZones) ? selectedZones : [selectedZones]) as string[]
        : [];

      const excludeIds = excludeGuideIds
        ? (Array.isArray(excludeGuideIds) ? excludeGuideIds : [excludeGuideIds]) as string[]
        : [];

      const suggestions = await suggestGuides({
        visitDate: visitDate as string,
        visitTime: visitTime as string,
        selectedZones: zones,
        excludeGuideIds: excludeIds,
      });

      // Add a top reason summary to each suggestion
      const enrichedSuggestions = suggestions.map(s => ({
        ...s,
        topReason: getTopReason(s),
      }));

      res.json(enrichedSuggestions);
    } catch (error) {
      logError("Error suggesting guides", error, req.requestId);
      res.status(500).json({ message: "Failed to suggest guides" });
    }
  });

  // Guide Comparison - side-by-side stats for selected guides
  // NOTE: This must be defined BEFORE /api/guides/:id to prevent route conflicts
  app.get("/api/guides/compare", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { guideIds } = req.query;

      if (!guideIds) {
        return res.status(400).json({ message: "guideIds parameter is required" });
      }

      const ids = Array.isArray(guideIds) ? guideIds as string[] : [guideIds as string];

      if (ids.length < 2 || ids.length > 4) {
        return res.status(400).json({ message: "Select 2-4 guides to compare" });
      }

      // Get guides
      const guides = await storage.getGuidesByIds(ids);
      if (guides.length === 0) {
        return res.status(404).json({ message: "No guides found" });
      }

      // Get all bookings to calculate stats
      const allBookings = await storage.getBookings();

      // Calculate comparison stats for each guide
      const comparison = guides.map(guide => {
        const guideBookings = getGuideBookings(allBookings, guide);
        const countedBookings = guideBookings.filter(b => b.status !== "cancelled");
        const completedBookings = guideBookings.filter(b => b.status === "completed");
        const cancelledBookings = guideBookings.filter(b => b.status === "cancelled" || b.status === "no_show");

        // Calculate monthly trends (last 6 months)
        const monthlyStats = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthBookings = completedBookings.filter(b => {
            const visitDate = new Date(b.visitDate);
            return visitDate >= monthStart && visitDate <= monthEnd;
          });

          monthlyStats.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            tours: monthBookings.length,
            earnings: monthBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0),
          });
        }

        // Calculate average rating from visitor ratings
        const ratedBookings = completedBookings.filter(b => b.visitorRating);
        const avgVisitorRating = ratedBookings.length > 0
          ? ratedBookings.reduce((sum, b) => sum + (b.visitorRating || 0), 0) / ratedBookings.length
          : null;

        return {
          guide: {
            id: guide.id,
            firstName: guide.firstName,
            lastName: guide.lastName,
            profileImageUrl: guide.profileImageUrl,
            languages: guide.languages,
            specialties: guide.specialties,
            assignedZones: guide.assignedZones,
          },
          stats: {
            totalTours: countedBookings.length,
            completedTours: completedBookings.length,
            totalEarnings: completedBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0),
            rating: guide.rating || 0,
            totalRatings: guide.totalRatings || 0,
            avgVisitorRating: avgVisitorRating ? Math.round(avgVisitorRating * 10) / 10 : null,
            completionRate: countedBookings.length > 0
              ? Math.round((completedBookings.length / countedBookings.length) * 100)
              : 0,
            cancellationRate: guideBookings.length > 0
              ? Math.round((cancelledBookings.length / guideBookings.length) * 100)
              : 0,
          },
          monthlyTrends: monthlyStats,
        };
      });

      res.json(comparison);
    } catch (error) {
      logError("Error comparing guides", error, req.requestId);
      res.status(500).json({ message: "Failed to compare guides" });
    }
  });

  app.get("/api/guides/:id/performance-detail", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const guide = await storage.getGuide(req.params.id);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }

      const allBookings = await storage.getBookings();
      const guideBookings = getGuideBookings(allBookings, guide);
      const countedBookings = guideBookings.filter((booking) => booking.status !== "cancelled");
      const completedBookings = guideBookings.filter((booking) => booking.status === "completed");
      const cancelledBookings = guideBookings.filter(
        (booking) => booking.status === "cancelled" || booking.status === "no_show"
      );
      const ratedBookings = guideBookings.filter((booking) => Number(booking.visitorRating || 0) > 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingBookings = guideBookings
        .filter((booking) => {
          if (!booking.visitDate) return false;
          const visitDate = new Date(booking.visitDate);
          return visitDate >= today && booking.status !== "cancelled" && booking.status !== "no_show";
        })
        .sort((a, b) => dateSortValue(a.visitDate) - dateSortValue(b.visitDate))
        .slice(0, 10);

      const recentBookings = [...guideBookings]
        .sort((a, b) => {
          const visitDiff = dateSortValue(b.visitDate) - dateSortValue(a.visitDate);
          return visitDiff || dateSortValue(b.createdAt) - dateSortValue(a.createdAt);
        })
        .slice(0, 20);

      const totalRevenue = completedBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + getBookingGuideEarnings(booking), 0);
      const paidBookings = completedBookings.filter((booking) => booking.paymentStatus === "paid");
      const payableEarnings = paidBookings.reduce((sum, booking) => sum + getBookingGuideEarnings(booking), 0);
      const pendingPaymentEarnings = Math.max(totalEarnings - payableEarnings, 0);

      const payouts = await storage.getPayouts({ guideId: guide.id });
      const paidPayoutAmount = payouts
        .filter((payout) => payout.status === "paid")
        .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
      const pendingPayoutAmount = payouts
        .filter((payout) => payout.status === "pending")
        .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
      const outstandingAmount = Math.max(totalEarnings - paidPayoutAmount - pendingPayoutAmount, 0);

      const countryCounts = new Map<string, number>();
      guideBookings.forEach((booking) => {
        const country = String(booking.visitorCountry || "").trim();
        if (country) countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      });
      const bookingsWithCountry = Array.from(countryCounts.values()).reduce((sum, count) => sum + count, 0);
      const visitorCountries = Array.from(countryCounts.entries())
        .map(([country, count]) => ({
          country,
          count,
          percentage: bookingsWithCountry > 0 ? Math.round((count / bookingsWithCountry) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const reports = await storage.getGuideTourReports({ guideId: guide.id });
      const bookingMap = new Map(guideBookings.map((booking) => [booking.id, booking]));
      const reportsWithBookings = reports.map((report) => {
        const booking = bookingMap.get(report.bookingId);
        return {
          ...report,
          booking: booking
            ? {
              id: booking.id,
              bookingReference: booking.bookingReference,
              visitorName: booking.visitorName,
              visitDate: booking.visitDate,
              status: booking.status,
            }
            : null,
        };
      });

      const availability = await storage.getGuideAvailability(guide.id);

      res.json({
        guide,
        stats: {
          totalTours: countedBookings.length,
          completedTours: completedBookings.length,
          cancelledTours: cancelledBookings.length,
          upcomingTours: upcomingBookings.length,
          completionRate: countedBookings.length > 0
            ? Math.round((completedBookings.length / countedBookings.length) * 100)
            : 0,
          cancellationRate: guideBookings.length > 0
            ? Math.round((cancelledBookings.length / guideBookings.length) * 100)
            : 0,
          totalRevenue,
          totalEarnings,
          payableEarnings,
          pendingPaymentEarnings,
          paidPayoutAmount,
          pendingPayoutAmount,
          outstandingAmount,
          averageVisitorRating: ratedBookings.length > 0
            ? Math.round((ratedBookings.reduce((sum, booking) => sum + Number(booking.visitorRating || 0), 0) / ratedBookings.length) * 10) / 10
            : null,
          totalRatings: ratedBookings.length,
          reportsSubmitted: reports.length,
          reportsPendingReview: reports.filter((report) => report.status === "submitted").length,
          followUpsNeeded: reports.filter((report) => report.followUpNeeded).length,
          bookingsWithCountry,
        },
        visitorCountries,
        upcomingBookings,
        recentBookings,
        payouts,
        reports: reportsWithBookings,
        availability,
      });
    } catch (error) {
      logError("Error fetching guide performance detail", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide performance detail" });
    }
  });

  app.get("/api/bookings/recent", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      // Get 10 most recent bookings
      const recentBookings = bookings
        .sort((a, b) => dateSortValue(b.createdAt) - dateSortValue(a.createdAt))
        .slice(0, 10);
      res.json(recentBookings);
    } catch (error: any) {
      console.error("Failed to fetch recent bookings:", error);
      res.status(500).send("Failed to fetch recent bookings");
    }
  });

  // Get GetYourGuide bookings
  app.get("/api/bookings/channel/getyourguide", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      // Filter bookings from GetYourGuide source
      const gygBookings = bookings
        .filter(b => b.source === 'getyourguide')
        .sort((a, b) => dateSortValue(b.createdAt) - dateSortValue(a.createdAt));
      res.json(gygBookings);
    } catch (error: any) {
      console.error("Failed to fetch GetYourGuide bookings:", error);
      res.status(500).send("Failed to fetch GetYourGuide bookings");
    }
  });

  app.get("/api/guides/:id", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.guidesRead), requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const guide = await storage.getGuide(req.params.id);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }
      if (!(await requireGuideOwnerOrStaff(req, guide.id))) {
        return res.status(403).json({ message: "You can only access your own guide profile" });
      }
      const bookings = await storage.getBookings();
      res.json(buildGuideComputedStats(guide, bookings));
    } catch (error) {
      logError("Error fetching guide", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide" });
    }
  });

  app.post("/api/guides", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const guideData = insertGuideSchema.parse(req.body);

      // Check if there is an existing user with this email
      let userId = null;
      if (guideData.email) {
        const existingUser = await storage.getUserByEmail(guideData.email);
        if (existingUser) {
          userId = existingUser.id;

          // Ensure user has "guide" role if they are currently just a visitor
          // Note: We don't overwrite if they are already 'admin' or 'coordinator'
          if (existingUser.role === "visitor") {
            await storage.updateUserRole(existingUser.id, "guide");
          }
        }
      }

      const guide = await storage.createGuide({
        ...guideData,
        userId: userId // Use found userId or null
      });

      const sessionUserId = req.session?.userId;
      if (sessionUserId) {
        await createAuditLog(sessionUserId, "create", "guide", guide.id, null, guideData, req);
      }

      res.status(201).json(guide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid guide data", errors: error.errors });
      } else {
        logError("Error creating guide", error, req.requestId);
        res.status(500).json({ message: "Failed to create guide" });
      }
    }
  });

  app.patch("/api/guides/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const oldGuide = await storage.getGuide(req.params.id);
      const guide = await storage.updateGuide(req.params.id, req.body);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "guide", guide.id, oldGuide, req.body, req);
      }

      res.json(guide);
    } catch (error) {
      logError("Error updating guide", error, req.requestId);
      res.status(500).json({ message: "Failed to update guide" });
    }
  });

  app.delete("/api/guides/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "delete", "guide", req.params.id, null, null, req);
      }

      await storage.deleteGuide(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting guide", error, req.requestId);
      res.status(500).json({ message: "Failed to delete guide" });
    }
  });

  // Guide leaderboard - public for display
  app.get("/api/guides/leaderboard", isAuthenticated, async (req, res) => {
    try {
      const [guides, bookings] = await Promise.all([
        storage.getGuides(),
        storage.getBookings(),
      ]);
      const leaderboard = guides
        .map((guide) => buildGuideComputedStats(guide, bookings))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.completedTours || 0) - (a.completedTours || 0))
        .slice(0, 10);
      res.json(leaderboard);
    } catch (error) {
      logError("Error fetching leaderboard", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });


  // Visitor Lifetime Value Analytics
  app.get("/api/analytics/visitor-ltv", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const allBookings = await storage.getBookings();
      const users = await storage.getUsers();

      // Group bookings by visitor (using visitorUserId or visitorEmail)
      const visitorMap = new Map<string, {
        visitorId: string | null;
        email: string;
        name: string;
        bookings: typeof allBookings;
      }>();

      for (const booking of allBookings) {
        const key = booking.visitorUserId || booking.visitorEmail;

        if (!visitorMap.has(key)) {
          visitorMap.set(key, {
            visitorId: booking.visitorUserId || null,
            email: booking.visitorEmail,
            name: booking.visitorName,
            bookings: [],
          });
        }
        visitorMap.get(key)!.bookings.push(booking);
      }

      // Calculate LTV metrics for each visitor
      const visitorLTV = Array.from(visitorMap.values()).map(visitor => {
        const completedBookings = visitor.bookings.filter(b => b.status === "completed");
        const paidBookings = visitor.bookings.filter(b => b.paymentStatus === "paid");

        const totalSpent = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalBookings = visitor.bookings.length;
        const completedCount = completedBookings.length;
        const averageBookingValue = paidBookings.length > 0
          ? Math.round(totalSpent / paidBookings.length)
          : 0;

        // Find first and last visit dates
        const sortedBookings = [...visitor.bookings].sort(
          (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
        );
        const firstVisit = sortedBookings.length > 0 ? sortedBookings[0].visitDate : null;
        const lastVisit = sortedBookings.length > 0 ? sortedBookings[sortedBookings.length - 1].visitDate : null;

        // Get user details if registered
        const user = visitor.visitorId ? users.find(u => u.id === visitor.visitorId) : null;

        // Calculate days since first visit for frequency
        const daysSinceFirst = firstVisit
          ? Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const visitFrequency = daysSinceFirst > 0 && completedCount > 1
          ? Math.round(daysSinceFirst / completedCount)
          : null; // Days between visits

        // Assign tier based on total spent
        let tier: "vip" | "regular" | "new";
        if (totalSpent >= 200000 || completedCount >= 5) {
          tier = "vip";
        } else if (completedCount >= 2) {
          tier = "regular";
        } else {
          tier = "new";
        }

        return {
          visitorId: visitor.visitorId,
          email: visitor.email,
          name: visitor.name,
          isRegistered: !!user,
          profileImageUrl: user?.profileImageUrl || null,
          metrics: {
            totalSpent,
            totalBookings,
            completedBookings: completedCount,
            averageBookingValue,
            firstVisit,
            lastVisit,
            visitFrequencyDays: visitFrequency,
          },
          tier,
        };
      });

      // Sort by total spent (highest first)
      visitorLTV.sort((a, b) => b.metrics.totalSpent - a.metrics.totalSpent);

      // Calculate summary stats
      const summary = {
        totalVisitors: visitorLTV.length,
        vipCount: visitorLTV.filter(v => v.tier === "vip").length,
        regularCount: visitorLTV.filter(v => v.tier === "regular").length,
        newCount: visitorLTV.filter(v => v.tier === "new").length,
        totalRevenue: visitorLTV.reduce((sum, v) => sum + v.metrics.totalSpent, 0),
        averageLTV: visitorLTV.length > 0
          ? Math.round(visitorLTV.reduce((sum, v) => sum + v.metrics.totalSpent, 0) / visitorLTV.length)
          : 0,
      };

      res.json({
        summary,
        visitors: visitorLTV,
      });
    } catch (error) {
      logError("Error calculating visitor LTV", error, req.requestId);
      res.status(500).json({ message: "Failed to calculate visitor LTV" });
    }
  });

  // ========== Mobile Money / Guide Payouts (Validation Pending) ==========

  // Guide Payouts are currently disabled pending new provider integration
  app.post("/api/guides/:id/pay", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    res.status(501).json({ message: "Mobile money payouts are currently disabled." });
  });

  app.get("/api/guides/:id/payments", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const payments = await storage.getGuidePayments(req.params.id);
      res.json(payments);
    } catch (error) {
      logError("Error fetching guide payments", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide payments" });
    }
  });

  // Initiate booking payment (visitor paying for their booking)
  app.post("/api/bookings/:id/pay", isAuthenticated, async (req: any, res) => {
    try {
      const { createCheckoutSession } = await import("./lib/stripe");

      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      const user = await storage.getUser(req.session.userId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!user) {
        return res.status(401).json({ message: "Session expired" });
      }

      // Verify the user owns this booking
      const isOwner = visitorOwnsBooking(booking, user);
      const canManagePayments = user.role === "admin" || user.role === "coordinator";

      if (!isOwner && !canManagePayments) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (booking.paymentStatus === "paid") {
        return res.status(400).json({ message: "Booking is already paid" });
      }

      if (booking.status === "cancelled" || booking.status === "no_show") {
        return res.status(400).json({ message: "This booking can no longer be paid online" });
      }

      if (booking.paymentMethod !== "card") {
        return res.status(400).json({ message: "Online card payment is only available when the booking payment method is card" });
      }

      const amount = booking.totalAmount || 0;
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      // Create Stripe Checkout Session
      const session = await createCheckoutSession(
        bookingId,
        amount,
        `${PUBLIC_APP_URL}/my-bookings?payment_success=true&booking_id=${bookingId}`,
        `${PUBLIC_APP_URL}/my-bookings?payment_cancel=true`,
        booking.visitorEmail,
        `Booking: ${booking.bookingReference}`
      );

      res.json({
        checkoutUrl: session.url,
        sessionId: session.sessionId,
        currency: session.checkoutAmount.currency.toUpperCase(),
        amount: session.checkoutAmount.amount,
      });
    } catch (error: any) {
      logError("Error initiating Stripe payment", error, req.requestId);
      res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
  });

  // Admin: Get all transactions (paid bookings)
  app.get("/api/admin/transactions", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const allBookings = await storage.getBookings();

      const transactions = allBookings
        .filter(b => b.paymentStatus === "paid")
        .map(b => ({
          id: b.id,
          date: b.paymentVerifiedAt || b.updatedAt,
          visitorName: b.visitorName,
          amount: b.totalAmount,
          currency: "MWK", // Default currency
          method: b.paymentMethod,
          status: b.paymentStatus,
          reference: b.paymentReference || b.bookingReference,
          bookingReference: b.bookingReference,
          paymentFees: b.paymentFees || 0,
          netAmount: b.netAmount || b.totalAmount || 0,
          paymentDetails: b.paymentDetails as any,
        }))
        .sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime());

      res.json(transactions);
    } catch (error) {
      logError("Error fetching admin transactions", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Payment Configuration Endpoint
  app.get("/api/admin/payment-config", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { getStripePaymentConfig } = await import("./lib/stripe");

      res.json(getStripePaymentConfig());
    } catch (error) {
      logError("Error fetching payment config", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch payment configuration" });
    }
  });

  // Stripe Balance Endpoint
  app.get("/api/admin/stripe/balance", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { getStripeClient } = await import("./lib/stripe");
      const stripe = getStripeClient();
      const balance = await stripe.balance.retrieve();

      // Transform balance data for frontend
      const formattedBalance = {
        available: balance.available.map(b => ({
          amount: b.amount,
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount,
          currency: b.currency.toUpperCase(),
        })),
      };

      res.json(formattedBalance);
    } catch (error) {
      logError("Error fetching Stripe balance", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch Stripe balance" });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const { amountFromMinorUnits, constructEvent, getStripeClient } = await import("./lib/stripe");
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).send('Webhook Error: Missing signature');
      }

      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!endpointSecret) {
        logger.warn("STRIPE_WEBHOOK_SECRET not set, cannot verify webhook");
        return res.status(400).send('Webhook Configuration Error');
      }

      // Use rawBody attached by app.ts middleware for signature verification
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        return res.status(400).send('Webhook Error: Raw body not available');
      }

      const event = constructEvent(rawBody, signature as string, endpointSecret);

      if (event.type === 'checkout.session.completed') {
        const eventSession = event.data.object as any;
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(eventSession.id, {
          expand: [
            "payment_intent",
            "payment_intent.payment_method",
            "payment_intent.latest_charge",
            "payment_intent.latest_charge.balance_transaction",
          ],
        });
        const bookingId = session.client_reference_id || session.metadata?.bookingId;

        logger.info(`[Stripe Webhook] Payment successful for booking ${bookingId}`);

        if (bookingId) {
          const oldBooking = await storage.getBooking(bookingId);

          if (!oldBooking) {
            throw new Error(`Booking not found for Stripe session ${session.id}`);
          }

          if (session.payment_status !== "paid") {
            logger.warn(`[Stripe Webhook] Ignoring checkout session ${session.id} with payment_status=${session.payment_status}`);
          } else {
            const expectedCurrency = (session.metadata?.checkoutCurrency || "").toLowerCase();
            const sessionCurrency = (session.currency || "").toLowerCase();
            const expectedAmountMinor = Number(session.metadata?.checkoutAmountMinor || NaN);

            if (expectedCurrency && sessionCurrency !== expectedCurrency) {
              throw new Error(`Stripe currency mismatch for booking ${bookingId}`);
            }

            if (Number.isFinite(expectedAmountMinor) && session.amount_total !== expectedAmountMinor) {
              throw new Error(`Stripe amount mismatch for booking ${bookingId}`);
            }

            if (oldBooking.paymentStatus !== "paid") {
              const paymentIntent = session.payment_intent as any;
              const paymentMethod = paymentIntent?.payment_method as any;
              const card = paymentMethod?.card || {};
              const charge = paymentIntent?.latest_charge as any;
              const balanceTransaction = charge?.balance_transaction as any;
              const stripeCurrency = (session.currency || expectedCurrency || "").toUpperCase();
              const checkoutAmount = typeof session.amount_total === "number" && sessionCurrency
                ? amountFromMinorUnits(session.amount_total, sessionCurrency)
                : null;
              const balanceCurrency = typeof balanceTransaction?.currency === "string"
                ? balanceTransaction.currency.toUpperCase()
                : null;
              const stripeFee = typeof balanceTransaction?.fee === "number" && balanceTransaction.currency
                ? amountFromMinorUnits(balanceTransaction.fee, balanceTransaction.currency)
                : null;
              const stripeNet = typeof balanceTransaction?.net === "number" && balanceTransaction.currency
                ? amountFromMinorUnits(balanceTransaction.net, balanceTransaction.currency)
                : null;
              const feeInMwk = balanceCurrency === "MWK" && stripeFee !== null ? Math.round(stripeFee) : 0;
              const netInMwk = balanceCurrency === "MWK" && stripeNet !== null ? Math.round(stripeNet) : oldBooking.totalAmount || 0;
              const existingDetails = (oldBooking.paymentDetails as Record<string, unknown> | null) || {};

              await storage.updateBooking(bookingId, {
                paymentMethod: "card",
                paymentStatus: "paid",
                paymentReference: session.id,
                paymentFees: feeInMwk,
                netAmount: netInMwk,
                paymentVerifiedAt: new Date(),
                paymentDetails: {
                  ...existingDetails,
                  provider: "stripe",
                  checkoutSessionId: session.id,
                  paymentIntentId: paymentIntent?.id || null,
                  chargeId: charge?.id || null,
                  checkoutCurrency: stripeCurrency,
                  checkoutAmount,
                  checkoutAmountMinor: session.amount_total,
                  bookingAmountMwk: Number(session.metadata?.bookingAmountMwk || oldBooking.totalAmount || 0),
                  conversionRate: session.metadata?.conversionRate ? Number(session.metadata.conversionRate) : null,
                  conversionSource: session.metadata?.conversionSource || null,
                  paymentStatus: session.payment_status,
                  brand: card.brand || null,
                  last4: card.last4 || null,
                  country: card.country || null,
                  funding: card.funding || null,
                  receiptUrl: charge?.receipt_url || null,
                  balanceCurrency,
                  stripeFee,
                  stripeFeeMinor: balanceTransaction?.fee ?? null,
                  stripeNet,
                  stripeNetMinor: balanceTransaction?.net ?? null,
                },
              });

              const booking = await storage.getBooking(bookingId);
              if (booking) {
                await notifyPaymentReceived(
                  booking.id,
                  booking.visitorName,
                  booking.totalAmount || 0,
                  "card"
                );
                await sendPaymentReceiptEmail(booking, null);
              }
            }
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      logError("Stripe Webhook Error", err, "webhook");
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // GetYourGuide Webhook Handler
  app.post("/api/webhooks/getyourguide", async (req, res) => {
    try {
      const { verifyBasicAuth } = await import("./middleware/basicAuth");

      // Verify Basic Auth — pure function, never hangs
      const auth = verifyBasicAuth(req);
      if (!auth.ok) {
        if (auth.headers) {
          for (const [key, value] of Object.entries(auth.headers)) {
            res.setHeader(key, value);
          }
        }
        return res.status(auth.status).json(auth.body);
      }

      const { booking_id, product_id, datetime, participants, customer, total_price } = req.body;

      if (!booking_id || !product_id || !datetime || !customer) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const bookingReference = `GYG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const visitDateTime = new Date(datetime);
      const visitDate = visitDateTime.toISOString().split("T")[0];
      const visitTime = visitDateTime.toISOString().slice(11, 16);
      const participantCount = Number(participants) || 1;
      const totalAmount = Number(total_price) || 0;

      const booking = await storage.createBooking({
        source: 'getyourguide',
        externalReferenceId: booking_id,
        tourType: 'standard',
        visitDate,
        visitTime,
        groupSize: participantCount > 10 ? 'custom' : participantCount > 1 ? 'small_group' : 'individual',
        numberOfPeople: participantCount,
        visitorName: customer.name || '',
        visitorEmail: customer.email || '',
        visitorPhone: customer.phone || '',
        visitorCountry: customer.country || customer.countryCode || null,
        bookingReference,
        totalAmount,
        paymentStatus: 'paid',
        paymentMethod: 'card',
        status: 'confirmed',
        selectedInterests: [],
        selectedZones: [],
      });

      logger.info(`✅ GetYourGuide booking: ${bookingReference}`);

      try {
        const gygEmail = await sendAutomatedTemplateEmail({
          templateName: "booking_confirmation",
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          data: buildBookingTemplateData(booking, {
            old_status: "pending",
            new_status: "confirmed",
          }),
          fallbackSubject: `Booking Confirmed - ${booking.bookingReference}`,
          fallbackMessage: `GetYourGuide confirmed booking email sent for ${booking.visitorName} (${booking.bookingReference}).`,
          fallbackSend: () => sendStatusUpdateDetailed({
            visitorName: booking.visitorName,
            visitorEmail: booking.visitorEmail,
            bookingReference: booking.bookingReference,
            oldStatus: "pending",
            newStatus: "confirmed",
            visitDate: booking.visitDate,
          }),
        });
        await storage.createEmailLog({
          recipientName: booking.visitorName,
          recipientEmail: booking.visitorEmail,
          subject: gygEmail.subject,
          message: gygEmail.message,
          templateType: "booking_confirmation",
          status: gygEmail.result.success ? "accepted" : "failed",
          errorMessage: gygEmail.result.error,
          providerMessageId: gygEmail.result.messageId,
          relatedEntityType: "booking",
          relatedEntityId: booking.id,
          metadata: buildEmailLogMetadata(booking, gygEmail, { source: "getyourguide" }),
        });
      } catch (emailError) {
        logger.error('Email error:', emailError);
      }

      res.status(200).json({ success: true, booking_reference: bookingReference });
    } catch (error: any) {
      logError("GetYourGuide webhook error", error, req.requestId);
      res.status(500).json({ error: ' Failed to process booking' });
    }
  });

  // Guide availability (weekly schedule)
  app.get("/api/guides/:id/availability", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.guidesRead), requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      if (!(await requireGuideOwnerOrStaff(req, req.params.id))) {
        return res.status(403).json({ message: "You can only access your own availability" });
      }
      const availability = await storage.getGuideAvailability(req.params.id);
      res.json(availability);
    } catch (error) {
      logError("Error fetching availability", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/guides/:id/availability", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      if (!(await requireGuideOwnerOrStaff(req, req.params.id))) {
        return res.status(403).json({ message: "You can only manage your own availability" });
      }
      const availabilityData = {
        ...req.body,
        guideId: req.params.id,
      };
      const availability = await storage.createGuideAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      logError("Error creating availability", error, req.requestId);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.delete("/api/guides/availability/:id", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const existing = await storage.getGuideAvailabilityItem(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Availability not found" });
      }
      if (!(await requireGuideOwnerOrStaff(req, existing.guideId))) {
        return res.status(403).json({ message: "You can only manage your own availability" });
      }
      await storage.deleteGuideAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting availability", error, req.requestId);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  app.get("/api/operations-control", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const usersList = await storage.getUsers();
      const settings = getOperationsControlFromUsers(usersList);
      const queueSummary = await getOperationsQueueSummary();
      res.json({
        settings,
        workflowDefinitions: operationWorkflowDefinitions,
        approvalDefinitions,
        notificationDefinitions,
        queueSummary,
        users: usersList
          .filter((user) => ["admin", "coordinator", "security"].includes(user.role || ""))
          .map(buildOperationsUserSummary),
      });
    } catch (error) {
      logError("Error fetching operations control settings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch operations control settings" });
    }
  });

  app.patch("/api/operations-control", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const usersList = await storage.getUsers();
      const parsed = operationsControlSettingsSchema.parse(req.body);
      const settings = normalizeOperationsControlSettings(parsed, usersList);
      const visitorMessageOwnerId = settings.workflows.visitor_messages?.ownerUserId || null;

      await Promise.all(
        usersList
          .filter((user) => user.role === "admin")
          .map((adminUser) => {
            const preferences = getUserPreferences(adminUser);
            return storage.updateUser(adminUser.id, {
              preferences: {
                ...preferences,
                visitorMessageOwner: Boolean(visitorMessageOwnerId && adminUser.id === visitorMessageOwnerId),
                operationsControl: settings,
              },
            });
          })
      );

      await createAuditLog(req.session.userId!, "update", "operations_control", "global", null, settings, req);

      res.json({
        settings,
        queueSummary: await getOperationsQueueSummary(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid operations control settings", errors: error.errors });
      }
      logError("Error updating operations control settings", error, req.requestId);
      res.status(500).json({ message: "Failed to update operations control settings" });
    }
  });

  // User management endpoints (Admin only)
  app.get("/api/users", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const usersList = await storage.getUsers();
      res.json(usersList);
    } catch (error) {
      logError("Error fetching users", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { role } = req.body;
      const oldUser = await storage.getUser(req.params.id);
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "user", user.id,
          { role: oldUser?.role }, { role }, req);
      }

      res.json(user);
    } catch (error) {
      logError("Error updating user role", error, req.requestId);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/users/:id/visitor-message-owner", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (targetUser.role !== "admin") {
        return res.status(400).json({ message: "Visitor messages can only be assigned to an admin account" });
      }
      if (targetUser.isActive === false) {
        return res.status(400).json({ message: "Visitor messages cannot be assigned to an inactive admin" });
      }

      const usersList = await storage.getUsers();
      const settings = getOperationsControlFromUsers(usersList);
      settings.workflows.visitor_messages = {
        ...settings.workflows.visitor_messages,
        ownerUserId: targetUser.id,
      };

      await Promise.all(
        usersList
          .filter((user) => user.role === "admin")
          .map((adminUser) => {
            const preferences = getUserPreferences(adminUser);
            return storage.updateUser(adminUser.id, {
              preferences: {
                ...preferences,
                visitorMessageOwner: adminUser.id === targetUser.id,
                operationsControl: settings,
              },
            });
          })
      );

      await createAuditLog(req.session.userId!, "update", "user", targetUser.id, null, {
        visitorMessageOwner: true,
      }, req);

      res.json({ message: "Visitor message owner updated", userId: targetUser.id });
    } catch (error) {
      logError("Error updating visitor message owner", error, req.requestId);
      res.status(500).json({ message: "Failed to update visitor message owner" });
    }
  });

  // Update user (admin only)
  app.patch("/api/users/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { firstName, lastName, phone, isActive } = req.body;
      const oldUser = await storage.getUser(req.params.id);
      if (!oldUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (isActive !== undefined) updates.isActive = isActive;

      const user = await storage.updateUser(req.params.id, updates);

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "user", req.params.id,
          { firstName: oldUser.firstName, lastName: oldUser.lastName, isActive: oldUser.isActive },
          updates, req);
      }

      res.json(user);
    } catch (error) {
      logError("Error updating user", error, req.requestId);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Toggle user active status (admin only)
  app.patch("/api/users/:id/toggle-active", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Can't deactivate yourself
      if (user.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }

      const newStatus = !user.isActive;
      const updatedUser = await storage.updateUser(req.params.id, { isActive: newStatus });

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "user", req.params.id,
          { isActive: user.isActive }, { isActive: newStatus }, req);
      }

      res.json(updatedUser);
    } catch (error) {
      logError("Error toggling user status", error, req.requestId);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Delete user (admin only) - soft delete by deactivating
  app.delete("/api/users/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Can't delete yourself
      if (user.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Soft delete by deactivating
      await storage.updateUser(req.params.id, { isActive: false });

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "delete", "user", req.params.id,
          { email: user.email, isActive: true }, { isActive: false }, req);
      }

      res.json({ message: "User deactivated" });
    } catch (error) {
      logError("Error deleting user", error, req.requestId);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin: Reset password for a user
  app.post("/api/users/:id/reset-password", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(req.params.id, hashedPassword);

      // Log the action
      const adminId = req.session?.userId;
      if (adminId) {
        await createAuditLog(adminId, "update", "user", req.params.id,
          { password: "[hidden]" }, { password: "[reset by admin]" }, req);
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      logError("Error resetting password", error, req.requestId);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Admin: Force verify email for a user
  app.post("/api/users/:id/verify-email", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.verifyEmail(req.params.id);

      const adminId = req.session?.userId;
      if (adminId) {
        await createAuditLog(adminId, "update", "user", req.params.id,
          { emailVerified: user.emailVerified }, { emailVerified: true }, req);
      }

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      logError("Error verifying email", error, req.requestId);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Admin: Get full user details with bookings
  app.get("/api/users/:id/details", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's bookings
      const allBookings = await storage.getBookings();
      const userBookings = allBookings.filter(b => visitorOwnsBooking(b, user));

      // Get guide profile if user is a guide
      const guides = await storage.getGuides();
      const guideProfile = guides.find(g => g.userId === req.params.id);

      res.json({
        user: {
          ...user,
          password: undefined, // Remove password from response
        },
        bookings: userBookings,
        guideProfile: guideProfile || null,
        stats: {
          totalBookings: userBookings.length,
          completedBookings: userBookings.filter(b => b.status === 'completed').length,
          pendingBookings: userBookings.filter(b => b.status === 'pending').length,
        }
      });
    } catch (error) {
      logError("Error fetching user details", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Admin: Send password reset email to user
  app.post("/api/users/:id/send-reset-email", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or no email" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.setPasswordResetToken(req.params.id, resetToken, resetExpires);

      // Send email
      const resetUrl = `${PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      await sendCustomEmail({
        recipientEmail: user.email,
        recipientName: user.firstName || 'User',
        subject: 'Password Reset - Visit Dzaleka',
        message: `An administrator has initiated a password reset for your account.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not request this, please contact support.`,
        senderName: 'Admin'
      });

      const adminId = req.session?.userId;
      if (adminId) {
        await createAuditLog(adminId, "update", "user", req.params.id,
          {}, { action: "password_reset_email_sent" }, req);
      }

      res.json({ message: "Password reset email sent" });
    } catch (error) {
      logError("Error sending reset email", error, req.requestId);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  });


  // Public Zones endpoint (for embed forms and public pages)
  app.get("/api/public/zones", async (req, res) => {
    try {
      const zonesList = await storage.getZones();
      // Return only active zones with limited fields
      const publicList = zonesList.filter(z => z.isActive !== false && z.isPublic !== false).map(z => ({
        id: z.id,
        name: z.name,
        description: z.description,
        zoneType: z.zoneType,
        icon: z.icon,
      }));
      res.json(publicList);
    } catch (error) {
      logError("Error fetching public zones", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch zones" });
    }
  });

  // Zones endpoints - admin and coordinator can manage
  app.get("/api/zones", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.guidesRead), async (req, res) => {
    try {
      const zonesList = await storage.getZones();
      res.json(zonesList);
    } catch (error) {
      logError("Error fetching zones", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch zones" });
    }
  });

  app.post("/api/zones", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const zoneData = insertZoneSchema.parse(req.body);
      const zone = await storage.createZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid zone data", errors: error.errors });
      } else {
        logError("Error creating zone", error, req.requestId);
        res.status(500).json({ message: "Failed to create zone" });
      }
    }
  });

  app.patch("/api/zones/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const zone = await storage.updateZone(req.params.id, req.body);
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      res.json(zone);
    } catch (error) {
      logError("Error updating zone", error, req.requestId);
      res.status(500).json({ message: "Failed to update zone" });
    }
  });

  app.delete("/api/zones/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteZone(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting zone", error, req.requestId);
      res.status(500).json({ message: "Failed to delete zone" });
    }
  });

  // Zone analytics - admin and coordinator
  app.get("/api/zones/analytics", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const analytics = await storage.getZoneAnalytics();
      res.json(analytics);
    } catch (error) {
      logError("Error fetching zone analytics", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch zone analytics" });
    }
  });


  // Public Events endpoint
  app.get("/api/events", async (req, res) => {
    try {
      // Try fetching from external API first
      try {
        const response = await fetch("https://services.dzaleka.com/api/events");
        if (response.ok) {
          const json = await response.json();
          const externalEvents = json.data?.events || [];

          const mappedEvents = externalEvents
            .filter((e: any) => {
              if (e.status !== 'upcoming') return false;
              // Check date/endDate to ensure it hasn't passed
              // Use endDate if available, otherwise assume event ends on the day of 'date'
              const end = e.endDate ? new Date(e.endDate) : new Date(new Date(e.date).setHours(23, 59, 59, 999));
              return end >= new Date();
            })
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              date: new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              time: new Date(e.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              location: e.location,
              image: e.image?.startsWith('http') ? e.image : `https://services.dzaleka.com${e.image}`,
              link: e.registration?.url || e.url || "#",
              category: e.category,
              isFeatured: e.featured
            }));

          // Return filtered logic from external API as authoritative source
          return res.json(mappedEvents);

          /*
          // Previous logic: fallback if empty.
          // Removing this because it causes confusion if external has 0 events but local has data.
          if (mappedEvents.length > 0) {
            return res.json(mappedEvents);
          }
          */
        }
      } catch (externalError) {
        logError("External events API failed, falling back to local DB", externalError, req.requestId);
      }

      // Fallback to local DB (no seeding)
      // This allows the frontend to show the "No Events" empty state
      let events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      logError("Error fetching events", error, req.requestId);
      res.json([]); // Return empty array to trigger empty state on frontend
    }
  });

  // Public Points of Interest endpoint (for embed forms)
  app.get("/api/public/points-of-interest", async (req, res) => {
    try {
      const poiList = await storage.getPointsOfInterest();
      // Return only active POIs with limited fields
      const publicList = poiList.filter(poi => poi.isActive !== false && poi.isPublic !== false).map(poi => ({
        id: poi.id,
        name: poi.name,
        description: poi.visitorDescription || poi.description,
        category: poi.category,
        estimatedDurationMinutes: poi.estimatedDurationMinutes,
        photoPolicy: poi.photoPolicy,
        mobilityLevel: poi.mobilityLevel,
        requiresPermission: poi.requiresPermission,
        serviceDirectoryUrl: poi.serviceDirectoryUrl,
      }));
      res.json(publicList);
    } catch (error) {
      logError("Error fetching public points of interest", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch points of interest" });
    }
  });

  // Points of Interest endpoints - admin and coordinator can manage, guide can view
  app.get("/api/points-of-interest", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const poiList = await storage.getPointsOfInterest();
      res.json(poiList);
    } catch (error) {
      logError("Error fetching points of interest", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch points of interest" });
    }
  });

  app.post("/api/points-of-interest", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const poiData = insertPointOfInterestSchema.parse(req.body);
      const poi = await storage.createPointOfInterest(poiData);
      res.status(201).json(poi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid POI data", errors: error.errors });
      } else {
        logError("Error creating POI", error, req.requestId);
        res.status(500).json({ message: "Failed to create point of interest" });
      }
    }
  });

  app.patch("/api/points-of-interest/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const poi = await storage.updatePointOfInterest(req.params.id, req.body);
      if (!poi) {
        return res.status(404).json({ message: "Point of interest not found" });
      }
      res.json(poi);
    } catch (error) {
      logError("Error updating POI", error, req.requestId);
      res.status(500).json({ message: "Failed to update point of interest" });
    }
  });

  app.delete("/api/points-of-interest/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deletePointOfInterest(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting POI", error, req.requestId);
      res.status(500).json({ message: "Failed to delete point of interest" });
    }
  });


  // Public Meeting Points endpoint (for embed forms)
  app.get("/api/public/meeting-points", async (req, res) => {
    try {
      const mpList = await storage.getMeetingPoints();
      // Return only active meeting points with limited fields
      const publicList = mpList.filter(mp => mp.isActive !== false).map(mp => ({
        id: mp.id,
        name: mp.name,
        description: mp.description,
        address: mp.address,
        googleMapsUrl: mp.googleMapsUrl,
        meetingInstructions: mp.meetingInstructions,
        guideIdentificationNote: mp.guideIdentificationNote,
        arrivalBufferMinutes: mp.arrivalBufferMinutes,
        isDefault: mp.isDefault,
      }));
      res.json(publicList);
    } catch (error) {
      logError("Error fetching public meeting points", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch meeting points" });
    }
  });

  // Meeting Points endpoints - admin and coordinator can manage
  app.get("/api/meeting-points", authenticateSessionOrApiKey(API_KEY_ROUTE_SCOPES.guidesRead), async (req, res) => {
    try {
      const mpList = await storage.getMeetingPoints();
      res.json(mpList);
    } catch (error) {
      logError("Error fetching meeting points", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch meeting points" });
    }
  });

  app.post("/api/meeting-points", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const mpData = insertMeetingPointSchema.parse(req.body);
      const mp = await storage.createMeetingPoint(mpData);
      res.status(201).json(mp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid meeting point data", errors: error.errors });
      } else {
        logError("Error creating meeting point", error, req.requestId);
        res.status(500).json({ message: "Failed to create meeting point" });
      }
    }
  });

  app.patch("/api/meeting-points/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const mp = await storage.updateMeetingPoint(req.params.id, req.body);
      if (!mp) {
        return res.status(404).json({ message: "Meeting point not found" });
      }
      res.json(mp);
    } catch (error) {
      logError("Error updating meeting point", error, req.requestId);
      res.status(500).json({ message: "Failed to update meeting point" });
    }
  });

  app.delete("/api/meeting-points/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteMeetingPoint(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting meeting point", error, req.requestId);
      res.status(500).json({ message: "Failed to delete meeting point" });
    }
  });

  // Incidents endpoints - Allow all auth users (visiters see own, admins all)
  app.get("/api/incidents", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const allIncidents = await storage.getIncidents();

      let visibleIncidents;
      if (user?.role === "admin" || user?.role === "coordinator" || user?.role === "security") {
        visibleIncidents = allIncidents;
      } else {
        // Visitors only see their own reports
        visibleIncidents = allIncidents.filter(i => i.reportedBy === req.session.userId);
      }

      res.json(visibleIncidents);
    } catch (error) {
      logError("Error fetching incidents", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.get("/api/incidents/:id", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      logError("Error fetching incident", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  // Create incident - Allow visitors to report (removed restricted role requirement)
  app.post("/api/incidents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const incidentData = insertIncidentSchema.parse({
        ...req.body,
        reportedBy: userId,
        status: "reported", // Enforce initial status
      });
      const incident = await storage.createIncident(incidentData);

      const user = await storage.getUser(userId!);
      await createAuditLog(userId, "create", "incident", incident.id, null, incidentData, req);

      // Notify admins and security
      await notifyIncidentReported(incident.id, incident.title, incidentData.severity || "low", user ? `${user.firstName} ${user.lastName}` : "Unknown User");
      if (incident.severity === "high" || incident.severity === "critical") {
        await sendIncidentAlertEmail(
          incident,
          user ? getDisplayName(user) : "Unknown User",
          userId || null
        );
      }

      // Dispatch Webhook
      WebhookDispatcher.dispatch("incident.reported", incident);

      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid incident data", errors: error.errors });
      } else {
        logError("Error creating incident", error, req.requestId);
        res.status(500).json({ message: "Failed to create incident" });
      }
    }
  });

  app.patch("/api/incidents/:id", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const oldIncident = await storage.getIncident(req.params.id);
      const incident = await storage.updateIncident(req.params.id, req.body);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "incident", incident.id, oldIncident, req.body, req);
      }

      res.json(incident);
    } catch (error) {
      logError("Error updating incident", error, req.requestId);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  app.post("/api/incidents/:id/resolve", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const incident = await storage.resolveIncident(req.params.id, userId);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      await createAuditLog(userId, "update", "incident", incident.id,
        { status: "reported" }, { status: "resolved" }, req);

      res.json(incident);
    } catch (error) {
      logError("Error resolving incident", error, req.requestId);
      res.status(500).json({ message: "Failed to resolve incident" });
    }
  });

  // Audit logs endpoints (Admin only) - enriched with names
  app.get("/api/audit-logs", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);

      // Fetch all users, bookings, and guides for lookup
      const [users, bookings, guides] = await Promise.all([
        storage.getUsers(),
        storage.getBookings(),
        storage.getGuides(),
      ]);

      // Create lookup maps - use email as fallback if name is empty
      const userMap = new Map(users.map(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        return [u.id, fullName || u.email || u.id];
      }));
      const bookingMap = new Map(bookings.map(b => [b.id, b.bookingReference || `REF-${b.id.slice(0, 6)}`]));
      const guideMap = new Map(guides.map(g => [g.id, `${g.firstName} ${g.lastName}`]));

      // Enrich logs with human-readable names
      const enrichedLogs = logs.map(log => {
        // Get user name - fallback to userId if not found
        const userName = userMap.get(log.userId) || `User ${log.userId.slice(0, 8)}`;

        // Get entity display name based on type
        let entityDisplay = log.entityId;
        if (log.entityType === 'user') {
          entityDisplay = userMap.get(log.entityId || '') || log.entityId;
        } else if (log.entityType === 'booking') {
          entityDisplay = bookingMap.get(log.entityId || '') || log.entityId;
        } else if (log.entityType === 'guide') {
          entityDisplay = guideMap.get(log.entityId || '') || log.entityId;
        }

        // Enrich new/old values with names where applicable
        const enrichValues = (values: any) => {
          if (!values || typeof values !== 'object') return values;
          const enriched = { ...values };
          if (enriched.assignedGuideId && guideMap.has(enriched.assignedGuideId)) {
            enriched.assignedGuideName = guideMap.get(enriched.assignedGuideId);
          }
          if (enriched.guideId && guideMap.has(enriched.guideId)) {
            enriched.guideName = guideMap.get(enriched.guideId);
          }
          if (enriched.bookingId && bookingMap.has(enriched.bookingId)) {
            enriched.bookingRef = bookingMap.get(enriched.bookingId);
          }
          return enriched;
        };

        return {
          ...log,
          userName,
          entityDisplay,
          oldValues: enrichValues(log.oldValues),
          newValues: enrichValues(log.newValues),
        };
      });

      res.json(enrichedLogs);
    } catch (error) {
      logError("Error fetching audit logs", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Delete old audit logs by age (Admin only) - MUST be before /:id route
  app.delete("/api/audit-logs/cleanup/:days", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const days = parseInt(req.params.days);

      if (isNaN(days) || days < 1) {
        return res.status(400).json({ message: "Invalid days parameter. Must be a positive number." });
      }
      const deleted = await storage.deleteOldAuditLogs(days);
      res.json({ message: `Deleted ${deleted} audit logs older than ${days} days`, deleted });
    } catch (error: any) {
      logError("Error cleaning up audit logs", error, req.requestId);
      res.status(500).json({ message: error?.message || "Failed to clean up audit logs" });
    }
  });

  // Delete a single audit log (Admin only)
  app.delete("/api/audit-logs/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAuditLog(id);
      res.json({ message: "Audit log deleted" });
    } catch (error) {
      logError("Error deleting audit log", error, req.requestId);
      res.status(500).json({ message: "Failed to delete audit log" });
    }
  });

  // Revenue reports (Admin only)
  app.get("/api/reports/revenue", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const revenueStats = await storage.getRevenueStats(start, end);
      res.json(revenueStats);
    } catch (error) {
      logError("Error fetching revenue report", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch revenue report" });
    }
  });

  app.get("/api/reports/email-stats", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const stats = await storage.getEmailStats(start, end);
      res.json(stats);
    } catch (error) {
      logError("Error fetching email stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch email stats" });
    }
  });

  // Pricing endpoints
  app.get("/api/pricing", isAuthenticated, async (req, res) => {
    try {
      const configs = await storage.getPricingConfigs();
      res.json(configs);
    } catch (error) {
      logError("Error fetching pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.patch("/api/pricing", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      if (!(await requireOperationApproval(req, res, "pricing_changes", "Pricing changes"))) {
        return;
      }
      const { approvalConfirmed, ...pricingPayload } = req.body;
      const existingPricing = await storage.getPricingConfigs();
      await storage.updatePricing(pricingPayload);
      await createAuditLog(req.session.userId!, "update", "pricing", "global", existingPricing, pricingPayload, req);
      res.json({ success: true });
    } catch (error) {
      logError("Error updating pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  // Special offers endpoints
  app.get("/api/public/special-offers", async (_req, res) => {
    try {
      const offers = await storage.getPublicSpecialOffers();
      res.json(offers);
    } catch (error) {
      logError("Error fetching public special offers", error);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  // Google Things to Do JSON Feed
  app.get("/api/public/feeds/things-to-do", async (_req, res) => {
    try {
      const configs = await storage.getPricingConfigs();
      const pricing = {
        individual: configs.find(c => c.groupSize === "individual")?.basePrice || 15000,
        small_group: configs.find(c => c.groupSize === "small_group")?.basePrice || 50000,
        large_group: configs.find(c => c.groupSize === "large_group")?.basePrice || 80000,
        custom: configs.find(c => c.groupSize === "custom")?.basePrice || 100000,
      };

      const feed = {
        feed_metadata: {
          shard_id: 0,
          total_shards_count: 1,
          processing_instruction: "PROCESS_AS_SNAPSHOT",
          nonce: Date.now()
        },
        products: [
          {
            id: "dzaleka-guided-walking-tour",
            title: {
              localized_texts: [
                { language_code: "en", text: "Dzaleka Refugee Camp Guided Walking Tour" }
              ]
            },
            description: {
              localized_texts: [
                {
                  language_code: "en",
                  text: "A resident-led cultural walking tour through Kawale, Katudza, Dzaleka Hill, community markets, and local organizations or project spaces when active. Book with transparent group tier pricing."
                }
              ]
            },
            brand_name: {
              localized_texts: [
                { language_code: "en", text: "Visit Dzaleka" }
              ]
            },
            images: [
              {
                url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQC52NEfamRlqaUT7uLWcP8ZKNUDp3_opelPFqoO6E5hyphenhyphen09lp-zxRXXig5aEnaH3PbRsia1ciM8y-vOdzDe9RMvbQApON7rdM0SrBmtVVWAPIzmiId-jvcwSa46-Y-qRApCBTmozhIbWhNZWxcLFY3bp6Q4uNk_LFB5MpYFlXywwX7vYlUQeRoirJWm50/s16000-rw/533061219_1079243081018233_5344782622295089839_n.jpg"
              }
            ],
            category: "TOURS_AND_SIGHTSEEING",
            related_locations: [
              {
                location: {
                  address: {
                    localized_address: {
                      language_code: "en",
                      text: "UNHCR/Plan International Compound, Dzaleka Refugee Camp, Dowa, Malawi"
                    }
                  },
                  coordinates: {
                    latitude: -13.6896,
                    longitude: 33.9376
                  }
                },
                relation_type: "DEPARTURE_POINT"
              }
            ],
            options: [
              {
                id: "option-individual",
                title: "Individual Tour (1 person)",
                landing_page: {
                  url: "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour"
                },
                price_options: [
                  {
                    id: "price-individual-adult",
                    title: "Individual",
                    price: {
                      currency_code: "MWK",
                      units: pricing.individual
                    }
                  }
                ]
              },
              {
                id: "option-small-group",
                title: "Small Group Tour (2-5 people)",
                landing_page: {
                  url: "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour"
                },
                price_options: [
                  {
                    id: "price-small-group-adult",
                    title: "Small Group",
                    price: {
                      currency_code: "MWK",
                      units: pricing.small_group
                    }
                  }
                ]
              },
              {
                id: "option-medium-group",
                title: "Medium Group Tour (6-10 people)",
                landing_page: {
                  url: "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour"
                },
                price_options: [
                  {
                    id: "price-medium-group-adult",
                    title: "Medium Group",
                    price: {
                      currency_code: "MWK",
                      units: pricing.large_group
                    }
                  }
                ]
              },
              {
                id: "option-large-group",
                title: "Large Group Tour (10+ people or organizations)",
                landing_page: {
                  url: "https://visit.dzaleka.com/things-to-do/dzaleka-refugee-camp-guided-walking-tour"
                },
                price_options: [
                  {
                    id: "price-large-group-adult",
                    title: "Large Group",
                    price: {
                      currency_code: "MWK",
                      units: pricing.custom
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      res.setHeader("Content-Type", "application/json");
      res.json(feed);
    } catch (error) {
      logError("Error generating Google Things to Do feed", error);
      res.status(500).json({ message: "Failed to generate feed" });
    }
  });

  // Public Community Listings
  app.get("/api/public/community-listings", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const listings = await storage.getCommunityListings({
        status: publicCommunityListingStatuses,
        type
      });
      res.json(listings);
    } catch (error) {
      logError("Error fetching public community listings", error);
      res.status(500).json({ message: "Failed to fetch community listings" });
    }
  });

  app.get("/api/public/community-listings/:id", async (req, res) => {
    try {
      const listing = await storage.getCommunityListing(req.params.id);
      if (!listing || !isPublicCommunityListing(listing)) {
        return res.status(404).json({ message: "Community listing not found" });
      }

      res.json(listing);
    } catch (error) {
      logError("Error fetching public community listing", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch community listing" });
    }
  });

  app.post("/api/public/community-listings", async (req: any, res) => {
    try {
      const parsed = insertCommunityListingSchema.parse(req.body);
      // Force status to pending for moderation
      const listing = await storage.createCommunityListing({
        ...parsed,
        status: "pending",
        submittedBy: req.user?.id || req.session?.userId || null,
      });
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing submission", errors: error.errors });
      }
      logError("Error creating community listing", error);
      res.status(500).json({ message: "Failed to submit community listing" });
    }
  });

  const communityExperienceRequestUpdateSchema = z.object({
    status: z.enum(["submitted", "contacted", "confirmed", "declined", "cancelled"]).optional(),
    adminNotes: z.string().nullable().optional(),
  });

  async function enrichCommunityExperienceRequest(request: any) {
    const listing = await storage.getCommunityListing(request.listingId);
    return { ...request, listing: listing || null };
  }

  app.post("/api/public/community-experience-requests", async (req, res) => {
    try {
      const parsed = insertCommunityExperienceRequestSchema.parse(req.body);
      const listing = await storage.getCommunityListing(parsed.listingId);
      if (!listing || !isPublicCommunityListing(listing) || !listing.offersExperience) {
        return res.status(404).json({ message: "Experience is not available for requests" });
      }

      const request = await storage.createCommunityExperienceRequest(parsed);
      const detailUrl = `${PUBLIC_APP_URL}/community-hub`;

      await sendCustomEmailDetailed({
        recipientName: parsed.visitorName,
        recipientEmail: parsed.visitorEmail,
        subject: `Community experience request received - ${listing.name}`,
        message: [
          `Hello ${parsed.visitorName},`,
          "",
          `We received your request for ${listing.name}.`,
          `Preferred date: ${parsed.preferredDate}`,
          parsed.preferredTime ? `Preferred time: ${parsed.preferredTime}` : "",
          `Group size: ${parsed.groupSize}`,
          "",
          "The Visit Dzaleka team will check host availability and follow up with next steps.",
          "",
          `Community Hub: ${detailUrl}`,
        ].filter(Boolean).join("\n"),
        senderName: "Visit Dzaleka Team",
      }).catch((error) => logError("Failed to send community experience visitor email", error, req.requestId));

      const recipients = await getInternalEmailRecipients(["admin", "coordinator"]);
      await Promise.all(recipients.map((recipient) => sendCustomEmailDetailed({
        recipientName: getDisplayName(recipient),
        recipientEmail: recipient.email!,
        subject: `New community experience request - ${listing.name}`,
        message: [
          `A visitor requested a community impact experience.`,
          "",
          `Experience: ${listing.name}`,
          `Visitor: ${parsed.visitorName}`,
          `Email: ${parsed.visitorEmail}`,
          parsed.visitorPhone ? `Phone: ${parsed.visitorPhone}` : "",
          `Preferred date: ${parsed.preferredDate}`,
          parsed.preferredTime ? `Preferred time: ${parsed.preferredTime}` : "",
          `Group size: ${parsed.groupSize}`,
          parsed.message ? `Message: ${parsed.message}` : "",
          "",
          `Manage requests: ${PUBLIC_APP_URL}/admin/community-listings`,
        ].filter(Boolean).join("\n"),
        senderName: "Visit Dzaleka System",
      }).catch((error) => logError("Failed to send community experience admin email", error, req.requestId))));

      res.status(201).json(await enrichCommunityExperienceRequest(request));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid experience request", errors: error.errors });
      }
      logError("Error creating community experience request", error, req.requestId);
      res.status(500).json({ message: "Failed to submit experience request" });
    }
  });

  // Admin/Coordinator Moderation Routes
  app.get("/api/admin/community-listings", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const listings = await storage.getCommunityListings({ type, status });
      res.json(listings);
    } catch (error) {
      logError("Error fetching admin community listings", error);
      res.status(500).json({ message: "Failed to fetch community listings for moderation" });
    }
  });

  app.get("/api/admin/community-listings/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const listing = await storage.getCommunityListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      res.json(listing);
    } catch (error) {
      logError("Error fetching admin community listing", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch community listing" });
    }
  });

  app.post("/api/admin/community-listings", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const parsed = insertCommunityListingSchema.parse(req.body);
      const status = normalizeCommunityListingStatus(parsed.status || "approved") || "approved";
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid listing status" });
      }

      const listing = await storage.createCommunityListing({
        ...parsed,
        status,
        submittedBy: parsed.submittedBy || req.session?.userId || null,
      });

      if (req.session?.userId) {
        await createAuditLog(req.session.userId, "create", "community_listing", listing.id, null, listing, req);
      }

      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing", errors: error.errors });
      }
      logError("Error creating admin community listing", error, req.requestId);
      res.status(500).json({ message: "Failed to create community listing" });
    }
  });

  app.get("/api/admin/community-experience-requests", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const listingId = req.query.listingId as string | undefined;
      const requests = await storage.getCommunityExperienceRequests({ status, listingId });
      res.json(await Promise.all(requests.map(enrichCommunityExperienceRequest)));
    } catch (error) {
      logError("Error fetching community experience requests", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch community experience requests" });
    }
  });

  app.get("/api/admin/community-experience-requests/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const request = await storage.getCommunityExperienceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Experience request not found" });
      }

      res.json(await enrichCommunityExperienceRequest(request));
    } catch (error) {
      logError("Error fetching community experience request", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch community experience request" });
    }
  });

  app.patch("/api/admin/community-experience-requests/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const payload = communityExperienceRequestUpdateSchema.parse(req.body);
      const current = await storage.getCommunityExperienceRequest(req.params.id);
      if (!current) {
        return res.status(404).json({ message: "Experience request not found" });
      }

      const updated = await storage.updateCommunityExperienceRequest(req.params.id, payload);
      if (!updated) {
        return res.status(404).json({ message: "Experience request not found" });
      }

      if (req.session?.userId) {
        await createAuditLog(req.session.userId, "update", "community_experience_request", updated.id, current, payload, req);
      }

      res.json(await enrichCommunityExperienceRequest(updated));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid experience request update", errors: error.errors });
      }
      logError("Error updating community experience request", error, req.requestId);
      res.status(500).json({ message: "Failed to update community experience request" });
    }
  });

  app.patch("/api/admin/community-listings/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getCommunityListing(id);
      if (!existing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Allow updating status, moderation notes, and basic details during review
      const updateData = { ...req.body };
      if ("status" in updateData) {
        const status = normalizeCommunityListingStatus(updateData.status);
        if (!status || !["pending", "approved", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Invalid listing status" });
        }
        updateData.status = status;
      }
      const updated = await storage.updateCommunityListing(id, updateData);
      res.json(updated);
    } catch (error) {
      logError("Error updating community listing", error);
      res.status(500).json({ message: "Failed to update community listing" });
    }
  });

  app.delete("/api/admin/community-listings/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getCommunityListing(id);
      if (!existing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      await storage.deleteCommunityListing(id);
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting community listing", error);
      res.status(500).json({ message: "Failed to delete community listing" });
    }
  });

  app.get("/api/special-offers", isAuthenticated, requireRole("admin", "coordinator"), async (_req, res) => {
    try {
      const offers = await storage.getSpecialOffers();
      res.json(offers);
    } catch (error) {
      logError("Error fetching special offers", error);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.post("/api/special-offers", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const payload = specialOfferRequestSchema.parse(req.body);
      const offer = await storage.createSpecialOffer({
        ...payload,
        description: payload.description || null,
        bookingNoticeDays: payload.bookingNoticeDays ?? null,
        discountedSeats: payload.discountedSeats ?? null,
        createdBy: req.session.userId,
      });
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid special offer data", errors: error.errors });
      } else {
        logError("Error creating special offer", error, req.requestId);
        res.status(500).json({ message: "Failed to create special offer" });
      }
    }
  });

  app.patch("/api/special-offers/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const payload = specialOfferUpdateSchema.parse(req.body);
      const offer = await storage.updateSpecialOffer(req.params.id, payload as Partial<SpecialOffer>);
      if (!offer) {
        return res.status(404).json({ message: "Special offer not found" });
      }
      res.json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid special offer data", errors: error.errors });
      } else {
        logError("Error updating special offer", error, req.requestId);
        res.status(500).json({ message: "Failed to update special offer" });
      }
    }
  });

  app.delete("/api/special-offers/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteSpecialOffer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting special offer", error, req.requestId);
      res.status(500).json({ message: "Failed to delete special offer" });
    }
  });

  // Calculate price endpoint (public for booking form)
  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { groupSize, tourType, customDuration, visitDate, visitTime, numberOfPeople } = req.body;
      const baseAmount = await calculateTotalAmount(groupSize, tourType, customDuration);
      const specialOffer = visitDate
        ? await storage.findApplicableSpecialOffer({
          groupSize,
          tourType,
          visitDate,
          visitTime,
          seats: numberOfPeople || 1,
        })
        : undefined;
      const { totalAmount, discountAmount } = applySpecialOfferAmount(baseAmount, specialOffer);
      res.json({
        totalAmount,
        originalAmount: baseAmount,
        discountAmount,
        specialOffer: specialOffer ? {
          id: specialOffer.id,
          name: specialOffer.name,
          discountPercent: specialOffer.discountPercent,
          offerType: specialOffer.offerType,
        } : null,
      });
    } catch (error) {
      logError("Error calculating price", error, req.requestId);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  // Email communication endpoint (Admin/Coordinator only)
  app.post("/api/send-email", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { recipientName, recipientEmail, subject, message } = req.body;

      if (!recipientEmail || !subject || !message) {
        return res.status(400).json({ message: "Missing required fields: recipientEmail, subject, and message are required" });
      }

      const user = await storage.getUser(req.session?.userId);
      const senderName = user ? `${user.firstName} ${user.lastName}` : undefined;

      const result = await sendCustomEmailDetailed({
        recipientName: recipientName || "Valued Customer",
        recipientEmail,
        subject,
        message,
        senderName
      });

      if (result.success) {
        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: recipientName || null,
          recipientEmail,
          subject,
          message,
          templateType: "custom",
          status: "accepted",
          providerMessageId: result.messageId,
        });
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: recipientName || null,
          recipientEmail,
          subject,
          message,
          templateType: "custom",
          status: "failed",
          errorMessage: result.error,
        });
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      logError("Error sending email", error, req.requestId);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Send Itinerary
  app.post("/api/itinerary/send", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const data = req.body;
      if (!data.recipientEmail || !data.items || !data.date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUser(req.session?.userId);
      const senderName = user ? `${user.firstName} ${user.lastName}` : "Visit Dzaleka Team";
      let itineraryVersion = 1;
      let previousItineraryId: string | undefined;

      if (data.bookingId) {
        const previousItinerary = await storage.getItineraryByBookingId(data.bookingId);
        const previousContent = previousItinerary?.content as any;
        itineraryVersion = previousItinerary ? Number(previousContent?.version || 1) + 1 : 1;
        previousItineraryId = previousItinerary?.id;
      }

      const itineraryPayload = {
        ...data,
        version: itineraryVersion,
        previousItineraryId,
        updatedAt: new Date().toISOString(),
      };

      const itineraryEmailResult = await sendItineraryEmailDetailed({
        ...itineraryPayload,
        senderName
      });

      if (itineraryEmailResult.success) {
        if (itineraryPayload.bookingId) {
          try {
            await storage.createItinerary({
              bookingId: itineraryPayload.bookingId,
              content: itineraryPayload
            });
          } catch (e) {
            logError("Failed to save itinerary to DB", e, req.requestId);
          }
        }

        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: itineraryPayload.recipientName,
          recipientEmail: itineraryPayload.recipientEmail,
          subject: "Your Visit Dzaleka Itinerary",
          message: [
            `Itinerary v${itineraryPayload.version} for ${itineraryPayload.recipientName} on ${itineraryPayload.date} (${itineraryPayload.duration})`,
            itineraryPayload.bookingReference ? `Ref: ${itineraryPayload.bookingReference}` : '',
            `\nTimeline:`,
            ...itineraryPayload.items.map((i: any) => `- ${i.time}: ${i.activity}`),
            (itineraryPayload.pois && itineraryPayload.pois.length > 0) ? `\nHighlights: ${itineraryPayload.pois.join(', ')}` : '',
            itineraryPayload.organizationStops ? `\nOrganizations: ${itineraryPayload.organizationStops}` : '',
            itineraryPayload.totalCost ? `Cost: ${itineraryPayload.totalCost}` : '',
            itineraryPayload.paymentStatus ? `Payment status: ${itineraryPayload.paymentStatus}` : '',
            itineraryPayload.guideName ? `Guide: ${itineraryPayload.guideName}` : '',
            itineraryPayload.notes ? `\nNotes: ${itineraryPayload.notes}` : ''
          ].filter(Boolean).join('\n'),
          templateType: "itinerary",
          status: "accepted",
          providerMessageId: itineraryEmailResult.messageId,
          relatedEntityType: itineraryPayload.bookingId ? "booking" : undefined,
          relatedEntityId: itineraryPayload.bookingId || undefined,
          metadata: {
            bookingReference: itineraryPayload.bookingReference,
            itineraryVersion: itineraryPayload.version,
            previousItineraryId,
          },
        });
        res.json({ success: true, message: "Itinerary sent successfully" });
      } else {
        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: itineraryPayload.recipientName,
          recipientEmail: itineraryPayload.recipientEmail,
          subject: "Your Visit Dzaleka Itinerary",
          message: itineraryEmailResult.error || "Failed to send",
          templateType: "itinerary",
          status: "failed",
          errorMessage: itineraryEmailResult.error,
          relatedEntityType: itineraryPayload.bookingId ? "booking" : undefined,
          relatedEntityId: itineraryPayload.bookingId || undefined,
          metadata: {
            bookingReference: itineraryPayload.bookingReference,
            itineraryVersion: itineraryPayload.version,
            previousItineraryId,
          },
        });
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      logError("Error sending itinerary", error, req.requestId);
      res.status(500).json({ message: "Failed to send itinerary" });
    }
  });

  // Email log endpoints (Admin/Coordinator only)
  app.get("/api/email-logs", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const archivedQuery = String(req.query.archived || "active");
      const logs = await storage.getEmailLogs({
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        templateType: typeof req.query.templateType === "string" ? req.query.templateType : undefined,
        recipient: typeof req.query.recipient === "string" ? req.query.recipient : undefined,
        bookingReference: typeof req.query.bookingReference === "string" ? req.query.bookingReference : undefined,
        dateFrom: typeof req.query.dateFrom === "string" ? req.query.dateFrom : undefined,
        dateTo: typeof req.query.dateTo === "string" ? req.query.dateTo : undefined,
        archived: archivedQuery === "archived" || archivedQuery === "all" ? archivedQuery : "active",
      });
      res.json(logs);
    } catch (error) {
      logError("Error fetching email logs", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Retry failed email
  app.post("/api/email-logs/:id/retry", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const emailLog = await storage.getEmailLog(id);

      if (!emailLog) {
        return res.status(404).json({ message: "Email log not found" });
      }

      const templateType = emailLog.templateType || "custom";
      const resendRenderedBody = templateType !== "custom";
      const result = await sendCustomEmailDetailed({
        recipientName: emailLog.recipientName || "",
        recipientEmail: emailLog.recipientEmail,
        subject: emailLog.subject,
        message: emailLog.message || "",
        includeGreeting: !resendRenderedBody,
      });

      if (result.success) {
        // Update the email log status
        await storage.updateEmailLogStatus(id, "accepted", null, result.messageId || null);
        res.json({ success: true, message: "Email resent successfully" });
      } else {
        await storage.updateEmailLogStatus(id, "failed", result.error || "Retry failed");
        res.status(500).json({ message: "Failed to resend email" });
      }
    } catch (error) {
      logError("Error retrying email", error, req.requestId);
      res.status(500).json({ message: "Failed to retry email" });
    }
  });

  // Archive email
  app.post("/api/email-logs/:id/archive", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const emailLog = await storage.archiveEmailLog(id);
      if (!emailLog) {
        return res.status(404).json({ message: "Email log not found" });
      }
      res.json({ success: true, message: "Email archived successfully" });
    } catch (error) {
      logError("Error archiving email", error, req.requestId);
      res.status(500).json({ message: "Failed to archive email" });
    }
  });

  // Delete email (soft delete)
  app.delete("/api/email-logs/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailLog(id);
      res.json({ success: true, message: "Email deleted successfully" });
    } catch (error) {
      logError("Error deleting email", error, req.requestId);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  app.post("/api/webhooks/resend", async (req, res) => {
    try {
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      if (webhookSecret) {
        const sharedSecretHeader = getHeaderValue(req.headers["x-webhook-secret"]);
        const hasSvixHeaders = Boolean(
          req.headers["svix-id"] && req.headers["svix-timestamp"] && req.headers["svix-signature"]
        );

        const isVerified = hasSvixHeaders
          ? verifyResendWebhookSignature(req, webhookSecret)
          : sharedSecretHeader === webhookSecret;

        if (!isVerified) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const eventType = String(req.body?.type || "");
      const status = resendEventStatusMap[eventType] || "accepted";
      const providerMessageId = req.body?.data?.email_id || req.body?.data?.id || req.body?.email_id;

      if (!providerMessageId) {
        return res.status(202).json({ received: true, tracked: false, message: "No provider message id in event" });
      }

      const errorMessage = req.body?.data?.bounce?.message
        || req.body?.data?.error?.message
        || req.body?.data?.reason
        || null;

      const updated = await storage.updateEmailLogDeliveryStatus(
        String(providerMessageId),
        status,
        req.body?.created_at || req.body?.data?.created_at || null,
        errorMessage
      );

      res.json({ received: true, tracked: !!updated, status });
    } catch (error) {
      logError("Error handling Resend webhook", error, req.requestId);
      res.status(500).json({ message: "Failed to process Resend webhook" });
    }
  });

  // Booking Reminders endpoints
  app.post("/api/admin/reminders/trigger", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { triggerRemindersManually } = await import("./lib/reminder-scheduler");
      await triggerRemindersManually();
      res.json({ success: true, message: "Reminder check triggered manually" });
    } catch (error) {
      logError("Error triggering reminders", error, req.requestId);
      res.status(500).json({ message: "Failed to trigger reminders" });
    }
  });

  // Email Templates API
  app.get("/api/email-templates", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      logError("Error fetching email templates", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates/initialize", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const requestedTemplates = Array.isArray(req.body?.templates) ? req.body.templates : [];
      if (requestedTemplates.length === 0) {
        return res.status(400).json({ message: "At least one template is required" });
      }

      const created = [];
      const updated = [];

      for (const requestedTemplate of requestedTemplates) {
        const templateData = insertEmailTemplateSchema.parse({
          name: requestedTemplate.name,
          subject: requestedTemplate.subject,
          body: requestedTemplate.body,
          description: requestedTemplate.description,
          variables: requestedTemplate.variables || [],
          isActive: requestedTemplate.isActive ?? true,
          updatedBy: req.session?.userId,
        });

        const existingTemplate = await storage.getEmailTemplateByName(templateData.name);
        if (!existingTemplate) {
          created.push(await storage.createEmailTemplate(templateData));
          continue;
        }

        const shouldPatchFeedbackBody = templateData.name === "feedback_request"
          && !String(existingTemplate.body || "").includes("{{feedback_link}}");
        const shouldPatchVariables = JSON.stringify(existingTemplate.variables || []) !== JSON.stringify(templateData.variables || []);

        if (shouldPatchFeedbackBody || shouldPatchVariables) {
          const updatedTemplate = await storage.updateEmailTemplate(existingTemplate.id, {
            body: shouldPatchFeedbackBody ? templateData.body : existingTemplate.body,
            description: templateData.description || existingTemplate.description,
            variables: templateData.variables,
            updatedBy: req.session?.userId,
          });

          if (updatedTemplate) {
            updated.push(updatedTemplate);
          }
        }
      }

      res.status(201).json({
        createdCount: created.length,
        updatedCount: updated.length,
        created,
        updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      logError("Error initializing email templates", error, req.requestId);
      res.status(500).json({ message: "Failed to initialize email templates" });
    }
  });

  app.post("/api/email-templates/:id/preview", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const sampleData = {
        ...TEMPLATE_SAMPLE_DATA,
        ...(req.body?.sampleData || {}),
      };

      res.json({
        subject: renderTemplateText(template.subject, sampleData),
        body: renderTemplateText(template.body, sampleData),
        sampleData,
      });
    } catch (error) {
      logError("Error previewing email template", error, req.requestId);
      res.status(500).json({ message: "Failed to preview email template" });
    }
  });

  app.post("/api/email-templates/:id/send-test", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const recipientEmail = String(req.body?.recipientEmail || "").trim();
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }

      const user = await storage.getUser(req.session?.userId);
      const senderName = user ? `${user.firstName} ${user.lastName}` : "Visit Dzaleka Team";
      const sampleData = {
        ...TEMPLATE_SAMPLE_DATA,
        ...(req.body?.sampleData || {}),
      };
      const subject = `[Test] ${renderTemplateText(template.subject, sampleData)}`;
      const message = renderTemplateText(template.body, sampleData);

      const result = await sendCustomEmailDetailed({
        recipientName: req.body?.recipientName || "Test Recipient",
        recipientEmail,
        subject,
        message,
        senderName,
      });

      await storage.createEmailLog({
        sentBy: req.session?.userId,
        recipientName: req.body?.recipientName || "Test Recipient",
        recipientEmail,
        subject,
        message,
        templateType: `${template.name}_test`,
        status: result.success ? "accepted" : "failed",
        errorMessage: result.error,
        providerMessageId: result.messageId,
        metadata: { templateId: template.id, test: true },
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to send test email" });
      }

      res.json({ success: true, message: "Test email sent", providerMessageId: result.messageId });
    } catch (error) {
      logError("Error sending test email", error, req.requestId);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  app.put("/api/email-templates/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateEmailTemplate(id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      logError("Error updating email template", error, req.requestId);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.patch("/api/email-templates/:id/toggle", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const template = await storage.toggleEmailTemplateStatus(id, isActive);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      logError("Error toggling email template", error, req.requestId);
      res.status(500).json({ message: "Failed to toggle email template" });
    }
  });

  // Revenue Dashboard endpoint (Admin/Coordinator only)
  app.get("/api/revenue", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const data = await storage.getRevenueDashboard();
      res.json(data);
    } catch (error) {
      logError("Error fetching revenue data", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Revenue KPIs endpoint (admin only)
  app.get("/api/revenue/kpis", isAuthenticated, requireRole("admin", "coordinator"), async (req: Request, res: Response) => {
    try {
      // Get all bookings using storage layer
      const allBookings = await storage.getBookings();
      const paidBookings = allBookings.filter(b => b.paymentStatus === "paid");

      // Get payout history using storage layer
      const allPayouts = await storage.getPayouts();
      const paidPayouts = allPayouts.filter(p => p.status === "paid");
      const totalGuidePayout = paidPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

      // 1. Total Revenue (from paid bookings)
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Guide share configuration: guides currently take 100% of tour revenue
      // Platform revenue is configured as 0% for direct tour payments.
      const GUIDE_SHARE_PERCENT = 100; // 100% to guides
      const PLATFORM_SHARE_PERCENT = 0;  // 0% to platform

      // Calculate actual guide earnings, honoring per-booking guidePayment when set.
      const completedPaidBookings = allBookings.filter(b =>
        (b.status === "completed" || b.status === "in_progress" || b.status === "confirmed") &&
        b.paymentStatus === "paid"
      );
      const totalGuideEarnings = completedPaidBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0);

      // 2. Gross Margin % = Platform keeps 0% since guides take 100%
      const platformRevenue = totalRevenue - totalGuideEarnings;
      const grossMarginPercent = totalRevenue > 0 ? Math.round((platformRevenue / totalRevenue) * 100) : 0;

      // 3. Platform vs Guide Share (based on business model, not payouts)
      const guideSharePercent = GUIDE_SHARE_PERCENT;
      const platformSharePercent = PLATFORM_SHARE_PERCENT;

      // 4. Average Tour Price by Type
      const avgPriceByType: Record<string, { count: number; total: number; avgPrice: number }> = {};
      paidBookings.forEach(b => {
        const tourType = b.tourType || "standard";
        if (!avgPriceByType[tourType]) {
          avgPriceByType[tourType] = { count: 0, total: 0, avgPrice: 0 };
        }
        avgPriceByType[tourType].count++;
        avgPriceByType[tourType].total += b.totalAmount || 0;
      });
      // Calculate averages
      Object.keys(avgPriceByType).forEach(type => {
        const data = avgPriceByType[type];
        data.avgPrice = data.count > 0 ? Math.round(data.total / data.count) : 0;
      });

      // 5. Net Ticket Margin (expected price vs actual realized)
      // Use pricing from database
      const pricingMap = await getPricingMap();
      const getBaselinePrice = (groupSize: string): number => {
        const pricing = pricingMap[groupSize] || DEFAULT_PRICING[groupSize] || DEFAULT_PRICING.individual;
        return pricing.basePrice;
      };

      // Calculate expected revenue based on each booking's group size
      const expectedRevenue = paidBookings.reduce((sum, b) => {
        const groupSize = b.groupSize || "individual";
        const baselinePrice = getBaselinePrice(groupSize);
        return sum + baselinePrice;
      }, 0);

      // Net Margin: (Actual - Expected) / Expected × 100
      // Positive = charging more than baseline, Negative = discounting
      const netTicketMargin = expectedRevenue > 0
        ? Math.round(((totalRevenue - expectedRevenue) / expectedRevenue) * 100)
        : 0;

      // 6. Revenue by completed vs no-show (efficiency metric)
      const completedBookings = allBookings.filter(b => b.status === "completed" && b.paymentStatus === "paid");
      const noShowBookings = allBookings.filter(b => b.status === "no_show");
      const completedRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const noShowLostRevenue = noShowBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      res.json({
        grossMargin: {
          percent: grossMarginPercent,
          platformRevenue,
          totalRevenue,
          totalGuidePayout,
        },
        revenueShare: {
          platformSharePercent,
          guideSharePercent,
          platformAmount: platformRevenue,
          guideAmount: totalGuidePayout,
        },
        avgPriceByType: Object.entries(avgPriceByType).map(([tourType, data]) => ({
          tourType,
          ...data,
        })).sort((a, b) => b.avgPrice - a.avgPrice),
        netTicketMargin: {
          percent: netTicketMargin,
          actualRevenue: totalRevenue,
          expectedRevenue,
          difference: totalRevenue - expectedRevenue,
        },
        revenueEfficiency: {
          completedRevenue,
          noShowLostRevenue,
          completedCount: completedBookings.length,
          noShowCount: noShowBookings.length,
        },
      });
    } catch (error) {
      logError("Error getting revenue KPIs", error, req.requestId);
      res.status(500).json({ message: "Failed to get revenue KPIs" });
    }
  });

  // User Stats endpoint (Admin only)
  app.get("/api/user-stats", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      logError("Error fetching user stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // =====================
  // Notification Routes
  // =====================

  // Get notifications for current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = parseInt(req.query.limit as string) || 50;
      const user = await storage.getUser(userId);
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications.filter((notification) => isNotificationVisibleToRole(notification, user?.role)));
    } catch (error) {
      logError("Error fetching notifications", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const notifications = await storage.getNotifications(userId, 500);
      const count = notifications.filter((notification) =>
        !notification.isRead && isNotificationVisibleToRole(notification, user?.role)
      ).length;
      res.json({ count });
    } catch (error) {
      logError("Error fetching unread count", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark single notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const notification = await storage.markNotificationAsReadForUser(id, userId);
      if (!notification || !isNotificationVisibleToRole(notification, user?.role)) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      logError("Error marking notification as read", error, req.requestId);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      logError("Error marking all notifications as read", error, req.requestId);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNotificationForUser(id, req.session.userId!);
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting notification", error, req.requestId);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // =====================
  // CMS Routes
  // =====================

  app.get("/api/content", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      const content = await storage.getContentBlocks();
      // Convert array to object key-value pairs for easier frontend consumption
      const contentMap = content.reduce((acc: Record<string, string>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      res.json(contentMap);
    } catch (error) {
      logError("Error fetching content", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put("/api/content", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      const { updates } = req.body; // Expecting object { key: value }
      const userId = req.session.userId!;

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: "Invalid updates format" });
      }

      const results = [];
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'string') {
          const result = await storage.updateContentBlock(key, value, userId);
          results.push(result);
        }
      }

      await createAuditLog(userId, "update", "cms", "content_blocks", null, { updatedKeys: Object.keys(updates) }, req);

      res.json({ success: true, updated: results.length });
    } catch (error) {
      logError("Error updating content", error, req.requestId);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // =====================
  // Backup & Export Routes
  // =====================

  app.get("/api/admin/export-data", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const [users, bookings, guides, zones] = await Promise.all([
        storage.getUsers(),
        storage.getBookings(),
        storage.getGuides(),
        storage.getZones()
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        users,
        bookings,
        guides,
        zones
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=system-backup-${new Date().toISOString().split('T')[0]}.json`);
      res.json(exportData);
    } catch (error) {
      logError("Error exporting data", error, req.requestId);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // =====================
  // Advanced Reporting Routes
  // =====================

  app.get("/api/reports/payouts", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const guides = await storage.getGuides();

      const completedBookings = bookings.filter(b => b.status === 'completed');
      const bookingsWithGuides = completedBookings.filter(b => b.assignedGuideId);

      // Calculate payouts based on completed bookings
      // Guide currently gets 100% of revenue (no platform fee)
      const GUIDE_SHARE_PERCENTAGE = 1.0;

      const payouts = guides.map(guide => {
        // Get all completed bookings for this guide (regardless of payment status)
        // Check both guide.id and guide.userId since assignedGuideId could be either
        const guideBookings = getGuideBookings(bookings, guide).filter(b => b.status === 'completed');

        // Separate by payment status
        const paidBookings = guideBookings.filter(b => b.paymentStatus === 'paid');
        const pendingBookings = guideBookings.filter(b => b.paymentStatus === 'pending');

        const paidRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalRevenue = paidRevenue + pendingRevenue;

        const paidGuideShare = Math.round(paidBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0) * GUIDE_SHARE_PERCENTAGE);
        const pendingGuideShare = Math.round(pendingBookings.reduce((sum, b) => sum + getBookingGuideEarnings(b), 0) * GUIDE_SHARE_PERCENTAGE);
        const guideShare = paidGuideShare + pendingGuideShare;
        const platformShare = Math.max(0, totalRevenue - guideShare);

        return {
          guideId: guide.id,
          guideName: `${guide.firstName} ${guide.lastName}`,
          completedTours: guideBookings.length,
          paidTours: paidBookings.length,
          pendingTours: pendingBookings.length,
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          paidGuideShare,
          pendingGuideShare,
          guideShare,
          platformShare
        };
      }).filter(p => p.completedTours > 0); // Show anyone with completed tours

      logger.debug("Payouts calculated", { guidesWithTours: payouts.length });

      res.json(payouts);
    } catch (error) {
      logError("Error calculating payouts", error, req.requestId);
      res.status(500).json({ message: "Failed to calculate payouts" });
    }
  });

  // =====================
  // Guide Payout History & Processing
  // =====================

  // Get payout history with optional filters
  app.get("/api/payouts", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { guideId, status } = req.query;
      const payouts = await storage.getPayouts({
        guideId: guideId as string | undefined,
        status: status as string | undefined,
      });

      // Enrich with guide names
      const guides = await storage.getGuides();
      const guideMap = new Map(guides.map(g => [g.id, g]));

      const enrichedPayouts = payouts.map(p => ({
        ...p,
        guideName: guideMap.get(p.guideId)
          ? `${guideMap.get(p.guideId)!.firstName} ${guideMap.get(p.guideId)!.lastName}`
          : "Unknown Guide",
      }));

      res.json(enrichedPayouts);
    } catch (error) {
      logError("Error fetching payouts", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  // Get payout summary stats
  app.get("/api/payouts/summary", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const summary = await storage.getPayoutSummary();
      res.json(summary);
    } catch (error) {
      logError("Error fetching payout summary", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch payout summary" });
    }
  });

  // Create a new payout record
  app.post("/api/payouts", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { guideId, amount, toursCount, periodStart, periodEnd, notes, status, paymentMethod, paymentReference, paidAt } = req.body;

      if (!guideId || !amount) {
        return res.status(400).json({ message: "Guide ID and amount are required" });
      }

      const payout = await storage.createPayout({
        guideId,
        amount,
        toursCount: toursCount || 0,
        periodStart: periodStart || null,
        periodEnd: periodEnd || null,
        notes: notes || null,
        status: status || "pending",
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
        paidAt: paidAt ? new Date(paidAt) : (status === 'paid' ? new Date() : null),
      });

      res.json(payout);
    } catch (error) {
      logError("Error creating payout", error, req.requestId);
      res.status(500).json({ message: "Failed to create payout" });
    }
  });

  // Mark payout as paid
  app.patch("/api/payouts/:id/mark-paid", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod, paymentReference } = req.body;
      const userId = req.session?.userId;

      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      const payout = await storage.markPayoutAsPaid(id, userId, paymentMethod, paymentReference);
      if (!payout) {
        return res.status(404).json({ message: "Payout not found" });
      }

      res.json(payout);
    } catch (error) {
      logError("Error marking payout as paid", error, req.requestId);
      res.status(500).json({ message: "Failed to mark payout as paid" });
    }
  });

  // Export payouts as CSV
  app.get("/api/payouts/export", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      let payouts = await storage.getPayouts({
        status: status as string | undefined,
      });

      // Filter by date range if provided
      if (startDate || endDate) {
        payouts = payouts.filter(p => {
          const created = new Date(p.createdAt!);
          if (startDate && created < new Date(startDate as string)) return false;
          if (endDate && created > new Date(endDate as string)) return false;
          return true;
        });
      }

      // Get guide names
      const guides = await storage.getGuides();
      const guideMap = new Map(guides.map(g => [g.id, `${g.firstName} ${g.lastName}`]));

      // Build CSV
      let csv = "Payout ID,Guide Name,Amount (MWK),Tours,Status,Payment Method,Payment Reference,Paid Date,Created Date\n";

      for (const p of payouts) {
        const guideName = guideMap.get(p.guideId) || "Unknown";
        const paidDate = p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : "";
        const createdDate = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : "";

        csv += `${p.id},${guideName},${p.amount},${p.toursCount || 0},${p.status},${p.paymentMethod || ""},${p.paymentReference || ""},${paidDate},${createdDate}\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=payouts_export_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      logError("Error exporting payouts", error, req.requestId);
      res.status(500).json({ message: "Failed to export payouts" });
    }
  });

  // =====================
  // User Invitation
  // =====================

  app.post("/api/auth/invite", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { email, role, firstName, lastName } = req.body;

      if (!email || !role || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!VALID_USER_ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid user role" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user with random password
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(tempPassword);

      const user = await storage.createUser(email, hashedPassword, firstName, lastName, role);

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send invitation email
      const inviteUrl = `${PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      const inviter = await storage.getUser(req.session.userId);

      const invitationResult = await sendInvitationEmailDetailed({
        email,
        role,
        inviteUrl,
        inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : "Administrator"
      });
      await storage.createEmailLog({
        sentBy: req.session.userId,
        recipientName: `${firstName} ${lastName}`.trim(),
        recipientEmail: email,
        subject: "You have been invited to Visit Dzaleka",
        message: `Invitation sent for ${role}.`,
        templateType: "invitation",
        status: invitationResult.success ? "accepted" : "failed",
        errorMessage: invitationResult.error,
        providerMessageId: invitationResult.messageId,
        relatedEntityType: "user",
        relatedEntityId: user.id,
        metadata: { role },
      });

      await createAuditLog(req.session.userId, "create", "user_invite", user.id, null, { email, role }, req);

      res.json({ success: true, message: "Invitation sent successfully" });
    } catch (error) {
      logError("Error sending invitation", error, req.requestId);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // =====================
  // Security Routes
  // =====================

  // Get all login history (admin only)
  app.get("/api/security/login-history", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const loginHistory = await storage.getLoginHistory(limit);
      res.json(loginHistory);
    } catch (error) {
      logError("Error fetching login history", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch login history" });
    }
  });

  // Get login history for specific user (admin only)
  app.get("/api/users/:id/login-history", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const loginHistory = await storage.getUserLoginHistory(req.params.id, limit);
      res.json(loginHistory);
    } catch (error) {
      logError("Error fetching user login history", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch login history" });
    }
  });

  // IP Whitelist CRUD
  app.get("/api/security/ip-whitelist", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const ips = await storage.getAllowedIps();
      res.json(ips);
    } catch (error) {
      logError("Error fetching allowed IPs", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch allowed IPs" });
    }
  });

  app.post("/api/security/ip-whitelist", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const ipData = insertAllowedIpSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });

      const allowedIp = await storage.createAllowedIp(ipData);

      await createAuditLog(req.session.userId, "create", "ip_whitelist", allowedIp.id, null, { ip: allowedIp.ipAddress }, req);

      res.json(allowedIp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        logError("Error adding allowed IP", error, req.requestId);
        res.status(500).json({ message: "Failed to add IP" });
      }
    }
  });

  app.delete("/api/security/ip-whitelist/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      await storage.deleteAllowedIp(req.params.id);
      await createAuditLog(req.session.userId, "delete", "ip_whitelist", req.params.id, null, null, req);
      res.json({ success: true });
    } catch (error) {
      logError("Error removing allowed IP", error, req.requestId);
      res.status(500).json({ message: "Failed to remove IP" });
    }
  });

  // =====================
  // User Invites Routes
  // =====================

  // Get all invites (admin only)
  app.get("/api/invites", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const invites = await storage.getInvites();
      res.json(invites);
    } catch (error) {
      logError("Error fetching invites", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  // Create new invite and send email (admin only)
  app.post("/api/invites", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { email, role } = req.body;
      const inviteRole = VALID_USER_ROLES.includes(role) ? role : "visitor";

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if there's already a pending invite for this email
      const existingInvite = await storage.getInviteByEmail(email);
      if (existingInvite) {
        return res.status(400).json({ message: "An invitation is already pending for this email" });
      }

      // Generate invite token
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invite
      const invite = await storage.createInvite({
        email,
        role: inviteRole,
        inviteToken,
        invitedBy: req.session.userId,
        expiresAt
      });

      // Send invitation email
      const inviteUrl = `${PUBLIC_APP_URL}/accept-invite?token=${inviteToken}`;
      const currentUser = await storage.getUser(req.session.userId);
      const inviterName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";

      try {
        const invitationResult = await sendInvitationEmailDetailed({
          email,
          role: inviteRole,
          inviteUrl,
          inviterName
        });
        await storage.createEmailLog({
          sentBy: req.session.userId,
          recipientEmail: email,
          subject: "You have been invited to Visit Dzaleka",
          message: `Invitation sent for ${inviteRole}.`,
          templateType: "invitation",
          status: invitationResult.success ? "accepted" : "failed",
          errorMessage: invitationResult.error,
          providerMessageId: invitationResult.messageId,
          relatedEntityType: "user_invite",
          relatedEntityId: invite.id,
          metadata: { role: inviteRole },
        });
      } catch (emailError) {
        logError("Failed to send invitation email", emailError, req.requestId);
        // Don't fail the request if email fails
      }

      await createAuditLog(req.session.userId, "create", "user_invite", invite.id, null, { email, role: inviteRole }, req);

      res.json({ success: true, invite });
    } catch (error) {
      logError("Error creating invite", error, req.requestId);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Resend invite (admin only)
  app.post("/api/invites/:id/resend", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const invites = await storage.getInvites();
      const invite = invites.find(i => i.id === req.params.id);

      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      if (invite.acceptedAt) {
        return res.status(400).json({ message: "Invite has already been accepted" });
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomBytes(32).toString("hex");
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Delete old invite and create new one
      await storage.deleteInvite(invite.id);
      const newInvite = await storage.createInvite({
        email: invite.email,
        role: invite.role || "visitor",
        inviteToken: newToken,
        invitedBy: req.session.userId,
        expiresAt: newExpiry
      });

      // Send invitation email
      const inviteUrl = `${PUBLIC_APP_URL}/accept-invite?token=${newToken}`;
      const currentUser = await storage.getUser(req.session.userId);
      const inviterName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";

      try {
        const invitationResult = await sendInvitationEmailDetailed({
          email: invite.email,
          role: invite.role || "visitor",
          inviteUrl,
          inviterName
        });
        await storage.createEmailLog({
          sentBy: req.session.userId,
          recipientEmail: invite.email,
          subject: "You have been invited to Visit Dzaleka",
          message: `Invitation resent for ${invite.role || "visitor"}.`,
          templateType: "invitation",
          status: invitationResult.success ? "accepted" : "failed",
          errorMessage: invitationResult.error,
          providerMessageId: invitationResult.messageId,
          relatedEntityType: "user_invite",
          relatedEntityId: newInvite.id,
          metadata: { role: invite.role || "visitor", resent: true },
        });
      } catch (emailError) {
        logError("Failed to send invitation email", emailError, req.requestId);
      }

      res.json({ success: true, invite: newInvite });
    } catch (error) {
      logError("Error resending invite", error, req.requestId);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // Delete invite (admin only)
  app.delete("/api/invites/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      await storage.deleteInvite(req.params.id);
      await createAuditLog(req.session.userId, "delete", "user_invite", req.params.id, null, null, req);
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting invite", error, req.requestId);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Accept invite and register (public endpoint)
  app.post("/api/auth/accept-invite", async (req, res) => {
    try {
      const { token, password, firstName, lastName } = req.body;

      if (!token || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Token, password, first name, and last name are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Find invite by token
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(400).json({ message: "Invalid or expired invitation token" });
      }

      // Check if expired
      if (new Date() > new Date(invite.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired. Please request a new one." });
      }

      // Check if already accepted
      if (invite.acceptedAt) {
        return res.status(400).json({ message: "Invitation has already been used." });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(invite.email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser(
        invite.email,
        hashedPassword,
        firstName,
        lastName,
        invite.role as any || "visitor"
      );

      // Mark invite as accepted
      await storage.acceptInvite(invite.id);

      const csrfToken = await establishAuthenticatedSession(req, user);
      res.set("X-CSRF-Token", csrfToken);

      // Audit log
      await createAuditLog(user.id, "create", "user", user.id, null, { email: invite.email, role: invite.role }, req);

      try {
        await sendWelcomeOrVerificationEmail(user, user.id);
      } catch (emailError) {
        logger.error("Failed to send welcome/verification email", emailError);
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      logError("Accept invite error", error, req.requestId);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // ==================== TRAINING MODULE ROUTES ====================

  // Get all guides' training stats (for admin dashboard)
  app.get("/api/training/guides-stats", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const stats = await storage.getAllGuidesTrainingStats();
      res.json(stats);
    } catch (error) {
      logError("Error fetching all guides training stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guides training stats" });
    }
  });

  app.post("/api/training/reminders/send", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const stats = await storage.getAllGuidesTrainingStats();
      const incompleteGuides = stats.filter((item) => item.total > 0 && item.percentage < 100);
      const results = [];

      for (const item of incompleteGuides) {
        const result = await sendGuideTrainingReminderEmail(item.guide, req.session?.userId || null);
        results.push({
          guideId: item.guide.id,
          guideName: `${item.guide.firstName} ${item.guide.lastName}`.trim(),
          sent: Boolean(result?.success),
          error: result?.error,
        });
      }

      res.json({
        sentCount: results.filter((item) => item.sent).length,
        skippedCount: incompleteGuides.length - results.length,
        results,
      });
    } catch (error) {
      logError("Error sending guide training reminders", error, req.requestId);
      res.status(500).json({ message: "Failed to send training reminders" });
    }
  });

  // Get all training modules (for guides and admins)
  app.get("/api/training/modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error) {
      logError("Error fetching training modules", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch training modules" });
    }
  });

  // Get single training module
  app.get("/api/training/modules/:id", isAuthenticated, async (req, res) => {
    try {
      const module = await storage.getTrainingModule(req.params.id);
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }
      res.json(module);
    } catch (error) {
      logError("Error fetching training module", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch training module" });
    }
  });

  // Create training module (admin only)
  app.post("/api/training/modules", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const moduleData = req.body;
      const module = await storage.createTrainingModule(moduleData);

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "create", "training_module", module.id, null, moduleData, req);
      }

      res.status(201).json(module);
    } catch (error) {
      logError("Error creating training module", error, req.requestId);
      res.status(500).json({ message: "Failed to create training module" });
    }
  });

  // Update training module (admin only)
  app.patch("/api/training/modules/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const oldModule = await storage.getTrainingModule(req.params.id);
      const module = await storage.updateTrainingModule(req.params.id, req.body);
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "training_module", module.id, oldModule, req.body, req);
      }

      res.json(module);
    } catch (error) {
      logError("Error updating training module", error, req.requestId);
      res.status(500).json({ message: "Failed to update training module" });
    }
  });

  // Delete training module (admin only)
  app.delete("/api/training/modules/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const module = await storage.getTrainingModule(req.params.id);
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }

      await storage.deleteTrainingModule(req.params.id);

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "delete", "training_module", req.params.id, module, null, req);
      }

      res.json({ message: "Training module deleted" });
    } catch (error) {
      logError("Error deleting training module", error, req.requestId);
      res.status(500).json({ message: "Failed to delete training module" });
    }
  });

  // ==================== GUIDE TRAINING PROGRESS ROUTES ====================

  // Training endpoints
  app.get("/api/visitor-resources", isAuthenticated, async (req, res) => {
    try {
      // Get visitor-targeted training modules only
      const modules = await storage.getVisitorResources();
      res.json(modules);
    } catch (error) {
      logError("Error fetching visitor resources", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/visitor-resources/progress", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const preferences = getUserPreferences(user);
      res.json(preferences.visitorResourceProgress || {});
    } catch (error) {
      logError("Error fetching visitor resource progress", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch resource progress" });
    }
  });

  app.patch("/api/visitor-resources/progress/:moduleId", isAuthenticated, requireRole("visitor"), async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const module = await storage.getTrainingModule(req.params.moduleId);
      if (!module || (module.targetAudience !== "visitor" && module.targetAudience !== "both")) {
        return res.status(404).json({ message: "Visitor resource not found" });
      }

      const payload = visitorResourceProgressSchema.parse(req.body);
      const preferences = getUserPreferences(user);
      const currentProgress = preferences.visitorResourceProgress || {};
      const updatedProgress = { ...currentProgress };

      if (payload.status === "completed") {
        updatedProgress[module.id] = {
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      } else {
        delete updatedProgress[module.id];
      }

      const updatedUser = await storage.updateUser(userId, {
        preferences: {
          ...preferences,
          visitorResourceProgress: updatedProgress,
        },
      });

      res.json(getUserPreferences(updatedUser).visitorResourceProgress || {});
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resource progress", errors: error.errors });
      }
      logError("Error updating visitor resource progress", error, req.requestId);
      res.status(500).json({ message: "Failed to update resource progress" });
    }
  });

  app.get("/api/training/progress", isAuthenticated, requireRole("guide", "admin", "coordinator"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get guide by user ID
      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const progress = await storage.getGuideTrainingProgress(guide.id);
      const modules = await storage.getTrainingModules();

      // Combine modules with progress
      const modulesWithProgress = modules.map(module => {
        const moduleProgress = progress.find(p => p.moduleId === module.id);
        return {
          ...module,
          progress: moduleProgress || { status: "not_started", completedAt: null, notes: null }
        };
      });

      res.json(modulesWithProgress);
    } catch (error) {
      logError("Error fetching training progress", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch training progress" });
    }
  });

  // Get specific guide's training progress (for admins)
  app.get("/api/guides/:guideId/training", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const progress = await storage.getGuideTrainingProgress(req.params.guideId);
      const stats = await storage.getGuideTrainingStats(req.params.guideId);
      const modules = await storage.getTrainingModules();

      // Combine modules with progress
      const modulesWithProgress = modules.map(module => {
        const moduleProgress = progress.find(p => p.moduleId === module.id);
        return {
          ...module,
          progress: moduleProgress || { status: "not_started", completedAt: null, notes: null }
        };
      });

      res.json({
        modules: modulesWithProgress,
        stats
      });
    } catch (error) {
      logError("Error fetching guide training", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide training" });
    }
  });

  // Update training progress (for guides)
  app.post("/api/training/progress/:moduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get guide by user ID
      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const { status, notes } = req.body;
      if (!status || !["not_started", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be not_started, in_progress, or completed" });
      }

      const progress = await storage.updateGuideTrainingProgress(guide.id, req.params.moduleId, status, notes);

      await createAuditLog(userId, "update", "training_progress", progress.id, null, { moduleId: req.params.moduleId, status }, req);

      res.json(progress);
    } catch (error) {
      logError("Error updating training progress", error, req.requestId);
      res.status(500).json({ message: "Failed to update training progress" });
    }
  });

  // Get training stats for current guide
  app.get("/api/training/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const guide = await storage.getGuideByUserId(userId);
      if (!guide) {
        return res.status(404).json({ message: "Guide profile not found" });
      }

      const stats = await storage.getGuideTrainingStats(guide.id);
      res.json(stats);
    } catch (error) {
      logError("Error fetching training stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch training stats" });
    }
  });

  // ==================== TASK MANAGEMENT ENDPOINTS ====================

  // Get all tasks (admin/coordinator sees all, others see their own)
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { status, priority, assignedTo } = req.query;
      let filters: { status?: string; assignedTo?: string; priority?: string } = {};

      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      // Admins and coordinators can see all tasks, others see only their own
      if (user.role === "admin" || user.role === "coordinator") {
        if (assignedTo) filters.assignedTo = assignedTo;
      } else {
        filters.assignedTo = userId;
      }

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      logError("Error fetching tasks", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get task statistics (must be before :id route)
  app.get("/api/tasks/stats", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      logError("Error fetching task stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch task statistics" });
    }
  });

  // Get my tasks (must be before :id route)
  app.get("/api/tasks/my-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      logError("Error fetching my tasks", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const access = await requireTaskAccess(req.params.id, req.session?.userId);
      if (access.status !== 200) {
        return sendTaskAccessError(res, access);
      }
      res.json(access.task);
    } catch (error) {
      logError("Error fetching task", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task (admin/coordinator only)
  app.post("/api/tasks", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const task = await storage.createTask({
        ...req.body,
        assigned_by: userId,
      });

      await createAuditLog(userId, "create", "tasks", task.id, null, task, req);

      res.status(201).json(task);
    } catch (error) {
      logError("Error creating task", error, req.requestId);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const existingTask = await storage.getTask(req.params.id);

      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const user = await storage.getUser(userId);

      // Only admin/coordinator can update any task, others can only update their own
      if (user?.role !== "admin" && user?.role !== "coordinator") {
        if (existingTask.assignedTo !== userId) {
          return res.status(403).json({ message: "You can only update tasks assigned to you" });
        }
        // Non-admin users can only update status
        const { status } = req.body;
        if (!status) {
          return res.status(400).json({ message: "You can only update task status" });
        }
        req.body = { status };
      }

      // If status is changing to completed, set completedAt
      if (req.body.status === "completed" && existingTask.status !== "completed") {
        req.body.completedAt = new Date().toISOString();
      }

      const task = await storage.updateTask(req.params.id, req.body);

      await createAuditLog(userId, "update", "tasks", req.params.id, existingTask, task, req);

      res.json(task);
    } catch (error) {
      logError("Error updating task", error, req.requestId);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete task (admin only)
  app.delete("/api/tasks/:id", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const task = await storage.getTask(req.params.id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await storage.deleteTask(req.params.id);
      await createAuditLog(userId, "delete", "tasks", req.params.id, task, null, req);

      res.status(204).send();
    } catch (error) {
      logError("Error deleting task", error, req.requestId);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Get task comments
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const access = await requireTaskAccess(req.params.id, req.session?.userId);
      if (access.status !== 200) {
        return sendTaskAccessError(res, access);
      }
      const comments = await storage.getTaskComments(req.params.id);
      res.json(comments);
    } catch (error) {
      logError("Error fetching task comments", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add task comment
  app.post("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const { content } = req.body;

      const access = await requireTaskAccess(req.params.id, userId);
      if (access.status !== 200) {
        return sendTaskAccessError(res, access);
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await storage.createTaskComment({
        taskId: req.params.id,
        userId,
        content: content.trim(),
      });

      res.status(201).json(comment);
    } catch (error) {
      logError("Error creating comment", error, req.requestId);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // =============================================
  // CHAT API ROUTES
  // =============================================

  // Get all chat rooms for current user
  app.get("/api/chat/rooms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const rooms = await storage.getChatRooms(userId);
      const allowedRooms = await filterChatRoomsForUser(userId, rooms);
      res.json(allowedRooms);
    } catch (error) {
      logError("Error fetching chat rooms", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  // Get a specific chat room
  app.get("/api/chat/rooms/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const access = await getChatRoomForParticipant(req.params.id, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      res.json(access.room);
    } catch (error) {
      logError("Error fetching chat room", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch chat room" });
    }
  });

  // Delete a chat room (and all messages)
  app.delete("/api/chat/rooms/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const roomId = req.params.id;

      const access = await getChatRoomForParticipant(roomId, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      const user = await getRequestUser(req);
      const isStaff = user?.role === "admin" || user?.role === "coordinator";

      if (isStaff) {
        await storage.deleteChatRoom(roomId);
        res.json({ message: "Chat history deleted" });
      } else {
        await storage.removeChatParticipant(roomId, userId);
        res.json({ message: "Left chat room successfully" });
      }
    } catch (error) {
      logError("Error deleting chat room", error, req.requestId);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // Create or get direct message room with another user
  app.post("/api/chat/direct/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.userId!;
      const otherUserId = req.params.userId;

      if (currentUserId === otherUserId) {
        return res.status(400).json({ message: "Cannot chat with yourself" });
      }

      const currentUser = await storage.getUser(currentUserId);
      const otherUser = await storage.getUser(otherUserId);
      if (!currentUser || !otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!(await canUsersStartDirectChat(currentUser, otherUser))) {
        return res.status(403).json({ message: "You do not have permission to message this user" });
      }

      const room = await storage.getOrCreateDirectRoom(currentUserId, otherUserId);
      res.json(room);
    } catch (error) {
      logError("Error creating direct room", error, req.requestId);
      res.status(500).json({ message: "Failed to create chat room" });
    }
  });

  // Get messages for a chat room
  app.get("/api/chat/rooms/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const userId = req.session.userId!;
      const access = await getChatRoomForParticipant(req.params.id, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      const messages = await storage.getChatMessages(req.params.id, limit);

      // Update last read timestamp for current user
      await storage.updateLastRead(req.params.id, userId);

      res.json(messages);
    } catch (error) {
      logError("Error fetching messages", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message to a chat room
  app.post("/api/chat/rooms/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { content, messageType } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const access = await getChatRoomForParticipant(req.params.id, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      const message = await storage.createChatMessage({
        roomId: req.params.id,
        senderId: userId,
        content: content.trim(),
        messageType: messageType || "text",
      });

      res.status(201).json(message);
    } catch (error) {
      logError("Error sending message", error, req.requestId);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Delete a message (only own messages)
  app.delete("/api/chat/messages/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const messageId = req.params.id;

      const message = await storage.getChatMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      const access = await getChatRoomForParticipant(message.roomId, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }

      await storage.deleteChatMessage(messageId);
      res.json({ message: "Message deleted" });
    } catch (error) {
      logError("Error deleting message", error, req.requestId);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Get participants of a chat room
  app.get("/api/chat/rooms/:id/participants", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const access = await getChatRoomForParticipant(req.params.id, userId);
      if (access.status !== 200) {
        return res.status(access.status).json({ message: access.message });
      }

      res.json(access.participants);
    } catch (error) {
      logError("Error fetching participants", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Get list of users for starting a chat
  app.get("/api/chat/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const currentUser = await storage.getUser(userId);
      const allUsers = await storage.getUsers();

      let filteredUsers = allUsers.filter(u => u.id !== userId);

      // Role-based filtering
      if (currentUser?.role === 'visitor') {
        // Visitors can only chat with:
        // 1. Admins (for general inquiries)
        // 2. Guides assigned to their bookings
        const assignedGuideUserIds = await getVisitorAssignedGuideUserIds(currentUser);
        const linkedTransportPartnerUserIds = new Set<string>();
        const transportPartnerUsers = filteredUsers.filter((u) => u.role === "transport_partner");
        for (const transportPartnerUser of transportPartnerUsers) {
          const partner = await getTransportPartnerForUser(transportPartnerUser);
          if (partner && await isVisitorLinkedToTransportPartner(currentUser, partner.id)) {
            linkedTransportPartnerUserIds.add(transportPartnerUser.id);
          }
        }

        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' ||
          u.role === 'coordinator' ||
          assignedGuideUserIds.has(u.id) ||
          linkedTransportPartnerUserIds.has(u.id)
        );
      } else if (currentUser?.role === 'transport_partner') {
        const partner = await getTransportPartnerForUser(currentUser);
        const linkedVisitorEmails = partner
          ? await getTransportPartnerLinkedVisitorEmails(partner.id)
          : new Set<string>();

        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' ||
          u.role === 'coordinator' ||
          (u.role === 'visitor' && linkedVisitorEmails.has(normalizedEmail(u.email)))
        );
      } else if (currentUser?.role === 'guide') {
        // Guides can only chat with admins/coordinators and assigned visitors
        const visitorUsers = filteredUsers.filter(u => u.role === 'visitor');
        const assignedVisitorIds = new Set<string>();
        for (const visitor of visitorUsers) {
          if (await isGuideAssignedToVisitor(currentUser, visitor)) {
            assignedVisitorIds.add(visitor.id);
          }
        }

        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' ||
          u.role === 'coordinator' ||
          assignedVisitorIds.has(u.id)
        );
      } else if (currentUser?.role === 'security') {
        // Security can only chat with admins/coordinators and active-day visitors
        const visitorUsers = filteredUsers.filter(u => u.role === 'visitor');
        const activeVisitorIds = new Set<string>();
        for (const visitor of visitorUsers) {
          if (await isVisitorActiveToday(visitor)) {
            activeVisitorIds.add(visitor.id);
          }
        }

        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' ||
          u.role === 'coordinator' ||
          activeVisitorIds.has(u.id)
        );
      } else if (currentUser?.role !== 'admin' && currentUser?.role !== 'coordinator') {
        // Default-deny other role pairs unless communicating with admins/coordinators
        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' ||
          u.role === 'coordinator'
        );
      }
      // Admins/coordinators and existing staff roles keep broader operational visibility.

      const chatUsers = filteredUsers.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        profileImageUrl: u.profileImageUrl,
      }));
      res.json(chatUsers);
    } catch (error) {
      logError("Error fetching chat users", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get unread chat count
  app.get("/api/chat/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      // We can reuse getChatRooms as it already fetches the necessary data with joins
      // A dedicated count query would be more performant in a large scale app
      const rooms = await storage.getChatRooms(userId) as any[];
      const allowedRooms = await filterChatRoomsForUser(userId, rooms);

      let unreadCount = 0;
      for (const room of allowedRooms) {
        // Use camelCase to match the transformed response
        const participants = room.chatParticipants || room.chat_participants || [];
        const participant = participants.find((p: any) =>
          p.userId === userId || p.user_id === userId
        );
        if (participant) {
          const lastReadStr = participant.lastReadAt || participant.last_read_at;
          const lastRead = lastReadStr ? new Date(lastReadStr) : new Date(0);
          const roomUpdatedStr = room.updatedAt || room.updated_at;
          const lastUpdated = new Date(roomUpdatedStr);

          // Check if room has been updated since last read
          if (lastUpdated > lastRead) {
            unreadCount++;
          }
        }
      }

      res.json({ count: unreadCount });
    } catch (error) {
      logError("Error fetching unread chat count", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // ================================================
  // HELP CENTER API
  // ================================================

  // Get help articles (filtered by user role)
  app.get("/api/help/articles", isAuthenticated, async (req, res) => {
    try {
      const userRole = req.session.userRole;
      const category = req.query.category as string | undefined;

      // Map user role to audience
      let audience: "visitor" | "guide" | "both" = "both";
      if (userRole === "visitor") {
        audience = "visitor";
      } else if (userRole === "guide") {
        audience = "guide";
      }

      const articles = await storage.getHelpArticles(
        audience,
        category as any
      );
      res.json(articles);
    } catch (error) {
      logError("Error fetching help articles", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch help articles" });
    }
  });

  // Get single article by slug
  app.get("/api/help/articles/:slug", isAuthenticated, async (req, res) => {
    try {
      const article = await storage.getHelpArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const user = await getRequestUser(req);
      const isStaff = user?.role === "admin" || user?.role === "coordinator";
      if (!isStaff) {
        if (!article.isPublished) {
          return res.status(404).json({ message: "Article not found" });
        }

        const userRole = user?.role || "visitor";
        if (article.audience !== "both") {
          if (article.audience === "visitor" && userRole !== "visitor") {
            return res.status(403).json({ message: "You do not have permission to view this article" });
          }
          if (article.audience === "guide" && userRole !== "guide") {
            return res.status(403).json({ message: "You do not have permission to view this article" });
          }
        }
      }

      res.json(article);
    } catch (error) {
      logError("Error fetching help article", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Admin: Get all articles (including unpublished)
  app.get("/api/admin/help/articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const articles = await storage.getAllHelpArticles();
      res.json(articles);
    } catch (error) {
      logError("Error fetching all help articles", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Admin: Create article
  app.post("/api/admin/help/articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const articleData = {
        ...req.body,
        createdBy: userId,
        updatedBy: userId,
      };
      const article = await storage.createHelpArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      logError("Error creating help article", error, req.requestId);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  // Admin: Update article
  app.put("/api/admin/help/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const updates = {
        ...req.body,
        updatedBy: userId,
      };
      const article = await storage.updateHelpArticle(req.params.id, updates);
      res.json(article);
    } catch (error) {
      logError("Error updating help article", error, req.requestId);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  // Admin: Delete article
  app.delete("/api/admin/help/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteHelpArticle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logError("Error deleting help article", error, req.requestId);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Helper to sanitize ticket by role
  function sanitizeTicketForRole(ticket: any, role: string) {
    if (role === "admin") return ticket;
    const { adminNotes, ...rest } = ticket;
    return rest;
  }

  // Get support tickets (admin sees all, users see their own)
  app.get("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await getRequestUser(req);
      const userRole = user?.role || "visitor";

      // Admins see all tickets, others see only their own
      const tickets = await storage.getSupportTickets(
        userRole === "admin" ? undefined : userId
      );
      res.json(tickets.map(t => sanitizeTicketForRole(t, userRole)));
    } catch (error) {
      logError("Error fetching support tickets", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Create support ticket
  app.post("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await getRequestUser(req);
      const userRole = user?.role || "visitor";
      const ticketData = {
        ...req.body,
        userId,
      };
      const ticket = await storage.createSupportTicket(ticketData);

      // Notify admins about new ticket
      await notifySupportTicketCreated(ticket.id, ticketData.subject, user ? `${user.firstName} ${user.lastName}` : "User");
      if (user?.email) {
        await sendSupportTicketCreatedEmail(ticket, user, userId);
      }

      res.status(201).json(sanitizeTicketForRole(ticket, userRole));
    } catch (error) {
      logError("Error creating support ticket", error, req.requestId);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Admin: Update support ticket
  app.put("/api/support/tickets/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const oldTicket = await storage.getSupportTicketById(req.params.id);
      const updates = req.body;
      if (updates.status === "resolved") {
        updates.resolvedAt = new Date().toISOString();
      }
      const ticket = await storage.updateSupportTicket(req.params.id, updates);
      if (ticket.status === "resolved" && oldTicket?.status !== "resolved") {
        const ticketUser = await storage.getUser(ticket.userId);
        if (ticketUser?.email) {
          await sendSupportTicketResolvedEmail(ticket, ticketUser, req.session?.userId || null);
        }
      }
      res.json(ticket);
    } catch (error) {
      logError("Error updating support ticket", error, req.requestId);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // =====================
  // Recurring Bookings
  // =====================

  app.get("/api/recurring-bookings", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const recurrings = await storage.getRecurringBookings();
      res.json(recurrings);
    } catch (error) {
      logError("Error fetching recurring bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch recurring bookings" });
    }
  });

  app.post("/api/recurring-bookings", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const parsed = insertRecurringBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid recurring booking",
          errors: parsed.error.flatten(),
        });
      }

      const bookingData = parsed.data;
      const dayOfWeek = bookingData.dayOfWeek ?? null;
      const weekOfMonth = bookingData.weekOfMonth ?? null;

      if (Number.isNaN(new Date(bookingData.startDate).getTime())) {
        return res.status(400).json({ message: "Invalid start date" });
      }

      if (dayOfWeek !== null && (dayOfWeek < 0 || dayOfWeek > 6)) {
        return res.status(400).json({ message: "dayOfWeek must be between 0 and 6" });
      }

      if (weekOfMonth !== null && (weekOfMonth < 1 || weekOfMonth > 5)) {
        return res.status(400).json({ message: "weekOfMonth must be between 1 and 5" });
      }

      if (bookingData.frequency === "weekly" && dayOfWeek === null) {
        return res.status(400).json({ message: "Weekly schedules require dayOfWeek" });
      }

      if (bookingData.frequency === "monthly" && weekOfMonth !== null && dayOfWeek === null) {
        return res.status(400).json({ message: "Monthly weekday schedules require dayOfWeek" });
      }

      const recurring = await storage.createRecurringBooking(bookingData);
      res.status(201).json(recurring);
    } catch (error) {
      logError("Error creating recurring booking", error, req.requestId);
      res.status(500).json({ message: "Failed to create recurring booking" });
    }
  });

  app.delete("/api/recurring-bookings/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteRecurringBooking(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      logError("Error deleting recurring booking", error, req.requestId);
      res.status(500).json({ message: "Failed to delete recurring booking" });
    }
  });

  const getDayOfMonth = (date: string | Date) => {
    if (date instanceof Date) return date.getDate();

    const dateOnlyDay = Number(date.split("T")[0]?.split("-")[2]);
    return Number.isFinite(dateOnlyDay) ? dateOnlyDay : new Date(date).getDate();
  };

  const getWeekOfMonth = (date: Date) => Math.ceil(date.getDate() / 7);
  const isRecurringDateMatch = (date: Date, recurring: RecurringBooking) => {
    if (recurring.frequency === "weekly") {
      return recurring.dayOfWeek !== null && recurring.dayOfWeek !== undefined && date.getDay() === recurring.dayOfWeek;
    }

    if (recurring.frequency === "monthly") {
      if (recurring.weekOfMonth && recurring.dayOfWeek !== null && recurring.dayOfWeek !== undefined) {
        return date.getDay() === recurring.dayOfWeek && getWeekOfMonth(date) === recurring.weekOfMonth;
      }

      return date.getDate() === getDayOfMonth(recurring.startDate);
    }

    return false;
  };

  app.post("/api/recurring-bookings/:id/generate", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { targetDate } = req.body; // Generate up to this date

      const recurring = await storage.getRecurringBooking(id);
      if (!recurring || !recurring.isActive) {
        return res.status(404).json({ message: "Recurring schedule not found or inactive" });
      }

      const endCap = targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      if (Number.isNaN(endCap.getTime())) {
        return res.status(400).json({ message: "Invalid target date" });
      }

      const startCursor = recurring.lastGeneratedDate
        ? new Date(new Date(recurring.lastGeneratedDate).getTime() + 24 * 60 * 60 * 1000) // Start from day after last gen
        : new Date(recurring.startDate);

      const generatedBookings = [];
      const cursor = new Date(startCursor);

      while (cursor <= endCap) {
        const shouldBook = isRecurringDateMatch(cursor, recurring);

        if (shouldBook) {
          // Create Booking
          const visitDateStr = cursor.toISOString().split('T')[0];

          // Check if booking already exists for this ref to avoid dupes?
          // We rely on createBooking.

          const bookingData = {
            visitorName: recurring.visitorName,
            visitorEmail: recurring.visitorEmail,
            visitorPhone: recurring.visitorPhone || "",
            groupSize: recurring.groupSize,
            numberOfPeople: recurring.numberOfPeople || 1,
            tourType: recurring.tourType,
            visitDate: visitDateStr,
            visitTime: recurring.startTime, // "HH:mm:ss"
            paymentMethod: "cash",
            status: "confirmed", // Auto-confirm? Or pending?
            adminNotes: `Auto-generated from recurring schedule: ${recurring.organizationName || ''}. ${recurring.notes || ''}`,
            recurringBookingId: recurring.id
          };

          // @ts-ignore
          const newBooking = await storage.createBooking(bookingData);
          generatedBookings.push(newBooking);
        }

        // Next day
        cursor.setDate(cursor.getDate() + 1);
      }

      // Update last generated date
      if (generatedBookings.length > 0) {
        await storage.updateRecurringBooking(id, {
          lastGeneratedDate: endCap.toISOString().split('T')[0]
        });
        await sendRecurringBookingGeneratedEmails(
          recurring,
          generatedBookings,
          req.session?.userId || null
        );
      }

      res.json({ generatedCount: generatedBookings.length, bookings: generatedBookings });
    } catch (error) {
      logError("Error generating bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to generate bookings" });
    }
  });

  // Live Operations Stats
  app.get("/api/live-ops/stats", isAuthenticated, requireRole("admin", "security"), async (req, res) => {
    try {
      const [activeVisits, incidents, guides] = await Promise.all([
        storage.getActiveVisits(),
        storage.getIncidents(),
        storage.getGuides(),
      ]);

      const openIncidents = incidents.filter(
        (i) => i.status === "reported" || i.status === "investigating"
      );

      const visitorsOnSite = activeVisits.reduce(
        (acc, booking) => acc + (booking.numberOfPeople || 1),
        0
      );

      // Create a map for quick guide lookup
      const guideMap = new Map(guides.map(g => [g.id, g]));

      // Simple heuristic for available guides: Active guides who are NOT currently assigned to an active visit
      const busyGuideIds = new Set(
        activeVisits.map((b) => b.assignedGuideId).filter(Boolean)
      );
      const availableGuides = guides.filter(
        (g) => g.isActive && !busyGuideIds.has(g.id)
      );

      // Enhance active bookings with guide name
      const enhancedActiveBookings = activeVisits.map((booking) => {
        const guide = booking.assignedGuideId ? guideMap.get(booking.assignedGuideId) : null;
        return {
          ...booking,
          guideName: guide ? `${guide.firstName} ${guide.lastName}` : null,
        };
      });

      res.json({
        activeTours: activeVisits.length,
        visitorsOnSite,
        openIncidents: openIncidents.length,
        availableGuides: availableGuides.length,
        recentIncidents: openIncidents.slice(0, 5),
        activeBookings: enhancedActiveBookings,
      });
    } catch (error) {
      logError("Error fetching live ops stats", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch live operations stats" });
    }
  });

  // Channel Manager Endpoints

  // Get all external calendars
  app.get("/api/calendars", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const calendars = await storage.getExternalCalendars();
      res.json(calendars);
    } catch (error) {
      logError("Error fetching external calendars", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch calendars" });
    }
  });

  // Create external calendar
  app.post("/api/calendars", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const calendar = await storage.createExternalCalendar(req.body);
      res.status(201).json(calendar);
    } catch (error) {
      logError("Error creating external calendar", error, req.requestId);
      res.status(500).json({ message: "Failed to create calendar" });
    }
  });

  // Delete external calendar
  app.delete("/api/calendars/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteExternalCalendar(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      logError("Error deleting external calendar", error, req.requestId);
      res.status(500).json({ message: "Failed to delete calendar" });
    }
  });

  // Public iCal Feed
  app.get("/api/calendar/feed/:token", async (req, res) => {
    try {
      const token = String(req.params.token || "").trim();
      const calendar = token ? await storage.getExternalCalendarByFeedTokenHash(hashToken(token)) : undefined;
      if (!calendar) {
        return res.status(404).send("Calendar feed not found");
      }

      const bookings = await getBookingsForCalendarFeed(calendar);
      const icalData = generateIcalFeed(bookings, calendar.name || "Visit Dzaleka Bookings", {
        includeSensitiveDetails: calendar.includeSensitiveDetails === true,
      });
      res.set('Content-Type', 'text/calendar; charset=utf-8');
      res.set('Content-Disposition', 'attachment; filename="calendar.ics"');
      res.send(icalData);
    } catch (error) {
      logError("Error generating iCal feed", error, req.requestId);
      res.status(500).send("Error generating feed");
    }
  });

  // Sync External Calendars (Import)
  app.post("/api/calendar/sync", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const calendars = await storage.getExternalCalendars();
      const results = [];

      for (const cal of calendars) {
        try {
          const events = await parseIcalFeed(cal.url, cal.name);
          // Here we would process events: check for duplicates, create 'external' bookings
          // For now, we just return the events found
          results.push({ calendar: cal.name, eventsFound: events.length });

          // Update last synced
          await storage.updateExternalCalendar(cal.id, { lastSyncedAt: new Date() });

        } catch (e: any) {
          results.push({ calendar: cal.name, error: e.message });
        }
      }
      res.json({ message: "Sync complete", results });
    } catch (error) {
      logError("Error syncing calendars", error, req.requestId);
      res.status(500).json({ message: "Failed to sync calendars" });
    }
  });

  // ===== Reviews + Performance Opportunities =====

  app.get("/api/public/reviews", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 6, 24);
      const reviews = await storage.getPublicTourReviews(limit);
      res.json(reviews.filter((review) => review.consentTestimonial === true).map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        visitorName: review.visitorName,
        source: review.source,
        submittedAt: review.submittedAt,
        responseText: review.responseText,
      })));
    } catch (error) {
      logError("Error fetching public reviews", error, req.requestId);
      res.json([]);
    }
  });

  app.get("/api/public/reviews/request", async (req: Request, res: Response) => {
    try {
      const token = String(req.query.token || "").trim();
      if (!token) {
        return res.status(400).json({ message: "Missing review token" });
      }

      const result = await loadBookingForReviewToken(token);
      if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
      }

      const booking = result.booking;
      const review = await storage.getTourReviewByBookingReference(booking.bookingReference);
      const guide = await getAssignedGuide(booking);
      res.json({
        bookingReference: booking.bookingReference,
        visitDate: booking.visitDate,
        visitTime: booking.visitTime,
        status: booking.status,
        guideName: guide ? `${guide.firstName} ${guide.lastName}` : null,
        canReview: booking.status === "completed",
        review: review?.submittedAt ? {
          id: review.id,
          rating: review.rating,
          status: review.status,
          submittedAt: review.submittedAt,
        } : null,
      });
    } catch (error) {
      logError("Error loading review request", error, req.requestId);
      res.status(500).json({ message: "Failed to load review request" });
    }
  });

  app.post("/api/public/reviews/request", async (req: Request, res: Response) => {
    try {
      const payload = publicReviewSchema.parse(req.body);
      const result = await loadBookingForReviewToken(payload.token.trim());
      if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
      }

      const booking = result.booking;
      if (payload.bookingReference !== booking.bookingReference) {
        return res.status(403).json({ message: "Review link does not match this booking." });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Reviews open after the tour is completed." });
      }

      const publicTitle = payload.title || (payload.overallExperience
        ? `${payload.overallExperience} Visit Dzaleka experience`
        : undefined);
      const publicComment = payload.comment || payload.enjoyedMost || payload.otherComments;
      const review = await storage.upsertTourReviewForBooking(booking, {
        rating: payload.rating,
        title: publicTitle || undefined,
        comment: publicComment || undefined,
        tourGuideName: payload.tourGuideName || undefined,
        country: payload.country || undefined,
        purposeOfVisit: payload.purposeOfVisit || undefined,
        groupSize: payload.groupSize || undefined,
        referralSource: payload.referralSource || undefined,
        overallExperience: payload.overallExperience || undefined,
        guideExperience: payload.guideExperience || undefined,
        enjoyedMost: payload.enjoyedMost || undefined,
        improvementSuggestions: payload.improvementSuggestions || undefined,
        wouldRecommend: payload.wouldRecommend || undefined,
        otherComments: payload.otherComments || undefined,
        wouldVisitAgain: payload.wouldVisitAgain || undefined,
        consentPhotos: payload.consentPhotos || false,
        consentTestimonial: payload.consentTestimonial || false,
        consentDataProcessing: payload.consentDataProcessing,
        status: "pending",
        submittedAt: new Date(),
      });

      await storage.updateBookingRating(booking.id, payload.rating);
      if (booking.assignedGuideId) {
        await recalculateGuideRating(booking.assignedGuideId, req.requestId);
      }
      if (payload.country && !booking.visitorCountry) {
        await storage.updateBooking(booking.id, { visitorCountry: payload.country });
      }

      res.status(201).json({
        success: true,
        message: "Thank you for your review. Our team will read it before publishing.",
        review: {
          id: review.id,
          rating: review.rating,
          status: review.status,
          submittedAt: review.submittedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      logError("Error submitting review", error, req.requestId);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.get("/api/reviews-performance", isAuthenticated, requireRole("admin", "coordinator"), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const setupIssues: { key: string; label: string; message: string }[] = [];
      const loadDashboardData = async <T,>(
        key: string,
        label: string,
        fallback: T,
        loader: () => Promise<T>
      ): Promise<T> => {
        try {
          return await loader();
        } catch (error: any) {
          const message = error?.message || "Unavailable";
          setupIssues.push({ key, label, message });
          logError(`Reviews performance data unavailable: ${label}`, error, req.requestId);
          return fallback;
        }
      };

      const [
        bookings,
        reviews,
        emailLogs,
        meetingPoints,
        pointsOfInterest,
        specialOffers,
        contentBlocks,
        emailTemplates,
      ] = await Promise.all([
        loadDashboardData("bookings", "Bookings", [], () => storage.getBookings()),
        loadDashboardData("tour_reviews", "Tour reviews", [], () => storage.getTourReviews()),
        loadDashboardData("email_logs", "Email logs", [], () => storage.getEmailLogs({ archived: "active" })),
        loadDashboardData("meeting_points", "Meeting points", [], () => storage.getMeetingPoints()),
        loadDashboardData("points_of_interest", "Points of interest", [], () => storage.getPointsOfInterest()),
        loadDashboardData("special_offers", "Special offers", [], () => storage.getSpecialOffers()),
        loadDashboardData("content_blocks", "CMS content", [], () => storage.getContentBlocks()),
        loadDashboardData("email_templates", "Email templates", [], () => storage.getEmailTemplates()),
      ]);

      const pageStats = await loadDashboardData("page_views", "Page analytics", null, () => storage.getPageViewStats(last30, now));
      const completedBookings = bookings.filter((booking) => booking.status === "completed");
      const bookingsLast30 = bookings.filter((booking) => dateSortValue(booking.createdAt) >= last30.getTime());
      const reviewByBooking = new Map(reviews.map((review) => [review.bookingReference, review]));
      const submittedReviews = reviews.filter((review) => review.rating != null);
      const publishedReviews = reviews.filter((review) => review.status === "published" && review.rating != null);
      const pendingModeration = reviews.filter((review) => review.status === "pending" && review.rating != null);
      const averageRating = submittedReviews.length
        ? Number((submittedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / submittedReviews.length).toFixed(1))
        : 0;
      const pendingReviewRequests = completedBookings.filter((booking) => !reviewByBooking.get(booking.bookingReference)?.submittedAt);
      const feedbackTemplate = emailTemplates.find((template) => template.name === "feedback_request");
      const failedEmails = emailLogs.filter((log) =>
        log.status === "failed" && dateSortValue(log.createdAt) >= last30.getTime()
      );
      const feedbackEmails = emailLogs.filter((log) =>
        log.templateType === "feedback_request" && dateSortValue(log.createdAt) >= last30.getTime()
      );
      const listingViews = pageStats?.pageBreakdown
        .filter((page) => page.page.includes("/things-to-do/dzaleka-refugee-camp-guided-walking-tour"))
        .reduce((sum, page) => sum + page.views, 0) || 0;
      const conversionRate = pageStats?.uniqueVisitors
        ? Number(((bookingsLast30.length / pageStats.uniqueVisitors) * 100).toFixed(1))
        : 0;
      const publicContent = Object.fromEntries(contentBlocks.map((block) => [block.key, block.value]));
      const activeOffer = specialOffers.some((offer) =>
        offer.isActive !== false &&
        offer.isPublic !== false &&
        new Date(offer.activityEndDate) >= now
      );

      const opportunities = [
        ...(setupIssues.length > 0 ? [{
          id: "setup-diagnostics",
          priority: "high",
          title: "Review dashboard setup needs attention",
          description: "One or more data sources could not be read. The dashboard is still usable, but review collection or opportunity metrics may be incomplete.",
          metric: `${setupIssues.length} issue${setupIssues.length === 1 ? "" : "s"}`,
          actionLabel: "Open diagnostics",
          href: "/reviews-performance",
        }] : []),
        {
          id: "first-reviews",
          priority: publishedReviews.length < 3 ? "high" : publishedReviews.length < 15 ? "medium" : "low",
          title: publishedReviews.length < 3 ? "Get the first 3 published reviews" : "Build toward 15 published reviews",
          description: publishedReviews.length < 3
            ? "The tour page needs early social proof. Start by sending review requests for completed tours."
            : "More recent reviews will make the listing feel safer to book and easier to trust.",
          metric: `${publishedReviews.length} published`,
          actionLabel: "Send review requests",
          href: "/reviews-performance",
        },
        {
          id: "moderation",
          priority: pendingModeration.length > 0 ? "high" : "low",
          title: "Review moderation queue",
          description: pendingModeration.length > 0
            ? "Publish strong verified reviews or hide unsuitable ones so the public listing stays fresh."
            : "No submitted reviews are waiting for moderation.",
          metric: `${pendingModeration.length} pending`,
          actionLabel: "Review queue",
          href: "/reviews-performance",
        },
        {
          id: "feedback-template",
          priority: feedbackTemplate?.isActive === false || !feedbackTemplate ? "high" : "low",
          title: "Feedback request email",
          description: feedbackTemplate?.isActive === false || !feedbackTemplate
            ? "The feedback_request template is missing or disabled. Review requests may not go out cleanly."
            : "Feedback request template is wired and active.",
          metric: feedbackTemplate?.isActive === false || !feedbackTemplate ? "Needs setup" : "Active",
          actionLabel: "Open templates",
          href: "/email-settings",
        },
        {
          id: "failed-emails",
          priority: failedEmails.length > 0 ? "high" : "low",
          title: "Failed email delivery",
          description: failedEmails.length > 0
            ? "Failed emails can block confirmations, reminders, and feedback requests."
            : "No failed emails in the last 30 days.",
          metric: `${failedEmails.length} failed`,
          actionLabel: "Open email history",
          href: "/send-email",
        },
        {
          id: "meeting-point-detail",
          priority: meetingPoints.some((point) => point.isActive !== false && (!point.googleMapsUrl || !point.meetingInstructions)) ? "medium" : "low",
          title: "Meeting point clarity",
          description: "Add map links and clear handoff instructions to reduce arrival confusion and protect reviews.",
          metric: `${meetingPoints.filter((point) => point.isActive !== false && (!point.googleMapsUrl || !point.meetingInstructions)).length} need detail`,
          actionLabel: "Update meeting points",
          href: "/zones?section=meeting",
        },
        {
          id: "listing-content",
          priority: (!publicContent.hero_title || !publicContent.hero_subtitle) ? "medium" : "low",
          title: "Public content freshness",
          description: "Keep the landing page and tour listing specific, current, and human. Avoid generic AI-sounding copy.",
          metric: (!publicContent.hero_title || !publicContent.hero_subtitle) ? "Needs copy" : "CMS ready",
          actionLabel: "Open CMS",
          href: "/cms",
        },
        {
          id: "special-offer",
          priority: activeOffer ? "low" : "medium",
          title: "Limited-time offer",
          description: activeOffer
            ? "A public special offer is active."
            : "Consider a limited offer for slower dates or first-review momentum.",
          metric: activeOffer ? "Active" : "No active offer",
          actionLabel: "Open offers",
          href: "/special-offers",
        },
        {
          id: "poi-completeness",
          priority: pointsOfInterest.some((poi) => poi.isActive !== false && (!poi.visitorDescription || !poi.photoPolicy)) ? "medium" : "low",
          title: "Route stop completeness",
          description: "Visitor descriptions, photo rules, and access notes help staff create stronger itineraries.",
          metric: `${pointsOfInterest.filter((poi) => poi.isActive !== false && (!poi.visitorDescription || !poi.photoPolicy)).length} need detail`,
          actionLabel: "Open POIs",
          href: "/zones?section=poi",
        },
      ].sort((a, b) => {
        const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return rank[a.priority] - rank[b.priority];
      });

      const reviewCandidates = pendingReviewRequests
        .sort((a, b) => dateSortValue(b.visitDate) - dateSortValue(a.visitDate))
        .slice(0, 12)
        .map((booking) => ({
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          visitDate: booking.visitDate,
          guideId: booking.assignedGuideId,
          reviewLink: buildFeedbackLink(booking),
        }));

      res.json({
        stats: {
          listingViews,
          uniqueVisitors: pageStats?.uniqueVisitors || 0,
          bookingRequestsLast30: bookingsLast30.length,
          conversionRate,
          completedTours: completedBookings.length,
          totalReviews: submittedReviews.length,
          publishedReviews: publishedReviews.length,
          pendingModeration: pendingModeration.length,
          averageRating,
          pendingReviewRequests: pendingReviewRequests.length,
          feedbackEmailsLast30: feedbackEmails.length,
        failedEmailsLast30: failedEmails.length,
        },
        opportunities,
        reviews,
        reviewCandidates,
        setupIssues,
      });
    } catch (error) {
      logError("Error building reviews performance dashboard", error, req.requestId);
      res.status(500).json({ message: "Failed to build reviews performance dashboard" });
    }
  });

  app.post("/api/reviews/request/:bookingId", isAuthenticated, requireRole("admin", "coordinator"), async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Review requests are meant for completed tours." });
      }

      const review = await storage.upsertTourReviewForBooking(booking, {
        requestedAt: new Date(),
      });
      const emailResult = await sendFeedbackRequestEmail(booking, req.session?.userId || null);

      res.json({
        success: emailResult.success,
        review,
        reviewLink: buildFeedbackLink(booking),
        emailError: emailResult.error,
      });
    } catch (error) {
      logError("Error sending review request", error, req.requestId);
      res.status(500).json({ message: "Failed to send review request" });
    }
  });

  app.get("/api/reviews/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req: Request, res: Response) => {
    try {
      const review = await storage.getTourReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      logError("Error fetching review", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.patch("/api/reviews/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req: Request, res: Response) => {
    try {
      const payload = reviewModerationSchema.parse(req.body);
      const existing = await storage.getTourReview(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Review not found" });
      }
      const nextStatus = payload.status || existing.status;
      if (nextStatus === "published" && !existing.consentTestimonial) {
        return res.status(400).json({
          message: "This visitor did not consent to featuring their feedback as a public testimonial.",
        });
      }
      const review = await storage.updateTourReview(req.params.id, {
        ...payload,
        status: nextStatus,
        responseBy: payload.responseText ? req.session?.userId || undefined : existing.responseBy || undefined,
        respondedAt: payload.responseText ? new Date() : existing.respondedAt || undefined,
        publishedAt: nextStatus === "published" && !existing.publishedAt ? new Date() : existing.publishedAt || undefined,
      });
      if (review && review.guideId) {
        await recalculateGuideRating(review.guideId, req.requestId);
      }
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review update", errors: error.errors });
      }
      logError("Error updating review", error, req.requestId);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // ===== Page View Analytics =====

  const pageviewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: { message: "Too many pageview requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown"),
  });

  // Track a page view (public endpoint - no auth required)
  app.post("/api/analytics/pageview", pageviewLimiter, async (req: Request, res: Response) => {
    try {
      const { page, referrer, userAgent, sessionId } = req.body;

      if (!page || !sessionId) {
        return res.status(400).json({ message: "page and sessionId are required" });
      }

      // Detect device type from user agent
      let deviceType = "desktop";
      if (userAgent) {
        const ua = userAgent.toLowerCase();
        if (/mobile|iphone|android.*mobile|windows phone/.test(ua)) {
          deviceType = "mobile";
        } else if (/tablet|ipad|android(?!.*mobile)/.test(ua)) {
          deviceType = "tablet";
        }
      }

      // Get user ID if authenticated
      const userId = req.session?.userId || undefined;

      await storage.createPageView({
        sessionId,
        page,
        referrer: referrer || undefined,
        userAgent: userAgent || undefined,
        deviceType,
        userId,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      logError("Error recording page view", error, req.requestId);
      res.status(500).json({ message: "Failed to record page view" });
    }
  });

  // Get live visitor count (public or admin? assuming public/semi-public for dashboard)
  app.get("/api/analytics/live", async (req: Request, res: Response) => {
    try {
      // Default to 5 minutes window
      const minutes = 5;
      const count = await storage.getLiveVisitors(minutes);
      res.json({ count });
    } catch (error) {
      logError("Error getting live visitors", error, req.requestId);
      res.status(500).json({ message: "Failed to get live visitors" });
    }
  });

  // Get page view statistics (admin only)
  app.get("/api/analytics/pageviews", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await storage.getPageViewStats(start, end);
      res.json(stats);
    } catch (error) {
      logError("Error getting page view stats", error, req.requestId);
      res.status(500).json({ message: "Failed to get page view statistics" });
    }
  });

  // Get conversion rate statistics (admin only)
  app.get("/api/analytics/conversion", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await storage.getConversionStats(start, end);
      res.json(stats);
    } catch (error) {
      logError("Error getting conversion stats", error, req.requestId);
      res.status(500).json({ message: "Failed to get conversion statistics" });
    }
  });

  // Get booking KPIs (admin only)
  app.get("/api/analytics/booking-kpis", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get all bookings using storage layer
      const allBookings = await storage.getBookings();
      const bookingsInRange = allBookings.filter(b => {
        const created = new Date(b.createdAt!);
        return created >= start && created <= end;
      });

      // 1. Total Booking Volume
      const totalBookings = bookingsInRange.length;
      const confirmedBookings = bookingsInRange.filter(b => b.status === "confirmed" || b.status === "completed" || b.status === "in_progress").length;

      // 2. Revenue by Channel/Source
      const revenueByChannel: Record<string, { count: number; revenue: number }> = {};
      bookingsInRange.forEach(b => {
        const source = b.source || "direct";
        if (!revenueByChannel[source]) {
          revenueByChannel[source] = { count: 0, revenue: 0 };
        }
        revenueByChannel[source].count++;
        revenueByChannel[source].revenue += b.totalAmount || 0;
      });

      // 3. Average Ticket Price
      const paidBookings = bookingsInRange.filter(b => b.totalAmount && b.totalAmount > 0);
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const averageTicketPrice = paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0;

      // 4. Lead Time (days between booking and visit)
      const leadTimes = bookingsInRange
        .filter(b => b.createdAt && b.visitDate)
        .map(b => {
          const created = new Date(b.createdAt!);
          const visit = new Date(b.visitDate);
          return Math.ceil((visit.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter(days => days >= 0);
      const averageLeadTime = leadTimes.length > 0 ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;

      // 5. No-Show Rate
      const noShowCount = bookingsInRange.filter(b => b.status === "no_show").length;
      const confirmedOrNoShow = bookingsInRange.filter(b =>
        b.status === "confirmed" || b.status === "completed" || b.status === "no_show" || b.status === "in_progress"
      ).length;
      const noShowRate = confirmedOrNoShow > 0 ? Math.round((noShowCount / confirmedOrNoShow) * 100) : 0;

      // 6. Repeat Booking Rate
      const emailCounts: Record<string, number> = {};
      allBookings.forEach(b => {
        const email = normalizedEmail(b.visitorEmail);
        if (!email) return;
        emailCounts[email] = (emailCounts[email] || 0) + 1;
      });
      const repeatVisitors = Object.values(emailCounts).filter(count => count > 1).length;
      const uniqueVisitors = Object.keys(emailCounts).length;
      const repeatBookingRate = uniqueVisitors > 0 ? Math.round((repeatVisitors / uniqueVisitors) * 100) : 0;

      // 7. Booking trends (daily for the period)
      const dailyTrends: Record<string, { date: string; bookings: number; revenue: number }> = {};
      bookingsInRange.forEach(b => {
        const dateKey = new Date(b.createdAt!).toISOString().split('T')[0];
        if (!dailyTrends[dateKey]) {
          dailyTrends[dateKey] = { date: dateKey, bookings: 0, revenue: 0 };
        }
        dailyTrends[dateKey].bookings++;
        dailyTrends[dateKey].revenue += b.totalAmount || 0;
      });

      // 8. Status breakdown
      const statusBreakdown: Record<string, number> = {};
      bookingsInRange.forEach(b => {
        const status = b.status || "pending";
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      // 9. Tour type breakdown
      const tourTypeBreakdown: Record<string, { count: number; revenue: number }> = {};
      bookingsInRange.forEach(b => {
        const tourType = b.tourType || "standard";
        if (!tourTypeBreakdown[tourType]) {
          tourTypeBreakdown[tourType] = { count: 0, revenue: 0 };
        }
        tourTypeBreakdown[tourType].count++;
        tourTypeBreakdown[tourType].revenue += b.totalAmount || 0;
      });

      res.json({
        period: { start: start.toISOString(), end: end.toISOString() },
        summary: {
          totalBookings,
          confirmedBookings,
          totalRevenue,
          averageTicketPrice,
          averageLeadTime,
          noShowRate,
          noShowCount,
          repeatBookingRate,
          uniqueVisitors,
          repeatVisitors,
        },
        revenueByChannel: Object.entries(revenueByChannel).map(([channel, data]) => ({
          channel,
          ...data,
        })),
        statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({
          status,
          count,
        })),
        tourTypeBreakdown: Object.entries(tourTypeBreakdown).map(([tourType, data]) => ({
          tourType,
          ...data,
        })),
        dailyTrends: Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date)),
      });
    } catch (error) {
      logError("Error getting booking KPIs", error, req.requestId);
      res.status(500).json({ message: "Failed to get booking KPIs" });
    }
  });

  // ========== Developer Settings: API Keys ==========

  // List API keys for current user
  app.get("/api/developer/api-keys", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const keys = await storage.getApiKeysByUser(userId);
      // Don't return the hash, just the prefix for identification
      const safeKeys = keys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes,
        status: k.status,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        requestCount: k.requestCount,
        createdAt: k.createdAt,
      }));
      res.json(safeKeys);
    } catch (error) {
      logError("Error listing API keys", error, req.requestId);
      res.status(500).json({ message: "Failed to list API keys" });
    }
  });

  // Create a new API key
  app.post("/api/developer/api-keys", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { name, scopes, expiresAt } = req.body;

      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "API key name is required" });
      }

      // Generate a unique random API key: dvz_<32 random hex chars>
      let rawKey = "";
      let keyPrefix = "";
      let isUnique = false;

      for (let attempt = 0; attempt < 10; attempt++) {
        rawKey = `dvz_${crypto.randomBytes(24).toString('hex')}`;
        keyPrefix = rawKey.substring(0, 12); // dvz_xxxxxxxx for display
        const existingKey = await storage.getApiKeyByPrefix(keyPrefix);
        if (!existingKey) {
          isUnique = true;
          break;
        }
      }

      if (!isUnique) {
        return res.status(500).json({ message: "Failed to generate a unique API key prefix after multiple attempts" });
      }

      const keyHash = await hashPassword(rawKey);

      const apiKey = await storage.createApiKey({
        userId,
        name,
        keyHash,
        keyPrefix,
        scopes: scopes || [],
        status: "active",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      await createAuditLog(userId, "create", "api_key", apiKey.id, null, { name, scopes }, req);

      // Return the full key ONLY on creation (never stored in plain text)
      res.json({
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Only shown once!
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        message: "Store this key securely. It won't be shown again."
      });
    } catch (error) {
      logError("Error creating API key", error, req.requestId);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  // Revoke an API key
  app.delete("/api/developer/api-keys/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;

      // Verify ownership
      const keys = await storage.getApiKeysByUser(userId);
      const keyToRevoke = keys.find(k => k.id === id);

      if (!keyToRevoke) {
        return res.status(404).json({ message: "API key not found" });
      }

      const revokedKey = await storage.revokeApiKey(id);

      await createAuditLog(userId, "delete", "api_key", id, { status: keyToRevoke.status }, { status: "revoked" }, req);

      res.json({ message: "API key revoked successfully", key: revokedKey });
    } catch (error) {
      logError("Error revoking API key", error, req.requestId);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });

  // =============================================================
  // Community Hub - Proxy endpoints for Dzaleka Online Services API
  // =============================================================

  const DZALEKA_API_BASE = "https://services.dzaleka.com/api";

  // Helper to fetch from external API with caching headers
  async function fetchDzalekaApi(endpoint: string, res: Response) {
    try {
      const response = await fetch(`${DZALEKA_API_BASE}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      const data = await response.json();

      // Set caching headers (5 min TTL)
      res.set("Cache-Control", "public, max-age=300");
      res.set("X-Cache-Source", "dzaleka-services");
      return data;
    } catch (error) {
      throw error;
    }
  }

  app.get("/api/getyourguide/self-test-readiness", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const productId = process.env.GETYOURGUIDE_EXTERNAL_PRODUCT_ID
        || process.env.GETYOURGUIDE_PRODUCT_ID
        || "dzaleka-refugee-camp-guided-walking-tour";
      const activityId = process.env.GETYOURGUIDE_ACTIVITY_ID || "1188868";
      const today = getGygLocalDate();
      const fromDate = addDaysToDateString(today, 7);
      const toDate = addDaysToDateString(today, 21);
      const unavailableDate = addDaysToDateString(today, 28);
      const selfTestProductIds = getGygSelfTestProductIds();
      const availabilityPushProductId = getGygAvailabilityPushProductId();

      const individualPrice = await calculateTotalAmount("individual", "standard");
      const groupPrice = await calculateTotalAmount("large_group", "standard");

      res.json({
        productId,
        activityId,
        listingUrl: "https://www.getyourguide.com/mbalame-l265219/dzaleka-refugee-camp-guided-walking-tour-t1188868/",
        publicBaseUrl: PUBLIC_APP_URL,
        webhookEndpoint: `${PUBLIC_APP_URL}/api/webhooks/getyourguide`,
        productTimezone: GYG_PRODUCT_TIMEZONE,
        testingConfigurationBaseUrl: PUBLIC_APP_URL,
        supplierApiBaseUrl: `${PUBLIC_APP_URL}/1`,
        supplierId: GYG_SUPPLIER_ID,
        credentialsConfigured: Boolean(
          (process.env.GETYOURGUIDE_SUPPLIER_API_USERNAME || process.env.GETYOURGUIDE_API_USERNAME)
          && (process.env.GETYOURGUIDE_SUPPLIER_API_PASSWORD || process.env.GETYOURGUIDE_API_PASSWORD)
        ),
        availabilityPushProductId: availabilityPushProductId || null,
        outboundCredentialsConfigured: Boolean(
          process.env.GETYOURGUIDE_API_USERNAME && process.env.GETYOURGUIDE_API_PASSWORD
        ),
        availabilityPushConfigured: Boolean(availabilityPushProductId),
        selfTestProductIds,
        recommendedSelfTests: [
          {
            key: "time_point_individual",
            label: "Time point for Individuals",
            productId: selfTestProductIds.timePointIndividual,
            byCategoryProductId: selfTestProductIds.timePointIndividualByCategory,
            status: "Ready to configure",
            timeAvailable: "At fixed starting times (Time point)",
            priceSetup: "Price per individual",
            sampleTimes: ["09:00", "14:00"],
            samplePrice: individualPrice,
            currency: GYG_CURRENCY,
          },
          {
            key: "time_point_group",
            label: "Time point for Groups",
            productId: selfTestProductIds.timePointGroup,
            status: "Ready to configure",
            timeAvailable: "At fixed starting times (Time point)",
            priceSetup: "Price per group",
            sampleTimes: ["09:00", "14:00"],
            samplePrice: groupPrice,
            currency: GYG_CURRENCY,
          },
          {
            key: "time_period_individual",
            label: "Time period for Individuals",
            productId: selfTestProductIds.timePeriodIndividual,
            byCategoryProductId: selfTestProductIds.timePeriodIndividualByCategory,
            status: "Ready to configure",
            timeAvailable: "During operation hours (Time period)",
            priceSetup: "Price per individual",
            sampleTimes: ["09:00-17:00"],
            samplePrice: individualPrice,
            currency: GYG_CURRENCY,
          },
          {
            key: "time_period_group",
            label: "Time period for Groups",
            productId: selfTestProductIds.timePeriodGroup,
            status: "Ready to configure",
            timeAvailable: "During operation hours (Time period)",
            priceSetup: "Price per group",
            sampleTimes: ["09:00-17:00"],
            samplePrice: groupPrice,
            currency: GYG_CURRENCY,
          },
        ],
        suggestedAvailabilityWindow: {
          from: fromDate,
          to: toDate,
          note: "Use a range that contains at least two available starting times so GetYourGuide can test booking changes.",
        },
        suggestedUnavailableWindow: {
          from: unavailableDate,
          to: unavailableDate,
          note: "Use a future blocked date after the available range.",
        },
        portalRules: [
          "On the Testing Configuration page, if the field asks for the system/base URL, enter https://visit.dzaleka.com without /1.",
          "The Supplier API endpoint paths already include /1, for example /1/get-availabilities/.",
          "Use fixed time slots for the current guided walking tour setup. Operation-hours testing should stay planned unless the product is changed to arrival-anytime availability.",
          "GetYourGuide does not mix fixed time slots and operation-hours availability in the same option.",
          "GetYourGuide does not mix price per individual and price per group in the same option. Create separate options if both are offered.",
          "If the portal test is set to Availability By Ticket Category, use an individual product ID that ends in -by-category.",
          "Use the activity meeting-point timezone in both systems: Africa/Blantyre.",
          "The public listing id 1188868 is not necessarily the same id GetYourGuide accepts for outbound availability notifications.",
          "Availability push requires GETYOURGUIDE_AVAILABILITY_PRODUCT_ID after GetYourGuide maps and activates the connected product.",
        ],
        mandatoryEndpoints: [
          {
            name: "Availability Query",
            status: "Wired",
            detail: "GET /1/get-availabilities/ returns vacancies and Price over API fields for time-point and time-period products.",
          },
          {
            name: "Reserve",
            status: "Wired",
            detail: "POST /1/reserve/ holds availability for 60 minutes and returns reservationExpiration.",
          },
          {
            name: "Cancel Reserve",
            status: "Wired",
            detail: "POST /1/cancel-reservation/ releases a held reservation.",
          },
          {
            name: "Book",
            status: "Wired",
            detail: "POST /1/book/ confirms a reservation, creates a GetYourGuide booking, and returns QR-code tickets.",
          },
          {
            name: "Cancel Booking",
            status: "Wired",
            detail: "POST /1/cancel-booking/ cancels eligible future bookings and releases capacity.",
          },
          {
            name: "Booking Modification",
            status: "Wired",
            detail: "Supported through GetYourGuide's documented change flow: reserve/book the amended details, then cancel the old supplier booking reference.",
          },
          {
            name: "Notify Availability",
            status: "Admin push wired",
            detail: "The admin sync action can push availability updates, but this is separate from the mandatory self-test flow.",
          },
        ],
      });
    } catch (error: any) {
      logError("Failed to build GetYourGuide self-test readiness", error, req.requestId);
      res.status(500).json({ message: "Failed to build GetYourGuide self-test readiness" });
    }
  });

  // Sync availability to GetYourGuide
  app.post("/api/getyourguide/sync-availability", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { notifyAvailabilityBatch } = await import("./lib/getyourguide");
      const requestedProductId = String(req.body?.productId || getGygAvailabilityPushProductId()).trim();
      if (!requestedProductId) {
        return res.status(400).json({
          message: "GetYourGuide availability push product is not configured",
          detail: "The public listing id 1188868 is valid for the live listing and self-test, but the outbound notify endpoint needs the connected product id GetYourGuide maps as active. Set GETYOURGUIDE_AVAILABILITY_PRODUCT_ID after GetYourGuide provides or confirms it.",
        });
      }

      if (isLikelyPublicGygActivityId(requestedProductId) && !process.env.GETYOURGUIDE_ALLOW_PUBLIC_ID_AVAILABILITY_PUSH) {
        return res.status(400).json({
          message: "GetYourGuide availability push is using a public listing ID",
          detail: `${requestedProductId} looks like the public GetYourGuide activity id. The notify-availability endpoint rejected that id. Set GETYOURGUIDE_AVAILABILITY_PRODUCT_ID to the mapped connected product id, or set GETYOURGUIDE_ALLOW_PUBLIC_ID_AVAILABILITY_PUSH=true only if GetYourGuide confirms this exact id is active for API notifications.`,
        });
      }

      const product = resolveGygProduct(requestedProductId);
      if (!product) {
        return res.status(400).json({
          message: "Invalid GetYourGuide product ID",
          detail: "Use the connected product ID configured in the GetYourGuide portal for availability notifications.",
        });
      }

      if (!process.env.GETYOURGUIDE_API_USERNAME || !process.env.GETYOURGUIDE_API_PASSWORD) {
        return res.status(400).json({
          message: "GetYourGuide outbound API credentials are not configured",
          detail: "Set GETYOURGUIDE_API_USERNAME and GETYOURGUIDE_API_PASSWORD before pushing availability updates to GetYourGuide.",
        });
      }

      const requestedDays = Number(req.body?.days || 30);
      const days = Number.isFinite(requestedDays) ? Math.min(60, Math.max(1, requestedDays)) : 30;
      const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body?.fromDate || ""))
        ? String(req.body.fromDate)
        : getGygLocalDate();
      const useSandbox = typeof req.body?.useSandbox === "boolean"
        ? req.body.useSandbox
        : process.env.GETYOURGUIDE_SYNC_USE_SANDBOX === "true";

      const availabilities: Record<string, unknown>[] = [];
      for (let day = 0; day < days; day += 1) {
        const visitDate = addDaysToDateString(startDate, day);
        if (product.timeMode === "time_period") {
          availabilities.push(await buildGygAvailability(product, visitDate, "09:00"));
        } else {
          for (const visitTime of GYG_DEFAULT_START_TIMES) {
            availabilities.push(await buildGygAvailability(product, visitDate, visitTime));
          }
        }
      }

      const result = await notifyAvailabilityBatch(product.productId, availabilities as any, useSandbox);
      logger.info("GetYourGuide availability sync completed", {
        productId: product.productId,
        availabilityCount: availabilities.length,
        useSandbox,
      });

      res.json({
        success: true,
        message: "Availability synced successfully",
        productId: product.productId,
        availabilityCount: availabilities.length,
        useSandbox,
        response: result.response,
      });
    } catch (error: any) {
      logError("Failed to sync GetYourGuide availability", error, req.requestId);
      res.status(502).json({
        message: "Failed to sync GetYourGuide availability",
        detail: error.message,
      });
    }
  });

  // GET /api/community/services - Fetch service organizations
  app.get("/api/community/services", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/services", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community services", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch services from Dzaleka Online" });
    }
  });

  // GET /api/community/events - Fetch events
  app.get("/api/community/events", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/events", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community events", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch events from Dzaleka Online" });
    }
  });

  // GET /api/community/resources - Fetch resources/documents
  app.get("/api/community/resources", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/resources", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community resources", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch resources from Dzaleka Online" });
    }
  });

  // GET /api/community/news - Fetch news articles
  app.get("/api/community/news", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/news", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community news", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch news from Dzaleka Online" });
    }
  });

  // GET /api/community/photos - Fetch photo gallery
  app.get("/api/community/photos", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/photos", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community photos", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch photos from Dzaleka Online" });
    }
  });

  // GET /api/community/jobs - Fetch job listings
  app.get("/api/community/jobs", async (req, res) => {
    try {
      const data = await fetchDzalekaApi("/jobs", res);
      res.json(data);
    } catch (error) {
      logError("Error fetching community jobs", error, req.requestId);
      res.status(502).json({ message: "Failed to fetch jobs from Dzaleka Online" });
    }
  });

  // GET /api/community/search - Search across collections
  app.get("/api/community/search", async (req, res) => {
    try {
      const { q, collections, limit } = req.query;
      const params = new URLSearchParams();
      if (q) params.set("q", q as string);
      if (collections) params.set("collections", collections as string);
      if (limit) params.set("limit", limit as string);

      const data = await fetchDzalekaApi(`/search?${params.toString()}`, res);
      res.json(data);
    } catch (error) {
      logError("Error searching community", error, req.requestId);
      res.status(502).json({ message: "Failed to search Dzaleka Online" });
    }
  });



  // ===== Analytics Settings Routes =====

  // Public tracking IDs are safe to expose; the admin settings endpoint stays protected.
  app.get("/api/settings/analytics/public", async (req, res) => {
    try {
      const settings = await storage.getAnalyticsSettings();
      res.json({
        facebookPixelId: settings?.facebookPixelId ?? null,
        ga4MeasurementId: settings?.ga4MeasurementId ?? null,
        googleAdsConversionId: settings?.googleAdsConversionId ?? null,
        isEnabled: settings?.isEnabled ?? false,
      });
    } catch (error) {
      logError("Failed to fetch public analytics settings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Get analytics settings
  app.get("/api/settings/analytics", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const settings = await storage.getAnalyticsSettings();
      // If no settings exist yet, return a default object or null
      res.json(settings || {});
    } catch (error) {
      logError("Failed to fetch analytics settings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update analytics settings
  app.patch("/api/settings/analytics", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const data = insertAnalyticsSettingsSchema.parse(req.body);
      const updated = await storage.updateAnalyticsSettings(data);

      await createAuditLog(
        req.session!.userId!,
        "update",
        "analytics_settings",
        updated.id,
        null,
        data,
        req
      );

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        logError("Failed to update analytics settings", error, req.requestId);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });


  // Blog Routes

  // Get all blog posts (public or admin)
  app.get("/api/blog", async (req, res) => {
    try {
      // If admin, show all (including drafts), otherwise only published
      // For now we trust the client logic or query param, but ideally we check role
      // But since we want public access to published posts, we check query param
      // and maybe enforce strictness if needed.
      // Actually, storage method supports publishedOnly flag.
      // If user is NOT admin, we force publishedOnly = true.

      const session = req.session;
      let isAdmin = false;
      if (session && session.userId) {
        const user = await storage.getUser(session.userId);
        if (user && (user.role === "admin" || user.role === "coordinator")) {
          isAdmin = true;
        }
      }

      const publishedOnly = !isAdmin;
      const posts = await storage.getBlogPosts(publishedOnly);
      res.json(posts);
    } catch (error) {
      logError("Failed to fetch blog posts", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get single blog post by slug (public)
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // If not published and user is not admin, deny
      if (!post.published) {
        const session = req.session;
        let isAdmin = false;
        if (session && session.userId) {
          const user = await storage.getUser(session.userId);
          if (user && (user.role === "admin" || user.role === "coordinator")) {
            isAdmin = true;
          }
        }
        if (!isAdmin) {
          return res.status(404).json({ message: "Blog post not found" });
        }
      }

      res.json(post);
    } catch (error) {
      logError("Failed to fetch blog post", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Get single blog post by ID (admin only - for editing)
  app.get("/api/blog/id/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      logError("Failed to fetch blog post by ID", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Create blog post (admin only)
  app.post("/api/blog", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost({
        ...data,
        authorId: req.session!.userId!,
        publishedAt: data.published ? new Date() : null,
      });
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      } else {
        logError("Failed to create blog post", error, req.requestId);
        res.status(500).json({ message: "Failed to create blog post" });
      }
    }
  });

  // Update blog post (admin only)
  app.patch("/api/blog/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      // Partial update
      const data = insertBlogPostSchema.partial().parse(req.body);

      // Handle publishedAt logic if published status changes
      if (data.published === true) {
        // If becoming published and no date set, set it
        // We might need to check current state if we want to preserve original publish date
        // For simplicity, we update publishedAt if explicitly sent or if switching to published
        if (!data.publishedAt) {
          // We'll let the frontend decide or handle it here?
          // Let's check existing post
          const existing = await storage.getBlogPost(req.params.id);
          if (existing && !existing.published) {
            (data as any).publishedAt = new Date();
          }
        }
      } else if (data.published === false) {
        (data as any).publishedAt = null;
      }

      const updated = await storage.updateBlogPost(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid blog post data", errors: error.errors });
      } else {
        logError("Failed to update blog post", error, req.requestId);
        res.status(500).json({ message: "Failed to update blog post" });
      }
    }
  });

  // Delete blog post (admin only)
  app.delete("/api/blog/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Failed to delete blog post", error, req.requestId);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // ==================== Scheduled Reports ====================

  app.get("/api/scheduled-reports", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const reports = await storage.getScheduledReports();
      res.json(reports);
    } catch (error) {
      logError("Failed to fetch scheduled reports", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch scheduled reports" });
    }
  });

  app.post("/api/scheduled-reports", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const payload = scheduledReportPayloadSchema.parse(req.body);
      const report = await storage.createScheduledReport({
        ...payload,
        createdByUserId: req.session!.userId!,
      });
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scheduled report", errors: error.errors });
      }
      logError("Failed to create scheduled report", error, req.requestId);
      res.status(500).json({ message: "Failed to create scheduled report" });
    }
  });

  app.patch("/api/scheduled-reports/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const payload = scheduledReportPayloadSchema.partial().parse(req.body);
      const report = await storage.updateScheduledReport(req.params.id, payload);
      if (!report) {
        return res.status(404).json({ message: "Scheduled report not found" });
      }
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scheduled report update", errors: error.errors });
      }
      logError("Failed to update scheduled report", error, req.requestId);
      res.status(500).json({ message: "Failed to update scheduled report" });
    }
  });

  app.delete("/api/scheduled-reports/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteScheduledReport(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Failed to delete scheduled report", error, req.requestId);
      res.status(500).json({ message: "Failed to delete scheduled report" });
    }
  });

  app.post("/api/scheduled-reports/:id/run", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const report = await storage.getScheduledReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Scheduled report not found" });
      }

      await ReportScheduler.executeReport(report, { advanceSchedule: false });

      res.json({ message: "Report sent successfully" });
    } catch (error) {
      logError("Failed to run scheduled report", error, req.requestId);
      res.status(500).json({ message: "Failed to run scheduled report" });
    }
  });

  // ==================== Webhooks ====================

  app.get("/api/webhooks", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const endpoints = await storage.getWebhookEndpoints();
      res.json(endpoints);
    } catch (error) {
      logError("Failed to fetch webhook endpoints", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch webhook endpoints" });
    }
  });

  app.post("/api/webhooks", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      if (!(await requireOperationApproval(req, res, "webhook_changes", "Webhook changes"))) {
        return;
      }
      const payload = webhookEndpointPayloadSchema.parse(req.body);
      const isSafe = await isSafeDestination(payload.url);
      if (!isSafe) {
        return res.status(400).json({ message: "Invalid webhook URL: Must use HTTPS and resolve to a public IP address." });
      }
      const endpoint = await storage.createWebhookEndpoint(payload);
      await createAuditLog(req.session.userId!, "create", "webhook_endpoint", endpoint.id, null, redactWebhookSecret(endpoint), req);
      res.status(201).json(endpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid webhook endpoint", errors: error.errors });
      }
      logError("Failed to create webhook endpoint", error, req.requestId);
      res.status(500).json({ message: "Failed to create webhook endpoint" });
    }
  });

  app.patch("/api/webhooks/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      if (!(await requireOperationApproval(req, res, "webhook_changes", "Webhook changes"))) {
        return;
      }
      const existingEndpoint = await storage.getWebhookEndpoint(req.params.id);
      if (!existingEndpoint) {
        return res.status(404).json({ message: "Webhook endpoint not found" });
      }
      const payload = webhookEndpointPayloadSchema.partial().parse(req.body);
      if (payload.url) {
        const isSafe = await isSafeDestination(payload.url);
        if (!isSafe) {
          return res.status(400).json({ message: "Invalid webhook URL: Must use HTTPS and resolve to a public IP address." });
        }
      }
      const endpoint = await storage.updateWebhookEndpoint(req.params.id, payload);
      if (!endpoint) {
        return res.status(404).json({ message: "Webhook endpoint not found" });
      }
      await createAuditLog(
        req.session.userId!,
        "update",
        "webhook_endpoint",
        endpoint.id,
        redactWebhookSecret(existingEndpoint),
        redactWebhookSecret(endpoint),
        req,
      );
      res.json(endpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid webhook endpoint update", errors: error.errors });
      }
      logError("Failed to update webhook endpoint", error, req.requestId);
      res.status(500).json({ message: "Failed to update webhook endpoint" });
    }
  });

  app.delete("/api/webhooks/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      if (!(await requireOperationApproval(req, res, "webhook_changes", "Webhook changes"))) {
        return;
      }
      const existingEndpoint = await storage.getWebhookEndpoint(req.params.id);
      if (!existingEndpoint) {
        return res.status(404).json({ message: "Webhook endpoint not found" });
      }
      await storage.deleteWebhookEndpoint(req.params.id);
      await createAuditLog(req.session.userId!, "delete", "webhook_endpoint", req.params.id, redactWebhookSecret(existingEndpoint), null, req);
      res.status(204).send();
    } catch (error) {
      logError("Failed to delete webhook endpoint", error, req.requestId);
      res.status(500).json({ message: "Failed to delete webhook endpoint" });
    }
  });

  app.get("/api/webhooks/deliveries", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const endpointId = req.query.endpointId as string | undefined;
      const deliveries = await storage.getWebhookDeliveries(endpointId);
      res.json(deliveries);
    } catch (error) {
      logError("Failed to fetch webhook deliveries", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch webhook deliveries" });
    }
  });

  app.post("/api/webhooks/deliveries/:id/retry", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const result = await WebhookDispatcher.retryDelivery(req.params.id);
      res.json(result);
    } catch (error) {
      logError("Failed to retry webhook delivery", error, req.requestId);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to retry webhook delivery" });
    }
  });

  // Trigger processing of any outstanding webhooks in database from previous runs
  WebhookDispatcher.triggerProcessor();

  return httpServer;
}
