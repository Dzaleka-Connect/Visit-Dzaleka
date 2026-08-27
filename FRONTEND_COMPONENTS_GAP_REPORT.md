# Frontend Components Gap Report - Visit Dzaleka

Date: 2026-05-25  
Scope: `client/src/**` and frontend-facing route/navigation linkages, excluding `**/ios/**`.  
Goal: validate that complete views, dashboards, and navigational entry points exist for Admin, Visitors, Guides, and Transport Partners, and flag missing pages, placeholder/blank sections, unlinked routes, dead links, and role states that lead to incomplete screens.

## Coverage Summary

Reviewed:

- `client/src/App.tsx` public, unauthenticated, and authenticated route switches.
- `client/src/components/app-sidebar.tsx` authenticated sidebar role matrix.
- `client/src/components/command-palette.tsx` keyboard navigation entries.
- `client/src/components/public-header.tsx` desktop and mobile public navigation.
- All `client/src/pages/*.tsx` page components.
- Shared state wrappers used by routed views: `ProtectedRoute`, `queryClient`, `useAuth`, empty/loading/error helpers, and public layout components.

Route inventory:

- Page files in `client/src/pages`: 124.
- Page files imported by `App.tsx`: 123.
- Orphan page file found: `client/src/pages/server-error.tsx`.
- Static sidebar navigation items checked: 65.
- Current sidebar items all resolve to a route or intended external URL.

## Role Coverage Matrix

### Authenticated Sidebar Inventory

These are the current role-visible sidebar entry points from `client/src/components/app-sidebar.tsx`.

Admin:

- `/` Dashboard
- `/transport-partner` Transport Ops
- `/bookings` Bookings
- `/recurring-bookings` Recurring
- `/itinerary-builder` Itinerary Builder
- `/calendar` Schedule
- `/channel-manager` Channel Manager
- `/guides` Guides
- `/guide-performance` Guide Performance
- `/guide-certificates` Guide Certificates
- `/reviews-performance` Reviews + Opportunities
- `/admin/post-tour-reports` Post-Tour Reports
- `/admin/guide-profile-reviews` Profile Reviews
- `/admin/community-listings` Community Listings
- `/zones` Zones & POI
- `/visitors` Visitors
- `/admin/blog` Blog
- `/tasks` My Tasks
- `/messages` Messages
- `/revenue` Revenue
- `/payments` Payments
- `/operations-control` Operations Control
- `/operations-manual` Operations Manual
- `/security` Security
- `/admin/system-health` System Health
- `/getyourguide` GetYourGuide
- `/special-offers` Special Offers
- `/live-ops` Live Operations
- `/security-admin` Security Admin
- `/send-email` Send Email
- `/email-settings` Email Templates
- `/audit-logs` Audit Logs
- `/reports` Reports
- `/analytics` Website Analytics
- `/training-admin` Training Management
- `/task-admin` Task Admin
- `/help-admin` Help Admin
- `/users` User Management
- `/cms` Content Management
- `/settings` Settings
- `/developer` Developer
- `/customers` Customers
- `/admin/webhooks` Webhooks
- `/admin/scheduled-reports` Scheduled Reports
- `/profile` My Profile

Visitor:

- `/` Dashboard
- `/my-bookings` My Bookings
- `/resources` Before You Visit
- `/share-photos` Share Photos
- `/saved-itineraries` Saved Itineraries
- `/favorite-guides` Favorite Guides
- `/messages` Messages
- `/help` Help Center
- `/profile` My Profile

Guide:

- `/` Dashboard
- `/calendar` Schedule
- `/guide-training` Guide Training
- `/my-tours` My Tours
- `/my-earnings` My Earnings
- `/my-availability` My Availability
- `/my-guide-profile` My Guide Profile
- `/tasks` My Tasks
- `/messages` Messages
- `/help` Help Center
- `/profile` My Profile

Transport partner:

