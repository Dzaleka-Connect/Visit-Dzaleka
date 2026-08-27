# Visit Dzaleka Codebase Audit Report

Audit date: 2026-05-25  
Workspace: `/Users/realbakari/Documents/GitHub/DzalekaVisit`

## Executive Summary

This audit covered the full working tree, excluding vendor/generated directories (`node_modules`, `.git`, and generated `dist`) while inventorying those exclusions. The current application is a React/Vite SPA, a large Express API, Supabase/Postgres storage, Netlify Functions deployment glue, a Chrome extension, an iOS SwiftUI app, SQL migrations, static documentation, scripts, and agent skill folders.

The highest-risk items are:

1. Dependency audit currently reports exploitable critical/high vulnerabilities in production dependencies, including `jspdf`, `drizzle-orm`, `express`, and `express-rate-limit`.
2. Session and request trust hardening is incomplete: permissive proxy trust, disabled rate-limit validation, a production fallback session secret, login without session regeneration, and logout clearing the wrong cookie.
3. CSRF protection is Origin/Referer-only and explicitly allows unsafe requests with no Origin/Referer; browser clients also do not send a CSRF token.
4. Supabase RLS posture is not provable from migrations because permissive policies, disabling scripts, and later hardening scripts coexist.
5. Several public token/reference endpoints expose visitor and booking data, and task detail/comment endpoints miss the same assigned-user access checks used elsewhere.
6. Multiple client links and API calls are broken (`/api/login`, `/auth`, `/api/bookings/:id/assign-guide`, `/visitor-essentials`).
7. Inbound/outbound webhook handling has verification and SSRF gaps.
8. The Chrome extension has DOM injection and arbitrary notification-link opening risks.
9. The iOS app is still using shared cookie session auth while its README says secure token storage is a future step; its password policy also conflicts with the web/backend policy.

## Scope and Inventory

Command used for the unique source inventory:

```bash
find . -path './.git' -prune -o -path './node_modules' -prune -o -path './dist' -prune -o -type f -print
```

Result before creating this report: 424 auditable non-generated files. After adding `AUDIT_REPORT.md`, the same command returns 425 files. Top-level pre-report distribution:

```text
client=232
server=26
migrations=55
docs=26
ios=28
chrome-extension=10
.agents=11
script=2
scripts=5
netlify=2
attached_assets=4
root config/docs/assets/log/env files=43
total=424
```

Symlink aliases `.agent/skills/resend`, `.claude/skills/resend`, `.cursor/skills/resend`, `.gemini/skills/resend`, and `.windsurf/skills/resend` resolve to the same Resend skill content as `.agents/skills/resend`; they were dereferenced and did not add unique source content.

Generated/vendor handling:

- `node_modules`: excluded as vendored dependency source; dependency risk covered through `npm audit`.
- `dist`: excluded as generated build output; sampled and confirmed it contains `dist/index.cjs` and `dist/public/*`.
- `.git`: excluded as VCS metadata.
- Binary assets were inventoried with `file`; one public JPEG contains EXIF/GPS metadata and is called out below.

Verification already run during audit:

```bash
npm run check
npm audit --omit=dev --json
npm audit --json
rg-based route, linkage, token, RLS, webhook, extension, iOS, and docs searches
```

`npm run check` passed. `npm audit` did not pass: production dependencies reported 13 vulnerabilities (1 critical, 5 high, 5 moderate, 2 low); full dependency tree reported 21 vulnerabilities (2 critical, 6 high, 11 moderate, 2 low).

## Milestone 1: Architecture and Configuration

### Finding A1 - Dependency vulnerabilities are currently shipping

Severity: Critical

Evidence:

```json
// package.json
"drizzle-orm": "^0.39.1",
"express": "^4.21.2",
"express-rate-limit": "^8.2.1",
"jspdf": "^3.0.4",
"vite": "^5.4.20"
```

`npm audit --omit=dev --json` reported 13 production vulnerabilities. The full audit reported 21 total vulnerabilities, including critical `jspdf` and dev/transitive `basic-ftp`, high `drizzle-orm` SQL injection, `express`, `express-rate-limit`, `lodash`, and `rollup`, plus moderate `vite`, `postcss`, `esbuild`, `ws`, `dompurify`, and related transitive issues.

Concrete fix:

- Upgrade `drizzle-orm` to at least the fixed line reported by audit (`0.45.2` or newer) and rerun type checks against query code.
- Upgrade `express`, `express-rate-limit`, `jspdf`, `vite`, and lockfile transitive packages through `npm audit fix` where non-breaking, then manually handle breaking upgrades.
- Add CI gates:

```bash
npm run check
npm audit --omit=dev --audit-level=high
```

Architectural suggestion:

Create a `security:deps` script and require it before deploy. Keep Netlify builds reproducible by avoiding implicit downloads in the build command where possible.

