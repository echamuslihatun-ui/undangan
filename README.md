# Website Undangan (Undanganku)

Sebuah aplikasi undangan pernikahan digital berbasis Next.js dengan admin panel, manajemen tamu, RSVP, buku tamu, pembayaran Midtrans, tema, dan dukungan PWA.

---

## Fitur

| Fitur | Keterangan |
|-------|------------|
| 🎨 **Tema Undangan** | Classic, Modern, Elegant — mudah dikustomisasi |
| 👥 **Manajemen Tamu** | Import CSV, undangan personalized per tamu, tracking status |
| 💌 **RSVP Online** | Konfirmasi kehadiran + jumlah tamu + pesan |
| 📖 **Buku Tamu** | Pesan dari tamu dengan moderasi (approval) |
| 💳 **Pembayaran** | Midtrans Snap (QRIS, Transfer, E-Wallet) + webhook + notifikasi email |
| 📧 **Email Transaksional** | Verifikasi akun, reset password, notifikasi pembayaran & RSVP via Resend |
| 🔐 **Autentikasi** | Email/password + Google OAuth, proteksi role (admin/customer), suspend akun |
| 🛡️ **Keamanan** | Rate limiting, validasi input, anti-spoofing IP, hash token SHA-256 |
| 📱 **PWA** | Manifest, Service Worker, halaman offline — bisa di-install ke home screen |
| 🖼️ **Upload Gambar** | Cloudinary (bukan filesystem lokal) |
| 📊 **JSONB Storage** | Story, foto, rekening bank disimpan sebagai JSONB asli PostgreSQL |

---

## Teknologi

- **Next.js 16** (App Router)
- TypeScript 5.4
- Tailwind CSS 3
- Prisma ORM 5 + PostgreSQL
- NextAuth.js 4 (JWT, Google OAuth, Credentials)
- Midtrans Snap (Payment Gateway)
- Resend (Transactional Email)
- Cloudinary (Image Storage)
- `bcryptjs`, `lucide-react`, `framer-motion`, `clsx`, `tailwind-merge`

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/echamuslihatun-ui/undangan.git
cd undangan
npm install
```

### 2. Environment variables

Salin `.env.example` menjadi `.env.local` dan isi semua variabel:

```bash
cp .env.example .env.local
```

Variabel yang wajib diisi:
- `DATABASE_URL` & `DIRECT_URL` — koneksi PostgreSQL (Supabase/Neon/Vercel Postgres)
- `NEXTAUTH_SECRET` — generate dengan `openssl rand -base64 32`
- `RESEND_API_KEY` & `EMAIL_FROM` — untuk verifikasi email & notifikasi
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` — untuk login Google
- `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` — untuk pembayaran
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — untuk upload gambar

> Di development, email verifikasi/reset password dicetak ke log server (console) jika `RESEND_API_KEY` tidak dikonfigurasi.

### 3. Sinkronkan database

```bash
npx prisma db push
```

Proyek ini menggunakan `prisma db push` (bukan `prisma migrate`) karena folder `prisma/migrations/` di-`.gitignore`. Untuk production, lihat [DEPLOY.md](./DEPLOY.md).

### 4. Seed akun admin (opsional)

```bash
npm run seed:admin
```

### 5. Jalankan development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Kegunaan |
|--------|----------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build produksi (`prisma generate && next build`) |
| `npm start` | Jalankan aplikasi produksi |
| `npm run lint` | Jalankan ESLint |
| `npm test` | Jalankan unit test (14 tes) |
| `npm run db:check` | Periksa apakah schema database sudah sinkron |
| `npm run db:sync` | Sinkronkan schema ke database (`prisma db push`) |
| `npm run migrate:jsonb` | Migrasi data dari kolom JSON ke JSONB |
| `npm run seed:admin` | Seed akun admin |

---

## Struktur Direktori

