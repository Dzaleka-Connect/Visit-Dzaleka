import crypto from "crypto";
import type { Request } from "express";

/**
 * Basic Authentication Verifier for GetYourGuide Webhook
 *
 * Pure function — validates HTTP Basic Auth credentials from the Authorization
 * header without touching `res`. The caller decides how to respond on failure.
 *
 * Uses constant-time comparison to prevent timing attacks.
 */

interface BasicAuthSuccess {
  ok: true;
}

interface BasicAuthFailure {
  ok: false;
  status: number;
  body: { error: string };
  headers?: Record<string, string>;
}

export type BasicAuthResult = BasicAuthSuccess | BasicAuthFailure;

export function verifyBasicAuth(req: Request): BasicAuthResult {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return {
      ok: false,
      status: 401,
      body: { error: "Authentication required" },
      headers: { "WWW-Authenticate": 'Basic realm="GetYourGuide Webhook"' },
    };
  }

  const expectedUsername = process.env.GETYOURGUIDE_WEBHOOK_USERNAME;
  const expectedPassword = process.env.GETYOURGUIDE_WEBHOOK_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    console.error("GetYourGuide webhook credentials not configured in environment");
    return {
      ok: false,
      status: 500,
      body: { error: "Webhook not configured" },
    };
  }

  let username: string;
  let password: string;

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const colonIndex = credentials.indexOf(":");
    if (colonIndex === -1) {
      return {
        ok: false,
        status: 400,
        body: { error: "Invalid Authorization header format" },
      };
    }
    username = credentials.substring(0, colonIndex);
    password = credentials.substring(colonIndex + 1);
  } catch {
    return {
      ok: false,
      status: 400,
      body: { error: "Invalid Authorization header format" },
    };
  }

  // Constant-time comparison to prevent timing attacks.
  // Pad both sides to the same length so timingSafeEqual does not throw.
  const usernameMatch = safeTimingEqual(username, expectedUsername);
  const passwordMatch = safeTimingEqual(password, expectedPassword);

  if (usernameMatch && passwordMatch) {
    return { ok: true };
  }

  return {
    ok: false,
    status: 401,
    body: { error: "Invalid credentials" },
    headers: { "WWW-Authenticate": 'Basic realm="GetYourGuide Webhook"' },
  };
}

/**
 * Constant-time string comparison that handles different-length inputs
 * without leaking length information through timing.
 */
function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Use HMAC to normalize both values to the same length before comparing,
  // preventing length-leaking from timingSafeEqual throwing on mismatched sizes.
  const key = crypto.randomBytes(32);
  const hmacA = crypto.createHmac("sha256", key).update(bufA).digest();
  const hmacB = crypto.createHmac("sha256", key).update(bufB).digest();

  return crypto.timingSafeEqual(hmacA, hmacB);
}
