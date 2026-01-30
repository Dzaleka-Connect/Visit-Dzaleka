/// <reference path="./types.d.ts" />
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./auth";
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
  type UserRole,
  type Booking,
} from "@shared/schema";
import { generateIcalFeed, parseIcalFeed } from "./lib/ical";
import { z } from "zod";
import {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendCustomEmail,
  sendGuideAssignment,
  sendCheckInNotification,
  sendPasswordReset,
  sendInvitationEmail,
  sendItineraryEmail
} from "./email";
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
import crypto from "crypto";

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

// Session-based authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
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

// Role-based access control middleware (session-based)
function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint - exempt from IP whitelist for monitoring
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connectivity with a lightweight query
      const zones = await storage.getZones();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        zonesCount: zones.length
      });
    } catch (error) {
      logError("Health check failed", error, req.requestId);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected"
      });
    }
  });

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
  app.get("/api/customers", requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const bookings = await storage.getBookings();

      const visitors = users.filter(u => u.role === "visitor");
      const customerStats = visitors.map(user => {
        const userBookings = bookings.filter(b => b.visitorUserId === user.id || b.visitorEmail === user.email);
        const totalVisits = userBookings.filter(b => b.status === "completed").length;
        const totalSpend = userBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const lastVisit = userBookings
          .filter(b => b.visitDate)
          .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0]?.visitDate;

        return {
          ...user,
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
  app.get("/api/customers/:id", requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "Customer not found" });

      const bookings = await storage.getBookings();
      const userBookings = bookings.filter(b => b.visitorUserId === user.id || b.visitorEmail === user.email);

      const stats = {
        totalVisits: userBookings.filter(b => b.status === "completed").length,
        totalSpend: userBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
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
  app.patch("/api/customers/:id", requireRole("admin", "coordinator"), async (req, res) => {
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
  app.get("/api/auth/session-status", (req, res) => {
    res.json({
      hasSession: !!req.session,
      hasUserId: !!req.session?.userId,
      sessionId: req.sessionID ? req.sessionID.substring(0, 8) + '...' : null,
      cookieSettings: {
        secure: req.session?.cookie?.secure,
        sameSite: req.session?.cookie?.sameSite,
        httpOnly: req.session?.cookie?.httpOnly,
      },
    });
  });

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

      // Regenerate session for security
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Set session after regeneration
      req.session.userId = user.id;
      req.session.userRole = user.role || "visitor";

      // Audit log
      await createAuditLog(user.id, "create", "user", user.id, null, { email, firstName, lastName }, req);

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

      // Set session userId and role
      req.session.userId = user.id;
      req.session.userRole = user.role || "visitor";

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
      res.clearCookie("connect.sid");
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
      const validRole = ["admin", "coordinator", "guide", "security", "visitor"].includes(role) ? role : "visitor";
      const user = await storage.createUser(email, hashedPassword, firstName, lastName, validRole);

      // Audit log
      await createAuditLog(req.session?.userId, "create", "user", user.id, null, { email, firstName, lastName, role: validRole }, req);

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
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;

      try {
        await sendPasswordReset({
          userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          userEmail: user.email,
          resetToken,
          resetUrl,
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
      const { firstName, lastName, phone, profileImageUrl, emailNotifications } = req.body;

      // Build update object, filtering out undefined values
      const updates: Record<string, any> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
      if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;

      const user = await storage.updateUserProfile(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      logError("Error updating profile", error, req.requestId);
      res.status(500).json({ message: "Failed to update profile" });
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
          const guideTours = bookings.filter(
            b => b.assignedGuideId === guide.id && b.status === 'completed'
          );
          const allGuideTours = bookings.filter(b => b.assignedGuideId === guide.id);
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

      // Initialize all guides
      guides.forEach(guide => {
        guideStats[guide.id] = { assigned: 0, completed: 0, cancelled: 0 };
      });

      // Count bookings per guide
      bookings.forEach(booking => {
        if (booking.assignedGuideId && guideStats[booking.assignedGuideId]) {
          guideStats[booking.assignedGuideId].assigned++;
          if (booking.status === "completed") {
            guideStats[booking.assignedGuideId].completed++;
          } else if (booking.status === "cancelled") {
            guideStats[booking.assignedGuideId].cancelled++;
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
  app.get("/api/bookings", isAuthenticated, requireRole("admin", "coordinator", "security", "guide"), async (req: any, res) => {
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
          bookingsList = bookingsList.filter(b => b.assignedGuideId === guideProfile.id);
        } else {
          // No guide profile - return empty list
          bookingsList = [];
        }
      }

      // Batch fetch guides
      const guideIds = Array.from(new Set(bookingsList.map(b => b.assignedGuideId).filter(Boolean) as string[]));
      const guides = await storage.getGuidesByIds(guideIds);
      const guidesMap = new Map(guides.map(g => [g.id, g]));

      const bookingsWithGuides = bookingsList.map(booking => ({
        ...booking,
        guide: booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null
      }));

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

      // Attach guides
      const guideIds = Array.from(new Set(bookings.map(b => b.assignedGuideId).filter(Boolean) as string[]));
      const guides = await storage.getGuidesByIds(guideIds);
      const guidesMap = new Map(guides.map(g => [g.id, g]));

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

      // Batch fetch guides
      const guideIds = Array.from(new Set(recentBookings.map(b => b.assignedGuideId).filter(Boolean) as string[]));
      const guides = await storage.getGuidesByIds(guideIds);
      const guidesMap = new Map(guides.map(g => [g.id, g]));

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

  app.get("/api/bookings/today", isAuthenticated, requireRole("admin", "coordinator", "security", "guide"), async (req, res) => {
    try {
      const todaysBookings = await storage.getTodaysBookings();

      // Batch fetch guides
      const guideIds = Array.from(new Set(todaysBookings.map(b => b.assignedGuideId).filter(Boolean) as string[]));
      const guides = await storage.getGuidesByIds(guideIds);
      const guidesMap = new Map(guides.map(g => [g.id, g]));

      const bookingsWithGuides = todaysBookings.map(booking => ({
        ...booking,
        guide: booking.assignedGuideId ? guidesMap.get(booking.assignedGuideId) || null : null
      }));

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

      // Batch fetch guides
      const guideIds = Array.from(new Set(activeVisits.map(b => b.assignedGuideId).filter(Boolean) as string[]));
      const guides = await storage.getGuidesByIds(guideIds);
      const guidesMap = new Map(guides.map(g => [g.id, g]));

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
  app.get("/api/bookings/my-bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get bookings by visitor user ID or email
      const allBookings = await storage.getBookings();
      const myBookings = allBookings.filter(b =>
        b.visitorUserId === userId || b.visitorEmail === user.email
      );

      // Add guide details to each booking
      const guides = await storage.getGuides();
      const bookingsWithGuide = myBookings.map(booking => {
        const guide = booking.assignedGuideId
          ? guides.find(g => g.id === booking.assignedGuideId)
          : null;
        return {
          ...booking,
          guide: guide ? {
            id: guide.id,
            firstName: guide.firstName,
            lastName: guide.lastName,
            phone: guide.phone,
            profileImageUrl: guide.profileImageUrl,
            languages: guide.languages,
            bio: guide.bio,
            specialties: guide.specialties,
            rating: guide.rating,
          } : null
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
  app.get("/api/visitors/saved-itineraries", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/visitors/saved-itineraries", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/visitors/saved-itineraries/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/visitors/favorite-guides", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/visitors/favorite-guides/:guideId", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/visitors/favorite-guides/:guideId", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/visitors/export-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all completed bookings for this user
      const allBookings = await storage.getBookings();
      const completedBookings = allBookings.filter(b =>
        (b.visitorUserId === userId || b.visitorEmail === user.email) &&
        b.status === "completed"
      );

      // Get guide details
      const guides = await storage.getGuides();
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
            ? guides.find(g => g.id === booking.assignedGuideId)
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
  app.get("/api/bookings/my-tours", isAuthenticated, async (req, res) => {
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
      const myTours = allBookings.filter(b => b.assignedGuideId === myGuide.id);
      res.json(myTours);
    } catch (error) {
      logError("Error fetching my tours", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  // Verify booking by reference (public endpoint for security check)
  app.get("/api/bookings/verify/:reference", async (req, res) => {
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
      const isIdMatch = booking.visitorUserId && req.session?.userId && booking.visitorUserId.toString() === req.session.userId.toString();
      const isEmailMatch = user && booking.visitorEmail === user.email;

      const isOwner = isIdMatch || isEmailMatch;
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
  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Authorization check
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isVisitor = user.role === "visitor";
      const isGuide = user.role === "guide";
      const isAdminOrCoord = ["admin", "coordinator", "security"].includes(user.role || "");

      if (isVisitor && booking.visitorUserId !== user.id && booking.visitorEmail !== user.email) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (isGuide) {
        const guide = await storage.getGuideByUserId(user.id);
        if (!guide || guide.id !== booking.assignedGuideId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // If not admin/coord and access not granted above, block (though logic above handles visitor/guide specific checks)
      // Actually simpler:
      if (!isAdminOrCoord) {
        if (isVisitor && booking.visitorUserId !== user.id && booking.visitorEmail !== user.email) {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (isGuide) {
          const guide = await storage.getGuideByUserId(user.id);
          if (!guide || guide.id !== booking.assignedGuideId) {
            return res.status(403).json({ message: "Forbidden" });
          }
        }
      }

      // Fetch guide details if assigned
      let guide = null;
      if (booking.assignedGuideId) {
        guide = await storage.getGuide(booking.assignedGuideId);
      }

      res.json({ ...booking, guide });
    } catch (error) {
      logError("Error fetching booking details", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch booking details" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const totalAmount = await calculateTotalAmount(
        bookingData.groupSize,
        bookingData.tourType,
        bookingData.customDuration || undefined
      );
      const booking = await storage.createBooking({
        ...bookingData,
        totalAmount,
      });

      // Send confirmation email
      const meetingPoint = bookingData.meetingPointId
        ? await storage.getMeetingPoint(bookingData.meetingPointId)
        : null;

      await sendBookingConfirmation({
        visitorName: booking.visitorName,
        visitorEmail: booking.visitorEmail,
        bookingReference: booking.bookingReference!,
        visitDate: booking.visitDate,
        visitTime: booking.visitTime,
        tourType: booking.tourType,
        numberOfPeople: booking.numberOfPeople || 1,
        totalAmount: booking.totalAmount || 0,
        meetingPoint: meetingPoint?.name,
      });

      // Notify admins/coordinators
      await notifyBookingCreated(
        booking.id,
        booking.visitorName,
        booking.visitDate
      );

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

  // Create historical booking (admin only) - for importing past visits
  app.post("/api/bookings/historical", isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const {
        visitorName,
        visitorEmail,
        visitorPhone,
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

      // Validate required fields
      if (!visitorName || !visitorEmail || !visitDate) {
        return res.status(400).json({ message: "Visitor name, email, and visit date are required" });
      }

      // Validate that the date is in the past
      const visitDateObj = new Date(visitDate);
      if (visitDateObj > new Date()) {
        return res.status(400).json({ message: "Historical bookings must have a past date" });
      }

      // Calculate amount if not provided
      const finalAmount = totalAmount || await calculateTotalAmount(
        groupSize || "individual",
        tourType || "standard",
        undefined
      );

      // Create the booking with completed status
      const booking = await storage.createBooking({
        visitorName,
        visitorEmail,
        visitorPhone: visitorPhone || "",
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
            totalEarnings: (guide.totalEarnings || 0) + (finalAmount || 0),
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

  app.patch("/api/bookings/:id/status", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, version } = req.body;
      const oldBooking = await storage.getBooking(id);

      // Use optimistic locking if version is provided
      const booking = await storage.updateBookingStatus(id, status, version);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send status update email
      await sendStatusUpdate({
        visitorName: booking.visitorName,
        visitorEmail: booking.visitorEmail,
        bookingReference: booking.bookingReference!,
        oldStatus: oldBooking?.status || "pending",
        newStatus: status,
        visitDate: booking.visitDate,
        adminNotes: booking.adminNotes || undefined,
      });

      // Create audit log
      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "booking", id,
          { status: oldBooking?.status }, { status }, req);
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

      res.json(booking);
    } catch (error) {
      logError("Error rescheduling booking", error, req.requestId);
      res.status(500).json({ message: "Failed to reschedule booking" });
    }
  });

  // Get booking activity log (timeline)
  app.get("/api/bookings/:id/activity", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const activities = await storage.getBookingActivityLogs(id);
      res.json(activities);
    } catch (error) {
      logError("Error fetching booking activity", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch booking activity" });
    }
  });

  // Payment verification endpoint - admin and coordinator only
  app.patch("/api/bookings/:id/payment", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentReference } = req.body;
      const userId = req.session?.userId;

      const oldBooking = await storage.getBooking(id);
      const booking = await storage.updateBookingPaymentStatus(id, paymentStatus, userId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Create audit log
      if (userId) {
        await createAuditLog(userId, "verify", "payment", id,
          { paymentStatus: oldBooking?.paymentStatus },
          { paymentStatus, paymentReference }, req);
      }

      res.json(booking);
    } catch (error) {
      logError("Error updating payment status", error, req.requestId);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Visitor can mark their own booking payment (visitor endpoint)
  app.patch("/api/bookings/:id/visitor-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const userId = req.session?.userId;

      // Get booking and verify ownership
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify this booking belongs to the current user
      if (booking.visitorUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }

      // Update payment status
      const updated = await storage.updateBookingPaymentStatus(id, paymentStatus, userId);

      // Create audit log
      if (userId) {
        await createAuditLog(userId, "update", "payment", id,
          { paymentStatus: booking.paymentStatus },
          { paymentStatus }, req);
      }

      res.json(updated);
    } catch (error) {
      logError("Error updating visitor payment status", error, req.requestId);
      res.status(500).json({ message: "Failed to update payment status" });
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
      if (!user || (booking.visitorUserId !== userId && booking.visitorEmail !== user.email)) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Only allow cancellation of pending or confirmed bookings
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return res.status(400).json({ message: "Only pending or confirmed bookings can be cancelled" });
      }

      // Update booking status
      const updated = await storage.updateBookingStatus(id, "cancelled");

      // Get guideUserId if assigned
      let guideUserId;
      if (booking.assignedGuideId) {
        const guide = await storage.getGuide(booking.assignedGuideId);
        if (guide) guideUserId = guide.userId;
      }

      // Notify Admins and Guide
      await notifyBookingCancelledByVisitor(id, booking.visitorName, booking.bookingReference!, guideUserId || undefined);

      // Email Visitor
      await sendStatusUpdate({
        visitorName: booking.visitorName,
        visitorEmail: booking.visitorEmail,
        bookingReference: booking.bookingReference!,
        oldStatus: booking.status,
        newStatus: "cancelled",
        visitDate: String(booking.visitDate),
        adminNotes: "Cancelled by visitor"
      });

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
        { status: "cancelled" }, req);

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
      if (!user || (booking.visitorUserId !== userId && booking.visitorEmail !== user.email)) {
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

      // Update guide rating
      const guide = await storage.getGuide(booking.assignedGuideId);
      if (guide) {
        // Calculate new average rating
        const currentTotal = (guide.rating || 0) * (guide.totalRatings || 0);
        const newTotalRatings = (guide.totalRatings || 0) + 1;
        const newRating = Math.round((currentTotal + rating) / newTotalRatings);

        await storage.updateGuide(booking.assignedGuideId, {
          rating: newRating,
          totalRatings: newTotalRatings
        });
      }

      // Save rating on booking
      await storage.updateBookingRating(id, rating);

      // Create audit log
      await createAuditLog(userId, "create", "guide_rating", booking.assignedGuideId,
        null, { rating, bookingId: id }, req);

      // Notify admins if rating is low (<= 3)
      if (rating <= 3) {
        const guideName = guide ? `${guide.firstName} ${guide.lastName}` : "Unknown Guide";
        await notifyLowRatingReceived(id, guideName, rating, booking.visitorName);
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
      const booking = await storage.assignGuideToBooking(id, guideId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get guide info and send email
      const guide = await storage.getGuide(guideId);
      const meetingPoint = booking.meetingPointId
        ? await storage.getMeetingPoint(booking.meetingPointId)
        : null;

      if (guide) {
        await sendGuideAssignment({
          visitorName: booking.visitorName,
          visitorEmail: booking.visitorEmail,
          bookingReference: booking.bookingReference!,
          guideName: `${guide.firstName} ${guide.lastName}`,
          guidePhone: guide.phone,
          visitDate: booking.visitDate,
          visitTime: booking.visitTime,
          meetingPoint: meetingPoint?.name,
        });
      }

      // Create audit log
      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "update", "booking", id,
          null, { assignedGuideId: guideId }, req);
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
        const guide = await storage.getGuide(booking.assignedGuideId);
        if (guide) {
          guideName = `${guide.firstName} ${guide.lastName}`;
        }
      }

      // Send check-in notification
      await sendCheckInNotification({
        visitorName: booking.visitorName,
        visitorEmail: booking.visitorEmail,
        bookingReference: booking.bookingReference!,
        checkInTime: new Date().toLocaleTimeString(),
        guideName,
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

      res.json(updatedBooking);
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

      const booking = await storage.updateBookingStatus(id, "completed");

      // Update guide stats if assigned
      if (oldBooking.assignedGuideId) {
        await storage.incrementGuideStats(
          oldBooking.assignedGuideId,
          1,
          oldBooking.totalAmount || 0
        );

        // Update guide rating if provided
        if (rating && rating >= 1 && rating <= 5) {
          await storage.updateGuideRating(oldBooking.assignedGuideId, rating);
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

  // Booking activity logs
  app.get("/api/bookings/:id/activity", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const logs = await storage.getBookingActivityLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      logError("Error fetching activity logs", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch activity logs" });
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
      res.json(guide);
    } catch (error) {
      logError("Error fetching guide profile", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide profile" });
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
      const guideBookings = allBookings.filter(b =>
        b.assignedGuideId === guide.id && b.status === "completed"
      );

      // Calculate earnings - use guidePayment if set, otherwise use 100% of totalAmount
      const GUIDE_PERCENTAGE = 1.0; // 100% of booking goes to guide

      const getEarnings = (booking: typeof allBookings[0]) => {
        if (booking.guidePayment && booking.guidePayment > 0) {
          return booking.guidePayment;
        }
        // Fallback: calculate as percentage of total amount
        return Math.round((booking.totalAmount || 0) * GUIDE_PERCENTAGE);
      };

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalEarnings = guideBookings.reduce((sum, b) => sum + getEarnings(b), 0);
      const weeklyEarnings = guideBookings
        .filter(b => new Date(b.visitDate) >= startOfWeek)
        .reduce((sum, b) => sum + getEarnings(b), 0);
      const monthlyEarnings = guideBookings
        .filter(b => new Date(b.visitDate) >= startOfMonth)
        .reduce((sum, b) => sum + getEarnings(b), 0);

      // Get detailed earnings list
      const earningsList = guideBookings.map(b => ({
        id: b.id,
        visitorName: b.visitorName,
        visitDate: b.visitDate,
        tourType: b.tourType,
        numberOfPeople: b.numberOfPeople,
        guidePayment: getEarnings(b),
        totalAmount: b.totalAmount || 0,
      })).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

      res.json({
        totalEarnings,
        weeklyEarnings,
        monthlyEarnings,
        totalTours: guideBookings.length,
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
        .filter(b => b.assignedGuideId === guide.id)
        .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

      res.json(guideBookings);
    } catch (error) {
      logError("Error fetching guide tours", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tours" });
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

      if (booking.assignedGuideId !== guide.id) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      // Update status to in_progress
      const updatedBooking = await storage.updateBookingStatus(bookingId, "in_progress");

      // Log check-in with check-in time (note: checkInTime would need to be handled separately or via admin notes)
      await createAuditLog(userId, "check_in", "booking", bookingId,
        { status: booking.status }, { status: "in_progress" }, req);

      res.json(updatedBooking);
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

      if (booking.assignedGuideId !== guide.id) {
        return res.status(403).json({ message: "You are not assigned to this booking" });
      }

      // Update status to completed
      const updatedBooking = await storage.updateBookingStatus(bookingId, "completed");

      // Update guide's completed tours count
      await storage.updateGuide(guide.id, {
        completedTours: (guide.completedTours || 0) + 1,
        totalTours: (guide.totalTours || 0) + 1,
      });

      await createAuditLog(userId, "check_out", "booking", bookingId,
        { status: booking.status }, { status: "completed" }, req);

      res.json(updatedBooking);
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

      if (booking.assignedGuideId !== guide.id) {
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

  app.get("/api/guides", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const guidesList = await storage.getGuides();
      res.json(guidesList);
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

      res.json(guide);
    } catch (error) {
      logError("Error fetching guide by slug", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide" });
    }
  });

  // Get bookings for a specific guide
  app.get("/api/guides/:id/bookings", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const guideBookings = bookings.filter(b => b.assignedGuideId === req.params.id);
      res.json(guideBookings);
    } catch (error) {
      logError("Error fetching guide bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch guide bookings" });
    }
  });

  // Smart Guide Suggestion - recommends best guide for a booking
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
        const guideBookings = allBookings.filter(b => b.assignedGuideId === guide.id);
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
            earnings: monthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
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
            totalTours: guide.totalTours || 0,
            completedTours: guide.completedTours || 0,
            totalEarnings: guide.totalEarnings || 0,
            rating: guide.rating || 0,
            totalRatings: guide.totalRatings || 0,
            avgVisitorRating: avgVisitorRating ? Math.round(avgVisitorRating * 10) / 10 : null,
            completionRate: guideBookings.length > 0
              ? Math.round((completedBookings.length / guideBookings.length) * 100)
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

  app.get("/api/bookings/recent", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      // Get 10 most recent bookings
      const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(gygBookings);
    } catch (error: any) {
      console.error("Failed to fetch GetYourGuide bookings:", error);
      res.status(500).send("Failed to fetch GetYourGuide bookings");
    }
  });

  app.get("/api/guides/:id", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const guide = await storage.getGuide(req.params.id);
      if (!guide) {
        return res.status(404).json({ message: "Guide not found" });
      }
      res.json(guide);
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
      const leaderboard = await storage.getGuideLeaderboard();
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

  // Get guide payment history
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

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify the user owns this booking
      if (booking.visitorUserId !== req.session.userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (booking.paymentStatus === "paid") {
        return res.status(400).json({ message: "Booking is already paid" });
      }

      const amount = booking.totalAmount || 0;
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid booking amount" });
      }

      // Create Stripe Checkout Session
      const protocol = req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}`;

      const session = await createCheckoutSession(
        bookingId,
        amount,
        "mwk",
        `${baseUrl}/my-bookings?payment_success=true&booking_id=${bookingId}`,
        `${baseUrl}/my-bookings?payment_cancel=true`,
        booking.visitorEmail,
        `Booking: ${booking.bookingReference}`
      );

      res.json({ checkoutUrl: session.url });
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
          netAmount: b.netAmount || 0,
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
      const stripeKey = process.env.STRIPE_SECRET_KEY || '';
      const isLiveMode = stripeKey.startsWith('sk_live_');

      res.json({
        isLiveMode,
        provider: 'stripe',
        currency: 'MWK'
      });
    } catch (error) {
      logError("Error fetching payment config", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch payment configuration" });
    }
  });

  // Stripe Balance Endpoint
  app.get("/api/admin/stripe/balance", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const stripe = (await import("./lib/stripe")).default;
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
      const { constructEvent } = await import("./lib/stripe");
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).send('Webhook Error: Missing signature');
      }

      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
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
        const session = event.data.object as any;
        const bookingId = session.client_reference_id;

        logger.info(`[Stripe Webhook] Payment successful for booking ${bookingId}`);

        if (bookingId) {
          await storage.updateBooking(bookingId, {
            paymentStatus: "paid",
            // Store Stripe Session ID as payment reference
            paymentReference: session.id,
            paymentVerifiedAt: new Date(),
          });

          // Optionally send confirmation email here
          // const booking = await storage.getBooking(bookingId);
          // if (booking) sendPaymentConfirmationEmail(booking);
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
      const { basicAuth } = await import("./middleware/basicAuth");

      // Verify Basic Auth
      await new Promise<void>((resolve, reject) => {
        basicAuth(req, res, (err?: any) => (err ? reject(err) : resolve()));
      });

      const { booking_id, product_id, datetime, participants, customer, total_price } = req.body;

      if (!booking_id || !product_id || !datetime || !customer) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const bookingReference = `GYG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const booking = await storage.createBooking({
        tourType: 'Community Tour',
        preferredDate: new Date(datetime),
        numberOfVisitors: participants || 1,
        visitorName: customer.name || '',
        visitorEmail: customer.email || '',
        visitorPhone: customer.phone || '',
        bookingReference,
        totalAmount: total_price || 0,
        paymentStatus: 'paid',
        paymentMethod: 'getyourguide',
        status: 'confirmed',
        bookingChannel: 'getyourguide',
        externalBookingId: booking_id,
        visitorsInterests: [],
        campZones: [],
      });

      logger.info(`✅ GetYourGuide booking: ${bookingReference}`);

      try {
        const { sendBookingConfirmation } = await import("./email");
        await sendBookingConfirmation(booking);
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
  app.get("/api/guides/:id/availability", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const availability = await storage.getGuideAvailability(req.params.id);
      res.json(availability);
    } catch (error) {
      logError("Error fetching availability", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/guides/:id/availability", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
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
      await storage.deleteGuideAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      logError("Error deleting availability", error, req.requestId);
      res.status(500).json({ message: "Failed to delete availability" });
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
      const userBookings = allBookings.filter(b =>
        b.visitorUserId === req.params.id || b.visitorEmail === user.email
      );

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
      const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      await sendCustomEmail({
        recipientEmail: user.email,
        recipientName: user.firstName || 'User',
        subject: 'Password Reset - Dzaleka Online Services',
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
      const publicList = zonesList.filter(z => z.isActive !== false).map(z => ({
        id: z.id,
        name: z.name,
        description: z.description,
        icon: z.icon,
      }));
      res.json(publicList);
    } catch (error) {
      logError("Error fetching public zones", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch zones" });
    }
  });

  // Zones endpoints - admin and coordinator can manage
  app.get("/api/zones", isAuthenticated, async (req, res) => {
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
      const publicList = poiList.filter(poi => poi.isActive !== false).map(poi => ({
        id: poi.id,
        name: poi.name,
        description: poi.description,
        category: poi.category,
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
      }));
      res.json(publicList);
    } catch (error) {
      logError("Error fetching public meeting points", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch meeting points" });
    }
  });

  // Meeting Points endpoints - admin and coordinator can manage
  app.get("/api/meeting-points", isAuthenticated, async (req, res) => {
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
      await storage.updatePricing(req.body);
      res.json({ success: true });
    } catch (error) {
      logError("Error updating pricing", error, req.requestId);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  // Calculate price endpoint (public for booking form)
  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { groupSize, tourType, customDuration } = req.body;
      const totalAmount = await calculateTotalAmount(groupSize, tourType, customDuration);
      res.json({ totalAmount });
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

      const success = await sendCustomEmail({
        recipientName: recipientName || "Valued Customer",
        recipientEmail,
        subject,
        message,
        senderName
      });

      if (success) {
        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: recipientName || null,
          recipientEmail,
          subject,
          message,
          templateType: "custom",
          status: "sent",
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

      const success = await sendItineraryEmail({
        ...data,
        senderName
      });

      if (success) {
        if (data.bookingId) {
          try {
            await storage.createItinerary({
              bookingId: data.bookingId,
              content: data
            });
          } catch (e) {
            logError("Failed to save itinerary to DB", e, req.requestId);
          }
        }

        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          subject: "Proposed Itinerary",
          message: [
            `Itinerary for ${data.recipientName} on ${data.date} (${data.duration})`,
            data.bookingReference ? `Ref: ${data.bookingReference}` : '',
            `\nTimeline:`,
            ...data.items.map((i: any) => `- ${i.time}: ${i.activity}`),
            (data.pois && data.pois.length > 0) ? `\nHighlights: ${data.pois.join(', ')}` : '',
            data.totalCost ? `Cost: ${data.totalCost}` : '',
            data.guideName ? `Guide: ${data.guideName}` : '',
            data.notes ? `\nNotes: ${data.notes}` : ''
          ].filter(Boolean).join('\n'),
          templateType: "itinerary",
          status: "sent",
        });
        res.json({ success: true, message: "Itinerary sent successfully" });
      } else {
        await storage.createEmailLog({
          sentBy: req.session?.userId,
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          subject: "Proposed Itinerary",
          message: "Failed to send",
          templateType: "itinerary",
          status: "failed",
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
      const logs = await storage.getEmailLogs();
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

      // Resend the email
      const success = await sendCustomEmail({
        recipientName: emailLog.recipientName || "",
        recipientEmail: emailLog.recipientEmail,
        subject: emailLog.subject,
        message: emailLog.message || "",
      });

      if (success) {
        // Update the email log status
        await storage.updateEmailLogStatus(id, "sent");
        res.json({ success: true, message: "Email resent successfully" });
      } else {
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
      // Platform revenue comes from other sources (not implemented yet)
      const GUIDE_SHARE_PERCENT = 100; // 100% to guides
      const PLATFORM_SHARE_PERCENT = 0;  // 0% to platform

      // Calculate actual guide earnings (100% of completed tour revenue)
      const completedPaidBookings = allBookings.filter(b =>
        (b.status === "completed" || b.status === "in_progress" || b.status === "confirmed") &&
        b.paymentStatus === "paid"
      );
      const totalGuideEarnings = completedPaidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

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
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      logError("Error fetching notifications", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const count = await storage.getUnreadNotificationCount(userId);
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
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
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
      await storage.deleteNotification(id);
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
        const guideBookings = bookings.filter(b =>
          b.status === 'completed' &&
          (b.assignedGuideId === guide.id || b.assignedGuideId === guide.userId)
        );

        // Separate by payment status
        const paidBookings = guideBookings.filter(b => b.paymentStatus === 'paid');
        const pendingBookings = guideBookings.filter(b => b.paymentStatus === 'pending');

        const paidRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalRevenue = paidRevenue + pendingRevenue;

        const guideShare = Math.round(paidRevenue * GUIDE_SHARE_PERCENTAGE);
        const platformShare = paidRevenue - guideShare;

        return {
          guideId: guide.id,
          guideName: `${guide.firstName} ${guide.lastName}`,
          completedTours: guideBookings.length,
          paidTours: paidBookings.length,
          pendingTours: pendingBookings.length,
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          guideShare, // Only calculated on paid revenue
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
      const inviteUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      const inviter = await storage.getUser(req.session.userId);

      await sendInvitationEmail({
        email,
        role,
        inviteUrl,
        inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : "Administrator"
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
        role: role || "visitor",
        inviteToken,
        invitedBy: req.session.userId,
        expiresAt
      });

      // Send invitation email
      const inviteUrl = `${req.protocol}://${req.get("host")}/accept-invite?token=${inviteToken}`;
      const currentUser = await storage.getUser(req.session.userId);
      const inviterName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";

      try {
        await sendInvitationEmail({
          email,
          role: role || "visitor",
          inviteUrl,
          inviterName
        });
      } catch (emailError) {
        logError("Failed to send invitation email", emailError, req.requestId);
        // Don't fail the request if email fails
      }

      await createAuditLog(req.session.userId, "create", "user_invite", invite.id, null, { email, role }, req);

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
      const inviteUrl = `${req.protocol}://${req.get("host")}/accept-invite?token=${newToken}`;
      const currentUser = await storage.getUser(req.session.userId);
      const inviterName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Admin";

      try {
        await sendInvitationEmail({
          email: invite.email,
          role: invite.role || "visitor",
          inviteUrl,
          inviterName
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

      // Regenerate session for security
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Set session after regeneration
      req.session.userId = user.id;
      req.session.userRole = user.role || "visitor";

      // Audit log
      await createAuditLog(user.id, "create", "user", user.id, null, { email: invite.email, role: invite.role }, req);

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

  // Get task by ID
  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
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

  // Get my tasks
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

  // Get task comments
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
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
      res.json(rooms);
    } catch (error) {
      logError("Error fetching chat rooms", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch chat rooms" });
    }
  });

  // Get a specific chat room
  app.get("/api/chat/rooms/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const room = await storage.getChatRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Chat room not found" });
      }
      res.json(room);
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

      // Verify user is a participant
      const participants = await storage.getChatParticipants(roomId);
      const isParticipant = participants.some(p => p.userId === userId);

      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant of this chat" });
      }

      await storage.deleteChatRoom(roomId);
      res.json({ message: "Chat history deleted" });
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
      const messages = await storage.getChatMessages(req.params.id, limit);

      // Update last read timestamp for current user
      const userId = req.session.userId!;
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

      // Get the message first to verify ownership
      const messages = await storage.getChatMessages("", 1000) as any[];
      const message = messages.find((m: any) => m.id === messageId);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
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
      const participants = await storage.getChatParticipants(req.params.id);
      res.json(participants);
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
        const allBookings = await storage.getBookings();
        const myBookings = allBookings.filter(b =>
          b.visitorUserId === userId || b.visitorEmail === currentUser.email
        );
        const assignedGuideIds = new Set(
          myBookings
            .filter(b => b.assignedGuideId)
            .map(b => b.assignedGuideId)
        );

        filteredUsers = filteredUsers.filter(u =>
          u.role === 'admin' || assignedGuideIds.has(u.id)
        );
      }
      // Staff (admin, coordinator, guide, security) can see all users

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

      let unreadCount = 0;
      for (const room of rooms) {
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

  // Get support tickets (admin sees all, users see their own)
  app.get("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userRole = req.session.userRole;

      // Admins see all tickets, others see only their own
      const tickets = await storage.getSupportTickets(
        userRole === "admin" ? undefined : userId
      );
      res.json(tickets);
    } catch (error) {
      logError("Error fetching support tickets", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Create support ticket
  app.post("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const ticketData = {
        ...req.body,
        userId,
      };
      const ticket = await storage.createSupportTicket(ticketData);

      // Notify admins about new ticket
      const user = await storage.getUser(userId);
      await notifySupportTicketCreated(ticket.id, ticketData.subject, user ? `${user.firstName} ${user.lastName}` : "User");

      res.status(201).json(ticket);
    } catch (error) {
      logError("Error creating support ticket", error, req.requestId);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Admin: Update support ticket
  app.put("/api/support/tickets/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updates = req.body;
      if (updates.status === "resolved") {
        updates.resolvedAt = new Date().toISOString();
      }
      const ticket = await storage.updateSupportTicket(req.params.id, updates);
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
      const bookingData = req.body;
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

  app.post("/api/recurring-bookings/:id/generate", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { id } = req.params;
      const { targetDate } = req.body; // Generate up to this date

      const recurring = await storage.getRecurringBooking(id);
      if (!recurring || !recurring.isActive) {
        return res.status(404).json({ message: "Recurring schedule not found or inactive" });
      }

      const endCap = targetDate ? new Date(targetDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
      const startCursor = recurring.lastGeneratedDate
        ? new Date(new Date(recurring.lastGeneratedDate).getTime() + 24 * 60 * 60 * 1000) // Start from day after last gen
        : new Date(recurring.startDate);

      if (startCursor < new Date()) {
        // Optionally enforce starting from today if last gen was long ago? 
        // For now allow backfilling if desired, or maybe max(startCursor, today)
      }

      const generatedBookings = [];
      const cursor = new Date(startCursor);

      while (cursor <= endCap) {
        let shouldBook = false;

        // Basic Frequency Logic
        if (recurring.frequency === 'weekly') {
          if (recurring.dayOfWeek !== null && cursor.getDay() === recurring.dayOfWeek) {
            shouldBook = true;
          }
        } else if (recurring.frequency === 'monthly') {
          // Ex: Same day of month (e.g. 15th)
          const startD = new Date(recurring.startDate);
          if (cursor.getDate() === startD.getDate()) {
            shouldBook = true;
          }
          // TODO: Implement "2nd Friday" logic if needed based on weekOfMonth
        }

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
            paymentMethod: "cash", // Default or needs adding to recurring schema
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
      }

      res.json({ generatedCount: generatedBookings.length, bookings: generatedBookings });
    } catch (error) {
      logError("Error generating bookings", error, req.requestId);
      res.status(500).json({ message: "Failed to generate bookings" });
    }
  });

  // Live Operations Stats
  app.get("/api/live-ops/stats", isAuthenticated, async (req, res) => {
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
  app.get("/api/calendars", requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const calendars = await storage.getExternalCalendars();
      res.json(calendars);
    } catch (error) {
      logError("Error fetching external calendars", error, req.requestId);
      res.status(500).json({ message: "Failed to fetch calendars" });
    }
  });

  // Create external calendar
  app.post("/api/calendars", requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const calendar = await storage.createExternalCalendar(req.body);
      res.status(201).json(calendar);
    } catch (error) {
      logError("Error creating external calendar", error, req.requestId);
      res.status(500).json({ message: "Failed to create calendar" });
    }
  });

  // Delete external calendar
  app.delete("/api/calendars/:id", requireRole("admin", "coordinator"), async (req, res) => {
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
    // In a real app, token would be verified against a user or setting.
    // For now, we'll allow public access or check a static token/ID.
    try {
      const bookings = await storage.getBookings(); // Retrieve all bookings
      const icalData = generateIcalFeed(bookings, "Visit Dzaleka Bookings");
      res.set('Content-Type', 'text/calendar; charset=utf-8');
      res.set('Content-Disposition', 'attachment; filename="calendar.ics"');
      res.send(icalData);
    } catch (error) {
      logError("Error generating iCal feed", error, req.requestId);
      res.status(500).send("Error generating feed");
    }
  });

  // Sync External Calendars (Import)
  app.post("/api/calendar/sync", requireRole("admin", "coordinator"), async (req, res) => {
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

  // ===== Page View Analytics =====

  // Track a page view (public endpoint - no auth required)
  app.post("/api/analytics/pageview", async (req: Request, res: Response) => {
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
        const email = b.visitorEmail.toLowerCase();
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

      // Generate a random API key: dvz_<32 random hex chars>
      const rawKey = `dvz_${crypto.randomBytes(24).toString('hex')}`;
      const keyPrefix = rawKey.substring(0, 12); // dvz_xxxxxxxx for display
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

  // Sync availability to GetYourGuide
  app.post("/api/getyourguide/sync-availability", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const { notifyAvailabilityUpdate } = await import('./lib/getyourguide');

      // Get next 30 days of bookings to calculate availability
      const bookings = await storage.getBookings();
      const today = new Date();
      const next30Days = new Date(today);
      next30Days.setDate(today.getDate() + 30);

      // For each day, calculate remaining spots and send to GetYourGuide
      const productId = process.env.GETYOURGUIDE_PRODUCT_ID || '1188868';
      const maxSpots = 20; // Configure based on your capacity

      // Group bookings by date
      const bookingsByDate = new Map<string, number>();
      bookings.forEach(booking => {
        const date = new Date(booking.visitDate).toISOString().split('T')[0];
        const current = bookingsByDate.get(date) || 0;
        bookingsByDate.set(date, current + (booking.numberOfPeople || 0));
      });

      // Send availability for next 30 days
      const promises = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const booked = bookingsByDate.get(dateStr) || 0;
        const available = Math.max(0, maxSpots - booked);

        promises.push(
          notifyAvailabilityUpdate(productId, date.toISOString(), available, false)
        );
      }

      await Promise.all(promises);

      res.json({ success: true, message: 'Availability synced successfully' });
    } catch (error: any) {
      console.error("Failed to sync availability:", error);
      res.status(500).json({ error: error.message });
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

  // Get analytics settings
  app.get("/api/settings/analytics", requireRole("admin", "coordinator"), async (req, res) => {
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
  app.patch("/api/settings/analytics", requireRole("admin"), async (req, res) => {
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

  return httpServer;
}
