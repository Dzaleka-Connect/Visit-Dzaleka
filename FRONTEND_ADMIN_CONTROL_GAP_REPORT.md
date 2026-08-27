# Frontend Admin Control Gap Report

Generated: 2026-05-25

Scope: static UI component and dashboard-section audit across `client/src/pages/**` and `client/src/components/**`, excluding `**/ios/**`. The audit focused on high-privilege admin controls, role-specific visitor/guide/transport partner layouts, and conditional rendering paths that can produce blank sections, false-empty states, or unauthorized control exposure.

## Executive Summary

The current frontend has substantially better route-level role protection than earlier snapshots. `client/src/App.tsx` gates visitor, guide, admin, coordinator, security, and transport partner routes through `ProtectedRoute` at lines 411-501. Sidebar navigation is role-filtered in `client/src/components/app-sidebar.tsx:507-510`, and the command palette now filters commands against the same role sources in `client/src/components/command-palette.tsx:74-101`.

The remaining gaps are concentrated in admin and partner operational dashboards. Several high-privilege pages still default failed queries to empty arrays or zero metrics, so an API outage can look like an empty queue, a green system, or an unconfigured panel. The transport partner portal also has real blank subsections in driver, vehicle, and pricing lists.

Visitor and guide flows were checked for the requested role-specific section coverage. The main visitor and guide pages have explicit empty states for booking details, support content, tours, guide assignment, transport requests, and timelines. No visitor or guide admin-control leakage was found in route or sidebar/command-palette gating.

## Verified Role And Routing Controls

- `client/src/App.tsx:411-418` separates staff booking routes from visitor `/my-bookings` routes.
- `client/src/App.tsx:420` allows `/calendar` for admin, coordinator, and guide, while `client/src/pages/calendar.tsx:88-106` restricts board/timeline management modes to admin/coordinator.
- `client/src/pages/calendar.tsx:138` now calls `/api/bookings/${bookingId}/assign`, matching the backend assignment route, and `client/src/pages/calendar.tsx:886-1030` hides admin assignment/status actions from guides.
- `client/src/App.tsx:446-448` gives guides separate `/my-tours` detail and itinerary routes.
- `client/src/App.tsx:472-474` gates transport partner routes to admin, coordinator, and transport_partner.
- `client/src/App.tsx:456-480` restricts system health, users, settings, audit logs, analytics, CMS, and security-admin to admin-only routes where expected.
- `client/src/App.tsx:458` redirects `/admin/webhooks` to `/developer?tab=webhooks`, avoiding a duplicate high-privilege webhook surface.
- `client/src/pages/security.tsx:88-132` normalizes `tab` from the URL and writes tab changes back to `/security?tab=...`, fixing the earlier security tab deep-link gap.

## Findings

### FAD-01 - System Health Shows Hard-Coded Green Integration Statuses

Severity: High

Files:
- `client/src/pages/system-health.tsx:31`
- `client/src/pages/system-health.tsx:120-165`

Evidence:
- The page only queries `/api/health` at `client/src/pages/system-health.tsx:31`.
- The third-party status cards hard-code `Operational` for Resend, Stripe, and GetYourGuide at `client/src/pages/system-health.tsx:120`, `client/src/pages/system-health.tsx:139`, `client/src/pages/system-health.tsx:152`, and `client/src/pages/system-health.tsx:165`.

Impact:
Admins can see a green "System Health" screen while email, payment, webhook, storage, or OTA integrations are down. This is an incomplete admin control panel because it presents fixed labels instead of measured operational state.

Required fix:
- Add backend health checks for Resend, Stripe, GetYourGuide, Supabase storage, scheduled reports, and webhook delivery queues.
- Replace the static cards with query-backed statuses, last-checked timestamps, degraded/error states, and remediation links to `/developer?tab=webhooks`, `/email-settings`, `/payments`, `/admin/scheduled-reports`, and `/getyourguide`.

### FAD-02 - Security Admin Tabs Render False Empty Tables On Query Failure

