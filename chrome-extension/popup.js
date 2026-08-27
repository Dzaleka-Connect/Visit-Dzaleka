// =============================================
// Visit Dzaleka Chrome Extension - Popup Script
// =============================================

const BASE_URL = "https://visit.dzaleka.com";
const ADMIN_ROLES = new Set(["admin", "coordinator"]);

// ---- DOM Helpers ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const onClick = (sel, handler) => {
    const el = $(sel);
    if (el) el.addEventListener("click", handler);
};

// ---- API Helper ----
async function api(endpoint) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            credentials: "include",
            headers: { "Accept": "application/json" },
        });
        if (!res.ok) {
            if (res.status === 401) return { _unauthorized: true };
            throw new Error(`HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`API error [${endpoint}]:`, err);
        return null;
    }
}

let cachedCsrfToken = null;

async function fetchCsrfToken() {
    if (cachedCsrfToken) return cachedCsrfToken;
    try {
        const res = await fetch(`${BASE_URL}/api/auth/csrf`, {
            credentials: "include",
            headers: { "Accept": "application/json" },
        });
        if (res.ok) {
            const data = await res.json();
            cachedCsrfToken = data.csrfToken;
            return cachedCsrfToken;
        }
    } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
    }
    return null;
}

function validateImageUrl(urlStr) {
    if (!urlStr) return null;
    try {
        const parsed = new URL(urlStr);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.toString();
        }
    } catch (e) {
        // invalid URL
    }
    return null;
}

async function apiAction(endpoint, { method = "POST", body } = {}) {
    try {
        const csrfToken = await fetchCsrfToken();
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            credentials: "include",
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            if (res.status === 401) return { _unauthorized: true };
            if (res.status === 403) {
                cachedCsrfToken = null;
            }
            throw new Error(`HTTP ${res.status}`);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : {};
    } catch (err) {
        console.error(`API action error [${endpoint}]:`, err);
        return null;
    }
}

function openApp(path = "") {
    chrome.tabs.create({ url: path.startsWith("http") ? path : `${BASE_URL}${path}` });
}

// ---- State ----
let currentUser = null;
let bookings = [];
let blogPosts = [];
let notifications = [];
let notificationFilter = "all";
let zonesData = [];
let poisData = [];
let helpArticles = [];
let countdownInterval = null;

const actionIcons = {
    calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    bookings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    explore: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 6L2 7"></path></svg>`,
    support: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path></svg>`,
    training: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    money: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
};

const manualSearchItems = [
    { title: "Operations Manual - Bookings", text: "booking workflow confirmations payments refunds cancellations reschedules", path: "/operations-manual?section=bookings" },
    { title: "Operations Manual - Guides", text: "guide assignments check-in no-show training availability payout workflow", path: "/operations-manual?section=guides" },
    { title: "Operations Manual - Visitors", text: "visitor dashboard support ticket payment visit preparation cancellation state", path: "/operations-manual?section=visitors" },
    { title: "Operations Manual - Finance", text: "revenue guide payouts payment verification financial framework", path: "/operations-manual?section=finance" },
    { title: "Operations Manual - Marketing", text: "content blog help articles GetYourGuide listing photos", path: "/operations-manual?section=marketing" },
    { title: "Operations Manual - Admin", text: "email operations users templates notifications support admin tasks", path: "/operations-manual?section=admin" },
    { title: "Operations Manual - Impact", text: "reports impact metrics community outcomes quality improvement", path: "/operations-manual?section=impact" },
    { title: "SOP Procedures", text: "standard operating procedures daily operations emergency escalation", path: "/standard-operating-procedures" },
    { title: "Internal Policies", text: "policy compliance finance guide conduct privacy", path: "/internal-policies" },
    { title: "Financial Framework", text: "finance revenue model guide income payout reporting", path: "/financial-framework" },
    { title: "DTDW Guide", text: "Dzaleka Things to Do Website content QA listing checklist", path: "/dtdw-guide" },
    { title: "IT Code of Practice", text: "technology security data code access passwords incident reporting", path: "/it-code-of-practice" },
];

// ---- Init ----
document.addEventListener("DOMContentLoaded", async () => {
    initDarkMode();
    setupTabNavigation();
    setupButtons();
    setupSearch();
    await checkAuth();
});

// ---- Auth Check ----
async function checkAuth() {
    const user = await api("/api/auth/user");

    if (!user || user._unauthorized) {
        showScreen("login-prompt");
        return;
    }

    currentUser = user;
    showScreen("main-app");
    renderUserCard();
    loadDashboard();
    loadExplore();
    loadBlog();
    loadHelpArticles();
    loadNotifications();
}

// ---- Screen Management ----
function showScreen(id) {
    $("#loading").classList.add("hidden");
    $("#login-prompt").classList.add("hidden");
    $("#main-app").classList.add("hidden");
    $(`#${id}`).classList.remove("hidden");
}

// ---- Tab Navigation ----
function setupTabNavigation() {
    $$(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            $$(".tab-btn").forEach((b) => b.classList.remove("active"));
            $$(".tab-panel").forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            $(`#tab-${tab}`).classList.add("active");
        });
    });
}