- `/transport-partner/dashboard` Dashboard
- `/transport-partner/requests` Transport Requests
- `/transport-partner/referrals` Tour Referrals
- `/transport-partner/roster` Roster
- `/transport-partner/availability` Availability
- `/transport-partner/pricing` Pricing
- `/transport-partner/profile` Profile
- `/transport-partner/help` Help Center
- `/messages` Messages
- `/profile` My Profile

Coordinator and security were also checked because they share frontend surfaces with the requested roles:

- Coordinator has the admin operational subset: bookings, recurring, itinerary builder, calendar, channel manager, guides, guide performance, guide certificates, reviews, post-tour reports, profile reviews, community listings, zones, visitors, blog, tasks, messages, revenue, operations manual, security, GetYourGuide, special offers, send email, reports, task admin, customers, profile.
- Security has dashboard, tasks, messages, security, live operations, profile.

### Admin

Primary dashboard and navigation exist.

Current sidebar coverage includes dashboard, bookings, recurring bookings, itinerary builder, calendar, channel manager, guide operations, visitors/customers, transport ops, finance, operations, security, reports, analytics, training admin, task admin, help admin, users, CMS, settings, developer settings, webhooks, scheduled reports, messages, and profile.

Main gaps:

- Duplicate webhook management surfaces exist at `/developer` and `/admin/webhooks`.
- Some data-heavy admin pages render misleading empty states when API calls fail.
- `server-error.tsx` is unused by the error boundary.

### Visitor

Primary dashboard and navigation exist.

Current sidebar coverage includes dashboard, my bookings, before you visit, share photos, saved itineraries, favorite guides, messages, help center, external services, and profile.

Main gaps:

- Visitor itinerary links point into staff-style `/bookings/:id/itinerary` instead of a visitor-owned route.
- Visitor resources can become a structurally empty tab view if no resource modules are returned.
- Help center hides the "My Support Tickets" section entirely when there are no tickets.
- Share photos is a portal handoff, not an in-app upload workflow.

### Guide

Primary dashboard and navigation exist.

Current sidebar coverage includes dashboard, schedule, guide training, my tours, my earnings, my availability, my guide profile, my tasks, messages, help center, external services, and profile.

Main gaps:

- Calendar is shared with admin/coordinator and exposes guide assignment/status controls to guides even though those actions are staff-only.
- The command palette exposes staff routes such as `/bookings` and `/settings` to guides.
- Generic booking itinerary/detail routes are not role-gated at the frontend level.

### Transport Partner

Primary portal and navigation exist.

Current sidebar coverage includes partner dashboard, transport requests, tour referrals, roster, availability, pricing, company profile, partner help, messages, external services, and personal profile.

Main gaps:

- Command palette is not transport-partner-aware and offers generic routes that lead to unauthorized or irrelevant screens.
- Share/profile distinction is present in sidebar, but command palette still sends partners to generic dashboard/help/settings routes.
- Partner help exists only inside the portal; the global help route is not represented in partner navigation, which is fine only if the portal help section is complete and maintained as the canonical partner support surface.

## Findings

### F1 - Command palette is not role-aware for core authenticated routes

Severity: High

Evidence:

- `client/src/components/command-palette.tsx:88-95` adds `Dashboard`, `Bookings`, `Calendar`, `Messages`, `My Profile`, `Settings`, and `Help Center` for every authenticated user.
- `client/src/App.tsx:348-406` protects those routes with different role sets. Examples:
  - `/bookings` is admin/coordinator only.
  - `/calendar` is admin/coordinator/guide only.
  - `/settings` is admin only.
  - `/analytics` is admin only.
- `client/src/components/app-sidebar.tsx:75-474` already has a more complete role matrix, but the command palette does not reuse it.

Impact:

Visitors, guides, transport partners, and security users can open the command palette and navigate to unauthorized or irrelevant screens. For example, a visitor sees "Bookings" but the visitor-owned page is `/my-bookings`; a transport partner sees generic `/calendar` and `/settings` commands that are not part of the partner portal.

