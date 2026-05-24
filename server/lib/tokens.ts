import crypto from "crypto";

export function generatePublicToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function tokenDigest(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashToken(token: string) {
  return `sha256:${tokenDigest(token)}`;
}

export function tokenFingerprint(token: string, length = 12) {
  return tokenDigest(token).slice(0, length);
}
