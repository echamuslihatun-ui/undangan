"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Share2, Smartphone, Monitor, Eye } from "lucide-react";
import { useToast } from "@/components/Toast";

/**
 * Lebar viewport yang disimulasikan tiap mode. Preview dirender di dalam
 * iframe agar tema yang memakai `position: fixed` dan satuan `vh`/`vw`
 * (mis. Elegant) tetap terkurung di dalam bidang preview.
 */
const DEVICE_WIDTH = { mobile: 390, desktop: 1280 } as const;
const DEVICE_HEIGHT = { mobile: 780, desktop: 800 } as const;

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
  // Lebar kotak penampung dipakai untuk menghitung skala iframe desktop.
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setStageWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [loading]);

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

  const frameWidth = DEVICE_WIDTH[device];
  const frameHeight = DEVICE_HEIGHT[device];
  // Perkecil bila viewport simulasi lebih lebar dari ruang yang tersedia.
  const scale = stageWidth > 0 ? Math.min(1, stageWidth / frameWidth) : 1;
  const previewSrc = `/preview-frame?theme=${encodeURIComponent(themeKey)}`;
  const shareUrl =
    wedding?.slug && typeof window !== "undefined"
      ? `${window.location.origin}/public/weddings/${wedding.slug}`
      : "";

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

      <div
        ref={stageRef}
        className="flex justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 md:p-8"
      >
        {wedding ? (
          <div
            // Tinggi wadah ikut menyusut bersama skala agar tidak ada ruang kosong.
            style={{ width: frameWidth * scale, height: frameHeight * scale }}
            className={`overflow-hidden bg-white shadow-lg ${
              device === "mobile" ? "rounded-[2rem] border-4 border-neutral-800" : "rounded-xl border border-border"
            }`}
          >
            <iframe
              key={`${themeKey}-${device}`}
              src={previewSrc}
              title="Preview undangan"
              style={{
                width: frameWidth,
                height: frameHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: "none",
              }}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">Data undangan belum tersedia.</div>
        )}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button onClick={() => setIsFullscreen(false)} className="absolute right-4 top-4 z-20 rounded-full bg-white p-3 text-sm font-semibold shadow-sm">Tutup</button>
            <div className="h-[90vh] bg-muted">
              {wedding ? (
                <iframe
                  key={`fullscreen-${themeKey}`}
                  src={previewSrc}
                  title="Preview undangan fullscreen"
                  className="h-full w-full border-none"
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">Data undangan belum tersedia.</div>
              )}
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
              value={shareUrl}
              className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
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
