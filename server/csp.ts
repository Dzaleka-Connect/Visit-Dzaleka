/**
 * Content Security Policy for HTML responses.
 *
 * Extracted from `app.ts` so the policy can be asserted in tests without booting
 * the whole application.
 *
 * Background: helmet's *default* CSP is `script-src 'self'`, which blocks this
 * app's own inline bootstrap (service-worker registration and JSON-LD) as well as
 * Google Fonts and analytics. Because `.env` sets `NODE_ENV=production`, that
 * default was applied whenever Express served HTML — including to the Puppeteer
 * crawler in `script/prerender.ts`. React never hydrated, so every prerendered
 * page was captured as an empty shell and AI crawlers saw almost no text.
 */

/** Just the variables the policy depends on; `process.env` satisfies this. */
export type CspEnv = Record<string, string | undefined>;

/**
 * The crawler opts out via `PRERENDER_DISABLE_CSP`, and development runs without
 * a policy for hot reload. Everything else gets the explicit policy below.
 */
export function shouldDisableCsp(env: CspEnv): boolean {
  return env.PRERENDER_DISABLE_CSP === "1" || env.NODE_ENV !== "production";
}

/**
 * Directives matching what the client actually loads. Anything added to the app
 * that fetches from a new origin has to be listed here.
 */
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  // Required by the service-worker registration and JSON-LD blocks in
  // client/index.html, which are inline by necessity.
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://static.cloudflareinsights.com",
  ],
  scriptSrcAttr: ["'none'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  // Editorial images come from partner domains, so `https:` is broad by
  // necessity. It still excludes plaintext http: and is not a script vector.
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
  ],
  frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
  formAction: ["'self'"],
} as const;

/** Value for helmet's `contentSecurityPolicy` option. */
export function cspOption(env: CspEnv) {
  return shouldDisableCsp(env)
    ? (false as const)
    : { directives: CSP_DIRECTIVES as unknown as Record<string, string[]> };
}