// ---- Button Setup ----
function setupButtons() {
    // Login button
    onClick("#btn-login", () => {
        chrome.tabs.create({ url: `${BASE_URL}/login` });
    });

    // Register link
    onClick("#btn-register", () => {
        chrome.tabs.create({ url: `${BASE_URL}/login` });
    });

    // Refresh button
    onClick("#btn-refresh", async () => {
        const icon = $("#btn-refresh svg");
        if (icon) icon.style.animation = "spin 0.8s linear infinite";
        await checkAuth();
        setTimeout(() => {
            if (icon) icon.style.animation = "";
        }, 1000);
    });

    // Open full site
    onClick("#btn-open-site", () => {
        chrome.tabs.create({ url: BASE_URL });
    });

    // Mark all notifications read
    onClick("#btn-mark-all-read", markAllNotificationsRead);

    $("#notif-filter")?.addEventListener("change", (event) => {
        notificationFilter = event.target.value;
        renderNotifications();
    });

    onClick("#btn-snooze-notifications", snoozeNotifications);
    renderSnoozeStatus();

    // Theme toggle
    onClick("#btn-theme", toggleDarkMode);

    // Booking verifier on login screen
    onClick("#btn-verify-login", () => {
        const ref = $("#verify-ref-login").value.trim();
        verifyBooking(ref, "#verify-result-login");
    });

    $("#verify-ref-login")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const ref = $("#verify-ref-login").value.trim();
            verifyBooking(ref, "#verify-result-login");
        }
    });

    onClick("#btn-verify-main", () => {
        const ref = $("#verify-ref-main").value.trim();
        verifyBooking(ref, "#verify-result-main");
    });

    $("#verify-ref-main")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const ref = $("#verify-ref-main").value.trim();
            verifyBooking(ref, "#verify-result-main");
        }
    });

    // Footer links
    onClick("#footer-support", () => {
        openApp("/help?support=true");
    });
    onClick("#footer-privacy", () => {
        openApp("/disclaimer");
    });
    onClick("#footer-terms", () => {
        openApp("/cookie-notice");
    });
}

// ---- Render User Card ----
function renderUserCard() {
    if (!currentUser) return;

    const initials = `${(currentUser.firstName || "")[0] || ""}${(currentUser.lastName || "")[0] || ""}`.toUpperCase() || "?";
    const name = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.email;

    $("#user-avatar").textContent = initials;
    $("#user-name").textContent = name;
    $("#user-role").textContent = currentUser.role || "visitor";
    renderQuickActions();
}

// ---- Load Dashboard ----
async function loadDashboard() {
    const data = await api(getDashboardBookingsEndpoint());

    if (!data || data._unauthorized) {
        $("#stat-upcoming").textContent = "—";
        $("#stat-completed").textContent = "—";
        $("#stat-total").textContent = "—";
        renderWorkflowHub([]);
        $("#role-status-cards")?.classList.add("hidden");
        $("#guide-workflow-panel")?.classList.add("hidden");
        return;
    }

    bookings = Array.isArray(data) ? data : [];
    const now = new Date();

    const upcoming = bookings.filter(
        (b) => bookingDateTime(b) >= now && b.status !== "cancelled" && b.status !== "completed"
    );
    const completed = bookings.filter((b) => b.status === "completed");

    $("#stat-upcoming").textContent = upcoming.length;
    $("#stat-completed").textContent = completed.length;
    $("#stat-total").textContent = bookings.length;

    renderWorkflowHub(upcoming);
    await renderRoleStatusCards(upcoming, completed);
    // Render next booking + countdown
    renderNextBooking(upcoming);
}

function getDashboardBookingsEndpoint() {
    const role = currentUser?.role || "visitor";
    if (role === "guide") return "/api/bookings/my-tours";
    if (role === "admin" || role === "coordinator" || role === "security") return "/api/bookings/recent";
    return "/api/bookings/my-bookings";
}

function bookingDateTime(booking) {
    const date = new Date(booking.visitDate);
    if (booking.visitTime) {
        const [hours, minutes] = String(booking.visitTime).split(":");
        date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
    }
    return date;
}

