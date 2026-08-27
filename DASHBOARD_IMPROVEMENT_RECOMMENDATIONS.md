# Dashboard Improvement Recommendations

Generated: 2026-05-25

Scope: current Visit Dzaleka dashboard and role-specific workflow audit for visitor, guide, admin, coordinator, security, and transport partner roles. This is a recommendation report, not an implementation patch. Evidence comes from the current worktree, mainly `client/src/pages/dashboard.tsx`, role routes in `client/src/App.tsx`, navigation in `client/src/components/app-sidebar.tsx`, and the linked role workflow pages.

## Executive Summary

Visitor and guide dashboards already cover the main workflow: visitors can see bookings, payment state, transport state, support options, reports, and planning links; guides can see today's tours, readiness, training, availability, earnings, QR scanning, and performance. The next improvement layer should make urgent work easier to find without forcing users to open multiple pages.

The biggest dashboard-level improvements are:

- Add a role-specific "Action Required" strip for visitors and guides.
- Add a visitor "Arrival Pass" section that exposes QR code, itinerary, meeting point, transport, and emergency contact in one place.
- Add guide "Current Tour Mode" and "Post-tour Follow-up" sections.
- Surface messages, support tickets, saved itineraries, favorite guides, tasks, and notifications directly on dashboards.
- Fix a real coordinator dashboard blank-state gap in the pending bookings panel.
- Move or remove unreachable guide/visitor quick-action code currently inside `AdminDashboard`.
- Add query error states to role dashboards so failed dashboard APIs do not read as zero activity.

## Current Role Dashboard Map

### Visitor

Current entry point:
- `client/src/App.tsx:2679` routes visitors to `VisitorDashboard`.
- `client/src/pages/dashboard.tsx:1697` defines `VisitorDashboard`.

Current sections:
- Data: bookings, saved itineraries, public zones, and meeting points are queried at `client/src/pages/dashboard.tsx:1703-1716`.
- Stats: total bookings, upcoming visits, completed tours at `client/src/pages/dashboard.tsx:1922-1939`.
- Next Visit: date, payment, transport, support, and next best action at `client/src/pages/dashboard.tsx:1943-2021`.
- Upcoming Visits: detailed cards at `client/src/pages/dashboard.tsx:2091-2273`.
- Cancellation/refund status at `client/src/pages/dashboard.tsx:2287-2314`.
- Past Visits and guide rating at `client/src/pages/dashboard.tsx:2403-2534`.
- Safety/support and incidents at `client/src/pages/dashboard.tsx:2544-2594`.
- Plan Your Visit links at `client/src/pages/dashboard.tsx:2606-2649`.

Related visitor pages not surfaced enough on the dashboard:
- Saved itineraries route exists in `client/src/App.tsx:418` and page query is `client/src/pages/saved-itineraries.tsx:40`.
- Favorite guides route exists in `client/src/App.tsx:419` and page query is `client/src/pages/favorite-guides.tsx:43`.
- Support ticket history exists in `client/src/pages/help-center.tsx:413-452`.
- Booking QR code appears in booking details at `client/src/pages/my-bookings.tsx:1215-1242`, not on the dashboard.

### Guide

Current entry point:
- `client/src/App.tsx:2672` routes guides to `GuideDashboard`.
- `client/src/pages/dashboard.tsx:1086` defines `GuideDashboard`.

Current sections:
- Data: guide tours, guide profile, availability, training stats, and earnings are queried at `client/src/pages/dashboard.tsx:1093-1110`.
- Stats: today's tours, completed tours, rating, and total earnings at `client/src/pages/dashboard.tsx:1221-1241`.
- Guide Readiness: availability, training, payout, and My Tours links at `client/src/pages/dashboard.tsx:1248-1308`.
- Next Assignment After Today at `client/src/pages/dashboard.tsx:1316-1357`.
- Today's Assigned Tours with check-in, no-show, check-out, and QR scan at `client/src/pages/dashboard.tsx:1364-1462`.
- Performance overview at `client/src/pages/dashboard.tsx:1470-1492`.
- QR scanner dialog at `client/src/pages/dashboard.tsx:1497-1503`.

