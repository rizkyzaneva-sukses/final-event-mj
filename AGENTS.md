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
├── app/
│   ├── api/
│   │   ├── auth/                 # Admin: login, logout, me
│   │   ├── member-auth/          # Member: login, register, logout, me, forgot-password, reset-password
│   │   ├── admin-user/           # CRUD admin users (SDM)
│   │   ├── admin/approve-member/ # Approve/reject member
│   │   ├── cloudinary/           # Signed upload params
│   │   ├── event/
│   │   │   ├── route.ts          # List/create events
│   │   │   ├── [id]/route.ts     # Get/update/delete event
│   │   │   ├── [id]/harga-tier/  # Harga tier management
│   │   │   ├── [id]/registrasi/  # List registrations
│   │   │   ├── [id]/checkin/     # POST: check-in by code
│   │   │   ├── [id]/qr/          # GET: QR data + stats
│   │   │   └── by-slug/[slug]/   # Public event detail
│   │   ├── kementerian/          # CRUD kementerian
│   │   ├── member/
│   │   │   ├── route.ts          # List/create members
│   │   │   ├── lookup/route.ts   # Public: member lookup by phone
│   │   │   ├── history/route.ts  # Member: registration history
│   │   │   └── [id]/route.ts     # Get/update member
│   │   │   └── [id]/tanggungan/  # Tanggungan management
│   │   ├── pembayaran/           # Payment upload + verify
│   │   └── registrasi/           # Public registration
│   ├── admin/                    # Admin panel (auth-protected)
│   │   ├── layout.tsx            # Server: getAuthUser() + redirect
│   │   ├── page.tsx              # Dashboard
│   │   ├── member/page.tsx       # Member list
│   │   ├── member-approval/      # SDM: approve/reject members
│   │   ├── kementerian/          # Kementerian management
│   │   ├── event/                # Event list + create + detail + absensi
│   │   ├── pembayaran/           # Payment overview
│   │   └── users/                # Admin user management
│   ├── daftar/[eventSlug]/       # Public registration form
│   │   └── checkin/              # QR check-in page
│   ├── login/
│   │   ├── page.tsx              # Admin login
│   │   └── member/               # Member login + forgot password
│   ├── member/history/           # Member event history
│   └── register/                 # Member registration
├── components/admin/AdminShell.tsx
├── lib/
│   ├── cloudinary.ts             # Cloudinary helpers
│   ├── hitung-tagihan.ts         # Billing calculation
│   ├── kode-unik.ts              # Payment code generator
│   ├── member-session.ts         # Member auth session
│   ├── prisma.ts                 # Prisma client singleton
│   ├── rate-limit.ts             # In-memory rate limiter
│   ├── session.ts                # Admin auth session
│   └── validations.ts            # Zod schemas
├── generated/                    # Prisma generated client (do not edit)
└── middleware.ts                  # Route protection
```

## Architecture Patterns

### Dual Auth System
- **Admin auth:** `src/lib/session.ts` → cookie `event-mj-session`
- **Member auth:** `src/lib/member-session.ts` → cookie `member-session`
- Both use iron-session with same `IRON_SESSION_PASSWORD`

### Roles (RoleAdmin enum)
- **SDM** — Full access (owner). Can manage members, kementerian, events, users, payments, approvals.
- **MENKEU** — View all events, verify payments globally.
- **KEMENTERIAN** — CRUD events + harga tiers for their own kementerian only.
- **BENDAHARA** — View assigned events, limited payment actions.

### Member Approval Flow
```
Register → PENDING → SDM Approve → APPROVED (statusKeanggotaan: MEMBER)
                                → REJECTED