function formatBookingDate(booking) {
    const date = bookingDateTime(booking);
    if (Number.isNaN(date.getTime())) return "Date TBC";
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function formatBookingTime(booking) {
    return booking.visitTime
        ? new Date(`2000-01-01T${booking.visitTime}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        })
        : "";
}

function formatTourType(type) {
    if (!type) return "Tour";
    return String(type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value, currency = "USD") {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
}

function formatPercent(value) {
    const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${Math.round(numeric)}%`;
}

function isToday(booking) {
    return bookingDateTime(booking).toDateString() === new Date().toDateString();
}

function getBookingReference(booking) {
    return booking?.bookingReference || booking?.reference || booking?.gygBookingReference || booking?.id?.slice(0, 8) || "—";
}

function getBookingPerson(booking) {
    return booking?.visitorName || booking?.customerName || booking?.firstName || booking?.visitorEmail || "Visitor";
}

function getBookingUrl(booking) {
    return booking?.id ? `/bookings/${booking.id}` : getDashboardPath();
}

function getDashboardPath() {
    const role = currentUser?.role || "visitor";
    if (role === "guide") return "/my-tours";
    if (role === "admin" || role === "coordinator") return "/bookings";
    if (role === "security") return "/live-ops";
    return "/my-bookings";
}

function bookingMatchesQuery(booking, q) {
    return [
        getBookingReference(booking),
        booking?.visitorName,
        booking?.visitorEmail,
        booking?.email,
        booking?.tourType,
        booking?.status,
        booking?.paymentStatus,
    ].some((value) => String(value || "").toLowerCase().includes(q));
}

function getQuickActionsForRole() {
    const role = currentUser?.role || "visitor";
    if (role === "guide") {
        return [
            { label: "My Tours", path: "/my-tours", icon: "bookings", tone: "blue" },
            { label: "Availability", path: "/my-availability", icon: "calendar", tone: "emerald" },
            { label: "Training", path: "/guide-training", icon: "training", tone: "amber" },
            { label: "Earnings", path: "/my-earnings", icon: "money", tone: "purple" },
        ];
    }
    if (ADMIN_ROLES.has(role)) {
        const emailAction = role === "admin"
            ? { label: "Templates", path: "/email-settings", icon: "mail", tone: "amber" }
            : { label: "Emails", path: "/send-email", icon: "mail", tone: "amber" };
        return [
            { label: "Bookings", path: "/bookings", icon: "bookings", tone: "blue" },
            { label: "Calendar", path: "/calendar", icon: "calendar", tone: "emerald" },
            emailAction,
            { label: "Reports", path: "/reports", icon: "reports", tone: "purple" },
        ];
    }
    if (role === "security") {
        return [
            { label: "Live Ops", path: "/live-ops", icon: "reports", tone: "blue" },
            { label: "Tasks", path: "/tasks", icon: "bookings", tone: "emerald" },
            { label: "Incidents", path: "/security", icon: "support", tone: "amber" },
            { label: "Support", path: "/help?support=true", icon: "support", tone: "purple" },
        ];
    }
    return [
        { label: "Book Visit", path: "/my-bookings?book=true", icon: "calendar", tone: "emerald" },
        { label: "Bookings", path: "/my-bookings", icon: "bookings", tone: "blue" },
        { label: "Support", path: "/help?support=true", icon: "support", tone: "amber" },
        { label: "Resources", path: "/resources", icon: "training", tone: "purple" },
    ];
}

function renderQuickActions() {
    const container = $("#quick-actions");
    if (!container) return;

    container.innerHTML = getQuickActionsForRole().map((action) => `
        <button type="button" class="action-card" data-url="${BASE_URL}${action.path}" aria-label="Open ${escapeHtml(action.label)}">
            <div class="action-icon ${action.tone}">
                ${actionIcons[action.icon] || actionIcons.bookings}
            </div>
            <span>${escapeHtml(action.label)}</span>
        </button>
    `).join("");

    container.querySelectorAll(".action-card").forEach((button) => {
        button.addEventListener("click", () => chrome.tabs.create({ url: button.dataset.url }));
    });
}

function renderWorkflowHub(upcoming) {
    const hub = $("#workflow-hub");
    if (!hub) return;

    const role = currentUser?.role || "visitor";
    const sortedUpcoming = [...(upcoming || [])].sort((a, b) => bookingDateTime(a) - bookingDateTime(b));
    const next = sortedUpcoming[0];
    const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
    const todaysCount = bookings.filter((booking) => {
        const d = bookingDateTime(booking);
        return d.toDateString() === new Date().toDateString() && booking.status !== "cancelled";
    }).length;

    let title = "Visit Hub";
    let subtitle = "Plan a visit, check booking status, or contact support.";
    let chips = [];
    let actions = [
        { label: "Open site", path: "", tone: "secondary" },
        { label: "Support", path: "/help?support=true", tone: "outline" },
    ];

    if (role === "guide") {
        title = "Guide Work Hub";
        subtitle = next
            ? `${formatBookingDate(next)}${formatBookingTime(next) ? ` at ${formatBookingTime(next)}` : ""} · ${next.visitorName || "Assigned visitor"}`
            : "No upcoming guide assignment loaded.";
        chips = [
            { label: `${todaysCount} today`, tone: todaysCount > 0 ? "success" : "muted" },
            { label: `${pendingCount} pending`, tone: pendingCount > 0 ? "warning" : "muted" },
        ];
        actions = [
            { label: "My tours", path: "/my-tours", tone: "primary" },
            { label: "Availability", path: "/my-availability", tone: "outline" },
        ];
    } else if (ADMIN_ROLES.has(role) || role === "security") {
        title = "Operations Snapshot";
        subtitle = pendingCount > 0
            ? `${pendingCount} booking ${pendingCount === 1 ? "request needs" : "requests need"} attention.`
            : "No pending booking requests in the recent queue.";
        chips = [
            { label: `${todaysCount} today`, tone: todaysCount > 0 ? "success" : "muted" },
            { label: `${pendingCount} pending`, tone: pendingCount > 0 ? "warning" : "muted" },
        ];
        actions = [
            { label: "Bookings", path: "/bookings", tone: "primary" },
            { label: "Reports", path: "/reports", tone: "outline" },
        ];
    } else {
        title = next ? "Your Visit Hub" : "Plan Your Visit";
        subtitle = next
            ? `${formatBookingDate(next)}${formatBookingTime(next) ? ` at ${formatBookingTime(next)}` : ""} · ${formatTourType(next.tourType)}`
            : "Book a guided visit and keep your confirmation close from the toolbar.";
        chips = next ? [
            { label: next.status || "pending", tone: next.status === "confirmed" ? "success" : "warning" },
            { label: next.paymentStatus === "paid" ? "paid" : "payment pending", tone: next.paymentStatus === "paid" ? "success" : "muted" },
        ] : [
            { label: "No visit scheduled", tone: "muted" },
        ];
        actions = next
            ? [
                { label: "My bookings", path: "/my-bookings", tone: "primary" },
                { label: "Support", path: "/help?support=true", tone: "outline" },
            ]
            : [
                { label: "Book visit", path: "/my-bookings?book=true", tone: "primary" },
                { label: "Explore", path: "/things-to-do", tone: "outline" },
            ];
    }

    hub.innerHTML = `
        <div class="workflow-card">
            <div class="workflow-main">
                <div class="workflow-kicker">${escapeHtml(currentUser?.role || "visitor")}</div>
                <h4>${escapeHtml(title)}</h4>
                <p>${escapeHtml(subtitle)}</p>
                <div class="workflow-chips">
                    ${chips.map((chip) => `<span class="status-chip ${chip.tone}">${escapeHtml(chip.label)}</span>`).join("")}
                </div>
            </div>
            <div class="workflow-actions">
                ${actions.map((action) => `
                    <button type="button" class="hub-action ${action.tone}" data-url="${BASE_URL}${action.path}">
                        ${escapeHtml(action.label)}
                    </button>
                `).join("")}
            </div>
        </div>
    `;
    hub.classList.remove("hidden");
    hub.querySelectorAll(".hub-action").forEach((button) => {
        button.addEventListener("click", () => chrome.tabs.create({ url: button.dataset.url }));
    });
}

async function renderRoleStatusCards(upcoming, completed) {
    const container = $("#role-status-cards");
    if (!container) return;

    const role = currentUser?.role || "visitor";
    const sortedUpcoming = [...(upcoming || [])].sort((a, b) => bookingDateTime(a) - bookingDateTime(b));
    const next = sortedUpcoming[0];
    const todaysTours = bookings.filter((booking) => isToday(booking) && booking.status !== "cancelled");
    let cards = [];

    if (role === "guide") {
        const [trainingStats, earnings] = await Promise.all([
            api("/api/training/stats"),
            api("/api/guides/me/earnings"),
        ]);
        const trainingPercent = trainingStats?.percentage ?? 0;
        const payoutSummary = earnings?.payoutSummary || {};
        const payoutValue = payoutSummary.pendingAmount
            ? formatMoney(payoutSummary.pendingAmount)
            : formatMoney(earnings?.monthlyEarnings || 0);
        const payoutDetail = payoutSummary.pendingCount
            ? `${payoutSummary.pendingCount} pending payout${payoutSummary.pendingCount === 1 ? "" : "s"}`
            : "Monthly guide earnings";

        cards = [
            {
                label: "Today’s tour",
                value: todaysTours.length ? `${todaysTours.length} assigned` : "None today",
                detail: todaysTours[0] ? `${formatBookingTime(todaysTours[0]) || "Time TBC"} · ${getBookingPerson(todaysTours[0])}` : "Check the next assignment below",
                path: todaysTours[0] ? getBookingUrl(todaysTours[0]) : "/my-tours",
                icon: "calendar",
                tone: todaysTours.length ? "success" : "muted",
            },
            {
                label: "Training",
                value: formatPercent(trainingPercent),
                detail: trainingStats?.total ? `${trainingStats.completed || 0} of ${trainingStats.total} modules complete` : "No training modules loaded",
                path: "/guide-training",
                icon: "training",
                tone: trainingPercent >= 100 ? "success" : "warning",
            },
            {
                label: "Payout",
                value: payoutValue,
                detail: payoutDetail,
                path: "/my-earnings",
                icon: "money",
                tone: payoutSummary.pendingCount ? "warning" : "muted",
            },
        ];

        renderGuideWorkflowPanel(sortedUpcoming, trainingStats || null);
    } else if (ADMIN_ROLES.has(role)) {
        const [stats, failedEmails] = await Promise.all([
            api("/api/stats"),
            api("/api/email-logs?status=failed"),
        ]);
        const pendingRequests = stats?.pendingRequests ?? bookings.filter((booking) => booking.status === "pending").length;
        const todayCount = stats?.todaysTours ?? todaysTours.length;
        const failedCount = Array.isArray(failedEmails) ? failedEmails.length : 0;

        cards = [
            {
                label: "Pending bookings",
                value: String(pendingRequests),
                detail: pendingRequests ? "Needs coordinator review" : "Queue is clear",
                path: "/bookings",
                icon: "bookings",
                tone: pendingRequests ? "warning" : "success",
            },
            {
                label: "Failed emails",
                value: String(failedCount),
                detail: failedCount ? "Review and retry sends" : "No failed sends found",
                path: "/send-email?status=failed",
                icon: "mail",
                tone: failedCount ? "danger" : "success",
            },
            {
                label: "Today’s tours",
                value: String(todayCount),
                detail: todayCount ? "Open calendar or booking queue" : "No tours scheduled today",
                path: "/calendar",
                icon: "calendar",
                tone: todayCount ? "success" : "muted",
            },
        ];

        $("#guide-workflow-panel")?.classList.add("hidden");
    } else if (role === "security") {
        const pendingRequests = bookings.filter((booking) => booking.status === "pending").length;
        cards = [
            {
                label: "Today’s tours",
                value: String(todaysTours.length),
                detail: todaysTours.length ? "Monitor live visit flow" : "No tours scheduled today",
                path: "/live-ops",
                icon: "calendar",
                tone: todaysTours.length ? "success" : "muted",
            },
            {
                label: "Pending bookings",
                value: String(pendingRequests),
                detail: pendingRequests ? "Coordinate with booking staff" : "Queue is clear",
                path: "/bookings",
                icon: "bookings",
                tone: pendingRequests ? "warning" : "success",
            },
            {
                label: "Incident support",
                value: "Open ops",
                detail: "Review tasks, incidents, and safety notes",
                path: "/security",
                icon: "support",
                tone: "blue",
            },
        ];

        $("#guide-workflow-panel")?.classList.add("hidden");
    } else {
        const paymentStatus = String(next?.paymentStatus || next?.payment_status || "").toLowerCase();
        const hasPaid = paymentStatus === "paid";
        const hasPaymentSignal = Boolean(paymentStatus || next?.paymentReference || next?.payment_reference);

        cards = [
            {
                label: "Next visit",
                value: next ? formatBookingDate(next) : "No visit",
                detail: next ? `${formatBookingTime(next) || "Time TBC"} · ${formatTourType(next.tourType)}` : "Book a guided visit",
                path: next ? getBookingUrl(next) : "/my-bookings?book=true",
                icon: "calendar",
                tone: next ? "success" : "muted",
            },
            {
                label: "Payment status",
                value: next ? (hasPaid ? "Paid" : hasPaymentSignal ? "Needs review" : "Pending") : "Not started",
                detail: next ? `Ref ${getBookingReference(next)}` : "Payment appears after booking",
                path: next ? getBookingUrl(next) : "/my-bookings",
                icon: "money",
                tone: hasPaid ? "success" : next ? "warning" : "muted",
            },
            {
                label: "Support shortcut",
                value: "Open ticket",
                detail: "Help with visits, refunds, or changes",
                path: "/help?support=true",
                icon: "support",
                tone: "blue",
            },
        ];

        $("#guide-workflow-panel")?.classList.add("hidden");
    }

    renderStatusCards(container, cards);
}

function renderStatusCards(container, cards) {
    container.innerHTML = cards.map((card) => `
        <button type="button" class="status-card status-${card.tone || "muted"}" data-url="${escapeHtml(`${BASE_URL}${card.path || ""}`)}" aria-label="${escapeHtml(`${card.label}: ${card.value}`)}">
            <span class="status-card-icon">${actionIcons[card.icon] || actionIcons.bookings}</span>
            <span class="status-card-copy">
                <span class="status-card-label">${escapeHtml(card.label)}</span>
                <strong>${escapeHtml(card.value)}</strong>
                <span>${escapeHtml(card.detail || "")}</span>
            </span>
        </button>
    `).join("");
    container.classList.remove("hidden");
    container.querySelectorAll(".status-card").forEach((button) => {
        button.addEventListener("click", () => openApp(button.dataset.url));
    });
}

function renderGuideWorkflowPanel(upcoming, trainingStats) {
    const panel = $("#guide-workflow-panel");
    if (!panel || currentUser?.role !== "guide") return;

    const sortedUpcoming = [...(upcoming || [])].sort((a, b) => bookingDateTime(a) - bookingDateTime(b));
    const todayTour = sortedUpcoming.find((booking) => isToday(booking));
    const nextAssignment = todayTour || sortedUpcoming[0];
    const trainingPercent = trainingStats?.percentage ?? 0;
    const assignmentTitle = nextAssignment
        ? `${formatBookingDate(nextAssignment)}${formatBookingTime(nextAssignment) ? ` at ${formatBookingTime(nextAssignment)}` : ""}`
        : "No upcoming assignment";
    const assignmentDetail = nextAssignment
        ? `${getBookingPerson(nextAssignment)} · ${formatTourType(nextAssignment.tourType)} · Ref ${getBookingReference(nextAssignment)}`
        : "Set availability or contact coordination if you expected a tour.";
    const canAction = Boolean(nextAssignment?.id);

    panel.innerHTML = `
        <h4 class="section-title">Guide Workflow</h4>
        <div class="guide-workflow-card">
            <div class="guide-assignment">
                <span class="guide-workflow-kicker">${todayTour ? "Today" : "Next assignment"}</span>
                <strong>${escapeHtml(assignmentTitle)}</strong>
                <span>${escapeHtml(assignmentDetail)}</span>
            </div>
            <div id="guide-workflow-message" class="workflow-message hidden" role="status"></div>
            <div class="guide-workflow-actions">
                <button type="button" class="workflow-button primary" data-action="open-assignment" ${canAction ? "" : "disabled"}>Open assignment</button>
                <button type="button" class="workflow-button" data-action="check-in" ${canAction ? "" : "disabled"}>Check in</button>
                <button type="button" class="workflow-button danger" data-action="no-show" ${canAction ? "" : "disabled"}>No-show</button>
                <button type="button" class="workflow-button" data-action="availability">Availability</button>
                <button type="button" class="workflow-button ${trainingPercent >= 100 ? "" : "warning"}" data-action="training">
                    ${trainingPercent >= 100 ? "Training ready" : `Training ${formatPercent(trainingPercent)}`}
                </button>
            </div>
        </div>
    `;

    panel.classList.remove("hidden");
    panel.querySelectorAll(".workflow-button").forEach((button) => {
        button.addEventListener("click", () => handleGuideWorkflowAction(button.dataset.action, nextAssignment));
    });
}

async function handleGuideWorkflowAction(action, booking) {
    if (action === "open-assignment" && booking) {
        openApp(getBookingUrl(booking));
        return;
    }
    if (action === "availability") {
        openApp("/my-availability");
        return;
    }
    if (action === "training") {
        openApp("/guide-training");
        return;
    }
    if (!booking?.id) return;

    if (action === "no-show" && !confirm("Mark this visitor as a no-show?")) {
        return;
    }

    const endpoint = action === "check-in"
        ? `/api/bookings/${booking.id}/guide-check-in`
        : `/api/bookings/${booking.id}/guide-no-show`;
    const message = $("#guide-workflow-message");
    if (message) {
        message.textContent = "Updating booking…";
        message.className = "workflow-message";
    }

    const result = await apiAction(endpoint, { method: "POST" });
    if (result && !result._unauthorized) {
        if (message) {
            message.textContent = action === "check-in" ? "Check-in recorded." : "No-show recorded.";
            message.className = "workflow-message success";
        }
        await loadDashboard();
    } else if (message) {
        message.textContent = "Unable to update this booking. Open the full app to review it.";
        message.className = "workflow-message error";
    }
}

// ---- Next Booking ----
function renderNextBooking(upcoming) {
    const container = $("#next-booking");

    if (!upcoming || upcoming.length === 0) {
        container.innerHTML = `<p class="empty-state">No upcoming bookings</p>`;
        $("#countdown-banner")?.classList.add("hidden");
        if (countdownInterval) clearInterval(countdownInterval);
        return;
    }

    // Sort by date, get the soonest
    const next = [...upcoming].sort((a, b) => bookingDateTime(a) - bookingDateTime(b))[0];

    const date = bookingDateTime(next);
    const formatted = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const time = formatBookingTime(next);

    const statusClass = (next.status || "pending").toLowerCase();
    const tourLabel = formatTourType(next.tourType);

    container.innerHTML = `
    <div class="booking-card">
      <span class="booking-date">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${formatted}${time ? ` at ${time}` : ""}
      </span>
      <span class="booking-type">${escapeHtml(tourLabel)}</span>
      <span class="booking-ref">Ref: ${escapeHtml(next.bookingReference || next.reference || next.id?.slice(0, 8) || "—")}</span>
      <span class="booking-status ${statusClass}">${escapeHtml(next.status || "pending")}</span>
    </div>
  `;

    // Start countdown
    startCountdown(date, next.visitTime);
}

// ---- Load Blog ----
async function loadBlog() {
    const container = $("#blog-list");
    const data = await api("/api/blog");

    if (!data) {
        container.innerHTML = `<p class="empty-state">Unable to load blog posts</p>`;
        return;
    }

    blogPosts = Array.isArray(data) ? data : [];

    if (blogPosts.length === 0) {
        container.innerHTML = `<p class="empty-state">No blog posts yet</p>`;
        return;
    }

    // Show latest 10
    const posts = blogPosts.slice(0, 10);
    container.innerHTML = posts
        .map((post) => {
            const date = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })
                : "";

            const thumbIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;

            const imgSrc = post.coverImage
                ? (post.coverImage.startsWith("http") ? post.coverImage : `${BASE_URL}${post.coverImage}`)
                : null;

            const validatedImgSrc = validateImageUrl(imgSrc);

            return `
        <div class="blog-card" data-slug="${escapeHtml(post.slug || "")}">
          <div class="blog-thumb">
            ${validatedImgSrc
                    ? `<img src="${escapeHtml(validatedImgSrc)}" alt="" />`
                    : thumbIcon
                }
          </div>
          <div class="blog-info">
            <h4>${escapeHtml(post.title || "Untitled")}</h4>
            <p class="blog-excerpt">${escapeHtml(post.excerpt || "")}</p>
            ${date ? `<span class="blog-date">${date}</span>` : ""}
          </div>
        </div>
      `;
        })
        .join("");

    // Add click handlers
    container.querySelectorAll(".blog-card").forEach((card) => {
        card.addEventListener("click", () => {
            const slug = card.dataset.slug;
            if (slug) {
                chrome.tabs.create({ url: `${BASE_URL}/blog/${slug}` });
            }
        });
    });
}

