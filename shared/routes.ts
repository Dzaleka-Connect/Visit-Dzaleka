/**
 * Single source of truth for the application's client-side route surface.
 *
 * Three consumers depend on this list agreeing:
 *  - `client/src/App.tsx` decides which layout (public vs authenticated) to render.
 *  - `server/static.ts` decides whether an unknown path gets the SPA shell (200)
 *    or a real 404 for agents and crawlers.
 *  - `script/generate-redirects.ts` emits the Netlify `_redirects` table so the
 *    CDN makes the same call without invoking a function.
 *
 * Keeping it here means a new page cannot silently start returning a soft 404.
 */

/** Public marketing/content routes. Prefix match: `/blog` also matches `/blog/my-post`. */
export const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/about-dzaleka",
  "/about-us",
  "/accept-invite",
  "/accommodation",
  "/auth",
  "/blog",
  "/community",
  "/community-hub",
  "/contact",
  "/cookie-notice",
  "/destinations",
  "/developers",
  "/disclaimer",
  "/embed",
  "/faq",
  "/friends-of-dzaleka",
  "/impact-report",
  "/it-code-of-practice",
  "/landing",
  "/life-in-dzaleka",
  "/login",
  "/newsletter",
  "/partner-with-us",
  "/plan-your-trip",
  "/privacy",
  "/reset-password",
  "/support-our-work",
  "/things-to-do",
  "/transport-quote",
  "/unauthorized",
  "/verify-email",
  "/visit",
  "/whats-on",
] as const;

/** Authenticated app routes. Prefix match. Mirrors the sidebar's route surface. */
export const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/analytics",
  "/audit-logs",
  "/bookings",
  "/calendar",
  "/channel-manager",
  "/customers",
  "/developer",
  "/email-history",
  "/email-settings",
  "/favorite-guides",
  "/getyourguide",
  "/guide",
  "/guide-performance",
  "/guides",
  "/help",
  "/help-admin",
  "/itinerary-builder",
  "/live-ops",
  "/messages",
  "/my-availability",
  "/my-bookings",
  "/my-earnings",
  "/my-guide-profile",
  "/my-tours",
  "/payments",
  "/profile",
  "/recurring-bookings",
  "/reports",
  "/resources",
  "/revenue",
  "/saved-itineraries",
  "/security",
  "/settings",
  "/share-photos",
  "/tasks",
  "/transport-partner",
  "/users",
  "/visitor-resources",
  "/visitors",
  "/zones",
] as const;

/**
 * Machine-readable files served as static assets. Listed so the 404 handler
 * never shadows them if the static layer misses.
 */
export const AGENT_FILES = [
  "/llms.txt",
  "/llms-full.txt",
  "/openapi.json",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.json",
  "/.well-known/api-catalog",
] as const;

function normalize(path: string): string {
  const [withoutQuery] = path.split(/[?#]/);
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  const routePath = normalize(path);
  return prefixes.some((prefix) =>
    prefix === "/" ? routePath === "/" : routePath === prefix || routePath.startsWith(`${prefix}/`)
  );
}

/** True when the path is a public marketing/content route. */
export function isPublicRoute(path: string): boolean {
  return matchesPrefix(path, PUBLIC_ROUTE_PREFIXES);
}

/** True when the path belongs to the authenticated application. */
export function isProtectedRoute(path: string): boolean {
  return matchesPrefix(path, PROTECTED_ROUTE_PREFIXES);
}

/**
 * True when the SPA has a route for this path, i.e. it is legitimate to answer
 * with the app shell and a 200. Anything else must return a real 404.
 */
export function isKnownAppPath(path: string): boolean {
  const routePath = normalize(path);
  if ((AGENT_FILES as readonly string[]).includes(routePath)) return true;
  return isPublicRoute(routePath) || isProtectedRoute(routePath);
}
