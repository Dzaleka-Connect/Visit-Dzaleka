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

/**
 * Hook that tracks page views automatically on route changes.
 * Should be called once at the app root level.
 */
export function usePageTracker() {
    const [location] = useLocation();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        // Avoid duplicate tracking for the same path
        if (lastTrackedPath.current === location) {
            return;
        }
        lastTrackedPath.current = location;

        // Don't track admin/internal pages if needed (optional filtering)
        // Skip tracking for API routes or assets
        if (location.startsWith("/api/") || location.includes(".")) {
            return;
        }

        const sessionId = getSessionId();
        const referrer = document.referrer || undefined;
        const userAgent = navigator.userAgent;

        // Send page view to backend
        fetch("/api/analytics/pageview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                page: location,
                sessionId,
                referrer,
                userAgent,
            }),
            // Use keepalive for navigation scenarios
            keepalive: true,
        }).catch((err) => {
            // Silently fail - analytics should not break the user experience
            console.debug("Analytics tracking failed:", err);
        });
    }, [location]);
}
