"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ThemeRenderer from "@/components/themes/ThemeRenderer";

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

export default function PublicWeddingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWedding() {
      try {
        const res = await fetch(`/api/public/weddings/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setWedding(data);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Failed to fetch wedding:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchWedding();
  }, [slug]);

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
    </div>
  );
}