/**
 * Kontrak data bersama untuk SEMUA theme undangan.
 * Setiap komponen theme menerima objek `wedding` bertipe `WeddingData` ini,
 * sehingga cukup satu tempat bila ada penambahan/perubahan field.
 */
export type BankAccount = { bank: string; account: string; holder: string };

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
  akadDate?: string | null;
  resepsiDate?: string | null;
  location?: string | null;
  mapsUrl?: string | null;
  message?: string | null;
  // `photos` & `bankAccounts` bisa datang sebagai array atau string JSON dari DB;
  // theme bertanggung jawab menormalkannya (lihat ClassicTheme sebagai contoh).
  photos?: string[] | string | null;
  musicUrl?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  bankAccounts?: BankAccount[] | string | null;
  qrisImage?: string | null;
  themeKey?: string;
};

/** Props standar yang diterima setiap komponen theme. */
export type ThemeComponentProps = { wedding: WeddingData };
