# Deploy ke Vercel (via GitHub)

Panduan deploy aplikasi Undanganku ke Vercel dengan **Supabase Postgres** dan **Cloudinary**.
Deploy berjalan otomatis setiap kali ada push ke branch `main`.

---

## 1. Import repository ke Vercel

1. Buka https://vercel.com → **Add New → Project**.
2. Pilih repo GitHub `echamuslihatun-ui/undangan`.
3. Framework otomatis terdeteksi sebagai **Next.js**. Jangan deploy dulu — siapkan dulu database & env di bawah.

---

## 2. Siapkan Supabase Postgres

1. Buka https://supabase.com → **New project**. Catat **database password** yang dibuat di
   langkah ini; password hanya ditampilkan sekali. Kalau lupa, reset di
   **Project Settings → Database → Reset database password**.
2. Buka **Project Settings → Database → Connection string**. Supabase menyediakan
   beberapa mode koneksi — aplikasi ini butuh dua di antaranya:

| Mode | Port | Dipakai untuk | Env var |
|---|---|---|---|
| Transaction pooler | `6543` | runtime serverless (query aplikasi) | `DATABASE_URL` |
| Session pooler | `5432` | `prisma db push` / `prisma migrate` | `DIRECT_URL` |
| Direct connection | `5432` | alternatif `DIRECT_URL`, **IPv6-only** | — |

3. Bentuk akhir kedua connection string:

```
DATABASE_URL="postgresql://postgres.<ref>:<PASSWORD>@<host>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<ref>:<PASSWORD>@<host>.pooler.supabase.com:5432/postgres"
```

> Nama host dan label di dashboard Supabase pernah berubah beberapa kali. Cara paling aman:
> copy string yang ditampilkan dashboard, lalu cocokkan berdasarkan **port** — `6543` untuk
> `DATABASE_URL`, `5432` untuk `DIRECT_URL`.

### Tiga hal yang sering bikin gagal

- **`?pgbouncer=true` wajib** pada `DATABASE_URL`. Transaction pooler tidak mendukung
  prepared statements; tanpa flag ini Prisma akan error acak
  `prepared statement "s0" already exists`.
- **`connection_limit=1`** disarankan untuk serverless. Tiap instance function punya pool
  sendiri, jadi pool besar cepat menghabiskan kuota koneksi Postgres.
- **Hindari mode Direct connection untuk `DIRECT_URL`** kalau dijalankan dari jaringan IPv4.
  Supabase memindahkan direct connection ke IPv6-only, sehingga sering timeout dari laptop
  biasa. Pakai Session pooler (port `5432`).

---

## 3. Set Environment Variables

Di **Project → Settings → Environment Variables**, isi semua berikut (scope: Production + Preview):

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler, port `6543`, `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase session pooler, port `5432` |
| `NEXTAUTH_URL` | Domain produksi, mis. `https://undangan.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `RESEND_API_KEY` | API key Resend untuk email transaksional |
| `EMAIL_FROM` | Pengirim pada domain yang sudah diverifikasi di Resend |
| `GOOGLE_CLIENT_ID` | Dari Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Dari Google Cloud Console |
| `MIDTRANS_SERVER_KEY` | Dari dashboard Midtrans |
| `MIDTRANS_CLIENT_KEY` | Dari dashboard Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `true` (produksi) / `false` (sandbox) |
| `CLOUDINARY_CLOUD_NAME` | Dari dashboard Cloudinary |
| `CLOUDINARY_API_KEY` | Dari dashboard Cloudinary |
| `CLOUDINARY_API_SECRET` | Dari dashboard Cloudinary |

---

## 4. Siapkan skema database (jalankan sekali dari lokal)

Vercel **tidak** menjalankan migrasi otomatis, jadi tabel harus dibuat manual sekali.
Buat file `.env.local` berisi `DATABASE_URL` dan `DIRECT_URL` yang menunjuk ke Supabase,
lalu jalankan:

```bash
# Sinkronkan skema Prisma ke Postgres
npx prisma db push

# Buat akun admin awal
npm run seed:admin
```

`RESEND_API_KEY` dan `EMAIL_FROM` diperlukan untuk verifikasi akun credentials
serta reset password. Verifikasi domain pengirim di dashboard Resend terlebih
dahulu. Jalankan `npx prisma db push` (atau migrasi Prisma pada pipeline Anda)
sebelum deployment agar tabel `AuthToken` dan kolom `User.authVersion` tersedia.

