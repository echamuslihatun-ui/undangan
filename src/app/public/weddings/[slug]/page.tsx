"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ThemeRenderer from "@/components/themes/ThemeRenderer";
import RSVPSection from "@/components/RSVPSection";

type Wedding = {
  id: string;
  partner1: string;
  partner2: string;
  parent1: string | null;
  parent2: string | null;
  fatherPria?: string | null;
  motherPria?: string | null;
  fatherWanita?: string | null;
  motherWanita?: string | null;
  akadDate: string | null;
  resepsiDate: string | null;
  location: string | null;
  mapsUrl: string | null;
  message: string | null;
  photos?: string[] | null;
  musicUrl?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  bankAccounts?: Array<{ bank: string; account: string; holder: string }> | null;
  qrisImage?: string | null;
  themeKey?: string;
};

function PublicWeddingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  // `useParams()` mengembalikan nilai yang SUDAH ter-decode. Untuk menghindari
  // double-encode pada slug lama yang mungkin sempat mengandung karakter
  // ter-encode (mis. "%26"), decode dulu secara aman sebelum dipakai.
  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const slug = safeDecode(params.slug as string);
  const guestSlug = searchParams.get("to");

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Undangan bersifat pribadi: hanya bisa dibuka lewat tautan tamu (?to=<slug>)
  // yang valid DAN milik undangan ini. Ini mencegah spam RSVP oleh sembarang orang.
  const [invalidAccess, setInvalidAccess] = useState(false);

  useEffect(() => {
    async function fetchWedding() {
      try {
        // Tanpa parameter `?to=`, akses langsung ditolak.
        if (!guestSlug) {
          setInvalidAccess(true);
          return;
        }

        const res = await fetch(`/api/public/weddings/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setError(true);
          return;
        }

        const data = await res.json();

        // Verifikasi tamu valid dan benar-benar milik undangan ini.
        const guestRes = await fetch(
          `/api/guests/${encodeURIComponent(guestSlug)}?weddingId=${encodeURIComponent(data.id)}`
        );
        if (!guestRes.ok) {
          setInvalidAccess(true);
          return;
        }

        const guestData = await guestRes.json();
        setWedding(data);
        setGuestInfo({ name: guestData.name, phone: guestData.phone });
      } catch (error) {
        console.error("Failed to fetch wedding:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchWedding();
  }, [slug, guestSlug]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  if (invalidAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold">Tautan Undangan Tidak Valid</h1>
          <p className="text-muted-foreground">
            Undangan ini bersifat pribadi dan hanya dapat dibuka melalui tautan
            khusus yang dikirimkan kepada Anda. Silakan gunakan tautan undangan
            pribadi Anda.
          </p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Undangan Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Maaf, undangan yang Anda cari tidak tersedia.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">
      <ThemeRenderer themeKey={wedding.themeKey || "classic"} wedding={wedding} />
      <RSVPSection weddingId={wedding.id} guest={guestInfo} guestSlug={guestSlug} />

    </div>
  );
}

export default function PublicWeddingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Memuat undangan...</p>
          </div>
        </div>
      }
    >
      <PublicWeddingContent />
    </Suspense>
  );
}