Severity: High

Files:
- `client/src/pages/security-admin.tsx:148-160`
- `client/src/pages/security-admin.tsx:396-405`
- `client/src/pages/security-admin.tsx:510-531`
- `client/src/pages/security-admin.tsx:608-629`
- `client/src/pages/security-admin.tsx:751`

Evidence:
- IP whitelist, login history, invites, and email log queries only destructure `data` and `isLoading` at `client/src/pages/security-admin.tsx:148-160`.
- IP whitelist falls through to a table when `allowedIps` is `undefined` because only `allowedIps?.length === 0` is checked at `client/src/pages/security-admin.tsx:396`.
- Login history and email logs show "No login history" or "No emails sent" based on filtered empty arrays at `client/src/pages/security-admin.tsx:510-611`.
- Invites branch on `invites?.length === 0` at `client/src/pages/security-admin.tsx:751`, so an undefined failed query can become an empty table shell.

Impact:
High-privilege security controls can silently appear empty during API failure. Admins may incorrectly believe there are no whitelisted IPs, login attempts, email deliveries, or pending invites.

Required fix:
- Destructure `isError`, `error`, and `refetch` for each security query.
- Render a tab-local error state before empty states or tables.
- Avoid optional `.map()` fallthrough inside table bodies for security-critical data.
- Disable destructive actions until the relevant collection has successfully loaded.

### FAD-03 - Operations Control Can Spin Forever After Failed Load

Severity: High

Files:
- `client/src/pages/operations-control.tsx:123`
- `client/src/pages/operations-control.tsx:201-207`

Evidence:
- `/api/operations-control` is queried at `client/src/pages/operations-control.tsx:123` without an `isError` branch.
- The page returns only a loader while `isLoading || !settings || !data` at `client/src/pages/operations-control.tsx:201-207`.

Impact:
If the operations-control endpoint fails, the admin page can remain in an indefinite loading state. That blocks delegation, queue owner, escalation, and notification-routing controls without telling the admin what failed.

Required fix:
- Destructure `isError`, `error`, and `refetch`.
- Render a blocking error state with retry when `isError || (!isLoading && !data)`.
- Keep the save button disabled until a valid settings object is loaded.

### FAD-04 - Live Operations Shows Zero/All-Clear States When Critical Queries Fail

Severity: High

Files:
- `client/src/pages/live-ops.tsx:78-96`
- `client/src/pages/live-ops.tsx:174-211`
- `client/src/pages/live-ops.tsx:303-311`
- `client/src/pages/live-ops.tsx:380-407`

Evidence:
- `/api/live-ops/stats` and `/api/bookings/today` are queried at `client/src/pages/live-ops.tsx:78-96` without error branches.
- Header cards default stats to zero via `stats?.visitorsOnSite || 0`, `stats?.activeTours || 0`, `stats?.openIncidents || 0`, and `stats?.availableGuides || 0` at `client/src/pages/live-ops.tsx:174-211`.
- Active tours render "No tours currently in progress" at `client/src/pages/live-ops.tsx:303` when `stats` is missing.
- Security feed renders "All Clear" at `client/src/pages/live-ops.tsx:407` when incidents are unavailable.
- The "Ready to Start" section is hidden entirely when `pendingTours.length === 0` at `client/src/pages/live-ops.tsx:311`, including the query-failed case.

Impact:
Security/admin operators can see all-clear and zero-count signals while live-ops APIs are unavailable. This is a high-risk dashboard misrepresentation.

Required fix:
- Add `isError/refetch` for live stats and today's bookings.
- Render an error banner and per-card unavailable states instead of zero values.
- Always render the "Ready to Start" section with an empty/error body, not only when pending tours exist.

### FAD-05 - Transport Partner Portal Defaults Failed Operational Queries To Empty Queues

Severity: High

Files:
- `client/src/pages/transport-partner-portal.tsx:1453-1486`
- `client/src/pages/transport-partner-portal.tsx:3096`
- `client/src/pages/transport-partner-portal.tsx:3494`

