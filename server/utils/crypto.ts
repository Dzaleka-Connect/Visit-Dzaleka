import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(
  (process.env.SESSION_SECRET || "fallback-secret-key-at-least-32-chars-long").substring(0, 32),
  "utf-8"
);

/**
 * Encrypt a plain-text string using AES-256-GCM.
 * Returns the format `iv:authTag:encryptedText`.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string in `iv:authTag:encryptedText` format.
 * Returns the original plain-text.
 * Gracefully falls back to returning the input string if decryption fails or format is invalid.
 */
export function decrypt(encryptedText: string | null | undefined): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      // Not encrypted / legacy plain-text
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    // Graceful fallback to legacy plaintext
    return encryptedText;
  }
}