Required addition:

- Drive command palette entries from the same role-aware nav registry used by `AppSidebar`, or create a shared route metadata file:

```ts
type AppRoute = {
  path: string;
  label: string;
  roles: UserRole[];
  command?: boolean;
  sidebar?: boolean;
};
```

- Replace generic commands with role-specific equivalents:
  - visitor: `My Bookings`, `Before You Visit`, `Saved Itineraries`, `Favorite Guides`.
  - guide: `My Tours`, `My Availability`, `Guide Training`, `My Guide Profile`.
  - transport partner: `Transport Requests`, `Roster`, `Availability`, `Pricing`, `Partner Help`.

### F2 - Staff booking detail and itinerary routes are not frontend role-gated

Severity: High

Evidence:

- `client/src/App.tsx:349` registers `/bookings/:id` with plain `<Route>`, not `ProtectedRoute`.
- `client/src/App.tsx:350` registers `/bookings/:id/itinerary` with plain `<Route>`, not `ProtectedRoute`.
- Visitor routes exist separately at `client/src/App.tsx:352-353` as `/my-bookings/:bookingId` and `/my-bookings`.
- Guide routes exist separately at `client/src/App.tsx:382-383` as `/my-tours/:bookingId` and `/my-tours`.
- `client/src/pages/my-bookings.tsx:1234` links visitors to `/bookings/${selectedBooking.id}/itinerary`.
- `client/src/pages/itinerary-view.tsx:39-50` sends the "not found" back link to `/bookings/${id}`.
- `client/src/pages/itinerary-view.tsx:87-90` sends the normal back link to `/bookings/${id}`.

Impact:

Visitors and guides have dedicated detail pages, but itinerary links route them into the staff booking namespace. If the backend rejects the request, the UI shows staff-oriented "booking not found" recovery and links back to `/bookings`, which is not a visitor or guide destination. If the backend allows the request, the frontend has not expressed the role boundary.

Required addition:

- Make staff routes explicit:

```tsx
<ProtectedRoute path="/bookings/:id" component={BookingDetails} allowedRoles={["admin", "coordinator", "security"]} />
<ProtectedRoute path="/bookings/:id/itinerary" component={ItineraryView} allowedRoles={["admin", "coordinator"]} />
```

- Add role-owned itinerary routes:
  - `/my-bookings/:bookingId/itinerary` for visitors.
  - `/my-tours/:bookingId/itinerary` for guides if guides need itinerary access.
- Make `ItineraryView` derive the back link from role/context, not from the staff route namespace.

### F3 - Calendar is guide-accessible but exposes staff-only controls

Severity: High

Evidence:

- `client/src/App.tsx:356` allows `/calendar` for `admin`, `coordinator`, and `guide`.
- `client/src/pages/calendar.tsx:95-99` fetches `/api/bookings` and `/api/guides` for the page.
- `client/src/pages/calendar.tsx:121-129` defines guide assignment mutation against `/api/bookings/${bookingId}/assign`.
- `client/src/pages/calendar.tsx:861-884` renders the "Assigned Guide" select for the selected booking without checking the viewer role.
- `client/src/pages/calendar.tsx:963-984` renders quick status actions such as confirm, complete, and cancel without checking the viewer role.
- `client/src/pages/calendar.tsx:997-1000` links to `/bookings/${selectedBooking.id}`, the staff detail route.

Impact:

Guides can open a calendar view that contains staff operations controls. Backend authorization may block these actions, but the guide-facing screen still looks broken: controls are visible, then fail. This is an incomplete role-specific view.

Required addition:

- Read the current user role in `CalendarPage`.
- For guides:
  - show read-only assigned schedule only.
  - hide guide assignment controls.
  - hide confirm/complete/cancel status controls unless a guide-specific action is explicitly supported.
  - link to `/my-tours/:bookingId`, not `/bookings/:id`.