Evidence:
- Profile, requests, referrals, drivers, vehicles, blackouts, pricing, activity, and config queries are declared at `client/src/pages/transport-partner-portal.tsx:1453-1486`.
- Most collections default to `[]`, and no query-level error states are rendered.
- Request and referral tabs show empty states at `client/src/pages/transport-partner-portal.tsx:3096` and `client/src/pages/transport-partner-portal.tsx:3494`.

Impact:
Admin/coordinator users and transport partners can see "No transport requests" or "No referrals" when the underlying API has failed. That hides queue failures in a revenue- and logistics-critical portal.

Required fix:
- Stop defaulting critical operational query results to `[]` until the query succeeds.
- Add a critical-data error banner for profile, requests, referrals, roster, availability, and pricing queries.
- Render per-tab `DataErrorState` with retry before empty states.

### FAD-06 - Transport Partner Dashboard Lacks A Blocking No-Linked-Partner State

Severity: High

Files:
- `client/src/pages/transport-partner-portal.tsx:1499-1512`
- `client/src/pages/transport-partner-portal.tsx:2290`
- `client/src/pages/transport-partner-portal.tsx:2646`

Evidence:
- Partner identity is inferred from `profile?.partners` or `profile?.partner` at `client/src/pages/transport-partner-portal.tsx:1499-1512`.
- The display name falls back to `"Transport Partner"` at `client/src/pages/transport-partner-portal.tsx:2290`.
- The partner dashboard renders for non-admin users when `!profileLoading && activeTab === "dashboard"` at `client/src/pages/transport-partner-portal.tsx:2646`, even if `profile?.partner` is missing.

Impact:
A `transport_partner` account with no linked active partner can see a generic operational portal with zero metrics and disabled controls instead of a clear account setup error. That looks like a half-built dashboard and gives no recovery path.

Required fix:
- Before rendering tabs for non-admin users, add:
  - `if (!isAdminView && !profileLoading && !profile?.partner) return <EmptyState ... />`
- Include retry, contact-support, and sign-out actions.
- Do not compute dashboard metrics or render operational controls until a partner record is linked.

### FAD-07 - Transport Partner Driver And Vehicle Roster Lists Have Blank Bodies

Severity: Medium

Files:
- `client/src/pages/transport-partner-portal.tsx:1525-1526`
- `client/src/pages/transport-partner-portal.tsx:3625`
- `client/src/pages/transport-partner-portal.tsx:3698`

Evidence:
- `scopedDrivers` and `scopedVehicles` are computed at `client/src/pages/transport-partner-portal.tsx:1525-1526`.
- The driver card maps `scopedDrivers.map(...)` at `client/src/pages/transport-partner-portal.tsx:3625`.
- The vehicle card maps `scopedVehicles.map(...)` at `client/src/pages/transport-partner-portal.tsx:3698`.
- Neither list has a zero-length branch.

Impact:
The roster view contains complete forms but an empty lower list area when no drivers or vehicles exist. For admins, this also fails to explain whether the selected partner has no records or no partner is selected.

Required fix:
- Add explicit empty states inside the driver and vehicle list containers.
- If `!rosterPartnerId`, show "Select or create a transport partner first" and keep forms disabled with the same reason.
- If a partner is selected but there are no records, show "No saved drivers" or "No saved vehicles" with a call to save the first record.

### FAD-08 - Transport Partner Pricing Table Has No Empty Row

Severity: Medium

Files:
- `client/src/pages/transport-partner-portal.tsx:1528`
- `client/src/pages/transport-partner-portal.tsx:3987`

Evidence:
- `scopedPartnerPricing` is computed at `client/src/pages/transport-partner-portal.tsx:1528`.
- The pricing table body only maps `scopedPartnerPricing.map(...)` at `client/src/pages/transport-partner-portal.tsx:3987`.
- There is no empty table row or empty state.

Impact:
When a partner has no route pricing, the "Partner Transport Prices" table renders headers and an empty body. This directly affects the requested transport partner route-management checkpoint.

