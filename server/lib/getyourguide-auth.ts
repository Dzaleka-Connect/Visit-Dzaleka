import { timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
export function getGygInboundCredentials(env: Environment = process.env) {
  // Testing and production share this API host, but GYG requires different credentials.
  // Explicit testing credentials suppress legacy fallbacks, even if incomplete.
  const testing = env.GETYOURGUIDE_SUPPLIER_API_USERNAME || env.GETYOURGUIDE_SUPPLIER_API_PASSWORD
    ? [[env.GETYOURGUIDE_SUPPLIER_API_USERNAME, env.GETYOURGUIDE_SUPPLIER_API_PASSWORD]]
    : [
      [env.GETYOURGUIDE_WEBHOOK_USERNAME, env.GETYOURGUIDE_WEBHOOK_PASSWORD],
      [env.GETYOURGUIDE_API_USERNAME, env.GETYOURGUIDE_API_PASSWORD],
    ];
  // Each pair must be complete; never combine credentials across environments.
  return [
    ...testing,
    [env.GETYOURGUIDE_PRODUCTION_USERNAME, env.GETYOURGUIDE_PRODUCTION_PASSWORD],
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
