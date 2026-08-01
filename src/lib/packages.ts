/**
 * Sumber tunggal (single source of truth) untuk paket berlangganan.
 * Harga dan masa aktif ditentukan di sini, BUKAN dari input client atau
 * dari harga template, supaya tidak bisa dimanipulasi lewat request.
 *
 * Nilai di sini harus sinkron dengan tampilan paket di halaman utama
 * (`src/app/page.tsx`).
 */
export type PackageName = "Basic" | "Premium" | "Exclusive";

export type PackageInfo = {
  name: PackageName;
  /** Harga dalam Rupiah (dikirim ke Midtrans sebagai gross_amount). */
  price: number;
  /** Masa aktif undangan setelah pembayaran lunas, dalam bulan. */
  activeMonths: number;
  description: string;
};

export const PACKAGES: Record<PackageName, PackageInfo> = {
  Basic: {
    name: "Basic",
    price: 150000,
    activeMonths: 3,
    description: "Untuk pernikahan sederhana",
  },
  Premium: {
    name: "Premium",
    price: 250000,
    activeMonths: 6,
    description: "Paling populer untuk acara istimewa",
  },
  Exclusive: {
    name: "Exclusive",
    price: 500000,
    activeMonths: 12,
    description: "Fitur lengkap & prioritas",
  },
};

/** Daftar paket berurutan untuk ditampilkan di UI. */
export const PACKAGE_LIST: PackageInfo[] = [
  PACKAGES.Basic,
  PACKAGES.Premium,
  PACKAGES.Exclusive,
];

/** Paket default bila client tidak mengirim pilihan yang valid. */
export const DEFAULT_PACKAGE: PackageName = "Premium";

/** true bila string merupakan nama paket yang valid. */
export function isValidPackage(name: unknown): name is PackageName {
  return typeof name === "string" && name in PACKAGES;
}

/** Ambil info paket; fallback ke paket default bila tidak valid. */
export function getPackage(name: unknown): PackageInfo {
  return isValidPackage(name) ? PACKAGES[name] : PACKAGES[DEFAULT_PACKAGE];
}
