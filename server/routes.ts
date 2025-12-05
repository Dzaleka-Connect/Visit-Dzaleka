import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
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
  type UserRole,
} from "@shared/schema";
import { z } from "zod";
import {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendCustomEmail,
  sendGuideAssignment,
  sendCheckInNotification,
  sendPasswordReset
} from "./email";
import {
  notifyBookingCreated,
  notifyBookingStatusChanged,
  notifyGuideAssigned,
  notifyCheckIn,
  notifyPaymentReceived,
} from "./notifications";
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

// Pricing calculation helper
const PRICING = {
  individual: 15000,
  small_group: 50000,
  large_group: 80000,
  custom: 100000,
  additional_hour: 10000,
};

function calculateTotalAmount(groupSize: string, tourType: string, customDuration?: number): number {
  const basePrice = PRICING[groupSize as keyof typeof PRICING] || PRICING.individual;

  if (tourType === "extended") {
    return basePrice + PRICING.additional_hour * 2;
  } else if (tourType === "custom" && customDuration) {
    const extraHours = Math.max(0, customDuration - 2);
    return basePrice + PRICING.additional_hour * extraHours;
  }

  return basePrice;
}

// Role-based access control middleware (session-based)
function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.role) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      (req as any).userRole = user.role;
      (req as any).currentUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
}

