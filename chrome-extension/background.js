// =============================================
// Visit Dzaleka Chrome Extension - Background
// =============================================

const BASE_URL = "https://visit.dzaleka.com";
const ALARM_NAME = "check-notifications";
const CHECK_INTERVAL_MINUTES = 5;
const ADMIN_NOTIFICATION_TYPES = new Set([
    "booking_created",
    "check_in",
    "payment_received",
    "incident_reported",
    "guide_assigned",
]);
const ADMIN_NOTIFICATION_LINKS = [
    "/bookings",
    "/security",
    "/security-admin",
    "/revenue",
    "/guide-performance",
    "/help-admin",
    "/calendar",
];

// ---- Install & Startup ----
chrome.runtime.onInstalled.addListener(() => {
    // Set up periodic alarm for notification checks
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: CHECK_INTERVAL_MINUTES,
    });

    // Clear badge on install
    chrome.action.setBadgeText({ text: "" });
});

// ---- Alarm Handler ----
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await checkForNewNotifications();
    }
});

// ---- Check Notifications ----
async function checkForNewNotifications() {
    try {
        const userRes = await fetch(`${BASE_URL}/api/auth/user`, {
            credentials: "include",
            headers: { Accept: "application/json" },
        });

        if (!userRes.ok) {
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        const currentUser = await userRes.json();
        const res = await fetch(`${BASE_URL}/api/notifications`, {
            credentials: "include",
            headers: { Accept: "application/json" },
        });

        if (!res.ok) {
            // User not logged in or other error - clear badge
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        let notifications = await res.json();

        if (!Array.isArray(notifications)) {
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        notifications = filterNotificationsForRole(notifications, currentUser?.role || "visitor");

        const unread = notifications.filter((n) => !n.isRead);

        if (unread.length > 0) {
            chrome.action.setBadgeText({
                text: unread.length > 99 ? "99+" : String(unread.length),
            });
            chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

            // Check for NEW notifications since last check
            const { lastCheckedAt, notificationSnoozedUntil } = await chrome.storage.local.get([
                "lastCheckedAt",
                "notificationSnoozedUntil",
            ]);
            const lastTime = lastCheckedAt ? new Date(lastCheckedAt) : new Date(0);
            const isSnoozed = notificationSnoozedUntil && Number(notificationSnoozedUntil) > Date.now();

            const brandNew = unread.filter(
                (n) => n.createdAt && new Date(n.createdAt) > lastTime
            );

            // Show desktop notification for truly new ones
            if (!isSnoozed && brandNew.length > 0 && brandNew.length <= 3) {
                const notificationLinks = {};
                for (const n of brandNew) {
                    const notificationId = `notif-${n.id}`;
                    notificationLinks[notificationId] = getNotificationTarget(n, currentUser?.role || "visitor");
                    chrome.notifications.create(notificationId, {
                        type: "basic",
                        iconUrl: "icons/icon128.png",
                        title: n.title || "Visit Dzaleka",
                        message: n.message || "You have a new notification",
                        priority: 1,
                    });
                }
                await mergeNotificationLinks(notificationLinks);
            } else if (!isSnoozed && brandNew.length > 3) {
                await mergeNotificationLinks({ "notif-batch": BASE_URL });
                chrome.notifications.create("notif-batch", {
                    type: "basic",
                    iconUrl: "icons/icon128.png",
                    title: "Visit Dzaleka",
                    message: `You have ${brandNew.length} new notifications`,
                    priority: 1,
                });
            }
        } else {
            chrome.action.setBadgeText({ text: "" });
        }

        // Update last checked timestamp
        await chrome.storage.local.set({
            lastCheckedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Background notification check failed:", err);
        chrome.action.setBadgeText({ text: "" });
    }
}

function filterNotificationsForRole(notifications, role) {
    if (role === "admin" || role === "coordinator" || role === "security") {
        return notifications;
    }

    return notifications.filter((notification) => {
        if (ADMIN_NOTIFICATION_TYPES.has(notification.type)) return false;
        if (notification.link && ADMIN_NOTIFICATION_LINKS.some((link) => notification.link === link || notification.link.startsWith(`${link}/`))) {
            return false;
        }
        return true;
    });
}

function normalizeNotificationLink(link) {
    if (!link) return BASE_URL;
    return link.startsWith("http") ? link : `${BASE_URL}${link}`;
}

function getNotificationTarget(notification, role = "visitor") {
    if (notification?.link) {
        return normalizeNotificationLink(notification.link);
    }

    const relatedId = notification?.relatedId || notification?.related_id;
    if (!relatedId) return BASE_URL;

    const type = String(notification?.type || "");
    if (type.includes("support")) {
        return role === "admin" || role === "coordinator"
            ? `${BASE_URL}/help-admin?ticket=${encodeURIComponent(relatedId)}`
            : `${BASE_URL}/help?support=true`;
    }
    if (type.includes("email")) return `${BASE_URL}/send-email?log=${encodeURIComponent(relatedId)}`;
    if (type.includes("booking") || type.includes("payment") || type.includes("guide") || type.includes("check_in")) {
        return `${BASE_URL}/bookings/${encodeURIComponent(relatedId)}`;
    }

    return BASE_URL;
}

async function mergeNotificationLinks(nextLinks) {
    const { notificationLinks = {} } = await chrome.storage.local.get("notificationLinks");
    await chrome.storage.local.set({
        notificationLinks: {
            ...notificationLinks,
            ...nextLinks,
        },
    });
}

// ---- Notification Click Handler ----
chrome.notifications.onClicked.addListener(async (notifId) => {
    const { notificationLinks = {} } = await chrome.storage.local.get("notificationLinks");
    chrome.tabs.create({ url: notificationLinks[notifId] || BASE_URL });
    chrome.notifications.clear(notifId);
    delete notificationLinks[notifId];
    await chrome.storage.local.set({ notificationLinks });
});
