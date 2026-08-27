# Comprehensive Audit Report - Visit Dzaleka

Date: 2026-05-25  
Scope: all repository source directories except `ios/` and `**/YourSwiftPackageFolder/**`. Generated/vendor output such as `.git/`, `node_modules/`, and `dist/` was excluded from source review.  
Primary focus: RBAC isolation for `admin`, `coordinator`, `visitor`, `guide`, and `transport_partner`, plus security configuration, UI consistency, and frontend/backend linkages.

## Executive Summary

The application has a substantial role model and many route guards, but several boundaries are currently porous. The highest-risk issues are:

- API keys are accepted by session-protected routes without enforcing the scopes selected during key creation.
- Public iCal and public review routes expose booking details without validating a per-recipient token.
- Guide routes allow one guide to access or mutate other guides' private profile, booking, and availability records.
- Transport partners are generally filtered to their own partner record, but partner-facing update routes allow partner-controlled workflow transitions that should belong to visitors or staff.
- Some routes depend on session-only middleware while the API docs advertise Bearer API key access.
- Serverless deployment does not durably run in-process schedulers.
- Frontend routing, sidebar visibility, docs, and backend permissions do not always agree.

Several previously reported items are now improved: the GetYourGuide Basic Auth wrapper no longer hangs on failed auth, `/auth` redirects to `/login`, legacy `/api/login` redirects were removed, and the calendar assignment endpoint mismatch appears fixed.

## Coverage Map

Reviewed non-iOS areas:

- `server/`: Express route guards, API endpoints, webhook dispatcher, auth middleware, Supabase storage adapter, schedulers, utilities.
- `shared/`: database schema and role/data model definitions.
- `client/`: app routing, role-gated route components, sidebar navigation, public pages, dashboard pages, hooks, styles, UI primitives.
- `migrations/` and Supabase SQL files: RLS posture, storage buckets, duplicate/contradictory migration behavior.
- `netlify/`: serverless entry point and redirect behavior.
- `chrome-extension/`: extension API linkages, CSRF compatibility, DOM rendering.
- `docs/`: API documentation, static docs search/linkage.
- `scripts/`, `script/`, `.agents/skills/`, and public assets: operational scripts, local automation, asset metadata exposure.

## RBAC Matrix Observed

Expected role boundaries:

- `admin`: full operational and security administration.
- `coordinator`: broad operational access, but not user/security/developer settings unless intentionally delegated.
- `guide`: only own guide profile, own availability, assigned bookings/tours, training, and guide-scoped communications.
- `visitor`: only own bookings, own saved itineraries/favorites/export history, visitor resources, and own support tickets.
- `transport_partner`: only own partner profile, own transport requests, roster, pricing, availability, and partner-scoped communications.

Observed deviations:

- API key auth can impersonate the key owner into normal session routes without scope checks.
- Guides can use `:id` endpoints to read and mutate other guides' records.
- Guide booking responses often return full booking rows instead of role-safe projections.
- Visitor-only endpoints are often only `isAuthenticated`, so staff roles can create visitor-owned artifacts under their own accounts.
- Transport partners are filtered by own partner record in many routes, but can set workflow states that should not be partner-controlled.
- Coordinator/admin route exposure is inconsistent between frontend and backend for analytics and scheduled reports.

## Findings

### A1 - API key scopes are not enforced on protected routes

Severity: High

Evidence:

- `server/routes.ts:2277-2301` makes `isAuthenticated` accept `Authorization: Bearer dvz_*`, calls `verifyApiKey(req)` with no required scopes, and then writes `req.session.userId` and `req.session.userRole`.
- `server/middleware/apiKeyAuth.ts:28-151` supports `requiredScopes`, status checks, expiry checks, bcrypt comparison, and usage incrementing.
- `server/middleware/apiKeyAuth.ts:158-174` defines `authenticateApiKey(...requiredScopes)`, but no protected route uses it.
- `docs/api.md:11-18` documents Bearer API key usage for API requests.
- `client/src/pages/developer-settings.tsx` exposes scoped API key creation and examples.

Risk:

An active API key owned by an admin can pass through normal `isAuthenticated` and then satisfy `isAdmin` or `requireRole("admin")` routes regardless of whether that key was created with `bookings:read`, `settings:write`, or no relevant scope. The scope UI and docs imply least-privilege keys, but the server currently treats them as broad session substitutes.

Concrete fix:

- Do not mutate `req.session` for API key requests.
- Add explicit API-key middleware to API routes that should support machine access:

```ts
app.get(
  "/api/bookings",
  authenticateSessionOrApiKey(["bookings:read"]),
  requireRole("admin", "coordinator", "security", "guide"),
  handler,
);
```

- Define a route-to-scope matrix and test it.
- Reject API keys on browser-only/admin UI routes unless a route is intentionally part of the public developer API.
- Log `incrementApiKeyUsage` failures with the key id and request id instead of silently ignoring them.

### A2 - Some role-guarded routes cannot be reached by documented API keys

Severity: Medium

Evidence:

- `server/routes.ts:2421-2454` `requireRole` reads only `req.session.userId`.
- Several routes use `requireRole(...)` without `isAuthenticated`, for example:
  - `server/routes.ts:4082-4143` `/api/customers*`
  - `server/routes.ts:14437-14486` `/api/calendars*`
  - `server/routes.ts:15609-15621` `/api/settings/analytics`
- API docs advertise Bearer key authentication globally.

Risk:

The authentication model is split. Routes using `isAuthenticated` may accept API keys without scopes, while routes using only `requireRole` reject API keys entirely. This creates unpredictable developer API behavior and makes future authorization reviews error-prone.

Concrete fix:

- Standardize route middleware order. Every protected route should start with one of:
  - `isAuthenticated` for browser/session-only routes.
  - `authenticateApiKey("scope")` for API-only routes.
  - a clearly named combined middleware for routes that intentionally support both.
- Update docs to list which endpoints support session auth, API key auth, or both.

### A3 - Public iCal feed returns all bookings without token validation

Severity: High

Evidence:

- `server/routes.ts:14470-14478` implements `GET /api/calendar/feed/:token`.
- The comment says the token would be verified, but the route ignores `req.params.token`.
- `server/routes.ts:14474` calls `storage.getBookings()` and generates a feed for all bookings.
- `server/lib/ical.ts:6-31` includes visitor names in event summaries and booking reference, tour, people count, date, and time in descriptions.

Risk:

Anyone who knows or guesses the endpoint can retrieve a calendar containing visitor names, booking references, and visit timing. This bypasses all RBAC boundaries.

Concrete fix:

- Store hashed calendar feed tokens per user/calendar/feed configuration.
- Validate `:token` before generating any feed.
- Scope the query to the token owner and intended audience.
- Use a minimal event projection by default, for example no visitor name unless a staff-owned feed explicitly requires it.
- Add tests that invalid tokens return `404` or `401`.

### A4 - Guide `:id` routes allow cross-guide access

Severity: High

Evidence:

- `server/routes.ts:9575-9584` `GET /api/guides/:id/bookings` allows `admin`, `coordinator`, and `guide`, but does not verify that a guide is requesting their own `:id`.
- `server/routes.ts:9909-9917` `GET /api/guides/:id` allows any guide to fetch any guide profile.
- `server/routes.ts:10516-10545` guide availability `GET`, `POST`, and `DELETE` allow any guide to view, create, or delete availability for any guide id.
- `server/routes.ts:90-130` `buildGuideComputedStats` spreads the guide record and includes operational stats such as earnings.

Risk:

A guide can inspect or alter other guides' private availability and read profile fields that should be private, including email, emergency contact, payment preferences, notes, and earnings.

Concrete fix:

- Add a shared guard:

```ts
async function requireGuideOwnerOrStaff(req: Request, guideId: string) {
  const user = await getCurrentUser(req);
  if (user.role === "admin" || user.role === "coordinator") return true;
  if (user.role !== "guide") return false;
  const guide = await storage.getGuideByUserId(user.id);
  return guide?.id === guideId;
}
```

- Apply it to every `/api/guides/:id/*` route.
- Return public guide projections to non-staff and full private projections only to the owner or staff.

### A5 - Guide booking responses expose full booking internals

Severity: High

Evidence:

- `server/routes.ts:5282-5328` `GET /api/bookings` filters guide users to assigned bookings, but response mapping still spreads full booking objects and nested guide objects.
- `server/routes.ts:5386-5407` `GET /api/bookings/today` has the same pattern.
- `server/routes.ts:5660-5684` `GET /api/bookings/my-tours` has only `isAuthenticated` and returns `attachVisitorTransportSummaries(myTours)`.
- `server/routes.ts:1609-1638` `attachVisitorTransportSummaries` spreads the full booking object.
- `server/routes.ts:9176-9279` guide check-in, checkout, and no-show mutations return the full updated booking.
- `server/routes.ts:1837-1882` already defines `buildSafeBookingForRole`, but these routes do not consistently use it.

