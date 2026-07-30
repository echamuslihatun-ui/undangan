# Website Undangan

Sebuah aplikasi undangan pernikahan berbasis Next.js dengan admin panel, manajemen template, user, RSVP, pesan, dan pembayaran.

## Teknologi

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- NextAuth
- `bcryptjs`, `lucide-react`, `framer-motion`, `xlsx`

## Setup

1. Install dependencies

```bash
npm install
```

2. Salin `.env.example` menjadi `.env.local` dan sesuaikan

3. Jalankan migrasi Prisma jika perlu:

```bash
npx prisma migrate dev
```

4. Jalankan aplikasi

```bash
npm run dev
```

## Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build produksi
- `npm start` - Jalankan aplikasi produksi
- `npm run lint` - Jalankan ESLint
- `npm run seed:admin` - Seed akun admin

## Struktur penting

- `src/app` - Halaman aplikasi dan API route Next.js
- `src/components` - Komponen UI
- `src/lib` - Utilitas, auth, prisma, logger, dll.
- `prisma/schema.prisma` - Definisi database

## Catatan

Pastikan file upload dan path `public/uploads` dapat ditulis saat menggunakan fitur upload gambar.
