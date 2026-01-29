import type { Request, Response, NextFunction } from "express";

/**
 * CSRF Protection Middleware using Origin/Referer header verification.
 * 
 * This middleware validates that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from allowed origins to prevent Cross-Site Request Forgery attacks.
 * 
 * How it works:
 * 1. Extracts Origin or Referer header from incoming request
 * 2. Compares against list of allowed origins
 * 3. Rejects requests from unknown origins
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

export function createCsrfMiddleware(allowedOrigins: string[]) {
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
        const origin = req.headers.origin;
        const referer = req.headers.referer;

        // If no Origin and no Referer, this is likely a same-origin request
        // (browsers set Origin on cross-origin requests)
        // However, for stricter security, you may want to reject these
        if (!origin && !referer) {
            // Allow requests without Origin/Referer (same-origin SPA requests)
            // These are typically from form submissions or non-CORS fetch
            return next();
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
        if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
            return res.status(403).json({
                message: "Forbidden: Cross-origin request not allowed"
            });
        }

        next();
    };
}
