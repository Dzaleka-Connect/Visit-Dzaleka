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

function getSigningSecret() {
  return process.env.REVIEW_TOKEN_SECRET || process.env.SESSION_SECRET || "supersecretdevkey";
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createSignedToken(payload: Record<string, unknown>, expiresInMs: number) {
  const body = {
    ...payload,
    exp: Date.now() + expiresInMs,
  };
  const encoded = base64UrlJson(body);
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySignedToken<T extends Record<string, unknown>>(token: string): T | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T & { exp?: number };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