async function loadHelpArticles() {
    const data = await api("/api/help/articles");
    helpArticles = Array.isArray(data) ? data : [];
}

// ---- Load Notifications ----
async function loadNotifications() {
    const container = $("#notif-list");
    const data = await api("/api/notifications");

    if (!data || data._unauthorized) {
        container.innerHTML = `<p class="empty-state">Sign in to see notifications</p>`;
        return;
    }

    notifications = Array.isArray(data) ? data : [];

    // Filter out admin/internal notifications for non-admin users
    const userRole = currentUser?.role || 'visitor';
    if (userRole === 'visitor') {
        // Admin-only notification types that visitors shouldn't see
        const adminTypes = ['booking_created', 'check_in', 'payment_received', 'incident_reported', 'guide_assigned'];
        // Admin-only links
        const adminLinks = ['/bookings', '/security', '/security-admin', '/revenue', '/guide-performance', '/help-admin', '/calendar'];

        notifications = notifications.filter(n => {
            if (adminTypes.includes(n.type)) return false;
            if (n.link && adminLinks.includes(n.link)) return false;
            return true;
        });
    }

    populateNotificationFilter();
    renderNotifications();
}

function populateNotificationFilter() {
    const select = $("#notif-filter");
    if (!select) return;

    const current = notificationFilter;
    const types = Array.from(new Set(notifications.map((n) => n.type).filter(Boolean))).sort();
    select.innerHTML = `
        <option value="all">All notifications</option>
        <option value="unread">Unread only</option>
        ${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(formatNotificationType(type))}</option>`).join("")}
    `;
    select.value = types.includes(current) || current === "all" || current === "unread" ? current : "all";
    notificationFilter = select.value;
}

function renderNotifications() {
    const container = $("#notif-list");
    if (!container) return;

    const unread = notifications.filter((n) => !n.isRead);
    const badge = $("#notif-badge");

    if (unread.length > 0) {
        badge.textContent = unread.length > 99 ? "99+" : unread.length;
        badge.classList.remove("hidden");
        // Update extension badge
        chrome.action.setBadgeText({ text: String(unread.length) });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    } else {
        badge.classList.add("hidden");
        chrome.action.setBadgeText({ text: "" });
    }

    if (notifications.length === 0) {
        container.innerHTML = `<p class="empty-state">No notifications yet</p>`;
        return;
    }

    const visible = notifications.filter((notification) => {
        if (notificationFilter === "unread") return !notification.isRead;
        if (notificationFilter === "all") return true;
        return notification.type === notificationFilter;
    });

    if (visible.length === 0) {
        container.innerHTML = `<p class="empty-state">No notifications match this filter</p>`;
        return;
    }

    container.innerHTML = visible
        .slice(0, 20)
        .map((n) => {
            const time = n.createdAt ? timeAgo(new Date(n.createdAt)) : "";
            const linkUrl = getNotificationTarget(n);
            return `
        <div class="notif-item ${n.isRead ? "" : "unread"}" data-id="${n.id}" ${linkUrl ? `data-url="${escapeHtml(linkUrl)}"` : ""} tabindex="0" role="button" aria-label="${escapeHtml(n.title || "Notification")}">
          ${!n.isRead ? '<div class="notif-dot"></div>' : ""}
          <div class="notif-content">
            <p class="notif-title">${escapeHtml(n.title || "Notification")}</p>
            <p class="notif-message">${escapeHtml(n.message || "")}</p>
            ${n.type ? `<span class="notif-type">${escapeHtml(formatNotificationType(n.type))}</span>` : ""}
            <div class="notif-footer">
              ${time ? `<span class="notif-time">${time}</span>` : "<span></span>"}
              <div class="notif-actions">
                ${!n.isRead ? `<button class="notif-link-btn notif-read-btn" data-id="${n.id}">Mark read</button>` : ""}
                ${linkUrl ? `<button class="notif-link-btn notif-open-btn" data-url="${escapeHtml(linkUrl)}">Open →</button>` : ""}
              </div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");

    // Link button click
    container.querySelectorAll(".notif-open-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openApp(btn.dataset.url);
        });
    });

    container.querySelectorAll(".notif-read-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await markNotificationRead(btn.dataset.id);
        });
    });

    container.querySelectorAll(".notif-item").forEach((item) => {
        const open = () => {
            if (item.dataset.url) {
                openApp(item.dataset.url);
            } else if (item.classList.contains("unread")) {
                markNotificationRead(item.dataset.id);
            }
        };
        item.addEventListener("click", open);
        item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
    });
}

