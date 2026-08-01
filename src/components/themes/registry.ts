/**
 * Registry theme undangan — SATU sumber kebenaran untuk semua desain.
 *
 * Untuk menambah desain baru:
 *   1. Buat komponen di `src/components/themes/NamaTheme.tsx`
 *      (props: `{ wedding: WeddingData }`, lihat `types.ts`).
 *   2. Tambahkan SATU entri ke array `THEMES` di bawah.
 *
 * `ThemeRenderer` dan dropdown di halaman admin membaca daftar ini secara
 * otomatis, jadi tidak perlu mengubah file lain lagi.
 */
import type { ComponentType } from "react";
import ClassicTheme from "./ClassicTheme";
import ModernTheme from "./ModernTheme";
import type { ThemeComponentProps } from "./types";

export type ThemeEntry = {
  /** Nilai yang disimpan sebagai `themeKey` di database. Harus unik & stabil. */
  key: string;
  /** Nama yang ditampilkan di dropdown admin. */
  label: string;
  /** Komponen React yang merender undangan. */
  component: ComponentType<ThemeComponentProps>;
};

export const THEMES: ThemeEntry[] = [
  { key: "classic", label: "Classic", component: ClassicTheme },
  { key: "modern", label: "Modern", component: ModernTheme },
];

/** Peta cepat key → entri, untuk lookup di renderer. */
export const THEME_MAP: Record<string, ThemeEntry> = Object.fromEntries(
  THEMES.map((t) => [t.key, t])
);

/** Theme default bila `themeKey` kosong atau tidak dikenali. */
export const DEFAULT_THEME_KEY = "classic";

/** Ambil entri theme; fallback ke default bila key tidak dikenali. */
export function getTheme(key: string | undefined | null): ThemeEntry {
  return (key && THEME_MAP[key]) || THEME_MAP[DEFAULT_THEME_KEY];
}
