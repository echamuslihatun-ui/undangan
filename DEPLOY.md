# Deploy ke Vercel (via GitHub)

Panduan deploy aplikasi Undanganku ke Vercel dengan **Vercel Postgres** dan **Cloudinary**.
Deploy berjalan otomatis setiap kali ada push ke branch `main`.

---

## 1. Import repository ke Vercel

1. Buka https://vercel.com → **Add New → Project**.
2. Pilih repo GitHub `echamuslihatun-ui/undangan`.
3. Framework otomatis terdeteksi sebagai **Next.js**. Jangan deploy dulu — set dulu database & env di bawah.

---

## 2. Buat Vercel Postgres

1. Di project Vercel → tab **Storage → Create Database → Postgres**.
2. Setelah dibuat, Vercel otomatis menambahkan beberapa env (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, dll).
3. Pemetaan yang dipakai aplikasi ini:
   - `DATABASE_URL`  → salin dari **`POSTGRES_PRISMA_URL`** (pooled, untuk runtime)
   - `DIRECT_URL`    → salin dari **`POSTGRES_URL_NON_POOLING`** (non-pooled, untuk migrasi)

---

## 3. Set Environment Variables

Di **Project → Settings → Environment Variables**, isi semua berikut (scope: Production + Preview):

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | = `POSTGRES_PRISMA_URL` dari Vercel Postgres |
| `DIRECT_URL` | = `POSTGRES_URL_NON_POOLING` dari Vercel Postgres |
| `NEXTAUTH_URL` | Domain produksi, mis. `https://undangan.vercel.app` |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
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

Buat file `.env.local` berisi `DATABASE_URL` dan `DIRECT_URL` yang menunjuk ke Vercel Postgres,
lalu jalankan:

```bash
# Sinkronkan skema Prisma ke Postgres
npx prisma db push

# Buat akun admin awal
npm run seed:admin
```

> Catatan: folder `prisma/migrations/` di-`.gitignore`, jadi kita memakai `prisma db push`
> (bukan `prisma migrate deploy`). Kalau nanti butuh migrasi berversi, hapus baris
> `prisma/migrations/` dari `.gitignore` dan pakai `prisma migrate`.

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
- Upload file sekarang ke Cloudinary (folder `undangan`), bukan ke filesystem lokal —
  karena filesystem Vercel bersifat read-only & ephemeral.
- Domain gambar Cloudinary (`res.cloudinary.com`) sudah diizinkan di `next.config.js`.