Required fix:
- Add a table row with `colSpan={isAdminView ? 7 : 6}`.
- Render an empty state such as "No route prices configured" with a CTA to save the first route price.
- In admin mode, include the selected partner name so the empty state is scoped.

### FAD-09 - Developer Settings Can Report No API Keys/Webhooks During Fetch Failure

Severity: Medium

Files:
- `client/src/pages/developer-settings.tsx:90-104`
- `client/src/pages/developer-settings.tsx:194`
- `client/src/pages/developer-settings.tsx:399`
- `client/src/pages/developer-settings.tsx:865`
- `client/src/pages/developer-settings.tsx:1009-1012`

Evidence:
- Webhook endpoints, deliveries, and API keys default to `[]` at `client/src/pages/developer-settings.tsx:90-104` and `client/src/pages/developer-settings.tsx:194`.
- Empty states render when `apiKeys.length === 0`, `webhookEndpoints.length === 0`, and `deliveries.length === 0` at `client/src/pages/developer-settings.tsx:399`, `client/src/pages/developer-settings.tsx:865`, and `client/src/pages/developer-settings.tsx:1009-1012`.

Impact:
Admins can falsely conclude that no API keys, webhook endpoints, or deliveries exist after a fetch failure. This is a high-privilege integration-control surface.

Required fix:
- Track `isError`, `error`, and `refetch` for API keys, endpoints, and deliveries.
- Render error states before empty states.
- Avoid default `[]` for security/integration inventories unless the query has succeeded.

### FAD-10 - Task Admin Misrepresents Failed Task/Stats/User Loads As Empty Or Zero

Severity: Medium

Files:
- `client/src/pages/task-admin.tsx:109-129`
- `client/src/pages/task-admin.tsx:288-332`
- `client/src/pages/task-admin.tsx:385-449`

Evidence:
- Tasks, users, and task stats are queried at `client/src/pages/task-admin.tsx:109-129` without error UI.
- Stats cards default to zero with `stats?.total || 0`, `stats?.pending || 0`, `stats?.inProgress || 0`, `stats?.completed || 0`, and `stats?.overdue || 0` at `client/src/pages/task-admin.tsx:288-332`.
- The task table shows "No tasks found. Create your first task!" at `client/src/pages/task-admin.tsx:449`.

Impact:
Coordinator/admin task queues can appear empty or all-zero during endpoint failure, hiding work assignment and operations tracking outages.

Required fix:
- Add error branches for tasks, users, and stats.
- Render "Tasks unavailable" separately from "No tasks found".
- Disable assignment controls when the user query fails and explain why.

### FAD-11 - Audit Logs Show "No Audit Logs" When Audit Query Fails

Severity: Medium

Files:
- `client/src/pages/audit-logs.tsx:110`
- `client/src/pages/audit-logs.tsx:333-339`

Evidence:
- Audit logs query only destructures `data: logs` and `isLoading` at `client/src/pages/audit-logs.tsx:110`.
- The empty branch at `client/src/pages/audit-logs.tsx:333-339` uses `logs && logs.length > 0` to choose between "No matching logs" and "No audit logs".

Impact:
An audit-log API failure is indistinguishable from a clean system with no recorded activity. That is unsafe for a high-privilege audit surface.

Required fix:
- Add `isError`, `error`, and `refetch`.
- Render an audit-specific error state.
- Disable CSV export and cleanup actions when logs are unavailable.

### FAD-12 - Scheduled Reports Can Hide Delivery Configuration Failures

Severity: Medium

Files:
- `client/src/pages/scheduled-reports.tsx:210`
- `client/src/pages/scheduled-reports.tsx:380-392`

Evidence:
- Scheduled reports default to `[]` at `client/src/pages/scheduled-reports.tsx:210`.
- The configured reports table shows "No scheduled reports" when `reports.length === 0` at `client/src/pages/scheduled-reports.tsx:389-392`.

Impact:
Admins can miss a failed reporting configuration fetch and assume no report schedules exist.

