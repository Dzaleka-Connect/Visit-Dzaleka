/**
 * Machine-readable surface for AI agents and crawlers.
 *
 * Three concerns live here:
 *  1. Discovery — `Link` headers and the `/api` index so an agent can find the
 *     spec, the llms.txt and the docs from any response.
 *  2. Structured errors — every `/api` failure answers with the `Error` schema
 *     from `shared/openapi.ts` rather than Express's default HTML page.
 *  3. Content negotiation — `Accept: text/markdown` gets markdown, and every
 *     negotiated response carries `Vary: Accept` so a CDN cannot hand an agent
 *     the cached HTML variant (per acceptmarkdown.com).
 *
 * `registerAgentRoutes` runs inside `createApp()`, so the Netlify function and
 * the standalone server get identical behaviour.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { openApiDocument, SITE_URL } from "../shared/openapi";
import { logger } from "./lib/logger";

/** Media types that mean "send me markdown". */
const MARKDOWN_TYPES = ["text/markdown", "text/x-markdown", "application/markdown"];

/**
 * Link relations advertised on every response, so an agent that lands on any URL
 * can discover the rest without guessing paths.
 * RFC 8288 link relations; `service-desc`/`service-doc` per RFC 8631.
 */
const DISCOVERY_LINKS = [
  `</llms.txt>; rel="describedby"; type="text/plain"`,
  `</openapi.json>; rel="service-desc"; type="application/openapi+json"`,
  `</developers>; rel="service-doc"; type="text/html"`,
  `</sitemap.xml>; rel="index"; type="application/xml"`,
  `</.well-known/api-catalog>; rel="api-catalog"`,
].join(", ");

/** True when the caller explicitly asked for markdown. */
export function prefersMarkdown(req: Request): boolean {
  const accept = req.headers.accept;
  if (!accept) return false;
  const lowered = accept.toLowerCase();
  if (!MARKDOWN_TYPES.some((type) => lowered.includes(type))) return false;

  // `Accept: */*` alongside markdown is ambiguous; an explicit markdown type wins
  // only when it is at least as preferred as text/html.
  const htmlQuality = qualityOf(lowered, "text/html");
  const markdownQuality = Math.max(...MARKDOWN_TYPES.map((type) => qualityOf(lowered, type)));
  return markdownQuality >= htmlQuality;
}

function qualityOf(accept: string, mediaType: string): number {
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().split(";");
    if (type.trim() !== mediaType) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    return q ? Number.parseFloat(q.slice(2)) || 0 : 1;
  }
  return 0;
}

/** True when the caller wants JSON rather than a page. */
export function prefersJson(req: Request): boolean {
  if (req.path.startsWith("/api/")) return true;
  if (req.path.startsWith("/1/")) return true;
  const accept = (req.headers.accept || "").toLowerCase();
  return accept.includes("application/json") && !accept.includes("text/html");
}

/**
 * Adds discovery `Link` headers plus `Vary: Accept` to every response.
 *
 * `Vary: Accept` is appended rather than assigned so it composes with the
 * `Accept-Encoding` the compression layer sets.
 */
export function agentDiscoveryMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Link", DISCOVERY_LINKS);
  appendVary(res, "Accept");
  next();
}

/** Append a field to `Vary` without dropping what is already there. */
export function appendVary(res: Response, field: string) {
  const existing = res.getHeader("Vary");
  if (!existing) {
    res.setHeader("Vary", field);
    return;
  }
  const values = String(existing)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!values.some((v) => v.toLowerCase() === field.toLowerCase())) {
    values.push(field);
  }
  res.setHeader("Vary", values.join(", "));
}

export interface ApiErrorBody {
  error: true;
  code: string;
  message: string;
  status: number;
  hint?: string;
  requestId?: string;
  documentation?: string;
}

/** Build the structured error body described by the `Error` schema. */
export function buildApiError(
  status: number,
  code: string,
  message: string,
  extra: { hint?: string; requestId?: string; documentation?: string } = {}
): ApiErrorBody {
  return {
    error: true,
    code,
    message,
    status,
    ...(extra.hint ? { hint: extra.hint } : {}),
    ...(extra.requestId ? { requestId: extra.requestId } : {}),
    documentation: extra.documentation ?? `${SITE_URL}/developers`,
  };
}

