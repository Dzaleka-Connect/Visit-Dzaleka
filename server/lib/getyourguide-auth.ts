import { timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
export function getGygInboundCredentials(env: Environment = process.env) {
  // Explicit supplier credentials take precedence; partial configuration fails closed.
  if (env.GETYOURGUIDE_SUPPLIER_API_USERNAME || env.GETYOURGUIDE_SUPPLIER_API_PASSWORD) {
    return env.GETYOURGUIDE_SUPPLIER_API_USERNAME && env.GETYOURGUIDE_SUPPLIER_API_PASSWORD
      ? [[env.GETYOURGUIDE_SUPPLIER_API_USERNAME, env.GETYOURGUIDE_SUPPLIER_API_PASSWORD]] : [];
  }
  // Existing installations registered webhook credentials in the integrator portal.
  // Keep the older API-credential fallback until explicit inbound credentials are set.
  return [
    [env.GETYOURGUIDE_WEBHOOK_USERNAME, env.GETYOURGUIDE_WEBHOOK_PASSWORD],
    [env.GETYOURGUIDE_API_USERNAME, env.GETYOURGUIDE_API_PASSWORD],
  ].filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]));
}

export function isGygAuthorizationValid(header: string, env: Environment = process.env) {
  if (!header.toLowerCase().startsWith("basic ")) return false;
  try {
    const supplied = Buffer.from(header.slice(6), "base64");
    return getGygInboundCredentials(env).some(([username, password]) => {
      const expected = Buffer.from(`${username}:${password}`, "utf8");
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    });
  } catch { return false; }
}