Required fix:
- Do not default the scheduled reports query to `[]` before success.
- Add an error state with retry.
- Surface last-run/delivery health separately from configuration presence.

### FAD-13 - Help Admin Can Hide Failed Article Or Ticket Queues Behind Empty States

Severity: Medium

Files:
- `client/src/pages/help-admin.tsx:87-91`
- `client/src/pages/help-admin.tsx:258`
- `client/src/pages/help-admin.tsx:346`

Evidence:
- Articles and tickets default to `[]` at `client/src/pages/help-admin.tsx:87-91`.
- Articles show "No Articles Yet" at `client/src/pages/help-admin.tsx:258`.
- Tickets show "No Tickets" at `client/src/pages/help-admin.tsx:346`.

Impact:
Admin support queues can look empty during API failure, causing missed visitor support requests or missing public help content.

Required fix:
- Add article and ticket query error branches.
- Keep "zero content" and "content unavailable" states visually distinct.
- If ticket fetch fails, show the ticket count as unavailable rather than zero.

### FAD-14 - User Management Role Counts And Table Lack Data Error States

Severity: Medium

Files:
- `client/src/pages/users.tsx:161-165`
- `client/src/pages/users.tsx:404`
- `client/src/pages/users.tsx:571`
- `client/src/pages/users.tsx:615-620`

Evidence:
- Users and stats queries are declared without error branches at `client/src/pages/users.tsx:161-165`.
- Role counts derive from `usersList?.reduce(...)` at `client/src/pages/users.tsx:404`.
- Count cards show `roleCounts[role] || 0` at `client/src/pages/users.tsx:571`.
- The table empty state shows "No users found" at `client/src/pages/users.tsx:615-620`.

Impact:
The admin user-management screen can show zero role counts and "No users found" when `/api/users` fails.

Required fix:
- Add query error UI and retry.
- Render count cards as unavailable instead of zero when user data did not load.
- Block bulk or destructive user actions until the user inventory is known.

### FAD-15 - CMS Content Editor Can Render Blank Forms After Content Fetch Failure

Severity: Medium

Files:
- `client/src/pages/cms.tsx:60-66`
- `client/src/pages/cms.tsx:85-110`

Evidence:
- `/api/content` is queried at `client/src/pages/cms.tsx:60` without an error branch.
- `react-hook-form` receives `values: content as ContentFormData` at `client/src/pages/cms.tsx:66`.
- Once loading ends, the page renders editable content sections starting at `client/src/pages/cms.tsx:95-110` even if content failed to load.

Impact:
Admins can see blank landing-page content fields and potentially overwrite live copy with empty values or incomplete values.

Required fix:
- Add `isError` and a blocking retry state before mounting the form.
- Keep the save button disabled until valid content has loaded.
- Consider a separate "Reset to defaults" action instead of silently mounting blank values.

### FAD-16 - Training Admin Progress Can Treat Failed Guide Stats As "No Guides Found"

Severity: Medium

Files:
- `client/src/pages/training-admin.tsx:113-117`
- `client/src/pages/training-admin.tsx:342-383`
- `client/src/pages/training-admin.tsx:391-459`

Evidence:
- Training modules and guide stats are queried at `client/src/pages/training-admin.tsx:113-117` without error branches.
- The progress table maps `guidesStats.map(...)` at `client/src/pages/training-admin.tsx:342`.
- The fallback says "No guides found" at `client/src/pages/training-admin.tsx:383`.
- Content modules do have an empty module state at `client/src/pages/training-admin.tsx:459`, but it is not separated from failed module loading.

Impact:
Training progress can appear empty when stats fail to load, hiding guide compliance gaps.

Required fix:
- Add separate error states for modules and guide stats.
- Keep "No guides found" only for a successful empty stats response.
- Show "Training modules unavailable" separately from "No Training Modules".

### FAD-17 - Admin Blog List Has An Empty Table Fallthrough On Failed Query

Severity: Low

