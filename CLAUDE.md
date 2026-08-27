# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Push database schema changes (Drizzle ORM)
npm run db:push

# Type check
npm run check

# Start production server (after build)
npm run start
```

## Architecture Overview

### Monorepo Structure
- **`client/`** - React SPA with Vite
- **`server/`** - Express API server
- **`shared/`** - Shared types and Drizzle schema (used by both client and server)

### Backend (`server/`)

**Key files:**
- `routes.ts` - All API endpoints (~4700 lines). Uses middleware pattern for auth (`isAuthenticated`, `isAdmin`, `requireRole`)
- `storage.ts` - Database access layer with all CRUD operations
- `auth.ts` - Password hashing with bcrypt
- `email.ts` - Transactional email via Resend API

**Authentication:**
- Session-based auth stored in PostgreSQL (`express-session` + `connect-pg-simple`)
- Roles: `admin`, `guide`, `visitor`
- Middleware: `isAuthenticated`, `isAdmin`, `requireRole(...roles)`

**Database:**
- Drizzle ORM with Neon PostgreSQL
- Schema defined in `shared/schema.ts`
- Run `npm run db:push` after schema changes

### Frontend (`client/src/`)

**Routing (wouter):**
- Unauthenticated: Landing, Login, Reset Password, Verify Email
- Authenticated: Role-based sidebar with 40+ pages
- See `App.tsx` for full route definitions

**State Management:**
- TanStack Query for server state
- `queryClient` in `lib/queryClient.ts` handles API calls

**UI:**
- Radix UI primitives in `components/ui/`
- shadcn/ui component architecture
- Tailwind CSS with custom theme in `tailwind.config.ts`

### Key Domain Models (from `shared/schema.ts`)

| Table | Purpose |
|-------|---------|
| `users` | Multi-role users (admin/guide/visitor) |
| `bookings` | Tour bookings with status workflow |
| `guides` | Guide profiles with availability |
| `guideAvailability` | Weekly/date-based scheduling |
| `zones` | Camp tour zones |
| `incidents` | Security module events |
| `auditLogs` | System activity tracking |

### API Patterns

**Request/Response:**
```typescript
// Client-side fetch (uses queryClient)
const { data } = useQuery({ queryKey: ["/api/bookings"] });

// Mutations
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/bookings", data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookings"] })
});
```

**Server-side route registration:**
```typescript
app.get("/api/bookings", isAuthenticated, async (req, res) => {
  const bookings = await storage.getBookings();
  res.json(bookings);
});
```

### Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your_secret
RESEND_API_KEY=re_...  # Optional for email
```

### Important Conventions

- All dates use `date-fns` for formatting
- Booking references follow pattern: `DVS-2024-001`
- Pricing in MWK (Malawi Kwacha): individual=15000, small_group=50000, large_group=80000
- Frontend uses relative imports with `@/` alias mapped to `client/src/`