- For admin/coordinator:
  - keep assignment and staff status controls.
- Add test coverage for the guide calendar path.

### F4 - Security dashboard query-tab links do not control the Security page

Severity: Medium

Evidence:

- `client/src/pages/dashboard.tsx:1610` links to `/security?tab=incidents`.
- `client/src/pages/dashboard.tsx:1664` links to `/security?tab=verification`.
- `client/src/pages/dashboard.tsx:1673` links to `/security?tab=incidents`.
- `client/src/pages/dashboard.tsx:1682` links to `/security?tab=active`.
- `client/src/pages/security.tsx:102` initializes `activeTab` to `"verify"` and never reads the URL query.
- `client/src/pages/security.tsx:420-433` defines valid tab values `verify`, `active`, and `incidents`.

Impact:

Security dashboard quick actions imply deep-link support, but `/security?tab=incidents` still opens the default verify tab. `/security?tab=verification` also uses a value that does not match the actual tab key (`verify`). Users land in the wrong section.

Required addition:

- Parse `tab` from `useSearch()` or `window.location.search` on load.
- Normalize `verification` to `verify` or change the dashboard link to `?tab=verify`.
- Update the URL when tab changes so Back/Forward restores the selected tab.

### F5 - Reviews page links to a route that does not exist

Severity: High

Evidence:

- `client/src/pages/reviews-performance.tsx:302` links to `/email-history`.
- `client/src/App.tsx:398` routes `EmailHistory` at `/send-email`.
- No `/email-history` route was found in `App.tsx`.

Impact:

The "Email history" action from Reviews & Visitor Feedback opens the Not Found page instead of the email history page.

Required addition:

- Change the link to `/send-email`, or add a compatibility route:

```tsx
<RedirectRoute path="/email-history" to="/send-email" />
```

- Prefer renaming the route to `/email-history` if that is the user-facing concept and keep `/send-email` as an alias.

### F6 - Public Things To Do subpages are routed but not discoverable from the public navigation

Severity: Medium

Evidence:

- `client/src/App.tsx:255-256` routes `/things-to-do/nature-outdoors` and `/things-to-do/dining-nightlife`.
- `client/src/components/public-header.tsx:136-151` includes Things To Do links for all experiences, guided walking tour, arts/culture, shopping, sports/recreation, and host community, but not nature/outdoors or dining/nightlife.
- `client/src/components/public-header.tsx:277-283` mobile navigation includes only Things To Do, guided walking tour, What's On, Community Hub, and Community Hub Guide.
- `client/src/pages/things-to-do.tsx` contains no direct links to the nature/outdoors or dining/nightlife routed pages in the current static link scan.

Impact:

Nature/outdoors and dining/nightlife pages exist, have SEO metadata, and are routable, but users cannot reliably discover them through the public header or Things To Do hub. These are orphaned public content pages.

Required addition:

- Add both pages to desktop `PublicHeader` under Things To Do.
- Add both pages to mobile public navigation.
- Add category cards/sections in `ThingsToDo` linking to every routed Things To Do subpage.

### F7 - Public header mobile navigation omits several desktop public destinations

Severity: Medium

Evidence:

- Desktop `PublicHeader` includes `Destinations`, `Friends of Dzaleka`, public holidays, Dzaleka map, and Safe Travel at `client/src/components/public-header.tsx:120-190`.
- Mobile `PublicHeader` at `client/src/components/public-header.tsx:257-323` omits at least:
  - `/friends-of-dzaleka`
  - `/plan-your-trip/public-holidays`
  - `/plan-your-trip/dzaleka-map`
  - `/plan-your-trip/safe-travel`
  - `/things-to-do/arts-culture`
  - `/things-to-do/shopping`
  - `/things-to-do/sports-recreation`
  - `/things-to-do/host-community`
  - `/things-to-do/nature-outdoors`
  - `/things-to-do/dining-nightlife`

Impact:

Mobile users see a narrower public site map than desktop users. Some routed public pages have no mobile navigation entry at all.

Required addition:

- Generate desktop and mobile public menus from one shared data structure.
- Keep top-level mobile menu concise, but include all routed destinations through collapsible groups.

### F8 - `server-error.tsx` is an orphaned page component

Severity: Low

Evidence:

- `client/src/pages/server-error.tsx` exists and renders a 500 error page.
- Static import scan found it is not imported by `client/src/App.tsx`.
- `client/src/components/error-boundary.tsx` renders its own fallback UI instead of using `ServerError`.

Impact:

The codebase contains an error view that cannot be reached. This increases maintenance noise and can mislead future contributors into thinking a server-error route exists.

Required addition:

- Either wire `ServerError` into `ErrorBoundary` as the fallback, add an explicit `/server-error` noindex route for diagnostics, or delete the unused page.

### F9 - Authenticated users who open `/login` see Not Found inside the app shell

Severity: Medium

Evidence:

- `client/src/App.tsx:309` routes `/login` only inside the unauthenticated switch.
- The authenticated switch at `client/src/App.tsx:347-431` has no `/login` redirect.
- `/login` is not in `PUBLIC_ROUTES`, so authenticated users do not use the public route branch.
- Public CTAs in `client/src/components/public-header.tsx:235` and `client/src/components/public-header.tsx:330` link to `/login`.

Impact:

If a signed-in user opens a login link from a public page or bookmark, they are routed into the authenticated layout and hit Not Found. This is a broken state for a common navigation path.

Required addition:

- Add an authenticated `/login` route that redirects based on role:
  - transport partner -> `/transport-partner/dashboard`
  - other authenticated users -> `/`
- Or include `/login` in the public route branch and make `AuthPage` redirect authenticated users.

### F10 - Visitor resources has no empty-state path when no modules exist

Severity: Medium

Evidence:

- `client/src/pages/visitor-resources.tsx:42-46` queries resource modules and progress.
- `client/src/pages/visitor-resources.tsx:155` sets `<Tabs defaultValue={categories[0]}>`.
- `client/src/pages/visitor-resources.tsx:158-177` maps categories to tab triggers and tab content.
- If `modules` is an empty array, `categories[0]` is undefined and the main content area has a blank tab shell.

Impact:

Visitors can land on "Before You Visit" and see progress/tips but no resource module explanation or recovery action. This is an incomplete empty state for a visitor-critical page.

Required addition:

- Before rendering tabs, handle `!modules || modules.length === 0`:

```tsx
if (!modules?.length) {
  return <EmptyState title="No visitor resources yet" description="Check back before your visit or contact support." />;
}
```

- Include a support CTA to `/help?support=true`.

### F11 - Help Center hides ticket history when there are no tickets

Severity: Low

Evidence:

- `client/src/pages/help-center.tsx:418` returns `null` when tickets are loading or `tickets.length === 0`.

Impact:

Authenticated users with no support tickets do not see a "My Support Tickets" section or a clear empty state. The section appears only after they have at least one ticket, which makes the help center feel inconsistent.

Required addition:

- Render a stable section for signed-in users:
  - loading state while tickets load.
  - empty state: "No support tickets yet".
  - CTA: "Contact support".

### F12 - Reports, Customers, and Visitors pages can mislabel API failures as empty data

Severity: Medium

Evidence:

- `client/src/pages/reports.tsx:75-97` performs multiple `useQuery` calls without `isError` handling.
- `client/src/pages/reports.tsx:755-765` renders "No bookings found for the selected filters" when `filteredBookings` is empty, even if the bookings query failed.
- `client/src/pages/customers.tsx:121-126` queries `/api/customers` and `/api/analytics/visitor-ltv` without error states.
- `client/src/pages/customers.tsx:417-426` renders "No visitor data" when LTV data is missing.
- `client/src/pages/visitors.tsx:82-94` queries `/api/customers` and `/api/bookings` without error states.

