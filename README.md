# Visit Dzaleka

The official booking and travel-information platform for [Dzaleka Refugee Camp](https://visit.dzaleka.com) in Dowa District, Malawi — about 45 km from Lilongwe.

Visitors book resident-led guided tours; administrators and guides run them. Tour fees pay local guides and fund community-led work.

**Live:** [visit.dzaleka.com](https://visit.dzaleka.com)

## What it does

- **Tour booking** — group-size pricing in MWK, availability, references in the form `DVS-2024-001`
- **Guide management** — profiles, weekly and date-based availability, assignment, earnings
- **Role-based access** — separate surfaces for `admin`, `guide`, `visitor` and `transport_partner`
- **Public content** — travel guides, community events, camp zones, a blog and a community hub
- **Transport partners** — vetted operators for the Lilongwe–Dzaleka route, with a quote flow
- **Payments** — Stripe checkout, plus Airtel Money, TNM Mpamba and cash recorded manually
- **Channel manager** — GetYourGuide integration for availability and bookings
- **Email** — transactional mail via Resend, with delivery history
- **Security module** — visitor check-in/out and incident tracking
- **Public API** — read-only, unauthenticated, described by OpenAPI

## For developers and AI agents

The site is built to be machine-readable. Nothing below needs a key.

| Resource | URL |
|---|---|
| Developer portal | [`/developers`](https://visit.dzaleka.com/developers) |
| OpenAPI 3.1 spec | [`/openapi.json`](https://visit.dzaleka.com/openapi.json) |
| Endpoint index | [`/api`](https://visit.dzaleka.com/api) |
| Agent guidance | [`/llms.txt`](https://visit.dzaleka.com/llms.txt) |
| API catalogue | [`/.well-known/api-catalog`](https://visit.dzaleka.com/.well-known/api-catalog) |
| CLI | `npx visit-dzaleka pricing` |

```bash
curl https://visit.dzaleka.com/api/public/pricing
```

Prices are integers in Malawi Kwacha with no decimal component, and they change — read them live rather than caching a figure. Errors return JSON with a stable `code`, never an HTML page. Every public page also has a markdown representation:

```bash
curl -H "Accept: text/markdown" https://visit.dzaleka.com/plan-your-trip
```

Full endpoint reference in [`docs/api.md`](docs/api.md). The spec lives in [`shared/openapi.ts`](shared/openapi.ts) and is the single source of truth — a new public endpoint has to be added there as well as in `server/routes.ts`, or agents will not discover it.

## Tech stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Radix UI (shadcn), wouter, TanStack Query
- **Backend** — Node.js, Express, Drizzle ORM
- **Data** — Supabase (PostgreSQL); sessions in Postgres via `connect-pg-simple`
- **Auth** — session-based, bcrypt password hashing, API keys for partner integrations
- **Email** — Resend
- **Payments** — Stripe
- **Hosting** — Netlify: static site, serverless functions for the API, one edge function for content negotiation
- **Tests** — Vitest

## Getting started

### Prerequisites

- Node.js 18 or newer
- A Supabase project (PostgreSQL)

### Installation

```bash
npm install
```

Create a `.env` file (see below), then:

```bash
npm run db:push    # sync the Drizzle schema
npm run dev        # http://localhost:3000
```

### Environment variables

Required:

```
DATABASE_URL=postgresql://...            # Drizzle migrations and the session store
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...            # server-side data access; required in production
SESSION_SECRET=...                       # required in production
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Optional, by feature:

```
RESEND_API_KEY=...                       # transactional email
RESEND_FROM_EMAIL=...
STRIPE_SECRET_KEY=...                    # card payments
STRIPE_WEBHOOK_SECRET=...
STRIPE_CHECKOUT_CURRENCY=usd             # if usd, STRIPE_MWK_PER_USD is required
STRIPE_MWK_PER_USD=...
ENCRYPTION_KEY=...                       # falls back to SESSION_SECRET if unset
APP_URL=https://visit.dzaleka.com
ALLOWED_ORIGINS=...                      # comma-separated CORS allowlist
PORT=3000
GETYOURGUIDE_*=...                       # channel manager; see docs/api.md
```

> `NODE_ENV=production` in a local `.env` will activate the production
> Content Security Policy against your dev server. Leave it unset for local work.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Generate agent files, build client and server, then prerender |
| `npm start` | Serve the production build |
| `npm run check` | TypeScript type check |
| `npm test` | Run the Vitest suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run security:deps` | `npm audit --audit-level=high` — gates the Netlify build |
| `npm run netlify:build` | What Netlify runs: audit, install Chrome, build |

`npm run build` takes several minutes: it prerenders every public route with Puppeteer so crawlers and AI agents see real content without JavaScript. It fails the build if the homepage renders without meaningful text.

## Project structure

```
client/              React SPA
  public/            Static assets, llms.txt, openapi.json, robots.txt
  src/pages/         Route components
  src/components/    UI, including ui/ (shadcn primitives)
server/              Express API
  routes.ts          All API endpoints
  storage.ts         Database access layer
  agent.ts           Discovery headers, JSON errors, /api index
  csp.ts             Content Security Policy
shared/              Types and schema shared by client and server
  schema.ts          Drizzle tables
  openapi.ts         Public API specification
  routes.ts          Route manifest, drives 404 handling
script/              Build and prerender
test/                Vitest suite
cli/                 The `visit-dzaleka` npm package
netlify/             Serverless functions and the edge function
docs/                API documentation
chrome-extension/    Browser extension
migrations/          SQL migrations
```

## Deployment

Netlify builds from `main` using `netlify:build`. The published directory is `dist/public`; `dist/` is not tracked in git.

Routing comes from `dist/public/_redirects`, generated during the prerender. It enumerates the real routes and ends in a `404` catch-all, so unknown paths return a genuine 404 rather than the app shell.

`npm run security:deps` runs first and **fails the build on any high-severity advisory**. If a deploy stops within about 30 seconds, check that before anything else.

## Testing

```bash
npm test
```

Covers the route manifest, redirect generation, the agent endpoints, OpenAPI spec quality, CSP, `robots.txt`, markdown conversion, the CLI, and the prerendered build output. The build-output tests skip themselves until `npm run build` has been run.

## Links

- [Book a tour](https://visit.dzaleka.com/login)
- [Plan your trip](https://visit.dzaleka.com/plan-your-trip)
- [Privacy policy](https://visit.dzaleka.com/privacy)
- [Disclaimer](https://visit.dzaleka.com/disclaimer)
- [Developer portal](https://visit.dzaleka.com/developers)

## A note on visiting

Dzaleka is a place where tens of thousands of people live, not an attraction. Visits are arranged with community agreement, photography requires consent, and access can be limited by UNHCR or partner guidance on the day. Anything built on this platform should carry that context to visitors.

## License

Private — all rights reserved.