Related guide pages not surfaced enough on the dashboard:
- My Tours has tabs for upcoming, in progress, completed, and reports at `client/src/pages/my-tours.tsx:608-622`.
- My Tours includes visitor email/phone actions at `client/src/pages/my-tours.tsx:330-339`, but the dashboard does not.
- Tasks are available to guides through `client/src/components/app-sidebar.tsx:291-297` and the task page has due/overdue summaries at `client/src/pages/tasks.tsx:215-223`.
- Messages are available to guides through `client/src/components/app-sidebar.tsx:297`.
- Help Center is available to guides through `client/src/components/app-sidebar.tsx:303`.

### Admin And Coordinator

Current admin entry point:
- `client/src/App.tsx:2668` routes admins to `AdminDashboard`.
- `client/src/pages/dashboard.tsx:225` defines `AdminDashboard`.

Current coordinator entry point:
- `client/src/App.tsx:2670` routes coordinators to `CoordinatorDashboard`.
- `client/src/pages/dashboard.tsx:887` defines `CoordinatorDashboard`.

Current admin sections:
- Quick actions at `client/src/pages/dashboard.tsx:337-385`.
- Stats at `client/src/pages/dashboard.tsx:454-481`.
- Community request alert at `client/src/pages/dashboard.tsx:485-507`.
- Analytics charts at `client/src/pages/dashboard.tsx:512-520`.
- Visitor countries, today's schedule, recent bookings, quick actions, and weekly revenue at `client/src/pages/dashboard.tsx:527-868`.

Current coordinator sections:
- Stats at `client/src/pages/dashboard.tsx:925-948`.
- Today's schedule at `client/src/pages/dashboard.tsx:956-990`.
- Pending bookings at `client/src/pages/dashboard.tsx:997-1032`.
- Quick actions at `client/src/pages/dashboard.tsx:1039-1080`.

### Security

Current entry point:
- `client/src/App.tsx:2674` routes security users to `SecurityDashboard`.
- `client/src/pages/dashboard.tsx:1507` defines `SecurityDashboard`.

Current sections:
- Active visits and incidents are queried at `client/src/pages/dashboard.tsx:1508-1512`.
- Today's tours are queried at `client/src/pages/dashboard.tsx:1516`.
- Stats are shown at `client/src/pages/dashboard.tsx:1541-1558`.
- Active visitors, open incidents, and quick actions are shown at `client/src/pages/dashboard.tsx:1567-1689`.

### Transport Partner

Current entry point:
- `client/src/App.tsx:2676` redirects transport partners to `/transport-partner/dashboard`.
- Transport partner navigation is explicitly role-scoped in `client/src/components/app-sidebar.tsx:80-128`.

Current portal state:
- The portal is already substantially built out. It includes next best action, quick actions, request pipeline, attention queue, route volume, visit-date volume, next pickup, readiness checklist, priority requests, request queue, referrals, roster, availability, pricing, profile, and help.
- Relevant dashboard sections are in `client/src/pages/transport-partner-portal.tsx:2777-3095`.
- Current tree already has data-error handling and empty states for live operations and transport partner roster/pricing, so those should not be treated as missing sections.

## Priority Recommendations

### V-01 - Add A Visitor "Action Required" Strip

Priority: High

Placement:
- Add directly under `PageHeader` in `VisitorDashboard`, before the three stat cards at `client/src/pages/dashboard.tsx:1922`.

Why:
- The visitor dashboard currently spreads urgent actions across Next Visit, Upcoming Visits, Cancellation & Refund Status, Support, My Reported Issues, and Help Center.
- A visitor should immediately see whether they need to pay, approve/decline a transport quote, read a support reply, rate a guide, complete pre-visit learning, or check cancellation/refund status.

