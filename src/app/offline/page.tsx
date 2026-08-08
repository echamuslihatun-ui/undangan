import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex justify-center">
          <svg
            className="h-20 w-20 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 15a9 9 0 019-9 9 9 0 019 9M3 15a9 9 0 009 9 9 9 0 009-9M3 15h2m14 0h2M12 6v9m0 0l-3-3m3 3l3-3"
            />
          </svg>
        </div>

        <h1 className="font-playfair text-3xl font-semibold text-stone-800">
          Anda Sedang Offline
        </h1>
        <p className="mt-3 text-stone-600">
          Sepertinya koneksi internet terputus. Periksa kembali koneksi Anda,
          lalu coba buka lagi halaman ini.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Coba Buka Beranda
        </Link>
      </div>
    </main>
  );
}