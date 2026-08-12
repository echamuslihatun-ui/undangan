/**
 * Kontrak data bersama untuk SEMUA theme undangan.
 * Setiap komponen theme menerima objek `wedding` bertipe `WeddingData` ini,
 * sehingga cukup satu tempat bila ada penambahan/perubahan field.
 */
export type BankAccount = { bank: string; account: string; holder: string };

/** Parse array JSON defensively so corrupt legacy data never crashes a theme. */
export function themeArray<T>(value: T[] | string | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Satu item timeline "Cerita Cinta".
 * `month` + `year` adalah format baru (mis. "Januari" / "2023").
 * `date` dipertahankan sebagai fallback untuk data lama yang sudah tersimpan.
 */
export type StoryItem = {
  month?: string;
  year?: string;
  date?: string;
  title: string;
  description: string;
};

/** Label periode sebuah item cerita: "Januari 2023", jatuh kembali ke `date`. */
export function storyPeriod(item: StoryItem): string {
  const period = [item.month, item.year].filter(Boolean).join(" ").trim();
  return period || item.date || "";
}

export type WeddingData = {
  partner1: string;
  partner2: string;
  nickname1?: string | null;
  nickname2?: string | null;
  parent1?: string | null;
  parent2?: string | null;
  fatherPria?: string | null;
  motherPria?: string | null;
  fatherWanita?: string | null;
  motherWanita?: string | null;
  // ===== Acara =====
  // Jam berformat "HH:mm". Venue/maps per-acara lebih diutamakan theme,
  // dengan `location`/`mapsUrl` sebagai fallback data lama.
  akadDate?: string | null;
  akadStart?: string | null;
  akadEnd?: string | null;
  akadVenue?: string | null;
  akadMapsUrl?: string | null;
  resepsiDate?: string | null;
  resepsiStart?: string | null;
  resepsiEnd?: string | null;
  resepsiVenue?: string | null;
  resepsiMapsUrl?: string | null;
  location?: string | null;
  mapsUrl?: string | null;
  message?: string | null;
  quote?: string | null;
  quoteSource?: string | null;
  // ===== Media =====
  heroImage?: string | null;
  quoteImage?: string | null;
  photoPria?: string | null;
  photoWanita?: string | null;
  instagram1?: string | null;
  instagram2?: string | null;
  storyEnabled?: boolean | null;
  // `story` bisa datang sebagai array atau string JSON dari DB.
  story?: StoryItem[] | string | null;
  // `photos` & `bankAccounts` bisa datang sebagai array atau string JSON dari DB;
  // theme bertanggung jawab menormalkannya (lihat ClassicTheme sebagai contoh).
  photos?: string[] | string | null;
  musicUrl?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  bankAccounts?: BankAccount[] | string | null;
  qrisImage?: string | null;
  liveStreamUrl?: string | null;
  themeKey?: string;
};

/** Props standar yang diterima setiap komponen theme. */
export type ThemeComponentProps = { wedding: WeddingData };