Suggested cards:
- Payment needed or payment verification pending.
- Transport quote waiting for approval.
- Unread message or notification.
- Support ticket updated.
- Guide rating due after a completed visit.
- Cancellation/refund follow-up.

Data sources:
- Existing `myBookings` from `client/src/pages/dashboard.tsx:1703`.
- Notifications from `client/src/components/notification-bell.tsx:60-67`.
- Support tickets from `client/src/pages/help-center.tsx:414-415`.
- Transport quote decisions from booking transport details in `client/src/pages/my-bookings.tsx:394-589`.

Concrete code direction:

```tsx
const visitorActionItems = buildVisitorActionItems({
  bookings: myBookings || [],
  supportTickets,
  unreadNotifications,
});

{visitorActionItems.length > 0 && (
  <ActionRequiredStrip items={visitorActionItems} />
)}
```

### V-02 - Add A Visitor "Arrival Pass" Section

Priority: High

Placement:
- Replace or expand the right-side "Next best action" panel inside `Next Visit` at `client/src/pages/dashboard.tsx:1965`.

Why:
- The dashboard currently tells the visitor a meeting point and links to details, but the high-value arrival items are scattered.
- QR code is available in booking details at `client/src/pages/my-bookings.tsx:1215-1242`, but it is not exposed on the dashboard.

Missing content to consolidate:
- Check-in QR code or "Open QR" button.
- Meeting point name plus map/directions link.
- Itinerary link if generated.
- Guide name and tap-to-call action.
- Transport driver/vehicle/phone if available.
- Emergency contact and support shortcut.
- Offline PDF or "Save to phone" action.

Concrete code direction:
- Use `nextVisit`, `nextVisitMeetingPoint`, `nextVisitTransport`, and `itineraries` already computed in `VisitorDashboard`.
- Add a dashboard-level `ArrivalPassCard` component instead of requiring users to open booking details.

### V-03 - Surface Saved Itineraries And Favorite Guides On The Visitor Dashboard

Priority: Medium

Placement:
- Add a "Your Saved Plans" row below Upcoming Visits or inside Plan Your Visit.

Why:
- Saved itineraries and favorite guides are routed and implemented, but they are not visible from the visitor dashboard beyond sidebar/navigation.
- These are high-intent repeat-booking shortcuts.

Evidence:
- Saved itineraries route exists at `client/src/App.tsx:418` and page data comes from `client/src/pages/saved-itineraries.tsx:40`.
- Favorite guides route exists at `client/src/App.tsx:419` and page data comes from `client/src/pages/favorite-guides.tsx:43`.

Suggested UI:
- "Book from saved itinerary".
- "Request a favorite guide".
- "No saved plans yet" state with a one-click booking CTA.

### V-04 - Add Visitor Support Ticket Status To The Dashboard

Priority: Medium

Placement:
- Add a small "Support status" panel next to My Reported Issues or inside Safety & Support.

Why:
- The dashboard links to support and renders incident history, but support ticket status is only in Help Center.
- Visitors should not need to navigate away to see whether the team replied.

Evidence:
- Help Center ticket history exists at `client/src/pages/help-center.tsx:413-452`.
- Visitor dashboard Safety & Support is at `client/src/pages/dashboard.tsx:2544-2579`.

Suggested UI:
- Latest ticket subject, status, last updated.
- "Open support ticket" and "View all tickets".
- Empty state: "No support tickets yet".

### V-05 - Add A Visitor Timeline / Latest Update Feed

Priority: Medium

Placement:
- Under Next Visit or inside each Upcoming Visit card.

Why:
- Booking status, guide assignment, transport quote, itinerary generation, payment verification, and staff messages are event-like updates.
- The visitor should see the latest state change without inspecting each booking.

Suggested data source:
- Existing booking timeline endpoints used by booking detail pages, or a new `/api/bookings/my-bookings/updates` aggregate.