function getNotificationTarget(notification) {
    const explicit = normalizeNotificationLink(notification?.link);
    if (explicit) return explicit;

    const relatedId = notification?.relatedId || notification?.related_id;
    if (!relatedId) return null;

    const type = String(notification?.type || "");
    if (type.includes("support")) {
        return ADMIN_ROLES.has(currentUser?.role)
            ? `${BASE_URL}/help-admin?ticket=${encodeURIComponent(relatedId)}`
            : `${BASE_URL}/help?support=true`;
    }
    if (type.includes("email")) return `${BASE_URL}/send-email?log=${encodeURIComponent(relatedId)}`;
    if (type.includes("booking") || type.includes("payment") || type.includes("guide") || type.includes("check_in")) {
        return `${BASE_URL}/bookings/${encodeURIComponent(relatedId)}`;
    }

    return null;
}

function normalizeNotificationLink(link) {
    if (!link) return null;
    return link.startsWith("http") ? link : `${BASE_URL}${link}`;
}

function formatNotificationType(type) {
    return String(type || "general")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function markNotificationRead(id) {
    if (!id) return;
    const result = await apiAction(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (result && !result._unauthorized) {
        notifications = notifications.map((notification) => (
            String(notification.id) === String(id) ? { ...notification, isRead: true } : notification
        ));
        renderNotifications();
    }
}

async function snoozeNotifications() {
    const until = Date.now() + 60 * 60 * 1000;
    await chrome.storage.local.set({ notificationSnoozedUntil: until });
    renderSnoozeStatus(until);
}

function renderSnoozeStatus(explicitUntil) {
    const status = $("#notif-snooze-status");
    if (!status) return;

    const render = (until) => {
        if (until && Number(until) > Date.now()) {
            status.textContent = `Desktop alerts snoozed until ${new Date(Number(until)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`;
            status.classList.remove("hidden");
        } else {
            status.classList.add("hidden");
        }
    };

    if (explicitUntil) {
        render(explicitUntil);
        return;
    }

    chrome.storage.local.get("notificationSnoozedUntil", (result) => {
        render(result.notificationSnoozedUntil);
    });
}

// ---- Mark All Read ----
async function markAllNotificationsRead() {
    try {
        await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        await loadNotifications();
    } catch (err) {
        console.error("Failed to mark all read:", err);
    }
}

// ---- Utility: Time Ago ----
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---- Utility: Escape HTML ----
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ---- Dark Mode ----
function initDarkMode() {
    chrome.storage.local.get('darkMode', (result) => {
        const hasSavedPreference = typeof result.darkMode === "boolean";
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
        setDarkMode(hasSavedPreference ? result.darkMode : prefersDark);
    });
}

function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark');
    chrome.storage.local.set({ darkMode: isDark });
    setDarkMode(isDark);
}

function setDarkMode(isDark) {
    document.body.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    if (isDark) {
        $("#icon-sun")?.classList.add('hidden');
        $("#icon-moon")?.classList.remove('hidden');
    } else {
        $("#icon-sun")?.classList.remove('hidden');
        $("#icon-moon")?.classList.add('hidden');
    }
}

// ---- Search ----
function setupSearch() {
    const input = $("#search-input");
    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => performSearch(input.value.trim()), 200);
    });

    // Close search on Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            $("#search-results").classList.add('hidden');
            $(".tab-content").style.display = '';
        }
    });
}

