# Event Muda Juara

Platform pendaftaran event, manajemen member, dan pembayaran untuk organisasi Muda Juara.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone) |
| Language | TypeScript (strict mode) |
| React | 19 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | iron-session 8 (admin), iron-session 8 (member) |
| Validation | Zod 4 |
| Upload | Cloudinary (signed) |
| Password | bcryptjs 3 |

## Fitur Utama

### 1. Manajemen Event
- CRUD event dengan slug unik untuk URL publik
- Kategorisasi per Kementerian
- Tipe audiens: Member Only, Umum, Keduanya
- Event berbayar dengan sistem harga tier (Dewasa, Anak, Balita)
- Banner image via Cloudinary

### 2. Pendaftaran Publik
- Form multi-step: No. WA → Data Diri → Peserta → Ringkasan → Pembayaran
- Auto-fill data jika member sudah terdaftar
- Pilih peserta: diri sendiri + tanggungan
- Tambah tanggungan baru saat pendaftaran
- Kode unik pembayaran (Kementerian + Program)

### 3. Sistem Pembayaran
- Kode unik untuk pencocokan transfer
- Upload bukti transfer (Cloudinary)
- Verifikasi oleh SDM/MENKEU
- Status: Belum Bayar → Pending → Terverifikasi

### 4. Sistem Absensi (Check-In)
- QR Code per event (URL unik)
- Peserta scan QR → login → klik "Hadir"
- Admin bisa input manual kode check-in
- Status: Sudah hadir / Belum hadir

### 5. Login Peserta
- Registrasi akun: No. WA + Password + Data Diri
- Login: No. WA + Password
- Lupa password: OTP via WhatsApp (WAHA)
- Lihat riwayat event yang diikuti

### 6. Approval Member
- Member baru status: `PENDING`
- SDM approve → `APPROVED` → bisa daftar event MEMBER_ONLY
- SDM reject → `REJECTED`

### 7. Admin Panel
- Dashboard dengan statistik
- Manajemen Member, Kementerian, Event, Admin Users
- Verifikasi Pembayaran
- Approval Member
- Absensi (Check-In)
- Role-based access (SDM, MENKEU, KEMENTERIAN, BENDAHARA)

## Roles

| Role | Akses |
|------|-------|
| **SDM** | Full access (owner). Kelola semua. |
| **MENKEU** | Lihat semua event, verifikasi pembayaran global. |
| **KEMENTERIAN** | CRUD event + harga tier untuk kementerian sendiri. |
| **BENDAHARA** | Lihat event yang ditugaskan, aksi pembayaran terbatas. |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                 # Admin login, logout, me
│   │   ├── member-auth/          # Member login, register, forgot/reset password
│   │   ├── admin-user/           # CRUD admin users (SDM)
│   │   ├── admin/approve-member/ # Approve/reject member
│   │   ├── cloudinary/           # Signed upload params
│   │   ├── event/                # CRUD events
│   │   │   ├── [id]/harga-tier/  # Harga tier management
│   │   │   ├── [id]/registrasi/  # List registrations
│   │   │   ├── [id]/checkin/     # Check-in endpoint
│   │   │   ├── [id]/qr/          # QR data for event
│   │   │   └── by-slug/[slug]/   # Public event detail
│   │   ├── kementerian/          # CRUD kementerian
│   │   ├── member/               # CRUD members + tanggungan + history
│   │   ├── pembayaran/           # Payment upload + verify
│   │   └── registrasi/           # Public registration
│   ├── admin/                    # Admin panel (auth-protected)
│   │   ├── member-approval/      # SDM approve/reject members
│   │   ├── event/                # Event management + detail + absensi
│   │   ├── member/               # Member management
│   │   ├── kementerian/          # Kementerian management
│   │   ├── pembayaran/           # Payment overview
│   │   └── users/                # Admin user management
│   ├── daftar/                   # Public registration
│   │   └── [eventSlug]/checkin/  # QR check-in page
│   ├── login/
│   │   ├── page.tsx              # Admin login
│   │   └── member/               # Member login + forgot password
│   ├── member/history/           # Member event history
│   └── register/                 # Member registration
├── components/admin/AdminShell.tsx
├── lib/
│   ├── cloudinary.ts
│   ├── hitung-tagihan.ts
│   ├── kode-unik.ts
│   ├── member-session.ts         # Member auth session
│   ├── prisma.ts
│   ├── rate-limit.ts
│   ├── session.ts                # Admin auth session
│   └── validations.ts
└── middleware.ts
```

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL
- Cloudinary account (untuk upload gambar)

### Setup

```bash
# 1. Clone & install
git clone <repo-url>
cd final-event-mj
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL, IRON_SESSION_PASSWORD, Cloudinary keys

# 3. Setup database
npm run db:push

# 4. Seed database (auto-runs if no admin users)
npm run db:seed

# 5. Start development
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/muda_juara?schema=public

