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
  uuid,
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
  "impersonate",
  "stop_impersonate",
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
  // CRM Fields
  preferences: jsonb("preferences").default({}), // Dietary requirements, special interests
  adminNotes: text("admin_notes"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`), // Segmentation tags
  // Enhanced CRM Fields
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  country: varchar("country"),
  preferredLanguage: varchar("preferred_language").default("en"),
  preferredContactMethod: varchar("preferred_contact_method").default("email"), // email, phone, whatsapp
  marketingConsent: boolean("marketing_consent").default(false),
  // Auth fields
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  // Legacy/Compatibility Fields (Restored)
  emailNotifications: boolean("email_notifications").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const externalCalendars = pgTable("external_calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Viator", "Airbnb"
  url: text("url").notNull(), // iCal URL
  color: text("color").default("#3b82f6"),
  lastSyncedAt: timestamp("last_synced_at"),
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
  // Self-managed availability
  availability: jsonb("availability"), // { monday: true, tuesday: false, ... }
  workingHours: jsonb("working_hours"), // { start: "08:00", end: "17:00" }
  deletedAt: timestamp("deleted_at"),
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
  deletedAt: timestamp("deleted_at"),
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
  bookingReference: varchar("booking_reference").unique().notNull(), // e.g., DVS-2024-001
  source: varchar("source").default("direct"), // direct, viator, expedia, manual
  externalReferenceId: varchar("external_reference_id"), // ID from OTA
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
  guidePayment: integer("guide_payment"), // Amount paid to guide for this tour
  visitorOrganization: varchar("visitor_organization"), // e.g., company name
  version: integer("version").default(1).notNull(), // Optimistic locking version
  recurringBookingId: varchar("recurring_booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly",
  "monthly",
]);

export const recurringBookings = pgTable("recurring_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationName: varchar("organization_name"), // e.g. "St. Mary's School"
  visitorName: varchar("visitor_name").notNull(),
  visitorEmail: varchar("visitor_email").notNull(),
  visitorPhone: varchar("visitor_phone"),
  groupSize: groupSizeEnum("group_size").notNull(),
  numberOfPeople: integer("number_of_people").default(1),
  tourType: tourTypeEnum("tour_type").notNull(),

  frequency: recurringFrequencyEnum("frequency").notNull(), // weekly, monthly
  dayOfWeek: integer("day_of_week"), // 0-6 (Sun-Sat)
  weekOfMonth: integer("week_of_month"), // 1-5 (e.g. 2nd Friday)

  startDate: date("start_date").notNull(),
  endDate: date("end_date"),

  startTime: time("start_time").notNull(), // Visit time

  isActive: boolean("is_active").default(true),
  lastGeneratedDate: date("last_generated_date"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recurringBookingsRelations = relations(recurringBookings, ({ many }) => ({
  bookings: many(bookings),
}));

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
  isArchived: boolean("is_archived").default(false),
  deletedAt: timestamp("deleted_at"),
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
  "incident_reported",
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

// Blog Posts table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(), // HTML or Markdown content
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  authorId: varchar("author_id").references(() => users.id),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

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
  assignedGuide: one(guides, {
    fields: [bookings.assignedGuideId],
    references: [guides.id],
  }),
  recurringBooking: one(recurringBookings, {
    fields: [bookings.recurringBookingId],
    references: [recurringBookings.id],
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

// Saved Itineraries - for visitors to save and reuse tour plans
export const savedItineraries = pgTable("saved_itineraries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  tourType: tourTypeEnum("tour_type").notNull(),
  groupSize: groupSizeEnum("group_size"),
  numberOfPeople: integer("number_of_people").default(1),
  selectedZones: text("selected_zones").array().default(sql`ARRAY[]::text[]`),
  selectedInterests: text("selected_interests").array().default(sql`ARRAY[]::text[]`),
  customDuration: integer("custom_duration"),
  meetingPointId: varchar("meeting_point_id"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSavedItinerarySchema = createInsertSchema(savedItineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Favorite Guides - for visitors to save preferred guides
export const favoriteGuides = pgTable("favorite_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  guideId: varchar("guide_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteGuideSchema = createInsertSchema(favoriteGuides).omit({
  id: true,
  createdAt: true,
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

export type InsertSavedItinerary = z.infer<typeof insertSavedItinerarySchema>;
export type SavedItinerary = typeof savedItineraries.$inferSelect;

export type InsertFavoriteGuide = z.infer<typeof insertFavoriteGuideSchema>;
export type FavoriteGuide = typeof favoriteGuides.$inferSelect;

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
export type NotificationType = "booking_created" | "booking_confirmed" | "booking_cancelled" | "booking_completed" | "guide_assigned" | "check_in" | "check_out" | "payment_received" | "payment_verified" | "incident_reported" | "system";

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

// Training Progress Status Enum
export const trainingProgressStatusEnum = pgEnum("training_progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

// Target Audience Enum - for separating guide vs visitor content
export const targetAudienceEnum = pgEnum("target_audience", [
  "guide",
  "visitor",
  "both",
]);

// Training Modules - stores training content for guides and visitors
export const trainingModules = pgTable("training_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // e.g., "About Dzaleka", "Culture", "Services"
  content: text("content"), // Full training content/instructions
  externalUrl: varchar("external_url"), // Link to external resource
  estimatedMinutes: integer("estimated_minutes").default(15),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
  isActive: boolean("is_active").default(true),
  targetAudience: targetAudienceEnum("target_audience").default("both"), // guide, visitor, or both
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Guide Training Progress - tracks each guide's progress on modules
export const guideTrainingProgress = pgTable("guide_training_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").notNull(),
  moduleId: varchar("module_id").notNull(),
  status: trainingProgressStatusEnum("status").default("not_started"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"), // Guide's notes/learnings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Module Relations
export const trainingModulesRelations = relations(trainingModules, ({ many }) => ({
  progress: many(guideTrainingProgress),
}));

// Guide Training Progress Relations
export const guideTrainingProgressRelations = relations(guideTrainingProgress, ({ one }) => ({
  guide: one(guides, {
    fields: [guideTrainingProgress.guideId],
    references: [guides.id],
  }),
  module: one(trainingModules, {
    fields: [guideTrainingProgress.moduleId],
    references: [trainingModules.id],
  }),
}));

// Insert Schemas for Training
export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuideTrainingProgressSchema = createInsertSchema(guideTrainingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Training Types
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

export type GuideTrainingProgress = typeof guideTrainingProgress.$inferSelect;
export type InsertGuideTrainingProgress = z.infer<typeof insertGuideTrainingProgressSchema>;

export type TrainingProgressStatus = "not_started" | "in_progress" | "completed";

export type TargetAudience = "guide" | "visitor" | "both";

// ==================== TASK MANAGEMENT ====================

// Task Enums
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "under_review",
  "completed",
  "cancelled",
]);

export const taskCategoryEnum = pgEnum("task_category", [
  "tour_prep",
  "training",
  "admin",
  "maintenance",
  "communication",
  "documentation",
  "other",
]);

// Tasks Table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("other"),
  priority: varchar("priority", { length: 10 }).default("medium"),
  status: varchar("status", { length: 20 }).default("pending"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern", { length: 50 }),
  parentTaskId: varchar("parent_task_id"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  assignedToIdx: index("idx_tasks_assigned_to").on(table.assignedTo),
  statusIdx: index("idx_tasks_status").on(table.status),
  dueDateIdx: index("idx_tasks_due_date").on(table.dueDate),
}));

// Task Comments Table
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  taskIdx: index("idx_task_comments_task").on(table.taskId),
}));

// Task Attachments Table
export const taskAttachments = pgTable("task_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  taskIdx: index("idx_task_attachments_task").on(table.taskId),
}));

// Task History Table (audit trail)
export const taskHistory = pgTable("task_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  fieldName: varchar("field_name", { length: 50 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  taskIdx: index("idx_task_history_task").on(table.taskId),
}));

// Task Relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  assigner: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
  comments: many(taskComments),
  attachments: many(taskAttachments),
  history: many(taskHistory),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [taskAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskHistory.userId],
    references: [users.id],
  }),
}));

// Insert Schemas for Tasks
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).omit({
  id: true,
  createdAt: true,
});

// Task Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;

export type TaskHistory = typeof taskHistory.$inferSelect;

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "under_review" | "completed" | "cancelled";
export type TaskCategory = "tour_prep" | "training" | "admin" | "maintenance" | "communication" | "documentation" | "other";

// Payout status enum
export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "paid",
  "cancelled",
]);

// Guide Payouts table for tracking payment history
export const guidePayouts = pgTable("guide_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id").notNull().references(() => guides.id),
  amount: integer("amount").notNull(), // Amount in MWK
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  toursCount: integer("tours_count").default(0),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  paymentMethod: varchar("payment_method", { length: 50 }), // cash, airtel_money, tnm_mpamba
  paymentReference: varchar("payment_reference", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  guideIdx: index("idx_payouts_guide").on(table.guideId),
  statusIdx: index("idx_payouts_status").on(table.status),
  createdIdx: index("idx_payouts_created").on(table.createdAt),
}));

// Guide Payouts relations
export const guidePayoutsRelations = relations(guidePayouts, ({ one }) => ({
  guide: one(guides, {
    fields: [guidePayouts.guideId],
    references: [guides.id],
  }),
  payer: one(users, {
    fields: [guidePayouts.paidBy],
    references: [users.id],
  }),
}));

// Payout insert schema
export const insertGuidePayoutSchema = createInsertSchema(guidePayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payout types
export type GuidePayout = typeof guidePayouts.$inferSelect;
export type InsertGuidePayout = z.infer<typeof insertGuidePayoutSchema>;

// Chat Rooms table
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  type: varchar("type").default("direct"), // 'direct', 'booking', 'group'
  bookingId: varchar("booking_id"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Participants table
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at").defaultNow(),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  senderId: varchar("sender_id"),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // 'text', 'image', 'system'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Insert Schemas
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
});

// Chat Types
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;

// Chat Relations
export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
  room: one(chatRooms, {
    fields: [chatParticipants.roomId],
    references: [chatRooms.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ many }) => ({
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// ================================================
// HELP CENTER
// ================================================

// Help article categories
export const helpCategoryEnum = pgEnum("help_category", [
  "faq",
  "getting_started",
  "guide_help",
  "visitor_help",
  "general",
]);

// Target audience for articles
export const helpAudienceEnum = pgEnum("help_audience", [
  "visitor",
  "guide",
  "both",
]);

// Support ticket status
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

// Support ticket priority
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

// Help articles table
export const helpArticles = pgTable("help_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  content: text("content").notNull(),
  category: helpCategoryEnum("category").default("general"),
  audience: helpAudienceEnum("audience").default("both"),
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").default("open"),
  priority: ticketPriorityEnum("priority").default("normal"),
  assignedTo: varchar("assigned_to"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Help Center Relations
export const helpArticlesRelations = relations(helpArticles, ({ one }) => ({
  creator: one(users, {
    fields: [helpArticles.createdBy],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertHelpArticleSchema = createInsertSchema(helpArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertExternalCalendarSchema = createInsertSchema(externalCalendars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true
});

// Types
export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = z.infer<typeof insertHelpArticleSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type HelpCategory = "faq" | "getting_started" | "guide_help" | "visitor_help" | "general";
export type HelpAudience = "visitor" | "guide" | "both";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const insertRecurringBookingSchema = createInsertSchema(recurringBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastGeneratedDate: true
});

export type RecurringBooking = typeof recurringBookings.$inferSelect;
export type InsertRecurringBooking = z.infer<typeof insertRecurringBookingSchema>;

export type ExternalCalendar = typeof externalCalendars.$inferSelect;
export type InsertExternalCalendar = z.infer<typeof insertExternalCalendarSchema>;

// ===== Page Views (Analytics) =====
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  page: varchar("page").notNull(),
  referrer: varchar("referrer"),
  userAgent: varchar("user_agent"),
  deviceType: varchar("device_type"), // mobile, tablet, desktop
  country: varchar("country"),
  userId: varchar("user_id"), // Optional - if user is logged in
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_pageviews_session").on(table.sessionId),
  index("IDX_pageviews_page").on(table.page),
  index("IDX_pageviews_created").on(table.createdAt),
]);

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;

// ===== API Keys (Developer Settings) =====
export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "active",
  "revoked",
  "expired",
]);

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Owner of the API key
  name: varchar("name").notNull(), // "Production Key", "Test Key"
  keyHash: varchar("key_hash").notNull(), // bcrypt hash of the full key
  keyPrefix: varchar("key_prefix").notNull(), // First 8 chars for display (dvz_xxxxxxxx)
  scopes: text("scopes").array().default(sql`ARRAY[]::text[]`), // ['bookings:read', 'guides:read']
  status: apiKeyStatusEnum("status").default("active"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  requestCount: integer("request_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_apikeys_user").on(table.userId),
  index("IDX_apikeys_prefix").on(table.keyPrefix),
]);

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
  requestCount: true,
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// ===== Analytics Settings =====
export const analyticsSettings = pgTable("analytics_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ga4MeasurementId: varchar("ga4_measurement_id"),
  googleAdsConversionId: varchar("google_ads_conversion_id"),
  googleAdsConversionLabel: varchar("google_ads_conversion_label"),
  facebookPixelId: varchar("facebook_pixel_id"),
  customHtml: text("custom_html"),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnalyticsSettingsSchema = createInsertSchema(analyticsSettings).omit({
  id: true,
  updatedAt: true,
});

export type AnalyticsSetting = typeof analyticsSettings.$inferSelect;
export type InsertAnalyticsSetting = z.infer<typeof insertAnalyticsSettingsSchema>;

export const itineraries = pgTable("itineraries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;

// Events table for public events (festivals, markets, etc.)
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(), // Using text to allow flexible date formats like "Every Tuesday" or "November 2026"
  time: text("time"),
  location: text("location"),
  image: text("image"),
  link: text("link"),
  category: text("category").notNull(), // e.g., 'Festival', 'Market', 'Sports'
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