function performSearch(query) {
    const resultsEl = $("#search-results");
    const tabContent = $(".tab-content");

    if (!query) {
        resultsEl.classList.add('hidden');
        tabContent.style.display = '';
        return;
    }

    const q = query.toLowerCase();
    const matches = [];

    // Search bookings by reference, visitor, tour type, and status
    bookings.forEach((booking) => {
        if (bookingMatchesQuery(booking, q)) {
            matches.push({
                type: "booking",
                name: `Booking ${getBookingReference(booking)}`,
                description: `${formatBookingDate(booking)}${formatBookingTime(booking) ? ` at ${formatBookingTime(booking)}` : ""} · ${getBookingPerson(booking)}`,
                path: getBookingUrl(booking),
            });
        }
    });

    // Search zones
    zonesData.forEach(z => {
        if ((z.name || '').toLowerCase().includes(q) || (z.description || '').toLowerCase().includes(q)) {
            matches.push({ type: 'zone', name: z.name, description: z.description || "Camp zone", id: z.id });
        }
    });

    // Search POIs
    poisData.forEach(p => {
        if ((p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) {
            matches.push({ type: 'poi', name: p.name, description: p.description || "Point of interest", id: p.id });
        }
    });

    // Search blog posts
    blogPosts.forEach(p => {
        if ((p.title || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q)) {
            matches.push({ type: 'blog', name: p.title, description: p.excerpt || "Blog article", slug: p.slug, path: p.slug ? `/blog/${p.slug}` : "/blog" });
        }
    });

    // Search help center articles
    helpArticles.forEach((article) => {
        const haystack = [article.title, article.content, article.category, article.audience].join(" ").toLowerCase();
        if (haystack.includes(q)) {
            matches.push({
                type: "help",
                name: article.title,
                description: article.category ? formatNotificationType(article.category) : "Help article",
                path: article.slug ? `/help?article=${encodeURIComponent(article.slug)}` : "/help",
            });
        }
    });

    // Search internal manual sections for staff
    if (currentUser && currentUser.role !== "visitor") {
        manualSearchItems.forEach((item) => {
            const haystack = `${item.title} ${item.text}`.toLowerCase();
            if (haystack.includes(q)) {
                matches.push({
                    type: "manual",
                    name: item.title,
                    description: "Staff manual",
                    path: item.path,
                });
            }
        });
    }

    if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="search-empty">No results found</div>';
    } else {
        resultsEl.innerHTML = matches.slice(0, 12).map(m => {
            const icons = {
                booking: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
                zone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
                poi: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
                blog: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
                help: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
                manual: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M20 22V2H6.5A2.5 2.5 0 0 0 4 4.5v15"></path></svg>`,
            };
            return `
                <div class="search-item" data-type="${m.type}" data-slug="${escapeHtml(m.slug || '')}" data-url="${m.path ? escapeHtml(`${BASE_URL}${m.path}`) : ""}">
                    <div class="search-item-icon ${m.type}">${icons[m.type] || icons.help}</div>
                    <div class="search-item-text">
                        <div class="search-item-title">${escapeHtml(m.name || '')}</div>
                        <div class="search-item-type">${escapeHtml(m.description || m.type)}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Click handlers
        resultsEl.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                if (item.dataset.url) {
                    openApp(item.dataset.url);
                } else if (type === 'zone') {
                    // Switch to Explore tab
                    $("#search-input").value = '';
                    resultsEl.classList.add('hidden');
                    tabContent.style.display = '';
                    $$('.tab-btn').forEach(b => b.classList.remove('active'));
                    $$('.tab-panel').forEach(p => p.classList.remove('active'));
                    $('[data-tab="explore"]').classList.add('active');
                    $('#tab-explore').classList.add('active');
                } else if (type === 'poi') {
                    $("#search-input").value = '';
                    resultsEl.classList.add('hidden');
                    tabContent.style.display = '';
                    $$('.tab-btn').forEach(b => b.classList.remove('active'));
                    $$('.tab-panel').forEach(p => p.classList.remove('active'));
                    $('[data-tab="explore"]').classList.add('active');
                    $('#tab-explore').classList.add('active');
                }
            });
        });
    }

    resultsEl.classList.remove('hidden');
    tabContent.style.display = 'none';
}

// ---- Countdown Timer ----
function startCountdown(visitDate, visitTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    const banner = $("#countdown-banner");
    if (!banner) return;

    function update() {
        const target = new Date(visitDate);
        if (visitTime) {
            const [h, m] = visitTime.split(':');
            target.setHours(parseInt(h), parseInt(m), 0);
        }

        const diff = target - new Date();
        if (diff <= 0) {
            banner.classList.add('hidden');
            if (countdownInterval) clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        $("#cd-days").textContent = days;
        $("#cd-hours").textContent = hours;
        $("#cd-mins").textContent = mins;
        banner.classList.remove('hidden');
    }

    update();
    countdownInterval = setInterval(update, 60000); // Update every minute
}

// ---- Load Explore (Public API) ----
async function loadExplore() {
    // Zones
    const zonesContainer = $("#zones-list");
    const zones = await api("/api/public/zones");

    if (!zones || !Array.isArray(zones) || zones.length === 0) {
        zonesContainer.innerHTML = `<p class="empty-state">No zones available</p>`;
    } else {
        zonesData = zones;
        zonesContainer.innerHTML = zones.map(z => `
            <div class="explore-card" data-zone="${z.id}">
                <div class="explore-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <div class="explore-info">
                    <div class="explore-name">${escapeHtml(z.name || 'Zone')}</div>
                    ${z.description ? `<div class="explore-desc">${escapeHtml(z.description)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Points of Interest
    const poiContainer = $("#poi-list");
    const pois = await api("/api/public/points-of-interest");

    if (!pois || !Array.isArray(pois) || pois.length === 0) {
        poiContainer.innerHTML = `<p class="empty-state">No points of interest available</p>`;
    } else {
        poisData = pois;
        poiContainer.innerHTML = pois.slice(0, 15).map(p => `
            <div class="explore-card">
                <div class="explore-icon poi">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </div>
                <div class="explore-info">
                    <div class="explore-name">${escapeHtml(p.name || 'POI')}</div>
                    ${p.description ? `<div class="explore-desc">${escapeHtml(p.description)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// ---- Booking Verifier ----
async function verifyBooking(ref, resultSelector) {
    const resultEl = $(resultSelector);

    if (!ref) {
        resultEl.className = 'verify-result error';
        resultEl.textContent = 'Please enter a booking reference.';
        resultEl.classList.remove('hidden');
        return;
    }

    resultEl.className = 'verify-result';
    resultEl.textContent = 'Checking…';
    resultEl.classList.remove('hidden');

    try {
        const res = await fetch(`${BASE_URL}/api/bookings/verify/${encodeURIComponent(ref)}`, {
            headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
            resultEl.className = 'verify-result error';
            resultEl.textContent = res.status === 404
                ? 'No booking found with that reference.'
                : 'Unable to verify. Please try again.';
            return;
        }

        const booking = await res.json();
        const status = (booking.status || 'pending').toLowerCase();
        const date = booking.visitDate
            ? new Date(booking.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A';

        resultEl.className = 'verify-result success';
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        const tourType = booking.tourType ? ` · ${formatTourType(booking.tourType)}` : "";
        resultEl.innerHTML = `<strong>${escapeHtml(label)}</strong> — ${escapeHtml(date)}${escapeHtml(tourType)}`;
    } catch (err) {
        resultEl.className = 'verify-result error';
        resultEl.textContent = 'Connection error. Please try again.';
    }
}
