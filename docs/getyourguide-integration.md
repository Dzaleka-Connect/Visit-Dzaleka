# GetYourGuide integration

GetYourGuide calls our `/1/` Supplier API to read availability, reserve inventory, confirm a booking, and cancel it. There is no scheduled import of existing GetYourGuide bookings. A booking manually entered in Visit Dzaleka must be attributed to GetYourGuide and linked to its external reference separately.

## Deployment

Apply `migrations/0026_getyourguide_persistence.sql`, then `migrations/0027_getyourguide_reserve.sql`, then `migrations/0028_getyourguide_availability_index.sql` before deploying the application. The first adds private, RLS-protected reservation and activity tables and lookup indexes. The second keeps reservation locking, capacity checks, and insertion in one database call to meet supplier API latency limits. Its function is private and executes with the caller’s permissions. The third indexes active bookings by visit date so 1-day availability queries do not scan the full table. The server needs `DATABASE_URL` with permission to access bookings, booking activity, and these integration tables. Reservations, confirmation, and cancellation use database transactions across Netlify instances. A booking change keeps both supplier booking references until GetYourGuide cancels the original; the external GYG reference is intentionally not unique.

Testing inbound credentials: `GETYOURGUIDE_SUPPLIER_API_USERNAME` and `GETYOURGUIDE_SUPPLIER_API_PASSWORD`. When explicit supplier credentials are absent, existing `GETYOURGUIDE_WEBHOOK_USERNAME` / `GETYOURGUIDE_WEBHOOK_PASSWORD` credentials and the older API-credential fallback remain supported. Production inbound credentials: `GETYOURGUIDE_PRODUCTION_USERNAME` and `GETYOURGUIDE_PRODUCTION_PASSWORD`. Use a different username and password from testing, as required by the production portal. Set this pair in Netlify for the production Functions environment and redeploy before submitting the same pair in GetYourGuide. Both inbound pairs work on the shared `/1/` API; incomplete pairs are rejected. Outbound credentials remain the API username/password issued by GetYourGuide and must not be replaced with the new production inbound pair.

Set `GETYOURGUIDE_AVAILABILITY_PRODUCT_ID` to the supplier product ID mapped to the tour option. Numeric IDs are supported; the API response determines whether a product is connected. A successful sandbox push does not verify production mapping.

## Certification and activation

1. Configure the testing base URL as `https://visit.dzaleka.com` (host `visit.dzaleka.com`, port `443`, path `/`; the portal adds `/1/`) and the inbound credentials in the integrator portal.
2. Complete supplier self-testing for the supported product combinations shown on the admin GetYourGuide page. Product timezone: `Africa/Blantyre`. Fixed departures default to 10:00 and 14:00, matching the existing supplier schedule. Default USD retail prices are 4900 minor units for adults and 1500 for children, matching the supplier option inspected on September 6, 2026. Self-test product variants reserve the dates 28–29 days from today as unavailable; use the page's suggested windows.
3. Complete the unlocked production configuration and production tests. Connect the supplier product ID to the correct tour option in the supplier portal. Confirm departure times and price configuration before enabling price import.
4. Make one successful production availability push from the admin page. The scheduled Netlify function then refreshes the next 30 days every 15 minutes for that exact product. Set `GETYOURGUIDE_AUTO_SYNC_ENABLED=false` to disable automatic pushes. Sandbox successes never activate the production schedule.

The dashboard shows authenticated request history, errors, and diagnostic/sandbox calls. It deliberately does not claim that configuration or an empty bookings query proves connectivity. Calls to self-test variants and requests with `X-Dzaleka-Diagnostic: true` do not count as live request activity. History is retained for 90 days and does not contain traveler contact details or credentials.

## Verification

- `npm run check`
- `npm test`
- `npm run netlify:build`
- `npx tsx scripts/check-getyourguide-persistence.ts` exercises independent database clients, concurrent reservations, retries, expiry, booking changes, exact cancellation, and activity history. It creates and removes an isolated temporary schema using `DATABASE_URL`; it does not modify real bookings.

Do not use the older `test-getyourguide*.ts` scripts as read-only diagnostics: they send mutations.

Official protocol: https://integrator.getyourguide.com/documentation/supplier_endpoints and https://integrator.getyourguide.com/documentation/overview#section/API-Request-Flows/Booking-Change

## Supplier API runtime

Netlify routes `/1/*` (and the legacy `/1/1/*` alias) to the dedicated
`getyourguide` function. It shares the supplier handlers with the local Express
app but does not load dashboard routes, sessions, email, or reporting modules.
This avoids the full application's startup cost on GetYourGuide requests.
The function targets Singapore (`sin`), matching the Supabase database region,
to avoid intercontinental database authentication and transaction round trips.
Availability returns after the inventory read: activity logging is not awaited,
90-day pruning runs on the 15-minute sync instead of every poll, and inventory
is limited to the requested date window. A scheduled warmer hits a 1-day
diagnostic availability query every five minutes so certification does not pay
a cold start. GetYourGuide’s 1-day availability SLA is under 1s desired, 3s at
the 95th percentile, and 6s longest; their certification run treats 4s as the
failing threshold.

Responses remain authenticated, use fresh database inventory and durable
reservations/activity, and explicitly disable browser/CDN caching.

The `X-Dzaleka-Supplier-Runtime: dedicated` response header identifies the new
deployment. `Server-Timing: app;dur=` reports handler time in milliseconds.
`test/getyourguide-runtime.test.ts` checks the deployed handler's
authentication, inventory/hold accounting, reservation body handling, that
availability does not wait for telemetry, and bundle dependencies.
