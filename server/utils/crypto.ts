import crypto from "crypto";
import { logger } from "../lib/logger";

const ALGORITHM = "aes-256-gcm";

// Helper to get key from env, enforcing exact 32 bytes or returning a fallback
function getKeyFromEnv(envVar: string | undefined, name: string): Buffer {
  if (!envVar) {
    return Buffer.from("fallback-secret-key-at-least-32-chars-long".substring(0, 32), "utf-8");
  }
  
  // If it's a hex or base64 key, decode it, otherwise convert from string
  let key: Buffer;
  if (envVar.length === 64 && /^[0-9a-fA-F]+$/.test(envVar)) {
    key = Buffer.from(envVar, "hex");
  } else {
    key = Buffer.from(envVar.substring(0, 32), "utf-8");
  }

  if (key.length !== 32) {
    throw new Error(`Invalid key length for ${name}: must resolve to exactly 32 bytes`);
  }
  return key;
}

// Derive keys
const KEY_V1 = process.env.ENCRYPTION_KEY ? getKeyFromEnv(process.env.ENCRYPTION_KEY, "ENCRYPTION_KEY") : null;
const KEY_V0 = getKeyFromEnv(process.env.SESSION_SECRET, "SESSION_SECRET");

// Validate exact key lengths at boot
if (process.env.NODE_ENV === "production") {
  if (!process.env.ENCRYPTION_KEY) {
    logger.warn("⚠️ ENCRYPTION_KEY env variable is not set. Falling back to SESSION_SECRET for encryption.");
  } else {
    const keyBytes = getKeyFromEnv(process.env.ENCRYPTION_KEY, "ENCRYPTION_KEY");
    if (keyBytes.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be exactly 32 bytes.");
    }
  }
}

/**
 * Encrypt a plain-text string using AES-256-GCM.
 * Uses version v1 if ENCRYPTION_KEY is configured, otherwise v0.
 * Returns the format `version:iv:authTag:encryptedText`.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const useV1 = KEY_V1 !== null;
  const key = useV1 ? KEY_V1! : KEY_V0;
  const version = useV1 ? "v1" : "v0";

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${version}:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string in `vX:iv:authTag:encryptedText` or legacy `iv:authTag:encryptedText` format.
 * Returns the original plain-text.
 * Gracefully falls back to returning the input string if decryption fails or format is invalid.
 */
export function decrypt(encryptedText: string | null | undefined): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    
    // Check if it's versioned (v1:... or v0:...) or legacy (iv:authTag:encryptedText)
    let version = "v0";
    let ivHex = "";
    let authTagHex = "";
    let encrypted = "";

    if (parts.length === 4) {
      version = parts[0];
      ivHex = parts[1];
      authTagHex = parts[2];
      encrypted = parts[3];
    } else if (parts.length === 3) {
      // Legacy unversioned defaults to v0 key
      ivHex = parts[0];
      authTagHex = parts[1];
      encrypted = parts[2];
    } else {
      // Not encrypted / legacy plain-text
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = version === "v1" ? (KEY_V1 || KEY_V0) : KEY_V0;

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Graceful fallback to legacy plaintext
    return encryptedText;
  }
}