### Finding A2 - Build and Netlify deployment install dev dependencies and recreate serverless handlers

Severity: Medium

Evidence:

```json
// package.json
"build": "npx puppeteer browsers install chrome && npx tsx script/build.ts && npx tsx script/prerender.ts"
```

```toml
# netlify.toml
[build.environment]
  NPM_FLAGS = "--include=dev"
```

```ts
// netlify/functions/api.ts
const appPromise = createApp().then(({ app }) => app);

export const handler = async (event: any, context: any) => {
  const app = await appPromise;
  const handler = serverless(app);
  return handler(event, context);
};
```

Risk:

- Build depends on a live Puppeteer browser download.
- Production build environment installs dev dependencies, increasing supply-chain exposure.
- `serverless(app)` is recreated on every function invocation.

Concrete fix:

```ts
const handlerPromise = createApp().then(({ app }) => serverless(app));

export const handler = async (event: any, context: any) => {
  const handler = await handlerPromise;
  return handler(event, context);
};
```

Architectural suggestion:

Separate prerender/browser installation from the normal server build, cache the browser binary explicitly, and deploy only production dependencies plus the bundled function output.

### Finding A3 - Local sensitive artifacts exist in the workspace

Severity: Medium

Evidence:

```text
.env       2046 bytes, mode 600
cookies.txt 271 bytes, mode 600
server.log 0 bytes
check_log.txt 109 lines
```

`.gitignore` does ignore `.env`, but `cookies.txt` and `server.log` are not ignored. `check_log.txt` is stale diagnostic output and can mislead future audits because current `npm run check` passes.

Concrete fix:

```gitignore
cookies.txt
server.log
check_log.txt
*.log
```

Do not commit `.env` or cookie jars. Add `.env.example` because README currently instructs users to copy it, but it does not exist.

## Milestone 2: Backend Security and Auth

### Finding B1 - Session, proxy, and rate-limit hardening needs correction

Severity: High

Evidence:

```ts
// server/app.ts
app.set('trust proxy', true);

const authLimiter = rateLimit({
  validate: false,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
});

session({
  secret: process.env.SESSION_SECRET || "supersecretdevkey",
  name: 'dzaleka.sid',
});
```

```ts
// server/routes.ts
// login success
req.session.userId = user.id;
req.session.userRole = user.role || "visitor";

// logout
res.clearCookie("connect.sid");
```

Risks:

- `trust proxy: true` trusts the full proxy chain. With permissive hosting/proxy paths, spoofed `X-Forwarded-For` can affect IP-based controls.
- `express-rate-limit` validation is disabled while the custom key generator uses `req.ip`/forwarded headers.
- Production can boot with `"supersecretdevkey"` if `SESSION_SECRET` is missing.
- Login does not regenerate the session after credential verification, enabling session fixation.
- Logout clears `connect.sid`, but the actual cookie name is `dzaleka.sid`.

Concrete fix:

```ts
app.set("trust proxy", 1); // or Netlify-specific trusted proxy configuration

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

await new Promise<void>((resolve, reject) => {
  req.session.regenerate((err) => err ? reject(err) : resolve());
});
req.session.userId = user.id;
req.session.userRole = user.role || "visitor";

res.clearCookie("dzaleka.sid", {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  domain: process.env.COOKIE_DOMAIN || undefined,
});
```

Architectural suggestion:

Centralize session lifecycle in `server/auth.ts` so register, login, logout, mobile, and extension flows share regeneration and cookie clearing behavior.

### Finding B2 - CSRF protection is Origin-only and allows missing Origin/Referer

Severity: High

Evidence:

```ts
// server/middleware/csrf.ts
if (!origin && !referer) {
  return next();
}
```

```ts
// client/src/lib/queryClient.ts
fetch(url, {
  method,
  headers: data ? { "Content-Type": "application/json" } : {},
  body: data ? JSON.stringify(data) : undefined,
  credentials: "include",
});
```

Risk:

Unsafe requests without `Origin` or `Referer` bypass CSRF. The SPA sends cookie-authenticated mutations but no CSRF header/token. This is especially sensitive because sessions are cookie based and CORS permits no-origin requests for mobile/curl compatibility.

Concrete fix:

- For browser sessions, issue a CSRF token endpoint and require `X-CSRF-Token` for unsafe methods.
- For iOS/extension clients, use a separate authenticated client header or HMAC/token flow instead of relying on missing Origin.
- Reject missing Origin/Referer for browser cookie sessions unless a trusted non-browser credential is present.

Example:

```ts
if (isCookieSession(req) && !origin && !referer && !req.headers["x-client-auth"]) {
  return res.status(403).json({ message: "Missing request origin" });
}
```

### Finding B3 - Public session diagnostic endpoint leaks session metadata

Severity: Medium

Evidence:

```ts
app.get("/api/auth/session-status", (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasUserId: !!req.session?.userId,
    sessionId: req.sessionID ? req.sessionID.substring(0, 8) + '...' : null,
    cookieSettings: { ... },
  });
});
```

