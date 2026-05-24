import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * CSRF protection for cookie-authenticated browser requests.
 *
 * This middleware validates that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from allowed origins and carry the session CSRF token.
 *
 * How it works:
 * 1. Extracts Origin or Referer header from incoming request
 * 2. Compares against list of allowed origins
 * 3. Requires X-CSRF-Token to match the server-side session token
 * 4. Allows trusted non-browser clients only when X-Client-Auth matches the configured token
 *
 * Safe requests (GET, HEAD, OPTIONS) are allowed through without checks.
 */

// State-changing HTTP methods that require CSRF protection
const UNSAFE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// Routes that should be exempt from CSRF protection
// (e.g., public booking API, webhooks, embed endpoints)
const EXEMPT_ROUTES = [
    "/api/public/",
    "/api/embed/",
    "/api/webhooks/",
];
const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function headerValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function safeEquals(a?: string, b?: string) {
    if (!a || !b) return false;
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function hasTrustedClientAuth(req: Request) {
    const provided = headerValue(req.headers["x-client-auth"]);
    const expectedTokens = [
        process.env.CLIENT_AUTH_TOKEN,
        process.env.MOBILE_CLIENT_AUTH_TOKEN,
    ].filter(Boolean);

    return expectedTokens.some((expected) => safeEquals(provided, expected));
}

export function createCsrfMiddleware(allowedOrigins: string[]) {
    const allowedOriginSet = new Set(allowedOrigins);
    const isProduction = process.env.NODE_ENV === "production";

    return (req: Request, res: Response, next: NextFunction) => {
        // Skip CSRF check for safe methods
        if (!UNSAFE_METHODS.includes(req.method)) {
            return next();
        }

        // Skip CSRF check for exempt routes
        if (EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
            return next();
        }

        // Get the Origin header (preferred) or fall back to Referer
        const origin = headerValue(req.headers.origin);
        const referer = headerValue(req.headers.referer);
        const trustedClient = hasTrustedClientAuth(req);

        if (trustedClient) {
            return next();
        }

        // Browser cookie sessions must provide an Origin or Referer. Non-browser
        // clients need X-Client-Auth so missing headers cannot become a CSRF bypass.
        if (!origin && !referer) {
            return res.status(403).json({
                message: "Forbidden: Missing request origin"
            });
        }

        // Extract origin from headers
        let requestOrigin: string | null = null;

        if (origin) {
            requestOrigin = origin;
        } else if (referer) {
            try {
                const refererUrl = new URL(referer);
                requestOrigin = refererUrl.origin;
            } catch {
                // Invalid referer URL
                return res.status(403).json({
                    message: "Forbidden: Invalid request origin"
                });
            }
        }

        // Check if the origin is allowed
        const isAllowedDevOrigin = !isProduction && LOCAL_DEV_ORIGIN_PATTERN.test(requestOrigin || "");
        if (requestOrigin && !allowedOriginSet.has(requestOrigin) && !isAllowedDevOrigin) {
            return res.status(403).json({
                message: "Forbidden: Cross-origin request not allowed"
            });
        }

        const requestToken = headerValue(req.headers["x-csrf-token"]);
        const sessionToken = req.session?.csrfToken;

        if (!safeEquals(requestToken, sessionToken)) {
            return res.status(403).json({
                message: "Forbidden: Invalid CSRF token"
            });
        }

        next();
    };
}
