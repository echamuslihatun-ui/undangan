# Panduan Membuat Theme Undangan

Folder ini berisi semua **desain (theme)** undangan. Berkat *theme registry*,
menambah desain baru cukup **2 langkah** dan otomatis muncul di dropdown admin
serta dipakai oleh halaman undangan publik.

## Struktur file

| File | Fungsi |
|------|--------|
| `types.ts` | Kontrak data bersama (`WeddingData`) yang diterima setiap theme. |
| `registry.ts` | Daftar semua theme (single source of truth). |
| `ThemeRenderer.tsx` | Memilih & merender komponen theme berdasarkan `themeKey`. |
| `ClassicTheme.tsx`, `ModernTheme.tsx` | Contoh implementasi theme. |

## Cara menambah desain baru

### 1. Buat komponen theme
Salin `ClassicTheme.tsx` sebagai kerangka, lalu ubah namanya. Komponen harus:
- Menerima props `{ wedding: WeddingData }` (impor tipe dari `./types`).
- Meng-export komponen sebagai `default`.

```tsx
"use client";

import type { WeddingData } from "./types";

export default function LuxuryTheme({ wedding }: { wedding: WeddingData }) {
  return (
    <div>
      <h1>{wedding.partner1} & {wedding.partner2}</h1>
      {/* ...desain Anda... */}
    </div>
  );
}
```

### 2. Daftarkan di `registry.ts`
Tambahkan **satu baris** ke array `THEMES`:

```ts
import LuxuryTheme from "./LuxuryTheme";

export const THEMES: ThemeEntry[] = [
  { key: "classic", label: "Classic", component: ClassicTheme },
  { key: "modern",  label: "Modern",  component: ModernTheme },
  { key: "luxury",  label: "Luxury",  component: LuxuryTheme }, // ← baru
];
```

Selesai. Theme baru otomatis:
- muncul di dropdown "Tema" pada halaman **admin/template** (tambah & edit),
- dikenali `ThemeRenderer` saat undangan dibuka publik.

> `key` disimpan sebagai `themeKey` di database — jaga agar **unik & stabil**
> (jangan diubah setelah dipakai template yang sudah ada).

## Field `wedding` yang tersedia

Lihat `types.ts` untuk daftar lengkap. Ringkasannya:

- **Mempelai**: `partner1`, `partner2`, `nickname1`, `nickname2`
- **Orang tua**: `fatherPria`, `motherPria`, `fatherWanita`, `motherWanita`, (lama: `parent1`, `parent2`)
- **Acara**: `akadDate`, `resepsiDate`, `location`, `mapsUrl`
- **Konten**: `message`, `photos`, `musicUrl`
- **Amplop digital**: `bankName`, `bankAccount`, `bankHolder`, `bankAccounts[]`, `qrisImage`

### Catatan normalisasi data
`photos` dan `bankAccounts` bisa datang sebagai **array** atau **string JSON**
dari database. Normalkan seperti contoh di `ClassicTheme.tsx`:

```ts
const photos = Array.isArray(wedding.photos)
  ? wedding.photos
  : (wedding.photos ? JSON.parse(wedding.photos) : []);
```

## Tips
- Gunakan `next/image` untuk gambar (domain sudah dikonfigurasi di `next.config.js`).
- Untuk countdown, pakai komponen `@/components/CountdownTimer`.
- Selalu jalankan `npm run build` setelah menambah theme untuk memastikan tidak ada error tipe.