Suggested UI:
- "Guide assigned".
- "Transport quote sent".
- "Payment verification pending".
- "Itinerary ready".
- "Support replied".

### G-01 - Move Dead Guide/Visitor Quick Actions Out Of `AdminDashboard`

Priority: High

Files:
- `client/src/pages/dashboard.tsx:337-446`
- `client/src/pages/dashboard.tsx:2667-2679`

Evidence:
- `AdminDashboard` contains conditional quick-action branches for `user?.role === "guide"` at `client/src/pages/dashboard.tsx:388` and `user?.role === "visitor"` at `client/src/pages/dashboard.tsx:422`.
- The role switch at `client/src/pages/dashboard.tsx:2667-2679` only renders `AdminDashboard` for admins. Guides and visitors render separate dashboard components, so those guide/visitor branches are unreachable.

Impact:
- Intended guide and visitor quick actions are dead code.
- GuideDashboard lacks a top quick-action rail for Schedule, My Tours, Tasks, Messages, Training, Profile, and Help.
- VisitorDashboard lacks a compact action rail for Book, Bookings, Messages, Resources, Saved Itineraries, Favorite Guides, and Support.

Required fix:
- Move those quick-action branches into `GuideDashboard` and `VisitorDashboard`, or delete them and replace with explicit role-local action sections.

Suggested guide actions:
- My Tours.
- Scan QR.
- Calendar.
- Tasks.
- Messages.
- Availability.
- Training.
- Earnings.

Suggested visitor actions:
- Book visit.
- Open next booking.
- Arrival pass.
- Messages.
- Support.
- Saved itineraries.
- Favorite guides.
- Resources.

### G-02 - Add A Guide "Current Tour Mode"

Priority: High

Placement:
- Add above "Today's Assigned Tours" in `GuideDashboard`, after Guide Readiness.

Why:
- Today's Assigned Tours has check-in/no-show/check-out controls, but it is a list. A guide starting a tour needs a focused command panel.
- Visitor phone/email shortcuts exist in `My Tours` at `client/src/pages/my-tours.tsx:330-339`, but not on the dashboard.

Suggested content:
- Current or next tour.
- Start/complete/no-show buttons.
- Visitor phone/email/message action.
- Meeting point and route.
- Transport partner/driver contact when available.
- Report incident.
- Open itinerary.
- Post-tour report CTA once completed.

Concrete code direction:
- Derive `activeTour = upcomingTours.find(t => t.status === "in_progress")`.
- Derive `nextConfirmedTour = upcomingTours.find(t => t.status === "confirmed")`.
- Render a `GuideCurrentTourCard` before the list.

### G-03 - Add A Guide "Action Required" Queue

Priority: High

Placement:
- Add below Guide Readiness or beside Current Tour Mode.

Why:
- Guides need to know what to do next across tasks, reports, training, availability, and payouts.
- Current dashboard shows readiness cards, but no unified queue of due actions.

Suggested action items:
- Post-tour report missing for completed tour.
- Training incomplete.
- Availability not set for coming week.
- Task due today or overdue.
- Payout pending or payout issue.
- Message unread.

Evidence:
- Guide training stats are already queried at `client/src/pages/dashboard.tsx:1105`.
- Guide earnings are already queried at `client/src/pages/dashboard.tsx:1110`.
- Task summary logic exists in `client/src/pages/tasks.tsx:215-223`.
- Messages exist in `client/src/pages/messages.tsx:124-135`.

Concrete code direction:
- Add `/api/dashboard/guide-actions` to avoid making the dashboard perform too many independent queries.
- Return typed items: `{ type, severity, title, description, href, count }`.

### G-04 - Improve Guide Earnings And Availability Feedback

Priority: Medium

Files:
- `client/src/pages/dashboard.tsx:1097-1110`
- `client/src/pages/dashboard.tsx:1228-1241`
- `client/src/pages/my-availability.tsx:34-86`
- `client/src/pages/my-earnings.tsx:27-45`