# Auth (minimal 32 karakter)
IRON_SESSION_PASSWORD=your-super-secret-password-at-least-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Optional
ADMIN_SEED_PASSWORD=custom-admin-password  # Default: random generated
WAHA_URL=http://localhost:3001             # WhatsApp API for OTP
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Base URL for QR check-in
```

### Default Admin Accounts (Seed)

| Role | Email | Password |
|------|-------|----------|
| SDM | sdm@mudajuara.id | (random generated) |
| MENKEU | menkeu@mudajuara.id | (random generated) |
| KEMENTERIAN | pendidikan@mudajuara.id | (random generated) |
| BENDAHARA | bendahara-rahma@mudajuara.id | (random generated) |

> Password ditampilkan di terminal saat seed berjalan. Atau set `ADMIN_SEED_PASSWORD` di `.env`.

## Halaman & URL

### Publik
| URL | Deskripsi |
|-----|-----------|
| `/login` | Login admin |
| `/login/member` | Login member |
| `/login/member/forgot` | Lupa password member |
| `/register` | Daftar akun member |
| `/daftar/{event-slug}` | Form pendaftaran event |
| `/daftar/{event-slug}/checkin` | Check-in hadir (via QR) |

### Admin (Login Required)
| URL | Deskripsi |
|-----|-----------|
| `/admin` | Dashboard |
| `/admin/member` | Kelola member |
| `/admin/member-approval` | Approval member baru |
| `/admin/kementerian` | Kelola kementerian |
| `/admin/event` | Daftar event |
| `/admin/event/new` | Buat event baru |
| `/admin/event/{id}` | Detail event + peserta + pembayaran + absensi |
| `/admin/pembayaran` | Overview pembayaran |
| `/admin/users` | Kelola admin users |

### Member (Login Required)
| URL | Deskripsi |
|-----|-----------|
| `/member/history` | Riwayat event diikuti |

## API Endpoints

### Public (No Auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/registrasi?eventSlug=X` | Pendaftaran event |
| POST | `/api/pembayaran` | Upload bukti transfer |
| GET | `/api/member/lookup?noWa=X` | Cek data member |
| GET | `/api/event/by-slug/[slug]` | Detail event |
| POST | `/api/cloudinary/sign` | Signature upload |
| POST | `/api/member-auth/register` | Daftar akun member |
| POST | `/api/member-auth/login` | Login member |
| POST | `/api/member-auth/forgot-password` | Minta OTP reset |
| POST | `/api/member-auth/reset-password` | Reset password |

### Admin (Auth Required)
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/auth/me` | Any | Info user login |
| POST | `/api/auth/logout` | Any | Logout |
| GET/POST | `/api/event` | All | List/buat event |
| GET/PATCH/DELETE | `/api/event/[id]` | SDM, KEMENTERIAN | CRUD event |
| GET/POST | `/api/event/[id]/harga-tier` | SDM, KEMENTERIAN | Kelola harga tier |
| GET | `/api/event/[id]/registrasi` | All | Daftar registrasi |
| GET | `/api/event/[id]/qr` | All | Data QR check-in |
| POST | `/api/event/[id]/checkin` | All | Check-in peserta |
| GET/POST | `/api/member` | SDM (create) | Kelola member |
| GET/PATCH | `/api/member/[id]` | SDM | Detail member |
| GET | `/api/member/history` | Member | Riwayat event |
| GET/POST | `/api/kementerian` | SDM | Kelola kementerian |
| GET/POST | `/api/admin-user` | SDM | Kelola admin |
| PATCH/DELETE | `/api/admin-user/[id]` | SDM | Update/hapus admin |
| PATCH | `/api/pembayaran/[id]/verify` | SDM, MENKEU | Verifikasi bayar |
| GET/PATCH | `/api/admin/approve-member` | SDM | Approve/reject member |

## Flow Penggunaan

### Flow Pendaftaran Event
```
1. Buka /daftar/{event-slug}
2. Lihat info event (accordion)
3. Klik "Daftar Sekarang"
4. Masukkan No. WA → sistem cek apakah sudah terdaftar
5. Isi/konfirmasi data diri
6. Pilih peserta (diri sendiri + tanggungan)
7. Ringkasan → Submit
8. Jika berbayar: instruksi transfer + kode unik
9. Upload bukti transfer
10. Tunggu verifikasi
```

### Flow Absensi Hari H
```
1. Admin buka detail event → tab "Absensi"
2. Tampilkan QR URL ke peserta (atau print)
3. Peserta buka /daftar/{slug}/checkin
4. Peserta login (No. WA + Password)
5. Klik "Hadir"
6. Selesai! Status berubah ✓ Hadir
```

### Flow Member Approval
```
1. Orang baru daftar di /register
2. Status: PENDING
3. SDM buka /admin/member-approval
4. Klik "Setujui" atau "Tolak"
5. Jika disetujui: status → APPROVED, role → MEMBER
6. Sekarang bisa daftar event MEMBER_ONLY
```

### Flow Lupa Password
```
1. Buka /login/member/forgot
2. Masukkan No. WA
3. Terima OTP via WhatsApp (6 digit)
4. Masukkan OTP
5. Masukkan password baru
6. Login dengan password baru
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production start (auto db push + seed)
npm run lint         # ESLint
npm run db:push      # Push schema ke database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Buka Prisma Studio
```

## Deployment (Docker)

```bash
# Build & run
docker compose -f docker-compose.easypanel.yml up -d

# Atau manual
docker build -t event-mj .
docker run -p 3000:3000 --env-file .env event-mj
```

## Security Features

- Rate limiting pada endpoint publik
- Session validation di middleware
- CSP headers
- Input validation (Zod)
- Role-based access control
- Admin self-protection (tidak bisa hapus akun sendiri)
- Member approval workflow
- OTP expiration (10 menit)