```
- MEMBER_ONLY events require `statusApproval: "APPROVED"`
- Non-approved members get error: "Akun member Anda belum disetujui"

### QR Check-In Flow
```
Admin: /admin/event/{id} → tab Absensi → lihat QR URL
Peserta: /daftar/{slug}/checkin → login → klik "Hadir"
```
- Check-in uses `checkinCode` (UUID) stored in `Registrasi` model
- Admin can also input code manually

### Registration Flow
```
1. Input No. WA → lookup member
2. Auto-fill if exists, new if not
3. Enforce tipeAudiens (MEMBER_ONLY check)
4. Enforce member approval status
5. Create registrasi + checkinCode
6. If berbayar: calculate tagihan + create pembayaran
```

### Rate Limiting
- `src/lib/rate-limit.ts` — in-memory, per-IP
- login: 5/15min, registration: 5/min, payment: 3/min, cloudinary: 10/min

### Data Validation
- All inputs validated with Zod schemas from `src/lib/validations.ts`
- Phone normalized to `628xxx` format

## Security Rules

1. **No XSS:** Never use `dangerouslySetInnerHTML`. Use `whiteSpace: "pre-line"`.
2. **Auth on all protected routes:** Every admin API route MUST call `getAuthUser()`.
3. **Role checks:** KEMENTERIAN only access their own kementerian data.
4. **Rate limiting:** Apply to all public endpoints.
5. **Input validation:** Zod on every endpoint.
6. **No secrets in code:** Environment variables only.
7. **Session validation:** Middleware validates iron-session integrity.
8. **CSP headers:** Configured in `next.config.ts`.
9. **Member lookup minimization:** Public endpoints return minimal data.
10. **Admin self-protection:** Cannot delete own account.
11. **Member approval:** MEMBER_ONLY events enforce approval status.

## API Reference

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/registrasi?eventSlug=X` | Registration |
| POST | `/api/pembayaran` | Upload payment proof |
| GET | `/api/member/lookup?noWa=X` | Member lookup |
| GET | `/api/event/by-slug/[slug]` | Event detail |
| POST | `/api/cloudinary/sign` | Upload signature |
| POST | `/api/member-auth/register` | Member registration |
| POST | `/api/member-auth/login` | Member login |
| POST | `/api/member-auth/forgot-password` | Request OTP |
| POST | `/api/member-auth/reset-password` | Reset password |

### Admin Endpoints
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/auth/me` | Any | Current user |
| POST | `/api/auth/logout` | Any | Logout |
| GET/POST | `/api/event` | All (filtered) | Events |
| GET/PATCH/DELETE | `/api/event/[id]` | SDM, KEMENTERIAN | Event CRUD |
| GET/POST | `/api/event/[id]/harga-tier` | SDM, KEMENTERIAN | Harga tiers |
| GET | `/api/event/[id]/registrasi` | Any | Registrations |
| GET | `/api/event/[id]/qr` | Any | QR data |
| POST | `/api/event/[id]/checkin` | Any | Check-in |
| GET/POST | `/api/member` | SDM (create) | Members |
| GET/PATCH | `/api/member/[id]` | SDM | Member detail |
| GET/POST | `/api/kementerian` | SDM | Kementerian |
| GET/POST | `/api/admin-user` | SDM | Admin users |
| PATCH/DELETE | `/api/admin-user/[id]` | SDM | Admin CRUD |
| PATCH | `/api/pembayaran/[id]/verify` | SDM, MENKEU | Verify payment |
| GET/PATCH | `/api/admin/approve-member` | SDM | Member approval |

### Member Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/member-auth/me` | Current member |
| POST | `/api/member-auth/logout` | Logout |
| GET | `/api/member/history` | Registration history |

## Environment Variables

```env
DATABASE_URL=postgresql://...          # Required
IRON_SESSION_PASSWORD=...              # Required, min 32 chars
CLOUDINARY_CLOUD_NAME=...              # Required
CLOUDINARY_API_KEY=...                 # Required
CLOUDINARY_API_SECRET=...              # Required
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...  # Required
ADMIN_SEED_PASSWORD=...                # Optional (random if not set)
WAHA_URL=...                           # Optional (WhatsApp API for OTP)
NEXT_PUBLIC_BASE_URL=...               # Optional (default: http://localhost:3000)
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production start (auto db push + seed)
npm run lint         # ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Prisma Studio
```