/** Markdown body for a 404, pointing an agent at the machine-readable index. */
export function notFoundMarkdown(path: string): string {
  return `# 404 Not Found

\`${path}\` does not exist on Visit Dzaleka.

## Where to look instead

- [/llms.txt](${SITE_URL}/llms.txt) — what this site is for and when to use it
- [/sitemap.xml](${SITE_URL}/sitemap.xml) — every published page
- [/openapi.json](${SITE_URL}/openapi.json) — the public API specification
- [/developers](${SITE_URL}/developers) — developer portal and quickstart
- [/api](${SITE_URL}/api) — machine-readable index of public endpoints
`;
}

/**
 * Registers the agent-facing endpoints. Called from `createApp()` before the
 * catch-all handlers so these paths always resolve.
 */
export function registerAgentRoutes(app: Express) {
  app.use(agentDiscoveryMiddleware);

  // The OpenAPI document. Also emitted as a static file at build time; serving it
  // here keeps development and self-hosted deployments consistent.
  app.get(["/openapi.json", "/api/openapi.json"], (_req, res) => {
    res.type("application/openapi+json").json(openApiDocument);
  });

  // RFC 9727 API catalogue.
  app.get("/.well-known/api-catalog", (_req, res) => {
    res.type("application/linkset+json").json({
      linkset: [
        {
          anchor: SITE_URL,
          "service-desc": [
            { href: `${SITE_URL}/openapi.json`, type: "application/openapi+json", title: "Visit Dzaleka Public API" },
          ],
          "service-doc": [{ href: `${SITE_URL}/developers`, type: "text/html", title: "Developer portal" }],
          describedby: [{ href: `${SITE_URL}/llms.txt`, type: "text/plain", title: "Agent instructions" }],
        },
      ],
    });
  });

  // Human- and agent-readable index of the public API surface. Probing `/api`
  // is the first thing most agents try, so it must answer with something useful.
  app.get("/api", (_req, res) => {
    const paths = Object.entries(openApiDocument.paths).map(([path, methods]) => {
      const get = (methods as any).get;
      return {
        path,
        method: "GET",
        operationId: get.operationId,
        summary: get.summary,
        tags: get.tags,
      };
    });

    res.json({
      name: openApiDocument.info.title,
      version: openApiDocument.info.version,
      description: openApiDocument.info.summary,
      authentication: "none",
      documentation: `${SITE_URL}/developers`,
      openapi: `${SITE_URL}/openapi.json`,
      instructions: `${SITE_URL}/llms.txt`,
      rateLimit: { requests: 100, window: "1 minute", scope: "per IP" },
      endpointCount: paths.length,
      endpoints: paths,
    });
  });
}

/**
 * Path prefixes that are API surfaces rather than pages. `/1/` is the legacy
 * channel-manager integration, which Netlify routes to the same function.
 */
const API_PREFIXES = ["/api", "/1/"];

/** True when the path belongs to an API rather than the site. */
export function isApiPath(path: string): boolean {
  return API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

/**
 * 404 for unmatched API paths. Mounted after every route so a mistyped endpoint
 * returns the `Error` schema instead of Express's HTML page.
 */
export function apiNotFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (!isApiPath(req.path)) return next();

  res.status(404).json(
    buildApiError(404, "not_found", `No API endpoint matches ${req.method} ${req.path}.`, {
      hint: `Fetch ${SITE_URL}/openapi.json for the list of available operations, or ${SITE_URL}/api for a short index.`,
      requestId: req.requestId,
    })
  );
}

/**
 * Terminal error handler. Produces the `Error` schema for `/api` and a plain
 * response elsewhere. Registered inside `createApp()` so the Netlify function
 * gets it too — it previously lived only in `server/index.ts`, which serverless
 * deployments never load.
 */
export function apiErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;

  logger.withRequest(req.requestId).error("Unhandled request error", err, {
    method: req.method,
    path: req.path,
    status,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && status >= 500 ? "Internal Server Error" : err.message || "Internal Server Error";

  const code =
    err.code && typeof err.code === "string"
      ? err.code
      : status === 400
        ? "validation_failed"
        : status === 401
          ? "unauthenticated"
          : status === 403
            ? "forbidden"
            : status === 404
              ? "not_found"
              : status === 429
                ? "rate_limited"
                : "internal_error";

  const hint =
    status === 401
      ? "Sign in, or supply an API key as `Authorization: Bearer <key>`."
      : status === 403
        ? "This endpoint requires a role your credentials do not have."
        : status === 429
          ? "Slow down to at most 100 requests per minute and retry."
          : status >= 500
            ? "This is a server-side fault. Retry shortly; quote requestId if it persists."
            : undefined;

  res
    .status(status)
    .json(buildApiError(status, code, message, { hint, requestId: req.requestId }));
}