Risk:

This endpoint reveals whether a valid user session exists and returns a session ID prefix and cookie settings. It is useful for debugging but should not be public in production.

Concrete fix:

Gate it behind admin auth in production or remove it:

```ts
if (process.env.NODE_ENV === "production") {
  app.get("/api/auth/session-status", isAuthenticated, requireRole("admin"), handler);
}
```

### Finding B4 - Error and production log output can expose internals

Severity: Medium

Evidence:

```ts
// server/index.ts
const message = err.message || "Internal Server Error";
res.status(status).json({ message });
```

```ts
// server/lib/logger.ts
entry.error = {
  message: error.message,
  stack: error.stack,
  code: (error as any).code,
};
```

Risk:

Unhandled errors can return raw messages to clients and log full stacks in production. Some database/client errors include SQL details, hostnames, provider IDs, or token-adjacent metadata.

Concrete fix:

- Return generic 500 messages in production.
- Preserve request IDs for support correlation.
- Redact stack traces unless `LOG_LEVEL=debug`.

## Milestone 3: Backend API Authorization and Logic

### Finding C1 - Task detail and comments bypass task assignment visibility rules

Severity: High

Evidence:

```ts
// /api/tasks applies role/assignment scoping
if (user.role === "admin" || user.role === "coordinator") {
  if (assignedTo) filters.assignedTo = assignedTo;
} else {
  filters.assignedTo = userId;
}
```

```ts
// /api/tasks/:id has no equivalent access check
app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
  const task = await storage.getTask(req.params.id);
  res.json(task);
});

app.get("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
  const comments = await storage.getTaskComments(req.params.id);
  res.json(comments);
});

app.post("/api/tasks/:id/comments", isAuthenticated, async (req: any, res) => {
  const comment = await storage.createTaskComment({ taskId: req.params.id, userId, content });
  res.status(201).json(comment);
});
```

Risk:

Any authenticated user who knows or guesses a task ID can read the task, read comments, and add comments, even when not assigned. Updates correctly enforce assignment, so the gap is inconsistent and likely unintended.

Concrete fix:

Create a shared helper:

```ts
async function requireTaskAccess(taskId: string, userId: string) {
  const [task, user] = await Promise.all([storage.getTask(taskId), storage.getUser(userId)]);
  if (!task || !user) return { status: 404 as const };
  if (user.role === "admin" || user.role === "coordinator" || task.assignedTo === userId || task.assignedBy === userId) {
    return { status: 200 as const, task };
  }
  return { status: 403 as const };
}
```

Use it for task detail, comments, attachments, and history.

### Finding C2 - Public booking verification leaks visitor and payment details by reference

Severity: High

Evidence:

```ts
app.get("/api/bookings/verify/:reference", async (req, res) => {
  const booking = await storage.getBookingByReference(req.params.reference);
  res.json({
    visitorName: booking.visitorName,
    visitDate: booking.visitDate,
    visitTime: booking.visitTime,
    numberOfPeople: booking.numberOfPeople,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
  });
});
```

Risk:

Booking references are treated as bearer secrets. If leaked, shared, or guessed, the endpoint exposes visitor attendance and payment state. This endpoint is useful for gate verification, but it should be scoped.

Concrete fix:

- Require security role auth for full details.
- For public verification, return only `{ valid: true, statusCategory }`.
- Add rate limits per reference/IP and log failed lookup bursts.
- Consider a separate QR verification token with expiry.

### Finding C3 - Public transport quote token endpoint exposes PII and allows unauthenticated decisions

Severity: High

Evidence:

```ts
app.get("/api/public/transport-quotes/:token", async (req, res) => {
  res.json({
    visitorName: request.visitorName,
    visitorEmail: request.visitorEmail,
    partnerPhone: partner?.phone || null,
    driverName: request.driverName,
    driverPhone: request.driverPhone,
    vehicleDetails: request.vehicleDetails,
    status: request.status,
  });
});

app.post("/api/public/transport-quotes/:token/decision", async (req, res) => {
  const request = await storage.getTransportRequestByQuoteToken(req.params.token);
  await storage.updateTransportRequest(request.id, { status: newStatus, quoteDecision: payload.decision });
});
```

Risk:

The endpoint is token based, but it exposes visitor email, driver phone, vehicle details, and allows state-changing decisions without user auth. If tokens are long-lived or logged, this becomes a PII and business workflow risk.

Concrete fix:

- Store only hashed quote tokens.
- Add expiry and one-time-use semantics.
- Require a secondary confirmation value for sensitive decisions where practical.
- Trim the public response to only details necessary for visitor approval.

### Finding C4 - Password reset and verification tokens are stored in plaintext

Severity: Medium

Evidence:

```ts
const resetToken = crypto.randomBytes(32).toString("hex");
await storage.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);
```