Risk:

Guide users can receive payment internals, admin notes, transport details, customer fields, and other data that is not necessary for tour delivery.

Concrete fix:

- Create one `serializeBookingForRole(booking, role)` function and use it for every booking list/detail/mutation response.
- For `guide`, include only the fields required to deliver assigned tours.
- Add `requireRole("guide")` to `/api/bookings/my-tours`.
- Add regression tests asserting guide responses omit admin/payment/internal fields.

### A6 - Visitor-only routes are not role-guarded

Severity: Medium

Evidence:

- `server/routes.ts:5435-5484` `GET /api/bookings/my-bookings` is only `isAuthenticated`.
- `server/routes.ts:5494-5540` saved itinerary routes are only `isAuthenticated`.
- `server/routes.ts:5546-5596` favorite guide routes are only `isAuthenticated`.
- `server/routes.ts:5602-5655` export history routes are only `isAuthenticated`.

Risk:

Staff, guide, and transport partner accounts can create or read visitor-mode artifacts under their own user records. This is not a direct cross-user leak, but it blurs role boundaries and makes analytics, audit trails, and support assumptions unreliable.

Concrete fix:

- Add `requireRole("visitor")` to visitor-only routes.
- If staff preview behavior is needed, create explicit admin preview endpoints that do not write visitor artifacts.

### A7 - Public review request endpoint leaks booking details by reference

Severity: High

Evidence:

- `server/routes.ts:14534-14583` `GET /api/public/reviews/request` accepts a booking reference or id.
- The response includes visitor name, date/time, status, guide name, and existing review fields.
- Existing review data may include improvement suggestions, other comments, testimonial consent, and other private review metadata.
- The route does not require a signed review token or email confirmation.

Risk:

Booking references become a public lookup key for visitor and review data. A leaked or guessed reference can expose private feedback and travel timing.

Concrete fix:

- Generate signed review tokens tied to booking id, visitor email, expiry, and purpose.
- Require that token on GET and POST review routes.
- Return only minimal display fields on GET.
- Never return private existing review comments through a public route.

### A8 - Transport partners can set workflow states that should be staff or visitor controlled

Severity: High

Evidence:

- `server/routes.ts:1924-1945` accepts statuses including `visitor_approved`, `visitor_declined`, `confirmed`, `completed`, and `cancelled`.
- `server/routes.ts:6757-6842` partner update logic writes `status: payload.status` and accepts quoted amount, requested pickup time/date, cancellation reason, driver, and vehicle fields.
- `server/routes.ts:6877-7015` sends notifications/emails based on those state changes.

Risk:

A transport partner can mark a request approved by the visitor, confirmed, completed, cancelled, or otherwise advance workflow states outside their authority. This can produce incorrect visitor communications and operational records.

Concrete fix:

- Split schemas by actor:
  - partner response schema: quote amount, partner note, proposed pickup details, accepted/declined.
  - visitor decision schema: approve/decline quote.
  - staff schema: confirmed/completed/cancelled/admin override.
- Enforce a transition table based on current status and actor.
- Add tests for forbidden transitions by partner role.

### A9 - Transport partner records are auto-created as active

Severity: Medium

Evidence:

- `server/routes.ts:2533-2552` `getCurrentTransportPartner` creates a partner row with `status: "active"` when a `transport_partner` user has no linked partner record.

Risk:

Assigning the `transport_partner` role provisions an active partner identity without a separate approval or onboarding checkpoint. This can unintentionally grant access to partner portal workflows.

Concrete fix:

- Do not auto-create active partner records inside an authorization helper.
- Require an existing linked partner row, or create a `pending` profile that cannot access requests until approved by admin.
- Move onboarding creation to an explicit admin action.

### A10 - Help article slugs bypass audience and published filters

Severity: Medium

Evidence:

- `server/routes.ts:14093-14116` list route calls `storage.getHelpArticles(userRole)`.
- `server/storage.ts:3676-3693` `getHelpArticles` filters by `is_published` and audience.
- `server/routes.ts:14119-14128` slug route calls `storage.getHelpArticleBySlug(slug)` directly.
- `server/storage.ts:3705-3714` `getHelpArticleBySlug` only filters by slug.

Risk:

Any authenticated user can fetch an unpublished or admin-audience help article if they know its slug.

Concrete fix:

- Make slug lookup role-aware:

```ts
const article = await storage.getHelpArticleBySlug(req.params.slug, userRole);
```