Impact:

Admin/coordinator users may see empty dashboards when the actual problem is a permission error, migration issue, or network failure. This masks broken functionality.

Required addition:

- Add `isError`/`error` handling to each data source.
- Render page-level or section-level error cards that name the failed data source and provide a retry button.
- Do not show "empty" states until the related query has succeeded.

### F13 - Webhook management is duplicated across two admin surfaces

Severity: Medium

Evidence:

- `client/src/App.tsx:392` routes `/admin/webhooks` to `Webhooks`.
- `client/src/App.tsx:425` routes `/developer` to `DeveloperSettings`.
- `client/src/components/app-sidebar.tsx:447-462` shows both "Developer" and "Webhooks" to admins.
- `client/src/pages/developer-settings.tsx:279-282` includes a `Webhooks` tab with endpoint and delivery management.
- `client/src/pages/webhooks.tsx` implements a separate webhook management page.

Impact:

Admins have two different UIs for the same feature. They do not have identical affordances or empty states, so one surface can drift from the other. This is a feature-completeness and navigation clarity issue.

Required addition:

- Pick one canonical webhook UI.
- If webhooks belong under Developer Settings, remove `/admin/webhooks` from the sidebar and redirect it to `/developer?tab=webhooks`.
- If `/admin/webhooks` is canonical, remove or simplify the Developer Settings webhook tab.

### F14 - `/admin/webhooks` tables have no endpoint/delivery empty rows

Severity: Low

Evidence:

- `client/src/pages/webhooks.tsx:285-333` renders the endpoint table body by mapping `endpoints`.
- `client/src/pages/webhooks.tsx:352-398` renders the delivery table body by mapping `recentDeliveries`.
- Unlike the Developer Settings webhooks tab, this page does not render an empty table row or `EmptyState` when the arrays are empty.

Impact:

The page can show a complete table frame with no rows and no explanation. For a newly configured admin account, this reads like a blank or broken screen section.

Required addition:

- Add explicit empty rows or cards:
  - "No webhook endpoints yet. Add an endpoint to receive events."
  - "No webhook deliveries yet. Deliveries appear after matching events fire."

### F15 - Newsletter page can render a blank subscription box if the third-party script fails

Severity: Low

Evidence:

- `client/src/pages/newsletter.tsx:12-32` creates and injects a Kit script into `formContainerRef`.
- `client/src/pages/newsletter.tsx:91` renders only an empty `<div ref={formContainerRef} id="kit-form-container" />`.
- No `onload`, `onerror`, timeout, or fallback form is present.

Impact:

If the Kit script is blocked by network, browser privacy settings, CSP, or an outage, the newsletter form area is blank.

Required addition:

- Track script load/error state.
- Render a fallback email link or native subscription form when the embed fails.
- Add a loading skeleton matching the final form height to avoid layout shift.

### F16 - Share Photos is a portal handoff rather than an in-app workflow

Severity: Low

Evidence:

- `client/src/components/app-sidebar.tsx:167-170` gives visitors a "Share Photos" navigation item.
- `client/src/pages/share-photos.tsx:34-36` sends visitors to `https://services.dzaleka.com/photos/submit/`.

Impact:

The route exists, but the Visit Dzaleka app does not provide upload state, consent capture, progress, or submission history. If "Share Photos" is expected to be part of the visitor portal, the current page is only a signpost.

Required addition:

- Either rename the nav item to "Photo Portal" and make the handoff explicit, or implement an in-app photo submission workflow with:
  - consent confirmation.
  - upload progress and error recovery.
  - accepted file type/size guidance.
  - submission history or confirmation.

### F17 - Public auth fallback sends protected deep links to the landing page

Severity: Medium

Evidence:

- `client/src/App.tsx:306-339` is the unauthenticated switch.
- Protected routes such as `/bookings`, `/my-bookings`, `/calendar`, `/transport-partner/dashboard`, and `/settings` are not present there.
- The unauthenticated catch-all at `client/src/App.tsx:339` renders `Landing`.

