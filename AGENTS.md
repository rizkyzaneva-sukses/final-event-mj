<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Event Muda Juara — Project Guide

## Tech Stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **Language:** TypeScript (strict mode)
- **React:** 19
- **Database:** PostgreSQL via Prisma 7 + `@prisma/adapter-pg`
- **ORM:** Prisma Client (generated to `src/generated/prisma`)
- **Auth:** iron-session 8 (cookie-based, HttpOnly, SameSite=Lax)
- **Validation:** Zod 4
- **File Upload:** Cloudinary (signed upload from client, signature from server)
- **Password Hashing:** bcryptjs 3

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Route Handlers
│   │   ├── auth/           # login, logout, me
│   │   ├── admin-user/     # CRUD admin users (SDM only)
│   │   ├── cloudinary/     # Signed upload params
│   │   ├── event/          # CRUD events + harga-tier + registrasi
│   │   ├── kementerian/    # CRUD kementerian
│   │   ├── member/         # CRUD members + tanggungan + lookup
│   │   ├── pembayaran/     # Payment upload + verify
│   │   └── registrasi/     # Public registration
│   ├── admin/              # Admin panel (SSR, auth-protected)
│   ├── daftar/             # Public registration form (client)
│   └── login/              # Admin login (client)
├── components/
│   └── admin/AdminShell.tsx # Admin layout shell (sidebar + topbar)
├── lib/                    # Shared utilities
│   ├── cloudinary.ts       # Cloudinary signature + URL helpers
│   ├── hitung-tagihan.ts   # Billing calculation logic
│   ├── kode-unik.ts        # Payment code generator
│   ├── prisma.ts           # Prisma client singleton
│   ├── rate-limit.ts       # In-memory rate limiter
│   ├── session.ts          # iron-session helpers
│   └── validations.ts      # Zod schemas
├── generated/              # Prisma generated client (do not edit)
└── middleware.ts            # Admin route protection + session validation
```

## Architecture Patterns

### Authentication Flow
1. **Login:** POST `/api/auth/login` → bcrypt compare → `createSession()` → iron-session cookie
2. **Session:** iron-session, HttpOnly, Secure (prod), SameSite=Lax, 7-day expiry
3. **Admin pages:** Server Components call `getAuthUser()` in layout; redirect to `/login` if null
4. **API routes:** Each route handler calls `getAuthUser()` for auth; middleware validates session integrity for `/admin` routes

### Roles (RoleAdmin enum)
- **SDM** — Full access (owner). Can manage members, kementerian, events, users, payments.
- **MENKEU** — View all events, verify payments globally.
- **KEMENTERIAN** — CRUD events + harga tiers for their own kementerian only.
- **BENDAHARA** — View assigned events, limited payment actions.

### Authorization Pattern
```typescript
const user = await getAuthUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (!["SDM", "KEMENTERIAN"].includes(user.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
// For KEMENTERIAN: verify event.kementerianId === user.kementerianId
```

### Rate Limiting
- In-memory rate limiter in `src/lib/rate-limit.ts`
- Applied to: login (5/15min), registration (5/min), payment upload (3/min), cloudinary sign (10/min)
- Returns 429 when exceeded

### Data Validation
- All API inputs validated with Zod schemas from `src/lib/validations.ts`
- Phone numbers normalized to `628xxx` format via `normalizeNoWa()`

### Database
- Schema: `prisma/schema.prisma`
- Client generated to: `src/generated/prisma`
- Connection: `src/lib/prisma.ts` (singleton pattern with global cache)
- Seed: `prisma/seed.ts` (auto-runs on first startup when no admin users exist)

## Security Rules

1. **No XSS:** Never use `dangerouslySetInnerHTML` with user/admin content. Use `whiteSpace: "pre-line"` for text with line breaks.
2. **Auth on all protected routes:** Every admin API route MUST call `getAuthUser()`.
3. **Role checks:** Enforce role-based access on every endpoint. KEMENTERIAN users can only access their own kementerian's data.
4. **Rate limiting:** Apply rate limits to public endpoints (login, registration, payment).
5. **Input validation:** Validate ALL inputs with Zod before processing.
6. **No secrets in code:** Use environment variables for all secrets.
7. **Session validation:** Middleware validates iron-session integrity for `/admin` routes.
8. **CSP headers:** Content Security Policy configured in `next.config.ts`.
9. **Member lookup minimization:** Public member lookup returns only registration-form-needed fields.
10. **Admin self-protection:** Admins cannot delete or modify their own account.

## API Endpoints Reference

### Public (No Auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login (rate-limited) |
| POST | `/api/registrasi?eventSlug=X` | Public registration (rate-limited) |
| POST | `/api/pembayaran` | Upload payment proof (rate-limited) |
| GET | `/api/member/lookup?noWa=X` | Member lookup by phone |
| GET | `/api/event/by-slug/[slug]` | Event detail by slug |
| POST | `/api/cloudinary/sign` | Cloudinary signed upload params (rate-limited) |

### Admin (Auth Required)
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/auth/me` | Any | Current user info |
| POST | `/api/auth/logout` | Any | Destroy session |
| GET/POST | `/api/event` | All (filtered) | List/create events |
| GET/PATCH/DELETE | `/api/event/[id]` | SDM, KEMENTERIAN | Event CRUD |
| GET/POST | `/api/event/[id]/harga-tier` | SDM, KEMENTERIAN | Harga tier management |
| PATCH/DELETE | `/api/event/[id]/harga-tier/[tid]` | SDM, KEMENTERIAN | Harga tier update/delete |
| GET | `/api/event/[id]/registrasi` | Any | List event registrations |
| GET/POST | `/api/member` | SDM (create), All (list) | Member management |
| GET/PATCH | `/api/member/[id]` | SDM (edit), All (view) | Member detail |
| GET/POST | `/api/member/[id]/tanggungan` | Any | Tanggungan management |
| PATCH/DELETE | `/api/member/[id]/tanggungan/[tid]` | SDM | Tanggungan update/delete |
| GET/POST | `/api/kementerian` | SDM | Kementerian management |
| PATCH/DELETE | `/api/kementerian/[id]` | SDM | Kementerian update/delete |
| GET/POST | `/api/admin-user` | SDM | Admin user management |
| PATCH/DELETE | `/api/admin-user/[id]` | SDM | Admin user update/delete |
| PATCH | `/api/pembayaran/[id]/verify` | SDM, MENKEU | Verify payment |

## Coding Conventions

### File Naming
- **Pages:** `page.tsx` (Next.js convention)
- **API Routes:** `route.ts` (named exports: `GET`, `POST`, `PATCH`, `DELETE`)
- **Components:** PascalCase `.tsx` (e.g., `AdminShell.tsx`)
- **Lib files:** kebab-case `.ts` (e.g., `rate-limit.ts`, `hitung-tagihan.ts`)

### Code Style
- **TypeScript strict mode** — no `any`, use proper types
- **Inline `<style>` blocks** in page components (not CSS modules)
- **CSS variables** for theming (dark admin, light public)
- **Zod schemas** for all validation
- **Prisma** for all database access (no raw SQL)
- **Server Components** for admin pages (data fetching on server)
- **Client Components** only when interactivity needed (forms, state)

### Error Handling
- All API routes wrap logic in try/catch
- Return generic "Terjadi kesalahan server" for unexpected errors
- Log specific errors with `console.error()`
- Validation errors return Zod error details

### State Management
- React `useState` + `useEffect` for client components
- `useCallback` for memoized fetch functions
- No global state library — keep it simple

## Environment Variables

```env
DATABASE_URL=postgresql://...          # Required
IRON_SESSION_PASSWORD=...              # Required, min 32 chars
CLOUDINARY_CLOUD_NAME=...              # Required for image upload
CLOUDINARY_API_KEY=...                 # Required for image upload
CLOUDINARY_API_SECRET=...              # Required for image upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...  # Required for client upload
ADMIN_SEED_PASSWORD=...                # Optional: seed password (auto-generated if not set)
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production start (with auto db push + seed)
npm run lint         # ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Build & Deploy

- **Docker:** Multi-stage Dockerfile (deps → build → runner)
- **Startup:** `scripts/start.ts` auto-runs `prisma db push` + seed if needed
- **Standalone output:** `.next/standalone` for minimal Docker image
- **Node:** 22-slim base image