```ts
async setPasswordResetToken(userId: string, token: string, expires: Date) {
  await this.updateUser(userId, { passwordResetToken: token, passwordResetExpires: expires });
}

async getUserByResetToken(token: string) {
  return this.supabase.from("users").select("*").eq("password_reset_token", token).single();
}
```

Risk:

Database read access exposes live reset and verification tokens. Tokens should be treated like passwords: store a hash, compare hashes, clear on use.

Concrete fix:

```ts
const token = crypto.randomBytes(32).toString("hex");
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
await storage.setPasswordResetToken(user.id, tokenHash, expires);
```

Then look up by hash, not raw token.

### Finding C5 - Password policy is inconsistent across register, reset, admin reset, and iOS

Severity: Medium

Evidence:

```ts
// server register
password: z.string().min(8, "Password must be at least 8 characters")

// server reset/admin reset
if (password.length < 6) ...
if (!newPassword || newPassword.length < 6) ...
```

```swift
// iOS
bannerMessage = "Add your name, a valid email, and a password with at least 6 characters."
password.count >= 6
```

Risk:

Users can set weaker passwords through reset/admin flows than through registration. iOS allows 6-7 character registration attempts that the backend rejects.

Concrete fix:

Define one shared policy, e.g. `MIN_PASSWORD_LENGTH = 8`, and update:

- server register/reset/admin reset/invite schemas
- web forms and placeholders
- iOS `RegisterDraft` and `PasswordHelpDraft`
- docs

### Finding C6 - Developer API key creation exists, but no incoming API key auth path was found

Severity: Medium

Evidence:

```ts
app.post("/api/developer/api-keys", isAuthenticated, isAdmin, async (req, res) => {
  const rawKey = `dvz_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = await hashPassword(rawKey);
  await storage.createApiKey({ userId, keyHash, scopes, status: "active" });
  res.json({ key: rawKey });
});
```

Search found UI examples using:

```text
Authorization: Bearer dvz_your_api_key_here
```

But no middleware was found that validates `Authorization: Bearer dvz_*`, checks scopes, expiry, revocation, or calls `incrementApiKeyUsage`.

Risk:

This is an incomplete feature. Users can create keys and documentation implies they work, but server routes do not appear to accept them.

Concrete fix:

Implement `authenticateApiKey(scopes: string[])`:

- Extract `Authorization: Bearer`.
- Find by prefix.
- Bcrypt-compare against candidate hashes.
- Check `status`, `expiresAt`, and scope.
- Attach `req.apiKey`/`req.currentUser`.
- Increment usage and handle RPC errors.

### Finding C7 - Supabase raw `.or(...)` filters interpolate user input

Severity: Medium

Evidence:

```ts
.or(`visitor_name.ilike.%${query}%,visitor_email.ilike.%${query}%,booking_reference.ilike.%${query}%`)
.or(`recipient_email.ilike.%${recipient}%,recipient_name.ilike.%${recipient}%`)
.or(`subject.ilike.%${reference}%,message.ilike.%${reference}%,related_entity_id.eq.${reference}`)
```

Risk:

Supabase/PostgREST `.or()` accepts a filter grammar string. Interpolating unescaped user input can break filters, widen searches, or produce unexpected query behavior when input includes commas, parentheses, percent signs, or operators.

Concrete fix:

- Escape PostgREST filter grammar metacharacters before interpolation.
- Prefer structured `.ilike()` calls where possible.
- For complex searches, create a server-side SQL function with typed parameters and call it via RPC.

### Finding C8 - GetYourGuide webhook auth wrapper can hang after failed Basic Auth

Severity: High

Evidence:

```ts
app.post("/api/webhooks/getyourguide", async (req, res) => {
  await new Promise<void>((resolve, reject) => {
    basicAuth(req, res, (err?: any) => (err ? reject(err) : resolve()));
  });
  ...
});
```

```ts
// basicAuth writes the response and does not call next() on auth failure
return res.status(401).json({ error: 'Invalid credentials' });
```

Risk:

When auth fails, `basicAuth` sends a response but the promise never resolves/rejects. In serverless, this can leave the invocation open until timeout.

Concrete fix:

Rewrite Basic Auth as a pure checker:

```ts
const auth = verifyBasicAuth(req);
if (!auth.ok) return res.status(auth.status).json(auth.body);
```

Also use constant-time comparison for credentials:

```ts
crypto.timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername))
```

### Finding C9 - Resend webhook verification is optional

Severity: High

Evidence:

```ts
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
if (webhookSecret) {
  const isVerified = hasSvixHeaders
    ? verifyResendWebhookSignature(req, webhookSecret)
    : sharedSecretHeader === webhookSecret;

  if (!isVerified) return res.status(401).json({ message: "Invalid webhook signature" });
}
```

Risk:

If `RESEND_WEBHOOK_SECRET` is missing in production, anyone can post delivery events and mutate email delivery status.

Concrete fix:

```ts
if (process.env.NODE_ENV === "production" && !process.env.RESEND_WEBHOOK_SECRET) {
  throw new Error("RESEND_WEBHOOK_SECRET is required in production");
}
```

Require Svix signature verification in production; keep shared-secret fallback only for local development if needed.

### Finding C10 - Outbound webhooks allow SSRF and may be dropped in serverless

Severity: High

Evidence:

```ts
Promise.allSettled(activeEndpoints.map(ep => this.sendToEndpoint(ep, eventName, payloadString)));
```

```ts
const response = await fetch(endpoint.url, {
  method: "POST",
  headers,
  body: payloadString,
  signal: controller.signal,
});
```

```ts
headers["X-Dzaleka-Signature"] = signature;
```

Risks:

- Admin-configured webhook URLs are fetched without HTTPS enforcement, private IP blocking, DNS rebinding protection, or redirect restrictions.
- Dispatch is not awaited or queued; Netlify/serverless may freeze before delivery/logging completes.
- HMAC signature lacks timestamp/replay protection.
- Webhook secrets, full payloads, and response bodies are stored in plain fields.

Concrete fix:

- Validate endpoint URLs: `https:` only, no localhost/private/link-local IPs, block redirects or revalidate redirect targets.
- Move delivery to a durable queue/table with worker retries.
- Sign `timestamp.payload` and send both timestamp and signature.
- Encrypt webhook secrets and minimize stored delivery payload/response data.

## Milestone 4: Supabase, Database, and Migrations

### Finding D1 - RLS migration posture is contradictory and order-dependent

Severity: High

Evidence:

```sql
-- migrations/enable_rls.sql
CREATE POLICY "Service role full access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
```

```sql
-- migrations/disable_notifications_rls.sql
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