Files:
- `client/src/pages/admin-blog.tsx:36`
- `client/src/pages/admin-blog.tsx:91-113`

Evidence:
- Blog posts query only destructures `posts` and `isLoading` at `client/src/pages/admin-blog.tsx:36`.
- The list renders an empty state only when `posts?.length === 0` at `client/src/pages/admin-blog.tsx:97`.
- The table body maps `posts?.map(...)` at `client/src/pages/admin-blog.tsx:113`, so an undefined failed query can produce a table shell with no rows.

Impact:
Admin editorial queues can appear blank during a fetch failure.

Required fix:
- Add `isError/refetch`.
- Render a single table row error or full-page error state before the table.

## Verified Complete Or Fixed Areas

- Visitor booking surfaces have explicit empty states:
  - `client/src/pages/my-bookings.tsx:1253-1255` renders "No bookings yet".
  - `client/src/pages/my-booking-details.tsx:318` renders "Booking not found".
  - `client/src/pages/my-booking-details.tsx:536`, `565`, `583`, and `645` cover missing guide, transport, notes, and timeline updates.
- Guide schedule/details surfaces have explicit empty states:
  - `client/src/pages/my-tours.tsx:626-671` covers upcoming, active, completed, and report states.
  - `client/src/pages/guide-tour-details.tsx:265` renders "Tour not found".
  - `client/src/pages/guide-tour-details.tsx:603` explicitly handles no linked transport request.
- Visitor resources no longer render blank when no modules exist:
  - `client/src/pages/visitor-resources.tsx:137` renders an `EmptyState`.
- Help center ticket history no longer disappears silently:
  - `client/src/pages/help-center.tsx:413-452` renders loading, no-ticket, and ticket-list states for `MyTicketsSection`.
- Newsletter embed failure is handled:
  - `client/src/pages/newsletter.tsx:14` tracks `loading`, `ready`, and `error`; `client/src/pages/newsletter.tsx:97-115` renders fallback UI.
- Security workspace tab state is URL-backed:
  - `client/src/pages/security.tsx:88-132` parses and writes query-string tab state.
- Calendar guide/admin controls are role-aware:
  - `client/src/pages/calendar.tsx:88-106`, `383`, `408`, `508-524`, `886-990`, and `1030` prevent guide access to admin management controls while keeping guide navigation functional.
- Review/community moderation pages already distinguish query failures:
  - `client/src/pages/admin-post-tour-reports.tsx:54-166`
  - `client/src/pages/admin-guide-profile-reviews.tsx:54-164`
  - `client/src/pages/admin-community-listings.tsx:160-458`
  - `client/src/pages/reviews-performance.tsx:190-268`

## Required Implementation Pattern

Use this shared pattern for the admin-control gaps above:

```tsx
const {
  data,
  isLoading,
  isError,
  error,
  refetch,
} = useQuery<Resource[]>({
  queryKey: ["/api/admin/resource"],
});

if (isLoading) return <SkeletonOrLoadingState />;

if (isError) {
  return (
    <DataErrorState
      title="Resource unavailable"
      description={error instanceof Error ? error.message : "Try again."}
      onRetry={() => refetch()}
    />
  );
}

if (!data || data.length === 0) {
  return <EmptyState title="No records yet" description="Create the first record to start." />;
}
```

For dashboards and metric cards, do not use `stats?.value || 0` unless the query has succeeded. Render `Unavailable`, `--`, or a retry affordance when the data source is unknown.

For tables, avoid blank `<TableBody>{items?.map(...)}</TableBody>` fallthrough. Every table should have exactly one of these body states: loading, error, empty, or populated.

## Priority Fix Order

1. Fix false-green operational dashboards: FAD-01, FAD-03, FAD-04.
2. Fix security-critical false-empty states: FAD-02, FAD-09, FAD-11.
3. Fix transport partner partner-link, queue, roster, and pricing blank states: FAD-05 through FAD-08.
4. Fix remaining admin inventory and content-control error states: FAD-10, FAD-12 through FAD-17.