Why:
- Dashboard secondary queries do not expose error states. If earnings/profile/availability fail, the dashboard can show zero or "Default hours".
- `MyEarnings` defaults to zero totals when its query returns no data.
- `MyAvailability` tracks `hasChanges`, but the page should also warn before navigating away with unsaved changes.

Suggested changes:
- Add `isError` and retry affordances for guide profile, availability, training, and earnings on the dashboard.
- Show "Unavailable" instead of zero for failed earnings.
- Use `useUnsavedChanges(hasChanges)` in `MyAvailability`.
- Add a "next 7 days" availability preview to the guide dashboard.

### G-05 - Add Post-tour Report Reminders

Priority: Medium

Placement:
- Add to GuideDashboard under Performance Overview or as part of Action Required.

Why:
- `My Tours` has Reports History and post-tour report dialog at `client/src/pages/my-tours.tsx:669-777`.
- The dashboard does not summarize which completed tours still need a report.

Suggested UI:
- "2 reports due" card.
- Link to `/my-tours?tab=completed` or `/my-tours?tab=reports`.
- Badge on completed tour cards until submitted.

### C-01 - Fix Coordinator Pending Bookings Blank-State Logic

Priority: High

Files:
- `client/src/pages/dashboard.tsx:997-1032`

Evidence:
- CoordinatorDashboard renders the Pending Bookings card at `client/src/pages/dashboard.tsx:997`.
- The empty state checks `!recentBookings || recentBookings.length === 0` at `client/src/pages/dashboard.tsx:1007-1010`.
- The populated branch maps `recentBookings.filter(b => b.status === "pending").slice(0, 5)` at `client/src/pages/dashboard.tsx:1015`.

Impact:
- If `recentBookings` contains only confirmed/completed bookings and no pending bookings, the card renders an empty container instead of "All bookings have been processed."

Required fix:

```tsx
const pendingBookings = (recentBookings || []).filter((booking) => booking.status === "pending");

{pendingBookings.length === 0 ? (
  <EmptyState
    icon={BookOpen}
    title="No pending bookings"
    description="All bookings have been processed."
    className="py-8"
  />
) : (
  pendingBookings.slice(0, 5).map(...)
)}
```

### A-01 - Add Admin/Coordinator Operational Action Center Above Analytics

Priority: Medium

Placement:
- Admin: between stat cards and analytics charts, before `client/src/pages/dashboard.tsx:512`.
- Coordinator: between stat cards and Today's Schedule, before `client/src/pages/dashboard.tsx:956`.

Why:
- AdminDashboard puts analytics charts high on the page. That is useful, but operational work should be easier to act on first.
- Existing admin quick actions and community request alert are useful but do not summarize all urgent queues.

Suggested items:
- Pending bookings.
- Unassigned confirmed bookings.
- Payment verifications pending.
- Transport requests needing partner/quote.
- Support tickets open.
- Incidents open.
- Community requests open.
- Guide profile change requests.
- Post-tour reports awaiting review.
- System health degraded.

Suggested data source:
- Add `/api/dashboard/admin-actions` and `/api/dashboard/coordinator-actions`.

### A-02 - Add Dashboard Query Error States Across All Role Dashboards

Priority: Medium

Files:
- `client/src/pages/dashboard.tsx:237-253`
- `client/src/pages/dashboard.tsx:888-896`
- `client/src/pages/dashboard.tsx:1093-1110`
- `client/src/pages/dashboard.tsx:1508-1516`
- `client/src/pages/dashboard.tsx:1703-1716`

Why:
- Dashboard queries generally use only `data` and `isLoading`, then default missing values to zero or empty arrays.
- This was already improved in `client/src/pages/live-ops.tsx:79-100`, where failed live operations queries render error states and "Unavailable" metrics.

Required pattern:

```tsx
const { data, isLoading, isError, error, refetch } = useQuery<T>({
  queryKey: ["/api/dashboard/role"],
});

if (isError) {
  return (
    <DataErrorState
      title="Dashboard unavailable"
      description={error instanceof Error ? error.message : "Could not load dashboard data."}
      onRetry={() => refetch()}
    />
  );
}
```

### S-01 - Strengthen Security Dashboard Loading/Error Coverage

Priority: Medium

Files:
- `client/src/pages/dashboard.tsx:1508-1516`
- `client/src/pages/dashboard.tsx:1528-1558`

Why:
- `SecurityDashboard` does not include `todaysTours` loading/error in the page-level loading state.
- If `/api/bookings/today` fails, pending check-ins and today's check-ins can read as zero.

Suggested changes:
- Track `isLoading`, `isError`, and `refetch` for `todaysTours`.
- Follow the `LiveOperations` error pattern in `client/src/pages/live-ops.tsx:174-181`.
- Add "Booking verification feed unavailable" instead of showing zero pending check-ins.

### T-01 - Add Transport Partner Settlement And SLA Sections

Priority: Medium

Current state:
- Transport partner dashboard is already strong and has next best action, request pipeline, attention queue, next pickup, readiness, and route demand.
- Evidence: `client/src/pages/transport-partner-portal.tsx:2777-3095`.

Missing useful sections:
- Settlement/invoice status for completed transport jobs.
- Quote response SLA timer, especially for requests older than 24 hours.
- Driver ETA or "pickup readiness" checklist per confirmed pickup.
- Route map preview for next pickup.
- "Needs Visit Dzaleka review" panel for declined quotes/reschedule requests.

Suggested additions:
- Add `Settlement status` card near Request pipeline.
- Add SLA badges to priority requests.
- Add `Confirm driver en route` action for confirmed pickups.

### X-01 - Add A Shared Dashboard Action Item Component

Priority: Medium

Why:
- Visitor, guide, admin, coordinator, security, and transport partner dashboards all need the same pattern: a short list of urgent actions, count, severity, and destination.

Suggested component:

```tsx
type DashboardActionItem = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

function DashboardActionList({ items }: { items: DashboardActionItem[] }) {
  if (items.length === 0) return null;
  return <section aria-label="Action required">...</section>;
}
```

Suggested role endpoints:
- `/api/dashboard/visitor-actions`
- `/api/dashboard/guide-actions`
- `/api/dashboard/admin-actions`
- `/api/dashboard/coordinator-actions`
- `/api/dashboard/security-actions`
- `/api/dashboard/transport-partner-actions`

## Suggested Implementation Order

1. Fix `C-01` and remove/move unreachable quick-action code from `AdminDashboard` (`G-01`). These are low-risk code hygiene wins.
2. Add visitor `Action Required` and `Arrival Pass` sections (`V-01`, `V-02`).
3. Add guide `Current Tour Mode` and `Action Required` sections (`G-02`, `G-03`).
4. Add dashboard query error states across all role dashboards (`A-02`, `S-01`).
5. Add admin/coordinator action centers (`A-01`).
6. Add visitor saved-plan/support panels and guide post-tour report reminders (`V-03`, `V-04`, `V-05`, `G-05`).
7. Add transport partner settlement/SLA enhancements (`T-01`).

## Acceptance Criteria

- Visitor dashboard shows at most one scroll to reach: next visit, QR/arrival pass, payment/transport action, support status, and saved plan shortcuts.
- Guide dashboard shows at most one scroll to reach: current tour action, QR scan, visitor contact, tasks due, reports due, availability, training, and payout status.
- Coordinator pending bookings card never renders a blank body when there are recent bookings but zero pending bookings.
- Dashboard stat cards do not show false zeroes when the backing query failed.
- Every role dashboard has a role-specific action list with clear destination links.
- Dead role-specific quick-action branches inside `AdminDashboard` are removed or relocated.
- All new dashboard controls use real buttons/links, accessible names, visible focus, and mobile tap targets of at least 44px where practical.