- Apply `is_published = true` and audience checks for non-admin users.
- Add a separate admin draft preview route if needed.

### A11 - Support tickets leak admin-only fields to ticket owners

Severity: Medium

Evidence:

- `server/routes.ts:14181-14193` returns `storage.getSupportTickets(userRole === "admin" ? undefined : userId)`.
- `server/storage.ts:3763-3775` uses `.select("*")`.
- `shared/schema.ts:1918` includes `adminNotes`.

Risk:

Non-admin users who own tickets can receive internal support notes or assignment metadata in the API response even if the UI does not display them.

Concrete fix:

- Create `getSupportTicketsForUser(userId)` with an explicit safe column projection.
- Return full ticket fields only from an admin route.
- Add API tests that visitor responses omit `adminNotes`.

### A12 - Booking community highlights update returns full booking data

Severity: Medium

Evidence:

- `server/routes.ts:5857-5915` allows admin/coordinator and the owning visitor to update selected community highlights.
- The route returns `res.json(updated)`, where `updated` is the full booking row.

Risk:

Visitors can receive full booking internals after a successful community highlight update.

Concrete fix:

- Return `buildSafeBookingForRole(updated, req.user.role)` or a minimal `{ selectedCommunityListings }` payload.

### A13 - Chat direct-message policy defaults to broad access for guide/security roles

Severity: Medium

Evidence:

- `server/routes.ts:3830-3875` `canUsersStartDirectChat` handles admin/coordinator, transport partner, and visitor explicitly, then returns `true`.
- `server/routes.ts:13950-14007` `/api/chat/users` filters visitors and transport partners, but allows broader visibility to staff roles.
- `server/routes.ts:13829-13851` direct chat creation relies on `canUsersStartDirectChat`.

Risk:

Guides and security users can list and start direct chats with users outside their operational scope unless another implicit UI layer prevents it.

Concrete fix:

- Replace the final `return true` with an explicit deny-by-default policy.
- Define guide access as assigned visitors plus admins/coordinators.
- Define security access according to the actual security workflow, for example active-day visitors plus admins/coordinators.

### A14 - Any chat participant can delete the whole room

Severity: Medium

Evidence:

- `server/routes.ts:13816-13826` allows any participant who can load the room to call `storage.deleteChatRoom(roomId)`.

Risk:

A visitor, guide, or partner can delete operational chat history for all participants.

Concrete fix:

- Implement per-user archive/leave state for normal users.
- Restrict hard delete to admin/coordinator.
- Keep message history immutable for audit-sensitive conversations.

### A15 - Public booking/review functionality relies on references instead of signed purpose tokens

Severity: Medium

Evidence:

- Public review request routes use booking reference/id directly at `server/routes.ts:14534-14583`.
- Public booking verification was narrowed to a coarse validity response, but review flows still expose more detail by reference.

Risk:

Booking references are operational identifiers, not authentication tokens. Any public flow that uses them as proof of access can leak data if references are shared, scraped from emails, or guessed.

Concrete fix:

- For every public follow-up flow, use purpose-specific signed tokens with short expiry.
- Bind tokens to booking id and visitor email.
- Keep references as display/search identifiers only.

### A16 - Supabase service-role fallback only warns in production

Severity: Medium

Evidence:

- `server/storage.ts:665-676` uses `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY`.
- When `SUPABASE_SERVICE_ROLE_KEY` is absent in production, the constructor logs a warning instead of failing fast.
- `server/storage.ts:693-700` later throws for service-role-only storage operations.

Risk:

Production can boot in a partially functional state, and storage features fail later at runtime. The fallback also makes it easier to accidentally run backend code with the wrong Supabase key.

Concrete fix:

```ts
if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for backend storage access");
}
```

- Ensure browser code only receives `VITE_SUPABASE_ANON_KEY`.
- Rotate service role credentials if `.env` or deployment logs have ever left the machine.

### A17 - Public avatar uploads do not strip metadata before storage

Severity: Medium

Evidence:

- `migrations/avatars_storage.sql:6-8` sets the `avatars` bucket to public.
- `server/routes.ts:4735-4755` decodes a base64 image and uploads the original bytes to Supabase Storage.
- Current checked public image assets did not show Make/Model/GPS EXIF tags, but the upload path still accepts raw image bytes.

Risk:

Future uploaded profile or guide images can expose EXIF/GPS/device metadata via permanent public URLs.

Concrete fix:

- Re-encode images with a metadata-stripping processor before upload, for example `sharp`.
- Normalize to JPEG/WebP/PNG and reject formats that are not needed.
- Add a precommit or build check using `exiftool` or ImageMagick for public assets.
- Consider private buckets and signed URLs for profile images if public permanence is not required.

### A18 - Supabase `.or()` filter sanitization still permits broad wildcard searches

Severity: Medium

Evidence:

- `server/storage.ts:201-218` `sanitizePostgrestValue` removes commas, parentheses, and backslashes.
- `.or(...)` filter strings use sanitized values at `server/storage.ts:1239`, `server/storage.ts:1847`, `server/storage.ts:1854`, `server/storage.ts:1889`, and `server/storage.ts:4304`.
- The sanitizer does not escape SQL LIKE wildcards `%` and `_`, and the comment mentions dots even though the function does not remove dots.

Risk:

The main grammar-breaking characters are reduced, but user input can still broaden `ilike` matches unexpectedly. The comment/code mismatch makes future reviews unreliable.

Concrete fix:

- Escape `%` and `_` before placing values inside `ilike`.
- Align the sanitizer comment with the actual behavior.
- Prefer server-side SQL RPC functions with typed parameters for complex multi-field searches.

### A19 - API key prefix lookup is not uniqueness-safe

Severity: Medium

Evidence:

- `shared/schema.ts:2026-2036` stores `keyPrefix` and creates a non-unique index.
- `server/storage.ts:4161-4168` looks up keys with `.eq("key_prefix", prefix).single()`.
- `server/storage.ts:4193-4195` ignores errors from the usage-increment RPC.

Risk:

A prefix collision can cause lookup failures or ambiguous behavior. Usage failures are invisible during operations.

Concrete fix:

- Add a unique database constraint on `api_keys.key_prefix`.
- Regenerate a key if a prefix collision occurs.
- Log usage-increment failures with request id and key id.

### A20 - Webhook dispatch is not durable in serverless

Severity: Medium

Evidence:

- `server/lib/webhook-dispatcher.ts:33-49` queues a delivery and triggers background processing with `setImmediate`.
- `server/routes.ts:15975-15978` triggers pending delivery processing only during app creation.
- `netlify/functions/api.ts:1-7` wraps the Express app as a serverless function and does not start a durable queue worker.

Risk:

In Netlify/serverless production, the runtime can freeze after queuing and before delivery attempts finish. Pending deliveries may wait until a later cold start or request.

Concrete fix:

- Move webhook dispatch retries to a Netlify scheduled function, external queue, or background worker.
- Keep route handlers responsible only for enqueueing and returning a deterministic result.
- Add observability for pending delivery age.

### A21 - Encryption key derivation depends on `SESSION_SECRET`

Severity: Medium

Evidence:

- `server/utils/crypto.ts:3-7` derives the AES key from `(SESSION_SECRET || fallback).substring(0, 32)`.

Risk:

If `SESSION_SECRET` is shorter than 32 bytes, encryption can fail at runtime. Rotating session secrets can also break decryption of stored webhook secrets or encrypted payloads.

Concrete fix:

- Add a separate `ENCRYPTION_KEY` environment variable.
- Validate exact decoded key length at boot.
- Support key versioning for future rotation.

### A22 - RLS and migration posture is contradictory without a verified migration chain

Severity: Medium

Evidence:

- `migrations/disable_notifications_rls.sql:1-8` disables RLS for notifications.
- `migrations/training_modules.sql:275-276` disables RLS for training tables.
- `migrations/help_center.sql:70-78` creates broad `FOR ALL USING (true)` policies.
- `migrations/zz_security_hardening.sql:1-110` and `supabase-rls.sql:1-117` harden/drop broad policies later.
- `package.json` exposes `db:push`, but no ordered migration runner or applied-migration ledger was found.
- Duplicate migration numbers exist, including `0021_*`, `0022_*`, and `0023_*`.

Risk:

Security depends on which SQL files were manually applied and in what order. A fresh database or emergency restore can land in a materially different RLS state.

Concrete fix:

- Adopt a single ordered migration runner.
- Rename duplicate migration numbers.
- Keep hardening migrations in the normal migration chain.
- Add CI verification that checks `pg_policies` and RLS enabled state for exposed tables.

### A23 - External iCal import can fetch arbitrary URLs for privileged users

Severity: Medium

Evidence:

- `server/routes.ts:14448-14456` creates external calendar records from request body URLs.
- `server/routes.ts:14486-14513` syncs all stored calendars.
- `server/lib/ical.ts:34-58` calls `nodeIcal.async.fromURL(url)` directly.

