"use client";

/**
 * Halaman preview telanjang (tanpa sidebar/navbar dashboard) yang dimuat
 * di dalam <iframe> oleh /dashboard/preview.
 *
 * Alasannya: beberapa tema (mis. Elegant) memakai `position: fixed` serta
 * satuan `vh`/`vw` yang selalu mengacu ke viewport browser. Kalau tema
 * dirender langsung di dalam kotak preview, elemen seperti progress bar,
 * tombol musik, dan lightbox akan lepas dari kotak tersebut. Dengan iframe,
 * viewport-nya adalah iframe itu sendiri sehingga simulasi perangkat akurat.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ThemeRenderer from "@/components/themes/ThemeRenderer";
import type { WeddingData } from "@/components/themes/types";

function PreviewFrameContent() {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [themeKey, setThemeKey] = useState(themeParam || "classic");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/wedding");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setWedding(data);
        // Query param menang supaya ganti tema di dashboard langsung terlihat.
        if (!themeParam && data?.themeKey) setThemeKey(data.themeKey);
      } catch {
        // Preview bersifat non-kritis; biarkan pesan kosong yang tampil.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [themeParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        Memuat preview...
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-gray-400">
        Data undangan belum tersedia.
      </div>
    );
  }

  return <ThemeRenderer themeKey={themeKey} wedding={wedding} />;
}

// useSearchParams wajib berada di bawah Suspense agar build Next.js lolos.
export default function PreviewFramePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
          Memuat preview...
        </div>
      }
    >
      <PreviewFrameContent />
    </Suspense>
  );
}
