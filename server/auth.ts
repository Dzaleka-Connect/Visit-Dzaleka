import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { storage } from "./storage";

const SALT_ROUNDS = 12;
export const SESSION_COOKIE_NAME = "dzaleka.sid";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getSessionSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production");
  }

  return process.env.SESSION_SECRET || "supersecretdevkey";
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  };
}

export async function regenerateSession(req: Request) {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getOrCreateCsrfToken(req: Request) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateSessionToken();
  }

  return req.session.csrfToken;
}

export async function establishAuthenticatedSession(req: Request, user: Pick<User, "id" | "role">) {
  await regenerateSession(req);

  req.session.userId = user.id;
  req.session.userRole = user.role || "visitor";
  req.session.csrfToken = generateSessionToken();

  return req.session.csrfToken;
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
}

export function isSessionAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export async function getCurrentUser(req: Request) {
  const userId = (req.session as any)?.userId;
  if (!userId) return null;
  return storage.getUser(userId);
}