Impact:

An unauthenticated user who follows a protected deep link lands on the marketing homepage instead of a login page with a return path. This is confusing for role users returning from email links, bookmarks, or expired sessions.

Required addition:

- Add a catch-all protected-route redirect for known app paths:

```tsx
<Route>
  <Redirect to={`/login?next=${encodeURIComponent(location)}`} />
</Route>
```

- Keep public unknown routes going to Not Found or Landing as product requires.

### F18 - Static alias routes exist without navigation or ownership clarity

Severity: Low

Evidence:

- `client/src/App.tsx:411-412` routes both `/resources` and `/visitor-resources` to `VisitorResources`.
- Sidebar uses `/resources` at `client/src/components/app-sidebar.tsx:161-164`.
- Static route/link scan found no internal navigation to `/visitor-resources`.

Impact:

The alias is harmless but undocumented. Duplicate route names increase confusion when documenting support flows and analytics.

Required addition:

- Keep one canonical route and redirect the alias.
- Prefer `/resources` if that is the sidebar label, or rename to `/visitor-resources` consistently if the backend/API naming is intended to be visible.

## Missing Sections By Role

### Admin Missing Or Incomplete Sections

- Webhook management should be consolidated into one complete UI.
- Reports, Customers, Visitors, and similar data-heavy admin pages need explicit API error sections.
- Error boundary should use the existing server-error page or remove it.
- `/email-history` alias should exist if admin pages link to that label.

### Visitor Missing Or Incomplete Sections

- Visitor itinerary view should have a visitor-owned route and back navigation.
- Before You Visit needs an empty resource state.
- Help Center needs a stable "My Support Tickets" empty state.
- Share Photos should either be renamed as an external portal or implemented as an in-app upload flow.
- Protected deep links should redirect to login with `next`, not to Landing.

### Guide Missing Or Incomplete Sections

- Calendar needs a guide-specific read-only or guide-action mode.
- Command palette needs guide-specific routes and should remove admin/staff commands.
- Itinerary/detail navigation should not use staff `/bookings/:id` routes.

### Transport Partner Missing Or Incomplete Sections

- Command palette needs transport partner route entries.
- Generic command palette routes should not send partners to admin/visitor screens.
- Partner help should remain in sync with global Help Center content or be explicitly maintained as separate partner documentation.

## Dead Links And Orphans

- Dead link: `/email-history` from `client/src/pages/reviews-performance.tsx:302`.
- Orphan page file: `client/src/pages/server-error.tsx`.
- Orphan public content pages from nav perspective:
  - `/things-to-do/nature-outdoors`
  - `/things-to-do/dining-nightlife`
- Alias route with no internal links:
  - `/visitor-resources`

## Required Frontend Additions

1. Shared route metadata registry for `App.tsx`, `AppSidebar`, and `CommandPalette`.
2. Role-specific command palette entries.
3. Staff-only protection for `/bookings/:id` and `/bookings/:id/itinerary`.
4. Visitor/guide-owned itinerary routes and role-aware back links.
5. Guide-safe calendar mode.
6. URL-synced tabs for Security.
7. `/email-history` route fix or redirect.
8. Complete public menu coverage for all public routes on desktop and mobile.
9. Empty/error states for visitor resources, help tickets, reports/customers/visitors, webhook tables, and newsletter embed.
10. Canonical webhook UI decision.
11. Authenticated `/login` redirect and unauthenticated protected deep-link redirect with `next`.

## Verification Notes

- Current sidebar entries were checked against `App.tsx`; no sidebar URL currently points to a missing route.
- Current public/static link scan found `/email-history` as a real dead internal route.
- Current page import scan found `server-error.tsx` as the only page file not imported by `App.tsx`.
- This report replaces an older stale version whose claims about `/bookings`, `/analytics`, and transport partner profile navigation no longer matched the current worktree.
