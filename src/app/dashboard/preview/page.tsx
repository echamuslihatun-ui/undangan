"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, Smartphone, Monitor, Eye } from "lucide-react";
import ThemeRenderer from "@/components/themes/ThemeRenderer";
import { useToast } from "@/components/Toast";

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
  slug?: string;
};

type Order = {
  template: { themeKey: string } | null;
  status: string;
};

export default function PreviewPage() {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [themeKey, setThemeKey] = useState("classic");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [weddingRes, ordersRes] = await Promise.all([
          fetch("/api/wedding"),
          fetch("/api/orders"),
        ]);
        if (weddingRes.ok) {
          const weddingData = await weddingRes.json();
          setWedding(weddingData);
          if (weddingData.themeKey) {
            setThemeKey(weddingData.themeKey);
          } else if (ordersRes.ok) {
            const orders: Order[] = await ordersRes.json();
            const active = orders.find((o) => o.status === "success" && o.template);
            if (active?.template?.themeKey) setThemeKey(active.template.themeKey);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Preview Undangan</h1>
          <p className="mt-1 text-muted-foreground">Lihat hasil undangan sebelum dibagikan.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-white p-1">
            <button onClick={() => setDevice("mobile")} className={`rounded-md p-2 ${device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Smartphone className="h-4 w-4" />
            </button>
            <button onClick={() => setDevice("desktop")} className={`rounded-md p-2 ${device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Monitor className="h-4 w-4" />
            </button>
          </div>
          <button className="btn-secondary" onClick={() => setIsFullscreen(true)}><Eye className="h-4 w-4" /> Fullscreen</button>
          <button className="btn-primary"><Share2 className="h-4 w-4" /> Bagikan</button>
        </div>
      </div>

      <div className="flex justify-center rounded-xl border border-border bg-muted/30 p-4 md:p-8">
        <div className={`${device === "mobile" ? "w-full max-w-sm" : "w-full max-w-2xl"}`}>
          {wedding ? (
            <ThemeRenderer themeKey={themeKey} wedding={wedding} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">Data undangan belum tersedia.</div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button onClick={() => setIsFullscreen(false)} className="absolute right-4 top-4 z-20 rounded-full bg-white p-3 text-sm font-semibold shadow-sm">Tutup</button>
            <div className="h-[90vh] overflow-auto bg-muted p-4">
              {wedding ? <ThemeRenderer themeKey={themeKey} wedding={wedding} /> : <div className="text-center py-12 text-muted-foreground">Data undangan belum tersedia.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Share Link */}
      {wedding?.slug && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-lg border border-border bg-white p-4"
        >
          <p className="mb-2 text-sm font-medium">Link Undangan:</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/u/${wedding.slug}`}
              className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/u/${wedding.slug}`);
                showToast("success", "Link berhasil disalin!");
              }}
              className="btn-primary"
            >
              <Share2 className="h-4 w-4" /> Salin
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