```sql
-- migrations/training_modules.sql
ALTER TABLE training_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE guide_training_progress DISABLE ROW LEVEL SECURITY;
```

```sql
-- migrations/zz_security_hardening.sql
ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ...
```

There are also duplicate numbered migrations:

```text
0021_add_no_show_status.sql
0021_add_soft_delete.sql
0021_fix_analytics_duplicates_combined.sql
0021_fix_analytics_settings_duplicates.sql
0022_add_payouts.sql
0022_clean_page_views_duplicates.sql
0023_add_page_views_unique_constraint.sql
0023_add_recurring_bookings.sql
```

Risk:

The actual database access posture depends on which SQL files were manually applied and in what order. Earlier broad `USING (true)` policies and RLS disabling scripts conflict with later hardening.

Concrete fix:

- Replace ad hoc SQL files with one ordered migration system (`drizzle-kit`, Supabase migrations, or a schema migration table).
- Add a `schema_migrations` table if not already managed.
- Make the intended model explicit:
  - If Express service-role is the only data boundary, then all exposed tables should have RLS enabled with no anon/auth policies.
  - If browser Supabase access is expected, define narrow `auth.uid()` policies per table.
- Add a production SQL audit script:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, policyname;
```

### Finding D2 - Backend service role bypass is intentional but should be guarded

Severity: Medium

Evidence:

```ts
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
this.hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
this.supabase = createClient(process.env.SUPABASE_URL, supabaseKey);
```

Risk:

The app correctly treats Express as the authorization boundary, but if `SUPABASE_SERVICE_ROLE_KEY` leaks to browser code or deployment logs, RLS is bypassed. If the service role is absent, some features fail later (`uploadPublicStorageObject`) rather than at boot.

Concrete fix:

- Assert service role in production:

```ts
if (process.env.NODE_ENV === "production" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for backend storage access");
}
```

- Ensure only `VITE_SUPABASE_ANON_KEY` is ever exposed to the browser.
- Rotate service role credentials if `.env` has ever left the machine.

### Finding D3 - Public avatar bucket and public image metadata need privacy review

Severity: Medium

Evidence:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

```ts
const folder = payload.purpose === "guide_profile" ? "guide-images" : "profile-images";
await storage.uploadPublicStorageObject("avatars", filePath, imageBuffer, ...);
```

Asset scan also found:

```text
client/public/friends-of-dzaleka/patrick-chafukira.jpg:
JPEG image data ... model=Redmi Note 8 ... datetime=2026:01:24 13:45:37 ... GPS-Data
```

Risk:

Public buckets and public images can reveal permanent URLs and metadata. The JPEG EXIF/GPS data is a concrete privacy leak in a public asset.

Concrete fix:

- Strip EXIF/GPS metadata from all public images before commit/deploy.
- Add a precommit or build check using `exiftool`/`imagemagick`.
- Consider private buckets with signed URLs for profile images if public access is not required.

## Milestone 5: Frontend, Routing, and Feature Completeness

### Finding E1 - Legacy `/api/login` redirects are broken

Severity: High

Evidence:

```text
client/src/pages/bookings.tsx:498 window.location.href = "/api/login";
client/src/pages/guides.tsx:260 window.location.href = "/api/login";
client/src/pages/security.tsx:181 window.location.href = "/api/login";
client/src/pages/settings.tsx:124 window.location.href = "/api/login";
client/src/pages/users.tsx:204 window.location.href = "/api/login";
client/src/pages/zones.tsx:489 window.location.href = "/api/login";
```

No server route for `/api/login` was found. Auth routes are `/api/auth/login`, and the UI route is `/login`.

Risk:

Expired-session flows redirect users to a missing endpoint instead of the login page.

Concrete fix:

Replace legacy redirects with the router:

```ts
setLocation("/login");
```

or centralize unauthorized handling in `queryClient`/`useAuth`.

### Finding E2 - Reset, verify, and invite flows navigate to `/auth`, but the router exposes `/login`

Severity: High

Evidence:

```tsx
// client/src/pages/reset-password.tsx
setTimeout(() => setLocation("/auth"), 3000);