Risk:

An admin or coordinator can configure SSRF-like fetches to internal network targets. This is privileged-user-only, but it is still a backend network boundary issue.

Concrete fix:

- Validate `https:` only unless there is a documented reason for `http:`.
- Resolve hosts and block private, loopback, link-local, and metadata IP ranges.
- Disable redirects or revalidate every redirect target.
- Add fetch timeouts and response size limits.

### A24 - Scheduled reports and reminders rely on long-lived process timers

Severity: Medium

Evidence:

- `server/index.ts:31-52` starts reminder and report schedulers in the long-lived server entry point.
- `netlify/functions/api.ts:1-7` only creates the Express app for serverless.
- No Netlify scheduled function was found for reminders or scheduled report execution.

Risk:

Production deployments using Netlify serverless will not reliably run reminders or scheduled reports. These features can appear configured but never execute.

Concrete fix:

- Move reminders and scheduled reports to Netlify scheduled functions, an external cron, or a durable worker.
- Add a health/admin endpoint that reports last scheduler run time.

### A25 - Analytics route permissions do not match frontend navigation

Severity: Medium

Evidence:

- `client/src/App.tsx:406` allows admin and coordinator to access `/analytics`.
- `client/src/components/app-sidebar.tsx:402-404` shows "Website Analytics" only for admin.
- `server/routes.ts:14994-15026` protects analytics pageviews/conversion/KPI endpoints with `isAdmin`.
- `client/src/pages/analytics.tsx:135-145` queries analytics endpoints from that page.

Risk:

A coordinator can deep-link to `/analytics` and see a partially broken page with `403` errors. This is a role-contract mismatch and an unhandled error-state problem.

Concrete fix:

- Either restrict `/analytics` to admin in `App.tsx`, or intentionally allow coordinator in backend and sidebar.
- Render a dedicated forbidden state when any role-protected dashboard query returns `403`.

### A26 - Scheduled reports permissions do not match frontend navigation

Severity: Medium

Evidence:

- `client/src/App.tsx:393` and `client/src/components/app-sidebar.tsx:466` expose scheduled reports to admin only.
- `server/routes.ts:15793-15847` allows admin and coordinator to list, create, update, delete, and run scheduled reports.

Risk:

Coordinator permissions are broader on the backend than the visible UI indicates. This can become a security issue if coordinators discover or script the API.

Concrete fix:

- Align backend to admin-only, or explicitly expose coordinator UI and document that permission.
- Add a permission test for scheduled report routes.

### A27 - Browser unauthorized handling still uses full-page redirects

Severity: Low

Evidence:

- `client/src/pages/bookings.tsx:498`
- `client/src/pages/guides.tsx:260`
- `client/src/pages/security.tsx:178`
- `client/src/pages/settings.tsx:122`
- `client/src/pages/users.tsx:204`
- `client/src/pages/zones.tsx:489`

These pages now redirect to `/login`, not the old missing `/api/login`, but they do so via `window.location.href`.

Risk:

Expired-session flows force a full reload and discard SPA state. Unauthorized handling is duplicated across pages.

Concrete fix:

- Centralize `401` handling in `queryClient` or `useAuth`.
- Use the router's `setLocation("/login")` for SPA navigation.
- Preserve a `next` URL for post-login return.

### A28 - Unsaved-change protection does not cover SPA navigation

Severity: Medium

Evidence:

- `client/src/hooks/useUnsavedChanges.ts:10-22` only listens for `beforeunload`.
- The hook is used by forms such as CMS, settings, guide profile, special offers, and profile pages.

Risk:

Internal Wouter navigation can discard dirty form state without warning. This violates the repo's UI rule that forms must warn on unsaved changes before navigation.

Concrete fix:

- Add a route-transition blocker or guarded `Link` wrapper.
- Keep `beforeunload` for browser/tab close.
- Focus the confirmation dialog and return focus to the triggering navigation control when cancelled.

### A29 - Public page navigation duplicates inaccessible hover-only patterns

Severity: Medium

Evidence:

- `client/src/pages/sports-recreation.tsx:84-112` implements a hover-only dropdown with `group-hover` and no `aria-expanded` or keyboard open state.
- `client/src/pages/sports-recreation.tsx:121-126` mobile menu button lacks a clear accessible name/expanded state.
- `client/src/pages/visitor-essentials.tsx:223-235` has similar custom public nav patterns.
- A shared `client/src/components/public-header.tsx` exists and should be the canonical public nav.

