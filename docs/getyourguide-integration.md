# GetYourGuide integration

GetYourGuide calls our `/1/` Supplier API to read availability, reserve inventory, confirm a booking, and cancel it. There is no scheduled import of existing GetYourGuide bookings. A booking manually entered in Visit Dzaleka must be attributed to GetYourGuide and linked to its external reference separately.

## Deployment

Apply `migrations/0026_getyourguide_persistence.sql` before deploying the application. It adds private, RLS-protected reservation and activity tables and lookup indexes. The server needs `DATABASE_URL` with permission to access bookings, booking activity, and these integration tables. Reservations, confirmation, and cancellation use database transactions across Netlify instances. A booking change keeps both supplier booking references until GetYourGuide cancels the original; the external GYG reference is intentionally not unique.

Inbound credentials: `GETYOURGUIDE_SUPPLIER_API_USERNAME` and `GETYOURGUIDE_SUPPLIER_API_PASSWORD`. The older `GETYOURGUIDE_API_USERNAME` / `GETYOURGUIDE_API_PASSWORD` fallback remains supported. Outbound credentials are the API username/password issued by GetYourGuide, which may differ from inbound credentials.

Set `GETYOURGUIDE_AVAILABILITY_PRODUCT_ID` to the supplier product ID mapped to the tour option. Numeric IDs are supported; the API response determines whether a product is connected. A successful sandbox push does not verify production mapping.

## Certification and activation

1. Configure the testing base URL as `https://visit.dzaleka.com` (the portal adds `/1/`) and the inbound credentials in the integrator portal.
2. Complete supplier self-testing for the supported product combinations shown on the admin GetYourGuide page. Product timezone: `Africa/Blantyre`. Fixed departures default to 09:00 and 14:00. Self-test product variants reserve the date 28 days from today as unavailable; use the page's suggested windows.
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