// client/src/pages/accept-invite.tsx
<Button onClick={() => setLocation("/auth")}>Go to Sign In</Button>
```

```tsx
// client/src/App.tsx
<Route path="/login" component={AuthPage} />
```

Risk:

Successful password resets and invite failure/success states send users to a non-existent route.

Concrete fix:

Change `/auth` to `/login`, or add a permanent `/auth` redirect route.

### Finding E3 - Calendar guide assignment calls a non-existent endpoint

Severity: High

Evidence:

```tsx
// client/src/pages/calendar.tsx
await apiRequest("PATCH", `/api/bookings/${bookingId}/assign-guide`, { guideId });
```

```ts
// server/routes.ts
app.patch("/api/bookings/:id/assign", isAuthenticated, requireRole("admin", "coordinator"), ...)
```

Risk:

Guide assignment from calendar will fail even though assignment works from other pages.

Concrete fix:

Use `/api/bookings/${bookingId}/assign`, or add a backend compatibility alias that calls the same handler.

### Finding E4 - Dashboard links to `/visitor-essentials`, but the route is nested

Severity: Medium

Evidence:

```tsx
// client/src/pages/dashboard.tsx
<Link href="/visitor-essentials">
```

```tsx
// client/src/App.tsx
<Route path="/plan-your-trip/visitor-essentials" component={VisitorEssentials} />
```

Risk:

Dashboard users land on 404/unauthorized routing instead of the public visitor essentials page.

Concrete fix:

```tsx
<Link href="/plan-your-trip/visitor-essentials">
```

### Finding E5 - Analytics custom HTML is stored and advertised but not rendered; tracker IDs are not validated

Severity: Medium

Evidence:

```ts
// shared/schema.ts
customHtml: text("custom_html"),
```

```tsx
// client/src/pages/settings.tsx
This code will be included at the bottom of the Booking Confirmation page.
<Textarea placeholder="<script>...</script>" value={analyticsForm.customHtml || ""} />
```

```tsx
// client/src/components/analytics-tracker.tsx
script.innerHTML = `
  ...
  fbq('init', '${settings.facebookPixelId}');
  fbq('track', 'PageView');
`;
```

Risk:

The UI promises a feature that does not appear to be implemented. If later implemented by injecting raw `customHtml`, it becomes an XSS footgun. Current tracker ID interpolation into `innerHTML` should validate ID formats first.

Concrete fix:

- Either remove `customHtml` UI/storage or implement it through a vetted allowlist of provider fields.
- Validate `facebookPixelId`, `ga4MeasurementId`, and Ads IDs with strict regex.
- Avoid dynamic script `innerHTML`; load provider scripts with `src` and call APIs with validated IDs.

### Finding E6 - Accessibility/design system improvements are partially addressed but should be regression-tested

Severity: Low

Evidence:

```tsx
// client/src/components/ui/input.tsx
"text-base ... md:text-sm"
```

```tsx
// client/src/components/ui/select.tsx
"touch-manipulation ... text-base ... md:text-sm"
```

The codebase shows work toward the UI requirements: mobile input text size, focus-visible rings, native controls, and touch manipulation are present in shared components. The audit did not run visual browser checks, and the app has many pages with dense forms, dialogs, data tables, command palettes, and custom widgets.

Concrete fix:

Add Playwright accessibility smoke tests for:

- keyboard-only navigation through auth, booking creation, dashboard, calendar, chat, and dialogs
- focus trap and return behavior in Radix dialogs/sheets
- mobile viewport text/input sizing
- no horizontal overflow on dashboard/table pages

## Milestone 6: Chrome Extension

### Finding F1 - Blog cards inject unescaped slug and image URL into `innerHTML`

Severity: High

Evidence:

```js
const imgSrc = post.coverImage
  ? (post.coverImage.startsWith("http") ? post.coverImage : `${BASE_URL}${post.coverImage}`)
  : null;