// Audit logging helper
async function createAuditLog(
  userId: string,
  action: "create" | "update" | "delete" | "login" | "logout" | "check_in" | "check_out" | "verify",
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
    console.error("Audit log error:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
          console.error(`Failed to send notification to user ${user.id}:`, e);
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
      console.error("Error sending notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
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

      // Audit log
      await createAuditLog(user.id, "create", "user", user.id, null, { email, firstName, lastName }, req);

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Failed to register" });
      }
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session userId 
      req.session.userId = user.id;

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
        console.error("Login error:", error);
        res.status(500).json({ message: "Failed to login" });
      }
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session?.userId;
    if (userId) {
      createAuditLog(userId, "logout", "user", userId, null, null, req);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
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
      console.error("Create user error:", error);
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
        console.error("Failed to send password reset email:", emailError);
        // Don't fail the request if email fails - user can retry
      }

      res.json({ message: "If an account exists with that email, we've sent password reset instructions." });
    } catch (error) {
      console.error("Forgot password error:", error);
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
      console.error("Reset password error:", error);
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
      console.error("Verify email error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Get current user (session-based)
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId!;
      const { firstName, lastName, phone } = req.body;

      const user = await storage.updateUserProfile(userId, { firstName, lastName, phone });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
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
      const validPassword = await comparePassword(currentPassword, user.password);
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
      console.error("Error changing password:", error);
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
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Stats endpoint - admin and coordinator only
  app.get("/api/stats", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
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
      console.error("Error fetching weekly stats:", error);
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

      let zoneData = Object.entries(zoneCounts)
        .map(([zoneId, visits]) => {
          const zone = zones.find(z => z.id === zoneId);
          return { name: zone?.name || zoneId.slice(0, 8), visits };
        })
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 6);

      // If no zone data, show zones with placeholder counts based on bookings
      if (zoneData.length === 0 && zones.length > 0) {
        zoneData = zones.slice(0, 5).map((zone, i) => ({
          name: zone.name,
          visits: Math.max(1, bookings.length - i * Math.floor(bookings.length / 5))
        }));
      }

      res.json(zoneData);
    } catch (error) {
      console.error("Error fetching zone stats:", error);
      res.status(500).json({ message: "Failed to fetch zone stats" });
    }
  });

  // Guide performance for bar chart
  app.get("/api/stats/guide-performance", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const guides = await storage.getGuides();
      const bookings = await storage.getBookings();

      let guideStats = guides
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

      // If no guide data, show placeholder with active guides
      if (guideStats.length === 0 && guides.length > 0) {
        guideStats = guides.filter(g => g.isActive).slice(0, 5).map(guide => ({
          name: `${guide.firstName} ${guide.lastName.charAt(0)}.`,
          tours: Math.floor(Math.random() * 10) + 1,
          rating: guide.rating || 4.5
        }));
      }

      res.json(guideStats);
    } catch (error) {
      console.error("Error fetching guide performance:", error);
      res.status(500).json({ message: "Failed to fetch guide performance" });
    }
  });

  // Bookings endpoints - admin, coordinator, security can view all bookings
  app.get("/api/bookings", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const bookingsList = await storage.getBookings();
      const bookingsWithGuides = await Promise.all(
        bookingsList.map(async (booking) => {
          if (booking.assignedGuideId) {
            const guide = await storage.getGuide(booking.assignedGuideId);
            return { ...booking, guide };
          }
          return booking;
        })
      );
      res.json(bookingsWithGuides);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/recent", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const recentBookings = await storage.getRecentBookings(10);
      const bookingsWithGuides = await Promise.all(
        recentBookings.map(async (booking) => {
          if (booking.assignedGuideId) {
            const guide = await storage.getGuide(booking.assignedGuideId);
            return { ...booking, guide };
          }
          return booking;
        })
      );
      res.json(bookingsWithGuides);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ message: "Failed to fetch recent bookings" });
    }
  });

  app.get("/api/bookings/today", isAuthenticated, requireRole("admin", "coordinator", "security", "guide"), async (req, res) => {
    try {
      const todaysBookings = await storage.getTodaysBookings();
      const bookingsWithGuides = await Promise.all(
        todaysBookings.map(async (booking) => {
          if (booking.assignedGuideId) {
            const guide = await storage.getGuide(booking.assignedGuideId);
            return { ...booking, guide };
          }
          return booking;
        })
      );
      res.json(bookingsWithGuides);
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
      res.status(500).json({ message: "Failed to fetch today's bookings" });
    }
  });

  // Active visits (checked in but not checked out) - security, admin, coordinator
  app.get("/api/bookings/active", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const activeVisits = await storage.getActiveVisits();
      const bookingsWithGuides = await Promise.all(
        activeVisits.map(async (booking) => {
          if (booking.assignedGuideId) {
            const guide = await storage.getGuide(booking.assignedGuideId);
            return { ...booking, guide };
          }
          return booking;
        })
      );
      res.json(bookingsWithGuides);
    } catch (error) {
      console.error("Error fetching active visits:", error);
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
      console.error("Error fetching my bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
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
      console.error("Error fetching my tours:", error);
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
      console.error("Error verifying booking:", error);
      res.status(500).json({ message: "Failed to verify booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const totalAmount = calculateTotalAmount(
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

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        console.error("Error creating booking:", error);
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
      const finalAmount = totalAmount || calculateTotalAmount(
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
      });

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
      console.error("Error creating historical booking:", error);
      // Log the full error object for debugging
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Stack:", error.stack);
      }
      // Return the specific error message to the client for debugging
      res.status(500).json({
        message: "Failed to create historical booking",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch("/api/bookings/:id/status", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const oldBooking = await storage.getBooking(id);
      const booking = await storage.updateBookingStatus(id, status);
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
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Get booking activity log (timeline)
  app.get("/api/bookings/:id/activity", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const activities = await storage.getBookingActivityLogs(id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching booking activity:", error);
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
      console.error("Error updating payment status:", error);
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
      console.error("Error updating visitor payment status:", error);
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
      console.error("Error cancelling booking:", error);
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
      // Save rating on booking
      await storage.updateBookingRating(id, rating);

      // Create audit log
      await createAuditLog(userId, "create", "guide_rating", booking.assignedGuideId,
        null, { rating, bookingId: id }, req);

      res.json({ success: true, message: "Guide rated successfully", rating });
    } catch (error) {
      console.error("Error rating guide:", error);
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
      console.error("Error assigning guide:", error);
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
      console.error("Error updating notes:", error);
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
      console.error("Error checking in visitor:", error);
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
      console.error("Error checking out visitor:", error);
      res.status(500).json({ message: "Failed to check out visitor" });
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
      console.error("Error starting tour:", error);
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
      console.error("Error completing tour:", error);
      res.status(500).json({ message: "Failed to complete tour" });
    }
  });

  // Booking companions endpoints
  app.get("/api/bookings/:id/companions", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const companions = await storage.getBookingCompanions(req.params.id);
      res.json(companions);
    } catch (error) {
      console.error("Error fetching companions:", error);
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
        console.error("Error creating companion:", error);
        res.status(500).json({ message: "Failed to create companion" });
      }
    }
  });

  app.delete("/api/bookings/:bookingId/companions/:id", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      await storage.deleteBookingCompanion(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting companion:", error);
      res.status(500).json({ message: "Failed to delete companion" });
    }
  });

  // Booking activity logs
  app.get("/api/bookings/:id/activity", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const logs = await storage.getBookingActivityLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
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
      console.error("Error fetching guide profile:", error);
      res.status(500).json({ message: "Failed to fetch guide profile" });
    }
  });

  app.get("/api/guides", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const guidesList = await storage.getGuides();
      res.json(guidesList);
    } catch (error) {
      console.error("Error fetching guides:", error);
      res.status(500).json({ message: "Failed to fetch guides" });
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
      console.error("Error fetching guide:", error);
      res.status(500).json({ message: "Failed to fetch guide" });
    }
  });

  app.post("/api/guides", isAuthenticated, requireRole("admin", "coordinator"), async (req: any, res) => {
    try {
      const guideData = insertGuideSchema.parse(req.body);
      const guide = await storage.createGuide(guideData);

      const userId = req.session?.userId;
      if (userId) {
        await createAuditLog(userId, "create", "guide", guide.id, null, guideData, req);
      }

      res.status(201).json(guide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid guide data", errors: error.errors });
      } else {
        console.error("Error creating guide:", error);
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
      console.error("Error updating guide:", error);
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
      console.error("Error deleting guide:", error);
      res.status(500).json({ message: "Failed to delete guide" });
    }
  });

  // Guide leaderboard - public for display
  app.get("/api/guides/leaderboard", isAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getGuideLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Guide availability (weekly schedule)
  app.get("/api/guides/:id/availability", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const availability = await storage.getGuideAvailability(req.params.id);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
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
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  app.delete("/api/guides/availability/:id", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      await storage.deleteGuideAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // User management endpoints (Admin only)
  app.get("/api/users", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const usersList = await storage.getUsers();
      res.json(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
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
      console.error("Error updating user role:", error);
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
      console.error("Error updating user:", error);
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
      console.error("Error toggling user status:", error);
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
      console.error("Error deleting user:", error);
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
      console.error("Error resetting password:", error);
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
      console.error("Error verifying email:", error);
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
      console.error("Error fetching user details:", error);
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
      console.error("Error sending reset email:", error);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  });

  // Zones endpoints - admin and coordinator can manage
  app.get("/api/zones", isAuthenticated, async (req, res) => {
    try {
      const zonesList = await storage.getZones();
      res.json(zonesList);
    } catch (error) {
      console.error("Error fetching zones:", error);
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
        console.error("Error creating zone:", error);
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
      console.error("Error updating zone:", error);
      res.status(500).json({ message: "Failed to update zone" });
    }
  });

  app.delete("/api/zones/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteZone(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting zone:", error);
      res.status(500).json({ message: "Failed to delete zone" });
    }
  });

  // Zone analytics - admin and coordinator
  app.get("/api/zones/analytics", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const analytics = await storage.getZoneAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching zone analytics:", error);
      res.status(500).json({ message: "Failed to fetch zone analytics" });
    }
  });

  // Points of Interest endpoints - admin and coordinator can manage, guide can view
  app.get("/api/points-of-interest", isAuthenticated, requireRole("admin", "coordinator", "guide"), async (req, res) => {
    try {
      const poiList = await storage.getPointsOfInterest();
      res.json(poiList);
    } catch (error) {
      console.error("Error fetching points of interest:", error);
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
        console.error("Error creating POI:", error);
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
      console.error("Error updating POI:", error);
      res.status(500).json({ message: "Failed to update point of interest" });
    }
  });

  app.delete("/api/points-of-interest/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deletePointOfInterest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting POI:", error);
      res.status(500).json({ message: "Failed to delete point of interest" });
    }
  });

  // Meeting Points endpoints - admin and coordinator can manage
  app.get("/api/meeting-points", isAuthenticated, async (req, res) => {
    try {
      const mpList = await storage.getMeetingPoints();
      res.json(mpList);
    } catch (error) {
      console.error("Error fetching meeting points:", error);
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
        console.error("Error creating meeting point:", error);
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
      console.error("Error updating meeting point:", error);
      res.status(500).json({ message: "Failed to update meeting point" });
    }
  });

  app.delete("/api/meeting-points/:id", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.deleteMeetingPoint(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting point:", error);
      res.status(500).json({ message: "Failed to delete meeting point" });
    }
  });

  // Incidents endpoints (Security module) - security, admin, coordinator
  app.get("/api/incidents", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req, res) => {
    try {
      const incidentsList = await storage.getIncidents();
      res.json(incidentsList);
    } catch (error) {
      console.error("Error fetching incidents:", error);
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
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  app.post("/api/incidents", isAuthenticated, requireRole("admin", "coordinator", "security"), async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      const incidentData = insertIncidentSchema.parse({
        ...req.body,
        reportedBy: userId,
      });
      const incident = await storage.createIncident(incidentData);

      await createAuditLog(userId, "create", "incident", incident.id, null, incidentData, req);

      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid incident data", errors: error.errors });
      } else {
        console.error("Error creating incident:", error);
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
      console.error("Error updating incident:", error);
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
      console.error("Error resolving incident:", error);
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
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
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
      console.error("Error fetching revenue report:", error);
      res.status(500).json({ message: "Failed to fetch revenue report" });
    }
  });

  // Pricing endpoints
  app.get("/api/pricing", isAuthenticated, async (req, res) => {
    try {
      const configs = await storage.getPricingConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.patch("/api/pricing", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      await storage.updatePricing(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ message: "Failed to update pricing" });
    }
  });

  // Calculate price endpoint (public for booking form)
  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { groupSize, tourType, customDuration } = req.body;
      const totalAmount = calculateTotalAmount(groupSize, tourType, customDuration);
      res.json({ totalAmount });
    } catch (error) {
      console.error("Error calculating price:", error);
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
          status: "failed",
        });
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Email log endpoints (Admin/Coordinator only)
  app.get("/api/email-logs", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const logs = await storage.getEmailLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching email logs:", error);
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
      console.error("Error retrying email:", error);
      res.status(500).json({ message: "Failed to retry email" });
    }
  });

  // Email Templates API
  app.get("/api/email-templates", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
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
      console.error("Error updating email template:", error);
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
      console.error("Error toggling email template:", error);
      res.status(500).json({ message: "Failed to toggle email template" });
    }
  });

  // Revenue Dashboard endpoint (Admin/Coordinator only)
  app.get("/api/revenue", isAuthenticated, requireRole("admin", "coordinator"), async (req, res) => {
    try {
      const data = await storage.getRevenueDashboard();
      res.json(data);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // User Stats endpoint (Admin only)
  app.get("/api/user-stats", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
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
      console.error("Error fetching notifications:", error);
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
      console.error("Error fetching unread count:", error);
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
      console.error("Error marking notification as read:", error);
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
      console.error("Error marking all notifications as read:", error);
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
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });



  return httpServer;
}
