import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Generate a session ID for this browser session
function getSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
}

// Normalize URL path to prevent duplicate tracking
function normalizePath(path: string): string {
    // Remove trailing slash (except for root "/")
    if (path.length > 1 && path.endsWith("/")) {
        return path.slice(0, -1);
    }
    return path;
}

/**
 * Hook that tracks page views automatically on route changes.
 * Should be called once at the app root level.
 */
export function usePageTracker() {
    const [location] = useLocation();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        // Normalize the path to prevent duplicate tracking
        const normalizedPath = normalizePath(location);

        // Avoid duplicate tracking for the same path
        if (lastTrackedPath.current === normalizedPath) {
            return;
        }
        lastTrackedPath.current = normalizedPath;

        // Don't track admin/internal pages if needed (optional filtering)
        // Skip tracking for API routes or assets
        if (normalizedPath.startsWith("/api/") || normalizedPath.includes(".")) {
            return;
        }

        const sessionId = getSessionId();
        const referrer = document.referrer || "";
        const userAgent = navigator.userAgent;

        // Use fetch for reliable tracking
        fetch("/api/analytics/pageview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                page: normalizedPath,
                sessionId,
                referrer,
                userAgent,
            }),
        }).catch(() => {
            // Silent fail - analytics should not break the user experience
        });
    }, [location]);
}