return `
  <div class="blog-card" data-slug="${post.slug || ""}">
    ${imgSrc ? `<img src="${imgSrc}" alt="" />` : thumbIcon}
    <h4>${escapeHtml(post.title || "Untitled")}</h4>
  </div>
`;
```

Risk:

`title` and `excerpt` are escaped, but `slug` and `coverImage` are not. A malicious or compromised blog API response can break attributes and inject HTML/JS in the extension popup context.

Concrete fix:

Build DOM nodes instead of HTML strings:

```js
const card = document.createElement("div");
card.className = "blog-card";
card.dataset.slug = String(post.slug || "");

const img = document.createElement("img");
img.alt = "";
img.src = safeImageUrl(post.coverImage);
```

Validate image URLs against `https://visit.dzaleka.com` or a strict media allowlist.

### Finding F2 - Notification clicks can open arbitrary HTTP(S) URLs

Severity: Medium

Evidence:

```js
function normalizeNotificationLink(link) {
  if (!link) return BASE_URL;
  return link.startsWith("http") ? link : `${BASE_URL}${link}`;
}
```

Risk:

If an API notification contains an external `http` or `https` link, the extension opens it. That can be used for phishing or unexpected navigation.

Concrete fix:

```js
function normalizeNotificationLink(link) {
  const url = new URL(link || "/", BASE_URL);
  if (url.origin !== BASE_URL) return BASE_URL;
  return url.toString();
}
```

If external domains are intentionally supported, use a small allowlist and show an interstitial.

## Milestone 7: iOS App

### Finding G1 - iOS auth is session-cookie based and secure token storage is still a TODO

Severity: Medium

Evidence:

```swift
let configuration = URLSessionConfiguration.default
configuration.httpCookieAcceptPolicy = .always
configuration.httpCookieStorage = .shared
configuration.httpShouldSetCookies = true
```

```md
The app uses `URLSessionVisitDzalekaAPI` and the same session-based auth routes as the web app.

Suggested Next Steps:
1. Add real authentication and secure token storage.
```

Risk:

The native app currently depends on browser-style cookie sessions. This can work, but the README itself identifies secure token storage as unfinished. Shared cookie storage increases unintended cross-session coupling.

Concrete fix:

- Move native auth to short-lived access tokens plus refresh tokens stored in Keychain, or a dedicated mobile session cookie jar.
- Add CSRF/client-auth compatibility when hardening CSRF.
- Add logout tests that clear native cookies/tokens.

### Finding G2 - iOS password validation conflicts with backend registration

Severity: Medium

Evidence:

```swift
bannerMessage = "Add your name, a valid email, and a password with at least 6 characters."
password.count >= 6
```

Backend registration requires 8 characters. See Finding C5.

Concrete fix:

Update iOS validation to 8+ characters and surface backend validation messages inline.

## Milestone 8: Docs, Static Assets, and Operational Scripts

### Finding H1 - Documentation is stale and contains broken references

Severity: Low

Evidence:

```md
// README.md
cp .env.example .env
```

`.env.example` does not exist.

```js
// docs/scripts/docs.js
{ title: "Authentication", url: "authentication.html", ... }
```

`docs/pages/authentication.html` does not exist.

```html
<!-- docs/pages/environment.html -->
<td>Server port. Defaults to 5000.</td>
```

The server defaults to port `3000`:

```ts
const port = parseInt(process.env.PORT || "3000", 10);
```

Concrete fix:

- Add `.env.example` with placeholder names only.
- Create `docs/pages/authentication.html` or remove the search index entry.
- Update all port defaults and auth docs to match the current email/password session implementation.

### Finding H2 - Test scripts can hit live external systems

Severity: Medium

Evidence:

```text
scripts/test-getyourguide-live.ts
scripts/test-payment-flow.ts
```

Search output shows the live GetYourGuide script labels itself as production testing and the payment script posts to `http://localhost:3000/api/webhooks/stripe`.

Risk:

Ad hoc scripts are useful but can mutate external integrations or local databases if run casually.

Concrete fix:

- Require explicit env flags such as `CONFIRM_LIVE_GYG_TESTS=true`.
- Put scripts behind package commands with clear names.
- Add dry-run defaults.

### Finding H3 - Public image contains GPS/device EXIF metadata

Severity: Medium

Evidence:

```text
client/public/friends-of-dzaleka/patrick-chafukira.jpg:
Exif ... model=Redmi Note 8 ... datetime=2026:01:24 13:45:37 ... GPS-Data
```

Risk:

Public assets can leak the photographer's device, timestamp, and geolocation.

Concrete fix:

Strip metadata:

```bash
exiftool -all= client/public/friends-of-dzaleka/patrick-chafukira.jpg
```

Then recompress/verify and add an automated asset metadata check.

## Positive Controls Observed

