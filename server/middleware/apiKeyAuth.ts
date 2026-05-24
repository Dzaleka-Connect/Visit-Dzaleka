import type { Request, Response, NextFunction } from "express";
import { verifyPassword } from "../auth";
import { storage } from "../storage";
import type { ApiKey, User } from "@shared/schema";

/**
 * API Key Authentication Middleware
 *
 * Validates `Authorization: Bearer dvz_*` tokens against stored key hashes.
 * Checks status, expiry, and required scopes before granting access.
 */

type ApiKeyAuthResult = {
  ok: true;
  apiKey: ApiKey;
  user: User;
} | {
  ok: false;
  status: number;
  code: string;
  message: string;
}

/**
 * Pure verifier — extracts and validates an API key from the request.
 * Does not write to `res`; callers decide how to handle failures.
 */
export async function verifyApiKey(
  req: Request,
  requiredScopes: string[] = [],
): Promise<ApiKeyAuthResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer dvz_")) {
    return {
      ok: false,
      status: 401,
      code: "missing_key",
      message: "Missing or invalid API key. Expected: Authorization: Bearer dvz_…",
    };
  }

  const rawKey = authHeader.slice("Bearer ".length);

  // The prefix is the first 12 characters: "dvz_" + 8 hex chars
  const keyPrefix = rawKey.substring(0, 12);

  let apiKey: ApiKey | undefined;
  try {
    apiKey = await storage.getApiKeyByPrefix(keyPrefix);
  } catch {
    return {
      ok: false,
      status: 500,
      code: "lookup_error",
      message: "Failed to look up API key",
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      status: 401,
      code: "invalid_key",
      message: "Invalid API key",
    };
  }

  // Check status
  if (apiKey.status !== "active") {
    return {
      ok: false,
      status: 401,
      code: "key_revoked",
      message: `API key is ${apiKey.status}`,
    };
  }

  // Check expiry
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return {
      ok: false,
      status: 401,
      code: "key_expired",
      message: "API key has expired",
    };
  }

  // Bcrypt-compare the full token against the stored hash
  let isValid = false;
  try {
    isValid = await verifyPassword(rawKey, apiKey.keyHash);
  } catch {
    return {
      ok: false,
      status: 500,
      code: "verify_error",
      message: "Failed to verify API key",
    };
  }

  if (!isValid) {
    return {
      ok: false,
      status: 401,
      code: "invalid_key",
      message: "Invalid API key",
    };
  }

  // Check scopes
  const keyScopes = apiKey.scopes || [];
  const missingScopes = requiredScopes.filter((s) => !keyScopes.includes(s));
  if (missingScopes.length > 0) {
    return {
      ok: false,
      status: 403,
      code: "insufficient_scope",
      message: `Missing required scopes: ${missingScopes.join(", ")}`,
    };
  }

  // Load the key owner
  let user: User | undefined;
  try {
    user = await storage.getUser(apiKey.userId);
  } catch {
    return {
      ok: false,
      status: 500,
      code: "user_lookup_error",
      message: "Failed to load API key owner",
    };
  }

  if (!user || user.isActive === false) {
    return {
      ok: false,
      status: 401,
      code: "invalid_key",
      message: "API key owner is inactive or not found",
    };
  }

  // Increment usage count (fire-and-forget — don't block the request)
  storage.incrementApiKeyUsage(apiKey.id).catch(() => {
    // Silently ignore counter errors; they should not block API calls
  });

  return { ok: true, apiKey, user };
}

/**
 * Express middleware factory that requires a valid API key with the given scopes.
 *
 * On success, attaches `req.apiKey` and `req.currentUser` for downstream handlers.
 */
export function authenticateApiKey(...requiredScopes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await verifyApiKey(req, requiredScopes);

    if (!result.ok) {
      return res.status(result.status).json({
        error: result.code,
        message: result.message,
      });
    }

    (req as any).apiKey = result.apiKey;
    (req as any).currentUser = result.user;
    next();
  };
}