> Catatan: folder `prisma/migrations/` di-`.gitignore`, jadi kita memakai `prisma db push`
> (bukan `prisma migrate deploy`). Konsekuensinya, setiap perubahan schema harus di-`db push`
> manual ke produksi dan tidak tercatat versinya. Begitu ada data pengguna sungguhan,
> sebaiknya pindah ke `prisma migrate`: hapus baris `prisma/migrations/` dari `.gitignore`,
> commit folder migrasi, dan ubah build script menjadi
> `prisma migrate deploy && prisma generate && next build`.

---

## 5. Update callback layanan eksternal (setelah domain diketahui)

**Google OAuth** — di Google Cloud Console → Credentials → OAuth client:
- Authorized redirect URI: `https://<domain>/api/auth/callback/google`

**Midtrans** — di dashboard Midtrans → Settings → Configuration:
- Payment Notification URL: `https://<domain>/api/orders/webhook`
- Finish/Redirect URL: `https://<domain>/dashboard/pembayaran`

---

## 6. Deploy

- Push ke `main` → Vercel build otomatis (`prisma generate && next build`).
- Verifikasi: buka domain, coba login Google, upload gambar (masuk ke Cloudinary),
  dan alur pembayaran Midtrans.

---

## Catatan teknis

- Build script sudah menjalankan `prisma generate` (`build` + `postinstall`) agar Prisma Client
  tidak basi saat Vercel meng-cache `node_modules`.
- Upload file ke Cloudinary (folder `undangan`), bukan ke filesystem lokal — karena filesystem
  Vercel bersifat read-only & ephemeral. Supabase Storage bisa menggantikan Cloudinary, tapi
  itu berarti menulis ulang `src/app/api/upload/route.ts` dan menambah domain baru di
  `next.config.js`; setup Cloudinary yang sekarang sudah berfungsi.
- Domain gambar Cloudinary (`res.cloudinary.com`) sudah diizinkan di `next.config.js`.
- Aplikasi hanya memakai Supabase sebagai Postgres biasa lewat Prisma — tidak memakai
  Supabase Auth (autentikasi ditangani NextAuth) maupun Row Level Security.

---

## Troubleshooting: Login Google gagal di Vercel

Gejala umum: klik "Login dengan Google" → balik lagi ke halaman login (atau
`/api/auth/error`), dan di log Vercel `GET /api/auth/callback/google` merespons
**302**.

> Catatan penting: status **302 pada callback itu NORMAL**. NextAuth selalu
> redirect setelah callback — entah ke `/dashboard` (sukses) atau ke halaman
> error (gagal). Jadi 302 sendiri bukan bukti error. Yang perlu dicek adalah
> **tujuan redirect** (`Location`) dan **isi log**.

Tanda callback GAGAL sebelum tukar token: durasi function sangat singkat
(mis. ~50ms) dan **tidak ada outgoing request** ke Google di panel Vercel.
Ini ciri khas **cookie `state` mismatch**, hampir selalu karena `NEXTAUTH_URL`
salah.

Cek berurutan dari yang paling sering:

1. **`NEXTAUTH_URL` di Environment Variables Vercel** harus sama persis dengan
   domain yang dipakai user, termasuk skema `https://` dan tanpa trailing slash,
   mis. `https://undangan-one-jade.vercel.app`. Kalau kosong atau masih
   `http://localhost:3000`, cookie state tidak cocok → login gagal.
2. **`NEXTAUTH_SECRET` harus terisi** di Vercel (wajib di production). Kalau
   kosong, sesi/JWT tidak bisa dienkripsi.
3. **Authorized redirect URI di Google Cloud Console** harus memuat persis:
   `https://<domain>/api/auth/callback/google`
   dan Authorized JavaScript origins: `https://<domain>`.
4. **Skema database sudah di-`prisma db push` ke Supabase.** Karena memakai
   `PrismaAdapter`, login Google menulis ke tabel `User`, `Account`, `Session`.
   Bila tabel belum ada, adapter melempar error dan login gagal.
5. **Env var Google benar & tidak tertukar** (`GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`), untuk OAuth client yang sama dengan redirect URI di
   atas.

Setiap perubahan Environment Variables **butuh redeploy** agar berlaku.

Aplikasi ini menulis error internal NextAuth ke log Vercel (lihat konfigurasi
`logger` di `src/lib/auth.ts`), jadi periksa **Vercel → Deployment → Functions →
Logs** untuk pesan `NextAuth error` yang menyertakan `code` (mis.
`OAUTH_CALLBACK_ERROR`, `OAUTH_CALLBACK_HANDLER_ERROR`) sebagai petunjuk pasti.
