import {
  type User,
  type UpsertUser,
  type Guide,
  type InsertGuide,
  type Zone,
  type InsertZone,
  type PointOfInterest,
  type InsertPointOfInterest,
  type MeetingPoint,
  type InsertMeetingPoint,
  type PricingConfig,
  type InsertPricingConfig,
  type Booking,
  type InsertBooking,
  type BookingStatus,
  type PaymentStatus,
  type GuideAvailability,
  type InsertGuideAvailability,
  type Incident,
  type InsertIncident,
  type IncidentStatus,
  type AuditLog,
  type InsertAuditLog,
  type ZoneVisit,
  type InsertZoneVisit,
  type BookingCompanion,
  type InsertBookingCompanion,
  type BookingActivityLog,
  type InsertBookingActivityLog,
  type EmailLog,
  type InsertEmailLog,
  type Notification,
  type InsertNotification,
  bookings,
  type UserRole,
  type NotificationType,
  type EmailTemplate,
  type InsertEmailTemplate,
  type ContentBlock,
  type InsertContentBlock,
  type AllowedIp,
  type InsertAllowedIp,
  type LoginHistory,
  type InsertLoginHistory,
  type UserInvite,
  type InsertUserInvite,
  type TrainingModule,
  type InsertTrainingModule,
  type GuideTrainingProgress,
  type InsertGuideTrainingProgress,
  type TrainingProgressStatus,
} from "@shared/schema";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Generate booking reference (e.g., DVS-2024-ABC123)
function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DVS-${year}-${random}`;
}

// Helper to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Transform object keys from snake_case to camelCase
function transformToCamel<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(transformToCamel) as any;
  if (obj instanceof Date) return obj as any;
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const key in obj) {
    const camelKey = toCamelCase(key);
    result[camelKey] = transformToCamel(obj[key]);
  }
  return result;
}

// Transform object keys from camelCase to snake_case
function transformToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(transformToSnake);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const result: any = {};
  for (const key in obj) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = transformToSnake(obj[key]);
  }
  return result;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  updateUserRole(id: string, role: UserRole): Promise<User | undefined>;
  updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; phone?: string }): Promise<User | undefined>;
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;
  verifyEmail(userId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  clearEmailVerificationToken(userId: string): Promise<void>;

  // Guide operations
  getGuides(): Promise<Guide[]>;
  getGuide(id: string): Promise<Guide | undefined>;
  getGuideByUserId(userId: string): Promise<Guide | undefined>;
  createGuide(guide: InsertGuide): Promise<Guide>;
  updateGuide(id: string, guide: Partial<Guide>): Promise<Guide | undefined>;
  deleteGuide(id: string): Promise<void>;

  // Zone operations
  getZones(): Promise<Zone[]>;
  getZone(id: string): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: string, zone: Partial<Zone>): Promise<Zone | undefined>;
  deleteZone(id: string): Promise<void>;

  // Points of Interest operations
  getPointsOfInterest(): Promise<PointOfInterest[]>;
  getPointOfInterest(id: string): Promise<PointOfInterest | undefined>;
  createPointOfInterest(poi: InsertPointOfInterest): Promise<PointOfInterest>;
  updatePointOfInterest(id: string, poi: Partial<PointOfInterest>): Promise<PointOfInterest | undefined>;
  deletePointOfInterest(id: string): Promise<void>;

  // Meeting Point operations
  getMeetingPoints(): Promise<MeetingPoint[]>;
  getMeetingPoint(id: string): Promise<MeetingPoint | undefined>;
  createMeetingPoint(mp: InsertMeetingPoint): Promise<MeetingPoint>;
  updateMeetingPoint(id: string, mp: Partial<MeetingPoint>): Promise<MeetingPoint | undefined>;
  deleteMeetingPoint(id: string): Promise<void>;

  // Pricing operations
  getPricingConfigs(): Promise<PricingConfig[]>;
  updatePricing(data: Record<string, number>): Promise<void>;

  // Booking operations
  getBookings(): Promise<Booking[]>;
  getActiveVisits(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | undefined>;
  updateBookingPaymentStatus(id: string, status: PaymentStatus, verifiedBy?: string): Promise<Booking | undefined>;
  assignGuideToBooking(bookingId: string, guideId: string): Promise<Booking | undefined>;
  updateBookingNotes(id: string, notes: string): Promise<Booking | undefined>;
  checkInVisitor(id: string, checkInBy: string): Promise<Booking | undefined>;
  checkOutVisitor(id: string, checkOutBy: string): Promise<Booking | undefined>;
  updateBookingRating(id: string, rating: number): Promise<Booking | undefined>;

  // Guide Helper
  getGuidesByIds(ids: string[]): Promise<Guide[]>;

  // Guide Availability operations
  getGuideAvailability(guideId: string): Promise<GuideAvailability[]>;
  createGuideAvailability(availability: InsertGuideAvailability): Promise<GuideAvailability>;
  deleteGuideAvailability(id: string): Promise<void>;

  // Incident operations
  getIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, incident: Partial<Incident>): Promise<Incident | undefined>;
  resolveIncident(id: string, resolvedBy: string): Promise<Incident | undefined>;

  // Audit Log operations
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Zone Visit Analytics
  getZoneVisits(): Promise<ZoneVisit[]>;
  createZoneVisit(visit: InsertZoneVisit): Promise<ZoneVisit>;
  getZoneAnalytics(): Promise<{ zoneId: string; zoneName: string; visitCount: number }[]>;

  // Booking Companions operations
  getBookingCompanions(bookingId: string): Promise<BookingCompanion[]>;
  createBookingCompanion(companion: InsertBookingCompanion): Promise<BookingCompanion>;
  deleteBookingCompanion(id: string): Promise<void>;

  // Booking Activity Log operations
  getBookingActivityLogs(bookingId: string): Promise<BookingActivityLog[]>;
  createBookingActivityLog(log: InsertBookingActivityLog): Promise<BookingActivityLog>;

  // Email Log operations
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLog(id: string): Promise<EmailLog | undefined>;
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  updateEmailLogStatus(id: string, status: string): Promise<EmailLog | undefined>;

  // User authentication operations
  createUser(email: string, password: string, firstName: string, lastName: string, role?: UserRole): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;

  // Guide leaderboard
  getGuideLeaderboard(): Promise<Guide[]>;
  updateGuideRating(guideId: string, rating: number): Promise<Guide | undefined>;
  incrementGuideStats(guideId: string, tours?: number, earnings?: number): Promise<Guide | undefined>;

  // Statistics
  getStats(): Promise<{
    totalBookings: number;
    pendingRequests: number;
    activeGuides: number;
    todaysTours: number;
    weeklyRevenue: number;
    monthlyGrowth: number;
  }>;

  // Revenue Analytics
  getRevenueStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    byPaymentMethod: Record<string, number>;
    byGroupSize: Record<string, number>;
  }>;

  // Comprehensive Revenue Dashboard
  getRevenueDashboard(): Promise<{
    totalRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    pendingRevenue: number;
    refundedAmount: number;
    byPaymentMethod: { method: string; amount: number; count: number }[];
    byTourType: { type: string; amount: number; count: number }[];
    byPaymentStatus: { status: string; amount: number; count: number }[];
    recentTransactions: { id: string; reference: string; visitorName: string; amount: number; status: string; date: string }[];
    monthlyTrend: { month: string; revenue: number; bookings: number }[];
  }>;

  // User Management Stats
  getUserStats(): Promise<{
    totalUsers: number;
    byRole: Record<string, number>;
    recentActivity: { action: string; userId: string; userName: string; timestamp: Date }[];
  }>;

  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Email Template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  toggleEmailTemplateStatus(id: string, isActive: boolean): Promise<EmailTemplate | undefined>;

  // CMS Operations
  getContentBlocks(): Promise<ContentBlock[]>;
  getContentBlock(key: string): Promise<ContentBlock | undefined>;
  updateContentBlock(key: string, value: string, userId: string): Promise<ContentBlock | undefined>;

  // IP Whitelist Operations
  getAllowedIps(): Promise<AllowedIp[]>;
  createAllowedIp(ip: InsertAllowedIp): Promise<AllowedIp>;
  deleteAllowedIp(id: string): Promise<void>;
  checkIpAllowed(ip: string): Promise<boolean>;

  // Login History Operations
  getLoginHistory(limit?: number): Promise<LoginHistory[]>;
  getUserLoginHistory(userId: string, limit?: number): Promise<LoginHistory[]>;
  createLoginRecord(record: InsertLoginHistory): Promise<LoginHistory>;

  // User Invite Operations
  getInvites(): Promise<UserInvite[]>;
  getInviteByToken(token: string): Promise<UserInvite | undefined>;
  getInviteByEmail(email: string): Promise<UserInvite | undefined>;
  createInvite(invite: InsertUserInvite): Promise<UserInvite>;
  acceptInvite(id: string): Promise<UserInvite | undefined>;
  deleteInvite(id: string): Promise<void>;

  // Training Module operations
  getTrainingModules(): Promise<TrainingModule[]>;
  getGuideTrainingModules(): Promise<TrainingModule[]>;
  getVisitorResources(): Promise<TrainingModule[]>;
  getTrainingModule(id: string): Promise<TrainingModule | undefined>;
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  updateTrainingModule(id: string, module: Partial<TrainingModule>): Promise<TrainingModule | undefined>;
  deleteTrainingModule(id: string): Promise<void>;

  // Guide Training Progress operations
  getGuideTrainingProgress(guideId: string): Promise<GuideTrainingProgress[]>;
  updateGuideTrainingProgress(guideId: string, moduleId: string, status: TrainingProgressStatus, notes?: string): Promise<GuideTrainingProgress>;
  getGuideTrainingStats(guideId: string): Promise<{ completed: number; total: number; percentage: number }>;
  getAllGuidesTrainingStats(): Promise<Array<{ guide: Guide; completed: number; total: number; percentage: number }>>;
}

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
    }
    // Prefer SUPABASE_SERVICE_ROLE_KEY if available to bypass RLS on the backend
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    this.supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
  }

  // Helper to handle Supabase responses
  private handleResponse<T>(data: T | null, error: any): T {
    if (error) throw new Error(error.message);
    if (data === null) throw new Error("No data returned");
    return transformToCamel<T>(data);
  }

  // Helper for optional return
  private handleOptionalResponse<T>(data: T | null, error: any): T | undefined {
    if (error) throw new Error(error.message);
    return data ? transformToCamel<T>(data) : undefined;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase.from("users").select("*").eq("email", email).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase.from("users").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const snakeData = transformToSnake(userData);
    const { data, error } = await this.supabase
      .from("users")
      .upsert({ ...snakeData, updated_at: new Date() })
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const snakeData = transformToSnake(userData);
    const { data, error } = await this.supabase
      .from("users")
      .update({ ...snakeData, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async updateUserRole(id: string, role: UserRole): Promise<User | undefined> {
    return this.updateUser(id, { role });
  }

  async updateUserProfile(id: string, profile: { firstName?: string; lastName?: string; phone?: string }): Promise<User | undefined> {
    return this.updateUser(id, profile);
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.updateUser(userId, { passwordResetToken: token, passwordResetExpires: expires });
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("password_reset_token", token)
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({ password_reset_token: null, password_reset_expires: null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.updateUser(userId, { emailVerified: true });
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  }

  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        email_verification_token: token,
        email_verification_expires: expires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    if (error) throw error;
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("email_verification_token", token)
      .gt("email_verification_expires", new Date().toISOString())
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async clearEmailVerificationToken(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    if (error) throw error;
  }

  // Guide operations
  async getGuides(): Promise<Guide[]> {
    const { data, error } = await this.supabase.from("guides").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async getGuide(id: string): Promise<Guide | undefined> {
    const { data, error } = await this.supabase.from("guides").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getGuideByUserId(userId: string): Promise<Guide | undefined> {
    const { data, error } = await this.supabase.from("guides").select("*").eq("user_id", userId).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createGuide(guide: InsertGuide): Promise<Guide> {
    const snakeData = transformToSnake(guide);
    const { data, error } = await this.supabase.from("guides").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updateGuide(id: string, guide: Partial<Guide>): Promise<Guide | undefined> {
    const snakeData = transformToSnake(guide);
    const { data, error } = await this.supabase
      .from("guides")
      .update({ ...snakeData, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async deleteGuide(id: string): Promise<void> {
    const { error } = await this.supabase.from("guides").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Zone operations
  async getZones(): Promise<Zone[]> {
    const { data, error } = await this.supabase.from("zones").select("*").order("name");
    return this.handleResponse(data, error);
  }

  async getZone(id: string): Promise<Zone | undefined> {
    const { data, error } = await this.supabase.from("zones").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createZone(zone: InsertZone): Promise<Zone> {
    const snakeData = transformToSnake(zone);
    const { data, error } = await this.supabase.from("zones").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updateZone(id: string, zone: Partial<Zone>): Promise<Zone | undefined> {
    const snakeData = transformToSnake(zone);
    const { data, error } = await this.supabase.from("zones").update(snakeData).eq("id", id).select().single();
    return this.handleOptionalResponse(data, error);
  }

  async deleteZone(id: string): Promise<void> {
    const { error } = await this.supabase.from("zones").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Points of Interest operations
  async getPointsOfInterest(): Promise<PointOfInterest[]> {
    const { data, error } = await this.supabase.from("points_of_interest").select("*").order("name");
    return this.handleResponse(data, error);
  }

  async getPointOfInterest(id: string): Promise<PointOfInterest | undefined> {
    const { data, error } = await this.supabase.from("points_of_interest").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createPointOfInterest(poi: InsertPointOfInterest): Promise<PointOfInterest> {
    const snakeData = transformToSnake(poi);
    const { data, error } = await this.supabase.from("points_of_interest").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updatePointOfInterest(id: string, poi: Partial<PointOfInterest>): Promise<PointOfInterest | undefined> {
    const snakeData = transformToSnake(poi);
    const { data, error } = await this.supabase.from("points_of_interest").update(snakeData).eq("id", id).select().single();
    return this.handleOptionalResponse(data, error);
  }

  async deletePointOfInterest(id: string): Promise<void> {
    const { error } = await this.supabase.from("points_of_interest").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Meeting Point operations
  async getMeetingPoints(): Promise<MeetingPoint[]> {
    const { data, error } = await this.supabase.from("meeting_points").select("*").order("name");
    return this.handleResponse(data, error);
  }

  async getMeetingPoint(id: string): Promise<MeetingPoint | undefined> {
    const { data, error } = await this.supabase.from("meeting_points").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createMeetingPoint(mp: InsertMeetingPoint): Promise<MeetingPoint> {
    const snakeData = transformToSnake(mp);
    const { data, error } = await this.supabase.from("meeting_points").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updateMeetingPoint(id: string, mp: Partial<MeetingPoint>): Promise<MeetingPoint | undefined> {
    const snakeData = transformToSnake(mp);
    const { data, error } = await this.supabase.from("meeting_points").update(snakeData).eq("id", id).select().single();
    return this.handleOptionalResponse(data, error);
  }

  async deleteMeetingPoint(id: string): Promise<void> {
    const { error } = await this.supabase.from("meeting_points").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Pricing operations
  async getPricingConfigs(): Promise<PricingConfig[]> {
    const { data, error } = await this.supabase.from("pricing_config").select("*");
    return this.handleResponse(data, error);
  }

  async updatePricing(data: Record<string, number>): Promise<void> {
    for (const [groupSize, price] of Object.entries(data)) {
      if (groupSize === "additional_hour") continue;

      const { data: existing } = await this.supabase
        .from("pricing_config")
        .select("*")
        .eq("group_size", groupSize)
        .single();

      if (existing) {
        await this.supabase
          .from("pricing_config")
          .update({
            base_price: price,
            additional_hour_price: data.additional_hour || 10000,
            updated_at: new Date()
          })
          .eq("group_size", groupSize);
      } else {
        await this.supabase.from("pricing_config").insert({
          name: groupSize.replace("_", " "),
          group_size: groupSize as any,
          base_price: price,
          additional_hour_price: data.additional_hour || 10000,
        });
      }
    }
  }

  // Booking operations
  async getBookings(): Promise<Booking[]> {
    const { data, error } = await this.supabase.from("bookings").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const { data, error } = await this.supabase.from("bookings").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getBookingByReference(reference: string): Promise<Booking | undefined> {
    const { data, error } = await this.supabase.from("bookings").select("*").eq("booking_reference", reference).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getRecentBookings(limit: number): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return this.handleResponse(data, error);
  }

  async getTodaysBookings(): Promise<Booking[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("visit_date", today)
      .order("visit_time");
    return this.handleResponse(data, error);
  }

  async getActiveVisits(): Promise<Booking[]> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .not("check_in_time", "is", null)
      .is("check_out_time", null)
      .order("check_in_time");
    return this.handleResponse(data, error);
  }

  // Helper for batch fetching guides to avoid N+1 queries
  async getGuidesByIds(ids: string[]): Promise<Guide[]> {
    if (!ids.length) return [];
    const { data, error } = await this.supabase
      .from("guides")
      .select("*")
      .in("id", ids);
    return this.handleResponse(data, error);
  }

  async createBooking(booking: typeof bookings.$inferInsert): Promise<Booking> {
    const bookingReference = generateBookingReference();
    const snakeData = transformToSnake(booking);
    const { data, error } = await this.supabase
      .from("bookings")
      .insert({ ...snakeData, booking_reference: bookingReference })
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | undefined> {
    const { data: updated, error } = await this.supabase
      .from("bookings")
      .update({ status, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If completed, update guide stats
    if (status === "completed" && updated?.assigned_guide_id) {
      const guide = await this.getGuide(updated.assigned_guide_id);
      if (guide) {
        await this.updateGuide(updated.assigned_guide_id, {
          totalTours: (guide.totalTours || 0) + 1,
          totalEarnings: (guide.totalEarnings || 0) + (updated.total_amount || 0),
        });
      }
    }

    return transformToCamel(updated);
  }

  async updateBookingPaymentStatus(id: string, status: PaymentStatus, verifiedBy?: string): Promise<Booking | undefined> {
    const updateData: any = { payment_status: status, updated_at: new Date() };
    if (verifiedBy && status === "paid") {
      updateData.payment_verified_by = verifiedBy;
      updateData.payment_verified_at = new Date();
    }
    const { data, error } = await this.supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async assignGuideToBooking(bookingId: string, guideId: string): Promise<Booking | undefined> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({ assigned_guide_id: guideId, updated_at: new Date() })
      .eq("id", bookingId)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async updateBookingNotes(id: string, notes: string): Promise<Booking | undefined> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({ admin_notes: notes, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async checkInVisitor(id: string, checkInBy: string): Promise<Booking | undefined> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        check_in_time: new Date(),
        check_in_by: checkInBy,
        status: "confirmed",
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async checkOutVisitor(id: string, checkOutBy: string): Promise<Booking | undefined> {
    const { data: updated, error } = await this.supabase
      .from("bookings")
      .update({
        check_out_time: new Date(),
        check_out_by: checkOutBy,
        status: "completed",
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update guide stats on checkout
    if (updated?.assigned_guide_id) {
      const guide = await this.getGuide(updated.assigned_guide_id);
      if (guide) {
        await this.updateGuide(updated.assigned_guide_id, {
          totalTours: (guide.totalTours || 0) + 1,
          totalEarnings: (guide.totalEarnings || 0) + (updated.total_amount || 0),
        });
      }
    }

    return transformToCamel(updated);
  }

  async updateBookingRating(id: string, rating: number): Promise<Booking | undefined> {
    const { data, error } = await this.supabase
      .from("bookings")
      .update({ visitor_rating: rating, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  // Guide Availability operations
  async getGuideAvailability(guideId: string): Promise<GuideAvailability[]> {
    const { data, error } = await this.supabase
      .from("guide_availability")
      .select("*")
      .eq("guide_id", guideId)
      .order("date");
    return this.handleResponse(data, error);
  }

  async createGuideAvailability(availability: InsertGuideAvailability): Promise<GuideAvailability> {
    const snakeData = transformToSnake(availability);
    const { data, error } = await this.supabase
      .from("guide_availability")
      .insert(snakeData)
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async deleteGuideAvailability(id: string): Promise<void> {
    const { error } = await this.supabase.from("guide_availability").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Incident operations
  async getIncidents(): Promise<Incident[]> {
    const { data, error } = await this.supabase.from("incidents").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const { data, error } = await this.supabase.from("incidents").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const snakeData = transformToSnake(incident);
    const { data, error } = await this.supabase.from("incidents").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updateIncident(id: string, incident: Partial<Incident>): Promise<Incident | undefined> {
    const snakeData = transformToSnake(incident);
    const { data, error } = await this.supabase
      .from("incidents")
      .update({ ...snakeData, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async resolveIncident(id: string, resolvedBy: string): Promise<Incident | undefined> {
    const { data, error } = await this.supabase
      .from("incidents")
      .update({
        status: "resolved",
        resolved_by: resolvedBy,
        resolved_at: new Date(),
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  // Audit Log operations
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return this.handleResponse(data, error);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const snakeData = transformToSnake(log);
    const { data, error } = await this.supabase.from("audit_logs").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  // Zone Visit Analytics
  async getZoneVisits(): Promise<ZoneVisit[]> {
    const { data, error } = await this.supabase.from("zone_visits").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async createZoneVisit(visit: InsertZoneVisit): Promise<ZoneVisit> {
    const snakeData = transformToSnake(visit);
    const { data, error } = await this.supabase.from("zone_visits").insert(snakeData).select().single();
    if (error) throw new Error(error.message);

    // Update zone visit count
    const zone = await this.getZone(visit.zoneId);
    if (zone) {
      await this.updateZone(visit.zoneId, { totalVisits: (zone.totalVisits || 0) + 1 });
    }

    return transformToCamel(data);
  }

  async getZoneAnalytics(): Promise<{ zoneId: string; zoneName: string; visitCount: number }[]> {
    const zonesList = await this.getZones();
    return zonesList.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      visitCount: zone.totalVisits || 0
    }));
  }

  // Booking Companions operations
  async getBookingCompanions(bookingId: string): Promise<BookingCompanion[]> {
    const { data, error } = await this.supabase
      .from("booking_companions")
      .select("*")
      .eq("booking_id", bookingId);
    return this.handleResponse(data, error);
  }

  async createBookingCompanion(companion: InsertBookingCompanion): Promise<BookingCompanion> {
    const snakeData = transformToSnake(companion);
    const { data, error } = await this.supabase.from("booking_companions").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async deleteBookingCompanion(id: string): Promise<void> {
    const { error } = await this.supabase.from("booking_companions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // Booking Activity Log operations
  async getBookingActivityLogs(bookingId: string): Promise<BookingActivityLog[]> {
    const { data, error } = await this.supabase
      .from("booking_activity_logs")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async createBookingActivityLog(log: InsertBookingActivityLog): Promise<BookingActivityLog> {
    const snakeData = transformToSnake(log);
    const { data, error } = await this.supabase.from("booking_activity_logs").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  // Email Log operations
  async getEmailLogs(): Promise<EmailLog[]> {
    const { data, error } = await this.supabase.from("email_logs").select("*").order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async getEmailLog(id: string): Promise<EmailLog | undefined> {
    const { data, error } = await this.supabase.from("email_logs").select("*").eq("id", id).single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const snakeData = transformToSnake(log);
    const { data, error } = await this.supabase.from("email_logs").insert(snakeData).select().single();
    return this.handleResponse(data, error);
  }

  async updateEmailLogStatus(id: string, status: string): Promise<EmailLog | undefined> {
    const { data, error } = await this.supabase
      .from("email_logs")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  // User authentication operations
  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = "visitor"
  ): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true,
        email_verified: false,
      })
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.updateUser(userId, { lastLoginAt: new Date() });
  }

  // Guide leaderboard
  async getGuideLeaderboard(): Promise<Guide[]> {
    const { data, error } = await this.supabase
      .from("guides")
      .select("*")
      .order("rating", { ascending: false })
      .order("total_tours", { ascending: false })
      .limit(10);
    return this.handleResponse(data, error);
  }

  async updateGuideRating(guideId: string, rating: number): Promise<Guide | undefined> {
    return this.updateGuide(guideId, { rating });
  }

  async incrementGuideStats(guideId: string, tours = 0, earnings = 0): Promise<Guide | undefined> {
    const guide = await this.getGuide(guideId);
    if (!guide) return undefined;

    return this.updateGuide(guideId, {
      totalTours: (guide.totalTours || 0) + tours,
      totalEarnings: (guide.totalEarnings || 0) + earnings,
    });
  }

  // Statistics
  async getStats(): Promise<{
    totalBookings: number;
    pendingRequests: number;
    activeGuides: number;
    todaysTours: number;
    weeklyRevenue: number;
    monthlyGrowth: number;
  }> {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: allBookings } = await this.supabase.from("bookings").select("*");
    const { count: activeGuides } = await this.supabase.from("guides").select("*", { count: 'exact', head: true }).eq("is_active", true);
    const { count: todaysTours } = await this.supabase.from("bookings").select("*", { count: 'exact', head: true }).eq("visit_date", today);

    const bookings = allBookings || [];

    const weeklyBookings = bookings.filter(
      (b) => b.visit_date >= weekAgo && (b.status === "completed" || b.payment_status === "paid")
    );
    const weeklyRevenue = weeklyBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const thisMonthBookings = bookings.filter((b) => b.created_at && b.created_at >= monthAgo);
    const lastMonthBookings = bookings.filter(
      (b) => b.created_at && b.created_at >= twoMonthsAgo && b.created_at < monthAgo
    );

    const monthlyGrowth = lastMonthBookings.length > 0
      ? Math.round(((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100)
      : thisMonthBookings.length > 0 ? 100 : 0;

    return {
      totalBookings: bookings.length,
      pendingRequests: bookings.filter((b) => b.status === "pending").length,
      activeGuides: activeGuides || 0,
      todaysTours: todaysTours || 0,
      weeklyRevenue,
      monthlyGrowth,
    };
  }

  // Revenue Analytics
  async getRevenueStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    byPaymentMethod: Record<string, number>;
    byGroupSize: Record<string, number>;
  }> {
    const { data: bookings } = await this.supabase.from("bookings").select("*");

    const filteredBookings = (bookings || []).filter(
      (b) =>
        b.created_at &&
        new Date(b.created_at) >= startDate &&
        new Date(b.created_at) <= endDate &&
        b.payment_status === "paid"
    );

    const total = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const byPaymentMethod: Record<string, number> = {};
    const byGroupSize: Record<string, number> = {};

    filteredBookings.forEach((b) => {
      const method = b.payment_method || "unknown";
      const size = b.group_size || "unknown";

      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + (b.total_amount || 0);
      byGroupSize[size] = (byGroupSize[size] || 0) + (b.total_amount || 0);
    });

    return { total, byPaymentMethod, byGroupSize };
  }

  // Comprehensive Revenue Dashboard
  async getRevenueDashboard(): Promise<{
    totalRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    pendingRevenue: number;
    refundedAmount: number;
    byPaymentMethod: { method: string; amount: number; count: number }[];
    byTourType: { type: string; amount: number; count: number }[];
    byPaymentStatus: { status: string; amount: number; count: number }[];
    recentTransactions: { id: string; reference: string; visitorName: string; amount: number; status: string; date: string }[];
    monthlyTrend: { month: string; revenue: number; bookings: number }[];
  }> {
    const { data: bookings, error } = await this.supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !bookings) {
      console.error("Error fetching bookings for revenue:", error);
      return {
        totalRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0,
        pendingRevenue: 0, refundedAmount: 0, byPaymentMethod: [],
        byTourType: [], byPaymentStatus: [], recentTransactions: [], monthlyTrend: []
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate totals
    let totalRevenue = 0, weeklyRevenue = 0, monthlyRevenue = 0, pendingRevenue = 0, refundedAmount = 0;
    const paymentMethodMap: Record<string, { amount: number; count: number }> = {};
    const tourTypeMap: Record<string, { amount: number; count: number }> = {};
    const paymentStatusMap: Record<string, { amount: number; count: number }> = {};

    bookings.forEach((b: any) => {
      const amount = b.total_amount || 0;
      const createdAt = new Date(b.created_at);
      const paymentStatus = b.payment_status || "pending";
      const paymentMethod = b.payment_method || "unknown";
      const tourType = b.tour_type || "standard";

      // Total by payment status
      if (paymentStatus === "paid") {
        totalRevenue += amount;
        if (createdAt >= oneWeekAgo) weeklyRevenue += amount;
        if (createdAt >= oneMonthAgo) monthlyRevenue += amount;
      } else if (paymentStatus === "pending") {
        pendingRevenue += amount;
      } else if (paymentStatus === "refunded") {
        refundedAmount += amount;
      }

      // By payment method (only paid)
      if (paymentStatus === "paid") {
        if (!paymentMethodMap[paymentMethod]) paymentMethodMap[paymentMethod] = { amount: 0, count: 0 };
        paymentMethodMap[paymentMethod].amount += amount;
        paymentMethodMap[paymentMethod].count += 1;
      }

      // By tour type
      if (!tourTypeMap[tourType]) tourTypeMap[tourType] = { amount: 0, count: 0 };
      tourTypeMap[tourType].amount += amount;
      tourTypeMap[tourType].count += 1;

      // By payment status
      if (!paymentStatusMap[paymentStatus]) paymentStatusMap[paymentStatus] = { amount: 0, count: 0 };
      paymentStatusMap[paymentStatus].amount += amount;
      paymentStatusMap[paymentStatus].count += 1;
    });

    // Convert maps to arrays
    const byPaymentMethod = Object.entries(paymentMethodMap).map(([method, data]) => ({
      method, amount: data.amount, count: data.count
    }));
    const byTourType = Object.entries(tourTypeMap).map(([type, data]) => ({
      type, amount: data.amount, count: data.count
    }));
    const byPaymentStatus = Object.entries(paymentStatusMap).map(([status, data]) => ({
      status, amount: data.amount, count: data.count
    }));

    // Recent transactions
    const recentTransactions = bookings.slice(0, 10).map((b: any) => ({
      id: b.id,
      reference: b.booking_reference || b.id.slice(0, 8),
      visitorName: b.visitor_name,
      amount: b.total_amount || 0,
      status: b.payment_status || "pending",
      date: new Date(b.created_at).toLocaleDateString()
    }));

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; revenue: number; bookings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleDateString("en", { month: "short" });

      let revenue = 0, count = 0;
      bookings.forEach((b: any) => {
        const bookingDate = new Date(b.created_at);
        if (bookingDate >= monthDate && bookingDate <= monthEnd && b.payment_status === "paid") {
          revenue += b.total_amount || 0;
          count += 1;
        }
      });
      monthlyTrend.push({ month: monthName, revenue, bookings: count });
    }

    return {
      totalRevenue, weeklyRevenue, monthlyRevenue, pendingRevenue, refundedAmount,
      byPaymentMethod, byTourType, byPaymentStatus, recentTransactions, monthlyTrend
    };
  }

  // User Management Stats
  async getUserStats(): Promise<{
    totalUsers: number;
    byRole: Record<string, number>;
    recentActivity: { action: string; userId: string; userName: string; timestamp: Date }[];
  }> {
    const { data: users } = await this.supabase.from("users").select("*");
    const { data: logs } = await this.supabase
      .from("audit_logs")
      .select("*, users(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(10);

    const userList = users || [];
    const byRole: Record<string, number> = {};

    userList.forEach(u => {
      const role = u.role || "visitor";
      byRole[role] = (byRole[role] || 0) + 1;
    });

    const recentActivity = (logs || []).map((log: any) => ({
      action: log.action,
      userId: log.user_id,
      userName: log.users ? `${log.users.first_name} ${log.users.last_name}` : "Unknown",
      timestamp: new Date(log.created_at)
    }));

    return {
      totalUsers: userList.length,
      byRole,
      recentActivity
    };
  }

  // Notification operations
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformToCamel<Notification>);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert(transformToSnake(notification))
      .select()
      .single();

    if (error) throw error;
    return transformToCamel<Notification>(data);
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data ? transformToCamel<Notification>(data) : undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  }

  async deleteNotification(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Email Template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .order("name");
    return this.handleResponse(data, error);
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const snakeData = transformToSnake(template);
    const { data, error } = await this.supabase
      .from("email_templates")
      .update({ ...snakeData, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async toggleEmailTemplateStatus(id: string, isActive: boolean): Promise<EmailTemplate | undefined> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .update({ is_active: isActive, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  // CMS Operations
  async getContentBlocks(): Promise<ContentBlock[]> {
    const { data, error } = await this.supabase
      .from("content_blocks")
      .select("*");
    return this.handleResponse(data, error);
  }

  async getContentBlock(key: string): Promise<ContentBlock | undefined> {
    const { data, error } = await this.supabase
      .from("content_blocks")
      .select("*")
      .eq("key", key)
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async updateContentBlock(key: string, value: string, userId: string): Promise<ContentBlock | undefined> {
    // Check if exists
    const existing = await this.getContentBlock(key);

    if (existing) {
      const { data, error } = await this.supabase
        .from("content_blocks")
        .update({ value, last_updated_by: userId, updated_at: new Date() })
        .eq("key", key)
        .select()
        .single();
      return this.handleOptionalResponse(data, error);
    } else {
      // Insert new (fallback if migration didn't run for some keys)
      const { data, error } = await this.supabase
        .from("content_blocks")
        .insert({
          section: "general", // Default section if creating dynamically
          key,
          value,
          last_updated_by: userId
        })
        .select()
        .single();
      return this.handleResponse(data, error);
    }
  }

  // IP Whitelist Operations
  async getAllowedIps(): Promise<AllowedIp[]> {
    const { data, error } = await this.supabase
      .from("allowed_ips")
      .select("*")
      .order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async createAllowedIp(ip: InsertAllowedIp): Promise<AllowedIp> {
    const snakeData = transformToSnake(ip);
    const { data, error } = await this.supabase
      .from("allowed_ips")
      .insert(snakeData)
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async deleteAllowedIp(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("allowed_ips")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async checkIpAllowed(ip: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("allowed_ips")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    // If whitelist is empty, allow all
    if (count === 0) return true;

    // Check if IP is in whitelist
    const { data } = await this.supabase
      .from("allowed_ips")
      .select("*")
      .eq("ip_address", ip)
      .single();

    return !!data;
  }

  // Login History Operations
  async getLoginHistory(limit: number = 100): Promise<LoginHistory[]> {
    const { data, error } = await this.supabase
      .from("login_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return this.handleResponse(data, error);
  }

  async getUserLoginHistory(userId: string, limit: number = 50): Promise<LoginHistory[]> {
    const { data, error } = await this.supabase
      .from("login_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return this.handleResponse(data, error);
  }

  async createLoginRecord(record: InsertLoginHistory): Promise<LoginHistory> {
    const snakeData = transformToSnake(record);
    const { data, error } = await this.supabase
      .from("login_history")
      .insert(snakeData)
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  // User Invite Operations
  async getInvites(): Promise<UserInvite[]> {
    const { data, error } = await this.supabase
      .from("user_invites")
      .select("*")
      .order("created_at", { ascending: false });
    return this.handleResponse(data, error);
  }

  async getInviteByToken(token: string): Promise<UserInvite | undefined> {
    const { data, error } = await this.supabase
      .from("user_invites")
      .select("*")
      .eq("invite_token", token)
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async getInviteByEmail(email: string): Promise<UserInvite | undefined> {
    const { data, error } = await this.supabase
      .from("user_invites")
      .select("*")
      .eq("email", email)
      .is("accepted_at", null)
      .single();
    if (error && error.code === 'PGRST116') return undefined;
    return this.handleOptionalResponse(data, error);
  }

  async createInvite(invite: InsertUserInvite): Promise<UserInvite> {
    const snakeData = transformToSnake(invite);
    const { data, error } = await this.supabase
      .from("user_invites")
      .insert(snakeData)
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async acceptInvite(id: string): Promise<UserInvite | undefined> {
    const { data, error } = await this.supabase
      .from("user_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async deleteInvite(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("user_invites")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  // Training Module operations
  async getTrainingModules(): Promise<TrainingModule[]> {
    const { data, error } = await this.supabase
      .from("training_modules")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return this.handleResponse(data || [], error);
  }

  async getGuideTrainingModules(): Promise<TrainingModule[]> {
    const { data, error } = await this.supabase
      .from("training_modules")
      .select("*")
      .eq("is_active", true)
      .in("target_audience", ["guide", "both"])
      .order("sort_order", { ascending: true });
    return this.handleResponse(data || [], error);
  }

  async getVisitorResources(): Promise<TrainingModule[]> {
    const { data, error } = await this.supabase
      .from("training_modules")
      .select("*")
      .eq("is_active", true)
      .in("target_audience", ["visitor", "both"])
      .order("sort_order", { ascending: true });
    return this.handleResponse(data || [], error);
  }

  async getTrainingModule(id: string): Promise<TrainingModule | undefined> {
    const { data, error } = await this.supabase
      .from("training_modules")
      .select("*")
      .eq("id", id)
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const snakeData = transformToSnake(module);
    const { data, error } = await this.supabase
      .from("training_modules")
      .insert(snakeData)
      .select()
      .single();
    return this.handleResponse(data, error);
  }

  async updateTrainingModule(id: string, module: Partial<TrainingModule>): Promise<TrainingModule | undefined> {
    const snakeData = transformToSnake({ ...module, updatedAt: new Date().toISOString() });
    const { data, error } = await this.supabase
      .from("training_modules")
      .update(snakeData)
      .eq("id", id)
      .select()
      .single();
    return this.handleOptionalResponse(data, error);
  }

  async deleteTrainingModule(id: string): Promise<void> {
    // Soft delete by setting is_active to false
    const { error } = await this.supabase
      .from("training_modules")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  // Guide Training Progress operations
  async getGuideTrainingProgress(guideId: string): Promise<GuideTrainingProgress[]> {
    const { data, error } = await this.supabase
      .from("guide_training_progress")
      .select("*")
      .eq("guide_id", guideId);
    return this.handleResponse(data || [], error);
  }

  async updateGuideTrainingProgress(
    guideId: string,
    moduleId: string,
    status: TrainingProgressStatus,
    notes?: string
  ): Promise<GuideTrainingProgress> {
    // First check if progress record exists
    const { data: existing } = await this.supabase
      .from("guide_training_progress")
      .select("*")
      .eq("guide_id", guideId)
      .eq("module_id", moduleId)
      .single();

    const progressData: any = {
      guide_id: guideId,
      module_id: moduleId,
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      progressData.notes = notes;
    }

    if (status === "completed") {
      progressData.completed_at = new Date().toISOString();
    }

    if (existing) {
      // Update existing record
      const { data, error } = await this.supabase
        .from("guide_training_progress")
        .update(progressData)
        .eq("id", existing.id)
        .select()
        .single();
      return this.handleResponse(data, error);
    } else {
      // Create new progress record
      const { data, error } = await this.supabase
        .from("guide_training_progress")
        .insert(progressData)
        .select()
        .single();
      return this.handleResponse(data, error);
    }
  }

  async getGuideTrainingStats(guideId: string): Promise<{ completed: number; total: number; percentage: number }> {
    // Get all active required modules for guides
    const { data: modules } = await this.supabase
      .from("training_modules")
      .select("id")
      .eq("is_active", true)
      .eq("is_required", true)
      .in("target_audience", ["guide", "both"]);

    const totalModules = modules?.length || 0;

    // Get completed progress for this guide
    const { data: progress } = await this.supabase
      .from("guide_training_progress")
      .select("*")
      .eq("guide_id", guideId)
      .eq("status", "completed");

    const completedCount = progress?.length || 0;
    const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return {
      completed: completedCount,
      total: totalModules,
      percentage,
    };
  }

  async getAllGuidesTrainingStats(): Promise<Array<{ guide: Guide; completed: number; total: number; percentage: number }>> {
    // Get all guides
    const guides = await this.getGuides();

    // Get all required guide training modules
    const { data: modules } = await this.supabase
      .from("training_modules")
      .select("id")
      .eq("is_active", true)
      .eq("is_required", true)
      .in("target_audience", ["guide", "both"]);

    const totalModules = modules?.length || 0;

    // Get all training progress
    const { data: allProgress } = await this.supabase
      .from("guide_training_progress")
      .select("*")
      .eq("status", "completed");

    // Calculate stats for each guide
    const results = guides.map(guide => {
      const guideProgress = allProgress?.filter(p => p.guide_id === guide.id) || [];
      const completedCount = guideProgress.length;
      const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

      return {
        guide,
        completed: completedCount,
        total: totalModules,
        percentage,
      };
    });

    // Sort by percentage descending
    return results.sort((a, b) => b.percentage - a.percentage);
  }
}

export const storage = new SupabaseStorage();