Risk:

Keyboard and screen-reader users can miss or be unable to operate navigation. Public pages also drift visually because each page carries custom header code.

Concrete fix:

- Consolidate public pages onto `PublicHeader`.
- Use native buttons/links or Radix-style menu primitives with `aria-expanded`, `aria-controls`, focus return, and Escape handling.
- Support `:focus-visible` and `:focus-within`, not hover-only disclosure.

### A30 - `transition-all` is used in styles and components

Severity: Low

Evidence:

- `client/src/index.css:379` `.table-row-hover` uses `transition-all`.
- Multiple frontend files use Tailwind `transition-all`.

Risk:

`transition-all` can animate layout-affecting properties, creates harder-to-debug motion, and conflicts with the repo UI rule to list animated properties explicitly.

Concrete fix:

- Replace with property-specific transitions, for example `transition-colors`, `transition-opacity`, or `transition-transform`.
- Keep reduced-motion handling from `client/src/index.css` in place.

### A31 - Chrome extension state-changing requests do not include CSRF token

Severity: Medium

Evidence:

- `server/middleware/csrf.ts:48-118` requires trusted origin/referer and `X-CSRF-Token` for state-changing `/api/*` routes unless exempt or trusted by `X-Client-Auth`.
- `chrome-extension/popup.js:34-48` `apiAction` sends JSON requests without CSRF token.
- `chrome-extension/popup.js:750-758` sends guide check-in/no-show requests.
- `chrome-extension/popup.js:1060` and `chrome-extension/popup.js:1099-1110` mark notifications read.

Risk:

Extension write flows can fail in production because `chrome-extension://...` origins are not normal site origins and no CSRF token is attached.

Concrete fix:

- Add an extension auth strategy:
  - fetch `/api/auth/csrf` and send `X-CSRF-Token`, plus explicitly allow the extension origin, or
  - issue an extension-specific `X-Client-Auth` secret with strict origin and permission controls.
- Add extension integration tests for write actions.

### A32 - Chrome extension blog rendering interpolates unescaped attributes

Severity: Low

Evidence:

- `chrome-extension/popup.js:838-852` interpolates `post.slug` and `imgSrc` into `data-slug` and `img src` attributes.
- Text content is generally escaped, but attribute contexts are not consistently escaped or URL-validated.

Risk:

Malformed CMS data can break extension markup or inject unexpected attributes. MV3 CSP limits exploitability, but DOM construction should still be robust.

Concrete fix:

- Build nodes with DOM APIs instead of `innerHTML`, or add attribute-specific escaping.
- Validate image URLs with `new URL()` and allow only `http:`/`https:`.

### A33 - Developer webhooks are implemented in backend but disabled in UI/docs

Severity: Medium

Evidence:

- `server/routes.ts:15865-15965` implements `/api/webhooks` CRUD, delivery listing, and retry.
- `client/src/pages/developer-settings.tsx` has a webhooks tab disabled.
- `docs/api.md:325` still describes webhooks as "Coming Soon".

Risk:

This is a half-implemented feature from the user's perspective. Admins cannot manage webhooks through the UI even though backend endpoints exist, and docs understate the actual API surface.

Concrete fix:

- Either finish the webhooks UI and docs, or hide/disable the backend routes until the feature is ready.
- Add backend permission tests before exposing the UI.

### A34 - Static documentation search references a missing page

Severity: Low

Evidence:

- `docs/scripts/docs.js:42` includes `authentication.html` in the search index.
- No matching `docs/pages/authentication.html` page was found.

Risk:

Docs search can direct users to a broken page.

Concrete fix:

- Add the missing authentication page or remove it from the search index.
- Add a docs link checker to CI.

### A35 - API documentation advertises scope behavior that the server does not enforce

Severity: High

Evidence:

- `docs/api.md:11-18` shows `Authorization: Bearer dvz_your_api_key_here`.
- `docs/api.md` lists scoped developer API behavior.
- `client/src/pages/developer-settings.tsx` lets admins select scopes while creating keys.
- Current route integration ignores scopes as described in A1.

Risk:

External integrations may be built around a documented security model that does not actually exist. This is both a security and product-trust issue.

Concrete fix:

- Treat this as part of the A1 fix.
- Temporarily update docs to say API-key support is limited or beta until scope enforcement is deployed.
- Add generated API docs from the same route-scope matrix used by tests.

### A36 - Public analytics endpoint may need privacy review

Severity: Low

Evidence:

- `server/routes.ts:14942-14981` provides unauthenticated analytics pageview ingestion and live analytics data.
- `server/routes.ts:15593` exposes public analytics settings.

Risk:

Public analytics endpoints are expected in many sites, but they can expose visitor behavior if live data is too detailed or not aggregated. This needs product privacy confirmation.

Concrete fix:

- Ensure live/public analytics responses are aggregated and never include IP, user agent, user id, email, booking id, or exact paths for low-volume private pages.
- Apply rate limits to ingestion endpoints.

### A37 - Large-list UI needs virtualization review

Severity: Low

Evidence:

- Multiple admin pages render operational lists and tables directly, including bookings, users, guides, zones, reviews, support, analytics, and developer settings pages.
- The repo UI rules require virtualization for large lists above 50 items.

Risk:

Dense admin datasets can become sluggish on low-power devices or Safari if rendered without pagination/virtualization. Some pages appear to use server-side filtering/pagination, but this is not consistent enough to rely on without per-page checks.

Concrete fix:

- Inventory every table/list with potential >50 rows.
- Use server pagination plus virtualization for dense tables.
- Add loading, empty, error, and dense states for each data-heavy page.

### A38 - Public header duplication increases responsive and accessibility drift

Severity: Low

Evidence:

- Public pages such as `sports-recreation.tsx`, `visitor-essentials.tsx`, and other destination/content pages carry local header/nav implementations instead of consistently using `PublicHeader`.

Risk:

Fixes to focus management, mobile menu behavior, safe-area handling, or navigation text must be repeated across pages. This is already visible in hover-only menu patterns.

Concrete fix:

- Replace custom public headers with a single shared `PublicHeader`.
- Keep public page content focused on page-specific body sections.
- Add Playwright coverage for desktop, mobile, and keyboard nav.

## Previously Reported Items That Appear Fixed

These were checked because earlier audit notes referenced them:

- GetYourGuide webhook Basic Auth no longer appears to hang on failed auth. `server/middleware/basicAuth.ts` is a pure verifier and `server/routes.ts:10420-10433` returns immediately on failure.
- Legacy `/api/login` redirects were not found. Current direct redirects target `/login`.
- `/auth` is routed to `/login` in `client/src/App.tsx:290-292`, and reset/invite flows now use `/login`.
- The old calendar `assign-guide` frontend/backend mismatch was not found in current search results; current backend uses `/api/bookings/:id/assign`.
- Public booking verification is now coarse-grained at `server/routes.ts:5687-5703`, while detailed verification is protected at `server/routes.ts:5710-5729`.
- Existing checked public JPEG assets did not show Make/Model/GPS EXIF tags, though future uploads still need metadata stripping as described in A17.
- Raw `.or(...)` interpolation has been partially mitigated with `sanitizePostgrestValue`, but wildcard handling and RPC migration remain open as described in A18.

## Priority Remediation Plan

1. Fix API key authorization first: remove session mutation, enforce scopes route-by-route, and align docs.
2. Close unauthenticated data leaks: iCal feed token validation and public review signed tokens.
3. Lock guide and transport partner RBAC: owner checks, role-safe serializers, transition tables.
4. Make Supabase and serverless production posture deterministic: service-role boot assertion, ordered migrations, scheduled functions.
5. Align frontend/backend permissions and docs: analytics, scheduled reports, developer webhooks, and unauthorized handling.
6. Consolidate public navigation and accessibility patterns.
7. Add regression tests for every role boundary in the RBAC matrix.

## Suggested RBAC Test Matrix

Add integration tests that exercise each protected endpoint as:

- anonymous
- visitor A
- visitor B
- guide A
- guide B
- transport partner A
- transport partner B
- coordinator
- admin
- admin API key with read-only scopes
- admin API key missing required scope

Minimum assertions:

- Visitors cannot read another visitor's bookings, reviews, tickets, saved itineraries, or exports.
- Guides can read only own guide profile/private fields and assigned booking projections.
- Transport partners can read/update only their own partner requests and cannot set visitor/admin workflow statuses.
- Coordinators cannot access admin-only analytics, developer API keys, webhooks, or user/security settings unless explicitly allowed.
- API keys without required scopes fail with `403`.
- Public token routes reject missing, expired, malformed, or wrong-purpose tokens.

## Verification Notes

- Static search covered all non-iOS source directories listed in the coverage map.
- No code changes were made other than this report.
- No application test suite was run because the requested output was an audit artifact. The next useful verification step is to convert the RBAC matrix above into automated integration tests.
