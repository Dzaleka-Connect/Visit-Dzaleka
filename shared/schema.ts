import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const groupSizeEnum = pgEnum("group_size", [
  "individual",
  "small_group",
  "large_group",
  "custom",
]);

export const tourTypeEnum = pgEnum("tour_type", [
  "standard",
  "extended",
  "custom",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "airtel_money",
  "tnm_mpamba",
  "cash",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "coordinator",
  "guide",
  "security",
  "visitor",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "reported",
  "investigating",
  "resolved",
  "closed",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "check_in",
  "check_out",
  "verify",
]);

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table with email/password authentication (multi-role support)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  role: userRoleEnum("role").default("visitor"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  emailNotifications: boolean("email_notifications").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guides table with rating and performance tracking
export const guides = pgTable("guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  languages: text("languages").array().default(sql`ARRAY[]::text[]`),
  specialties: text("specialties").array().default(sql`ARRAY[]::text[]`),
  assignedZones: text("assigned_zones").array().default(sql`ARRAY[]::text[]`),
  // Availability fields
  availableDays: text("available_days").array().default(sql`ARRAY[]::text[]`), // ['monday', 'tuesday', etc.]
  preferredTimes: text("preferred_times").array().default(sql`ARRAY[]::text[]`), // ['morning', 'afternoon', 'evening']
  // Emergency contact
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  // Payment preferences
  preferredPaymentMethod: varchar("preferred_payment_method").default("cash"), // 'cash', 'airtel_money', 'tnm_mpamba'
  // Additional notes
  additionalNotes: text("additional_notes"),
  // Stats
  isActive: boolean("is_active").default(true),
  totalTours: integer("total_tours").default(0),
  completedTours: integer("completed_tours").default(0),
  totalEarnings: integer("total_earnings").default(0),
  rating: integer("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Camp Zones table
export const zones = pgTable("zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  isActive: boolean("is_active").default(true),
  totalVisits: integer("total_visits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Points of Interest table
export const pointsOfInterest = pgTable("points_of_interest", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zoneId: varchar("zone_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meeting Points table
export const meetingPoints = pgTable("meeting_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing Configuration table
export const pricingConfig = pgTable("pricing_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  groupSize: groupSizeEnum("group_size").notNull(),
  minPeople: integer("min_people").default(1),
  maxPeople: integer("max_people"),
  basePrice: integer("base_price").notNull(),
  additionalHourPrice: integer("additional_hour_price").default(10000),
  currency: varchar("currency").default("MWK"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingReference: varchar("booking_reference").unique(),
  visitorName: varchar("visitor_name").notNull(),
  visitorEmail: varchar("visitor_email").notNull(),
  visitorPhone: varchar("visitor_phone").notNull(),
  visitorUserId: varchar("visitor_user_id"),
  visitDate: date("visit_date").notNull(),
  visitTime: time("visit_time").notNull(),
  groupSize: groupSizeEnum("group_size").notNull(),
  numberOfPeople: integer("number_of_people").default(1),
  tourType: tourTypeEnum("tour_type").notNull(),
  customDuration: integer("custom_duration"),
  meetingPointId: varchar("meeting_point_id"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentReference: varchar("payment_reference"),
  paymentVerifiedBy: varchar("payment_verified_by"),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  status: bookingStatusEnum("status").default("pending"),
  selectedZones: text("selected_zones").array().default(sql`ARRAY[]::text[]`),
  selectedInterests: text("selected_interests").array().default(sql`ARRAY[]::text[]`),
  specialRequests: text("special_requests"),
  accessibilityNeeds: text("accessibility_needs"),
  referralSource: varchar("referral_source"),
  totalAmount: integer("total_amount"),
  assignedGuideId: varchar("assigned_guide_id"),
  adminNotes: text("admin_notes"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInBy: varchar("check_in_by"),
  checkOutBy: varchar("check_out_by"),
  visitorRating: integer("visitor_rating"), // Rating given by visitor (1-5)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guide Availability table - Enhanced for weekly scheduling
export const guideAvailability = pgTable("guide_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").notNull(),
  dayOfWeek: integer("day_of_week"),
  date: date("date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Booking Companions table
export const bookingCompanions = pgTable("booking_companions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  relationship: varchar("relationship"),
  specialNeeds: text("special_needs"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Booking Activity Log table
export const bookingActivityLogs = pgTable("booking_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  userId: varchar("user_id"),
  action: varchar("action").notNull(),
  description: text("description"),
  oldStatus: varchar("old_status"),
  newStatus: varchar("new_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Incidents table for Security Module
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id"),
  reportedBy: varchar("reported_by").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  severity: incidentSeverityEnum("severity").default("medium"),
  status: incidentStatusEnum("status").default("reported"),
  location: varchar("location"),
  involvedParties: text("involved_parties"),
  actionsTaken: text("actions_taken"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zone Visit Analytics table
export const zoneVisits = pgTable("zone_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  zoneId: varchar("zone_id").notNull(),
  visitedAt: timestamp("visited_at").defaultNow(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Log table for tracking sent emails
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sentBy: varchar("sent_by"),
  recipientName: varchar("recipient_name"),
  recipientEmail: varchar("recipient_email").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message"),
  templateType: varchar("template_type").default("custom"), // 'booking_confirmation', 'password_reset', 'invitation', 'custom', etc.
  status: varchar("status").default("sent"), // 'sent', 'failed', 'pending'
  errorMessage: text("error_message"),
  relatedEntityType: varchar("related_entity_type"), // 'booking', 'user', 'guide', etc.
  relatedEntityId: varchar("related_entity_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Templates table for admin-editable templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // e.g., 'booking_confirmation', 'booking_reminder', 'feedback_request'
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  description: text("description"), // Help text for admin
  variables: jsonb("variables"), // Available merge variables like {{visitor_name}}, {{visit_date}}
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "booking_completed",
  "guide_assigned",
  "check_in",
  "check_out",
  "payment_received",
  "payment_verified",
  "system",
]);

// Notifications table for in-app notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  link: varchar("link"), // Optional URL to navigate to
  relatedId: varchar("related_id"), // e.g., booking ID
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  incidents: many(incidents),
}));

export const guidesRelations = relations(guides, ({ one, many }) => ({
  user: one(users, {
    fields: [guides.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  availability: many(guideAvailability),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  guide: one(guides, {
    fields: [bookings.assignedGuideId],
    references: [guides.id],
  }),
  meetingPoint: one(meetingPoints, {
    fields: [bookings.meetingPointId],
    references: [meetingPoints.id],
  }),
  visitor: one(users, {
    fields: [bookings.visitorUserId],
    references: [users.id],
  }),
  incidents: many(incidents),
  zoneVisits: many(zoneVisits),
  companions: many(bookingCompanions),
  activityLogs: many(bookingActivityLogs),
}));

export const bookingCompanionsRelations = relations(bookingCompanions, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingCompanions.bookingId],
    references: [bookings.id],
  }),
}));

export const bookingActivityLogsRelations = relations(bookingActivityLogs, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingActivityLogs.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [bookingActivityLogs.userId],
    references: [users.id],
  }),
}));

export const guideAvailabilityRelations = relations(guideAvailability, ({ one }) => ({
  guide: one(guides, {
    fields: [guideAvailability.guideId],
    references: [guides.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  booking: one(bookings, {
    fields: [incidents.bookingId],
    references: [bookings.id],
  }),
  reporter: one(users, {
    fields: [incidents.reportedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const zonesRelations = relations(zones, ({ many }) => ({
  pointsOfInterest: many(pointsOfInterest),
  visits: many(zoneVisits),
}));

export const pointsOfInterestRelations = relations(pointsOfInterest, ({ one }) => ({
  zone: one(zones, {
    fields: [pointsOfInterest.zoneId],
    references: [zones.id],
  }),
}));

export const zoneVisitsRelations = relations(zoneVisits, ({ one }) => ({
  booking: one(bookings, {
    fields: [zoneVisits.bookingId],
    references: [bookings.id],
  }),
  zone: one(zones, {
    fields: [zoneVisits.zoneId],
    references: [zones.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuideSchema = createInsertSchema(guides).omit({
  id: true,
  totalTours: true,
  completedTours: true,
  totalEarnings: true,
  rating: true,
  totalRatings: true,
  createdAt: true,
  updatedAt: true,
});

export const insertZoneSchema = createInsertSchema(zones).omit({
  id: true,
  totalVisits: true,
  createdAt: true,
});

export const insertPointOfInterestSchema = createInsertSchema(pointsOfInterest).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingPointSchema = createInsertSchema(meetingPoints).omit({
  id: true,
  createdAt: true,
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingReference: true,
  status: true,
  paymentStatus: true,
  paymentVerifiedBy: true,
  paymentVerifiedAt: true,
  assignedGuideId: true,
  adminNotes: true,
  checkInTime: true,
  checkOutTime: true,
  checkInBy: true,
  checkOutBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuideAvailabilitySchema = createInsertSchema(guideAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertZoneVisitSchema = createInsertSchema(zoneVisits).omit({
  id: true,
  createdAt: true,
});

export const insertBookingCompanionSchema = createInsertSchema(bookingCompanions).omit({
  id: true,
  createdAt: true,
});

export const insertBookingActivityLogSchema = createInsertSchema(bookingActivityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guides.$inferSelect;

export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zones.$inferSelect;

export type InsertPointOfInterest = z.infer<typeof insertPointOfInterestSchema>;
export type PointOfInterest = typeof pointsOfInterest.$inferSelect;

export type InsertMeetingPoint = z.infer<typeof insertMeetingPointSchema>;
export type MeetingPoint = typeof meetingPoints.$inferSelect;

export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfig.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertGuideAvailability = z.infer<typeof insertGuideAvailabilitySchema>;
export type GuideAvailability = typeof guideAvailability.$inferSelect;

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertZoneVisit = z.infer<typeof insertZoneVisitSchema>;
export type ZoneVisit = typeof zoneVisits.$inferSelect;

export type InsertBookingCompanion = z.infer<typeof insertBookingCompanionSchema>;
export type BookingCompanion = typeof bookingCompanions.$inferSelect;

export type InsertBookingActivityLog = z.infer<typeof insertBookingActivityLogSchema>;
export type BookingActivityLog = typeof bookingActivityLogs.$inferSelect;

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Enum types
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type GroupSize = "individual" | "small_group" | "large_group" | "custom";
export type TourType = "standard" | "extended" | "custom";
export type PaymentMethod = "airtel_money" | "tnm_mpamba" | "cash";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type UserRole = "admin" | "coordinator" | "guide" | "security" | "visitor";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "reported" | "investigating" | "resolved" | "closed";
export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "check_in" | "check_out" | "verify";
export type NotificationType = "booking_created" | "booking_confirmed" | "booking_cancelled" | "booking_completed" | "guide_assigned" | "check_in" | "check_out" | "payment_received" | "payment_verified" | "system";

// Content Management System (CMS)
export const contentBlocks = pgTable("content_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: varchar("section").notNull(), // e.g., "hero", "features", "pricing"
  key: varchar("key").notNull().unique(), // e.g., "hero_title", "hero_subtitle"
  value: text("value").notNull(),
  type: varchar("type").default("text"), // text, image_url, json
  lastUpdatedBy: varchar("last_updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentBlocksRelations = relations(contentBlocks, ({ one }) => ({
  updater: one(users, {
    fields: [contentBlocks.lastUpdatedBy],
    references: [users.id],
  }),
}));

export const insertContentBlockSchema = createInsertSchema(contentBlocks).omit({
  id: true,
  updatedAt: true,
});

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;

// IP Whitelist
export const allowedIps = pgTable("allowed_ips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address").notNull().unique(),
  description: text("description"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const allowedIpsRelations = relations(allowedIps, ({ one }) => ({
  creator: one(users, {
    fields: [allowedIps.createdBy],
    references: [users.id],
  }),
}));

export const insertAllowedIpSchema = createInsertSchema(allowedIps).omit({
  id: true,
  createdAt: true,
});

export type AllowedIp = typeof allowedIps.$inferSelect;
export type InsertAllowedIp = z.infer<typeof insertAllowedIpSchema>;

// Login History - tracks all login attempts
export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type"), // 'desktop', 'mobile', 'tablet'
  browser: varchar("browser"),
  os: varchar("os"),
  success: boolean("success").notNull().default(false),
  failureReason: varchar("failure_reason"), // 'invalid_password', 'account_disabled', 'user_not_found'
  createdAt: timestamp("created_at").defaultNow(),
});

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  createdAt: true,
});

export type LoginHistory = typeof loginHistory.$inferSelect;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;

// User Invites - tracks pending invitations
export const userInvites = pgTable("user_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  role: varchar("role").default("visitor"),
  inviteToken: varchar("invite_token").notNull().unique(),
  invitedBy: varchar("invited_by"),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userInvitesRelations = relations(userInvites, ({ one }) => ({
  inviter: one(users, {
    fields: [userInvites.invitedBy],
    references: [users.id],
  }),
}));

export const insertUserInviteSchema = createInsertSchema(userInvites).omit({
  id: true,
  acceptedAt: true,
  createdAt: true,
});

export type UserInvite = typeof userInvites.$inferSelect;
export type InsertUserInvite = z.infer<typeof insertUserInviteSchema>;