```
├── prisma/
│   └── schema.prisma          # Definisi database
├── public/
│   ├── sw.js                  # Service Worker (PWA)
│   ├── icon.svg               # Ikon aplikasi (PWA)
│   └── manifest.ts            # Manifest PWA
├── src/
│   ├── app/
│   │   ├── api/               # API Route (Next.js)
│   │   │   ├── auth/          #   Autentikasi (register, login, verify, reset)
│   │   │   ├── guests/        #   CRUD tamu
│   │   │   ├── orders/        #   Pembayaran & webhook Midtrans
│   │   │   ├── rsvp/          #   RSVP
│   │   │   ├── messages/      #   Buku tamu
│   │   │   ├── photos/        #   Upload foto
│   │   │   ├── wedding/       #   Data undangan
│   │   │   ├── templates/     #   Template tema
│   │   │   ├── upload/        #   Upload ke Cloudinary
│   │   │   └── profile/       #   Profil pengguna
│   │   ├── public/weddings/   # Halaman undangan publik (per slug)
│   │   ├── dashboard/         # Dashboard customer
│   │   ├── admin/             # Dashboard admin
│   │   ├── login/             # Halaman login
│   │   ├── register/          # Halaman registrasi
│   │   ├── forgot-password/   # Lupa password
│   │   ├── reset-password/    # Reset password
│   │   ├── verify-email/      # Verifikasi email
│   │   ├── rsvp/              # Halaman RSVP publik
│   │   └── offline/           # Halaman offline PWA
│   ├── components/
│   │   ├── themes/            # Komponen tema undangan (Classic, Modern, Elegant)
│   │   └── ...                # Komponen UI lainnya
│   ├── lib/
│   │   ├── auth.ts            # Konfigurasi NextAuth
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── email.ts           # Email transaksional (Resend)
│   │   ├── midtrans.ts        # Midtrans Snap
│   │   ├── rate-limit.ts      # Rate limiter
│   │   ├── input.ts           # Validasi input
│   │   ├── csv.ts             # Export CSV tamu
│   │   ├── account-security.ts # Normalisasi email, hash token
│   │   ├── env.ts             # Validasi environment variables
│   │   ├── packages.ts        # Paket harga
│   │   └── logger.ts          # Logger
│   ├── types/
│   │   └── next-auth.d.ts     # Type augmentation NextAuth
│   └── middleware.ts           # Proteksi route dashboard/admin
└── tests/
    ├── account-security.test.ts  # Test keamanan akun
    └── input-rate-limit.test.ts  # Test validasi input & rate limit
```

---

## Keamanan

- **Rate Limiting**: Setiap endpoint publik dibatasi per IP (mis. 5 percobaan login per menit)
- **Hash Token**: Token autentikasi disimpan dalam bentuk SHA-256, tidak pernah sebagai plaintext
- **Anti-Spoofing IP**: Mengambil IP paling kanan dari `x-forwarded-for` (paling terpercaya)
- **Validasi Input**: Normalisasi email, sanitasi HTML, validasi URL Instagram
- **Auth Version**: Mekanisme mencabut semua JWT pengguna dengan menaikkan `authVersion`
- **Middleware**: Proteksi route dashboard/admin + redirect berdasarkan role + suspend handling
- **CORS**: Hanya domain yang diizinkan bisa mengakses API

---

## PWA (Progressive Web App)

Aplikasi ini dapat di-install ke home screen perangkat mobile/desktop:

- **Manifest**: `src/app/manifest.ts` — nama, ikon, theme color
- **Service Worker**: `public/sw.js` — cache halaman offline
- **Halaman Offline**: `src/app/offline/page.tsx` — tampilan saat tidak ada koneksi
- **Registrasi**: `src/components/ServiceWorkerRegister.tsx` — auto-register di layout

---

## Deployment

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan deploy ke Vercel dengan Supabase Postgres dan Cloudinary.

---

## Catatan

- Upload gambar menggunakan **Cloudinary** (bukan filesystem lokal) karena Vercel bersifat read-only & ephemeral
- Domain `res.cloudinary.com` sudah diizinkan di `next.config.js`
- Tabel database dibuat via `prisma db push` — folder `prisma/migrations/` di-`.gitignore`
- Pastikan `DIRECT_URL` menggunakan session pooler (port 5432), bukan direct connection (IPv6-only)