- `npm run check` passes.
- Passwords and API keys use bcrypt hashing.
- Registration regenerates sessions before setting user data.
- Stripe webhook verifies signatures and validates amount/currency metadata.
- Public API caching is disabled for non-public API routes.
- The service worker avoids caching `/api/*`.
- Markdown rendering uses `ReactMarkdown` without `rehypeRaw`, so raw HTML is escaped by default.
- Chrome extension permissions are narrow: `storage`, `notifications`, `alarms`, and `https://visit.dzaleka.com/*`.
- Visitor booking payment/cancel/rating routes checked in this pass enforce ownership.
- Chat room/message routes checked in this pass enforce participant access.

## Architectural Recommendations

1. Split the large `server/routes.ts` into bounded routers: auth, bookings, transport, webhooks, tasks, chat, admin/settings, public content, integrations. Keep shared auth helpers in one module.
2. Introduce a policy layer for authorization checks (`canReadTask`, `canAccessBooking`, `canManageTransportRequest`) and test it independently.
3. Make database migrations deterministic. One ordered migration chain should be the source of truth; remove or archive manual one-off SQL files after folding them into that chain.
4. Treat public bearer links as credentials: hash tokens at rest, expire them, rate-limit them, and minimize returned PII.
5. Add a route contract test that compares client API calls to Express routes. This would catch `/assign-guide`, `/api/login`, and `/auth` regressions.
6. Add security CI:

```bash
npm run check
npm audit --omit=dev --audit-level=high
rg -n 'window.location.href = "/api/login"|setLocation\("/auth"\)|assign-guide' client/src server
```

7. Add Playwright smoke tests for auth, booking creation, calendar assignment, reset/invite flows, transport quote decisions, and dashboard internal links.
8. Add asset sanitation for EXIF/GPS metadata and SVG script/event attributes.
9. Add production boot assertions for `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_WEBHOOK_SECRET`, Stripe webhook secret, and GetYourGuide webhook credentials when relevant features are enabled.

## Coverage Matrix

| Area | Files/coverage | Result |
| --- | ---: | --- |
| Root config/docs | `package.json`, lockfile, TS/Vite/Tailwind/PostCSS/Drizzle/Netlify, README, CLAUDE, AGENTS, design docs, env/log artifacts | Dependency, build, docs, env artifact issues found |
| `server/` | 26 files including app setup, routes, storage, middleware, email, Stripe, GetYourGuide, schedulers, webhook dispatcher | Session, CSRF, auth, webhook, task access, token, logging, route issues found |
| `shared/` | `shared/schema.ts` | API key, webhook, analytics, token schema surfaces reviewed |
| `client/` | 232 files inventoried; router, API client, auth flows, settings, calendar, dashboard, extension-linked public pages, UI primitives reviewed deeply | Broken linkages and feature gaps found |
| `migrations/` and SQL roots | 55 migration files plus `supabase-rls.sql`/`supabase-schema.sql` | RLS/order contradictions and public bucket posture found |
| `netlify/` | Netlify function and TOML | Handler/dependency/deploy concerns found |
| `script/` and `scripts/` | Build/prerender plus operational scripts | Live-test and build reproducibility risks found |
| `chrome-extension/` | Manifest, popup, background, docs, icons | DOM injection and arbitrary link opening risks found |
| `ios/` | 28 Swift/Xcode/README files | Native auth and password policy issues found |
| `docs/` | 26 docs files | Missing page and stale environment docs found |
| `attached_assets/` and public assets | JSON, Markdown, SVG, PNG/JPEG assets inventoried | Public JPEG EXIF/GPS issue found |
| Hidden agent skill dirs | `.agents` source plus symlink aliases under `.agent`, `.claude`, `.cursor`, `.gemini`, `.windsurf` | No app runtime code; no hardcoded real secrets found in searched skill docs |
| `dist/` | Generated output sampled and excluded from source findings | Build output only |
| `node_modules/` | Excluded as vendored code | Covered via `npm audit` |

## Final Verification Checklist

Completed:

- Unique non-generated file inventory counted 424 files before this report and 425 files after adding `AUDIT_REPORT.md`.
- Symlinked hidden skill aliases were dereferenced and checked as duplicates of `.agents/skills/resend`.
- Generated/vendor directories were explicitly excluded and documented.
- `npm run check` passed before report creation and passed again after report creation.
- `npm audit --omit=dev --json` and full `npm audit --json` were run and summarized.
- Route/linkage searches confirmed broken `/api/login`, `/auth`, `/assign-guide`, and `/visitor-essentials` references.
- SQL/RLS searches confirmed conflicting RLS policies and disabled-RLS scripts.
- Extension, iOS, docs, assets, scripts, Netlify, and root configuration were included in the coverage matrix.

Recommended next verification after fixes:

```bash
npm run check
npm audit --omit=dev --audit-level=high
npm run build
```

Add Playwright/browser smoke tests before claiming UI workflow fixes are complete.
