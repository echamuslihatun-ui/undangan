"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, Music, QrCode, Upload, Save, Calendar, MapPin, User, Trash2, X, ImagePlus, Eye, Clock, Plus, Sparkles, Quote } from "lucide-react";
import { useToast } from "@/components/Toast";

type Tab = "template" | "acara" | "media" | "cerita" | "amplop";

/** Jenis gambar tunggal yang bisa diunggah (bukan galeri). */
type SingleImageField = "heroImage" | "quoteImage" | "photoPria" | "photoWanita";

interface BankAccount {
  bank: string;
  account: string;
  holder: string;
}

interface StoryItem {
  month: string;
  year: string;
  title: string;
  description: string;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Konversi nilai tanggal dari DB ke value input `type="date"` / `type="time"`.
 * Sengaja memakai komponen waktu LOKAL (bukan toISOString yang UTC) supaya
 * tanggal tidak bergeser satu hari bagi pengguna di zona waktu Indonesia.
 */
const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  // Data lama tersimpan sebagai tanggal saja (00:00); jangan tampilkan jam palsu.
  return time === "00:00" ? "" : time;
};

interface WeddingData {
  partner1: string;
  partner2: string;
  nickname1: string;
  nickname2: string;
  parent1: string;
  parent2: string;
  fatherPria: string;
  motherPria: string;
  fatherWanita: string;
  motherWanita: string;
  themeKey: string;
  akadDate: string;
  akadStart: string;
  akadEnd: string;
  akadVenue: string;
  akadMapsUrl: string;
  resepsiDate: string;
  resepsiStart: string;
  resepsiEnd: string;
  resepsiVenue: string;
  resepsiMapsUrl: string;
  location: string;
  mapsUrl: string;
  message: string;
  quote: string;
  quoteSource: string;
  heroImage: string;
  quoteImage: string;
  photoPria: string;
  photoWanita: string;
  photos: string[];
  musicUrl: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  qrisImage: string;
  bankAccounts: BankAccount[];
  story: StoryItem[];
}

interface Template {
  id: string;
  name: string;
  category: string;
  image: string;
  themeKey: string;
  status: string;
}

export default function KustomisasiPage() {
  const [activeTab, setActiveTab] = useState<Tab>("template");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [weddingData, setWeddingData] = useState<WeddingData>({
    partner1: "",
    partner2: "",
    nickname1: "",
    nickname2: "",
    parent1: "",
    parent2: "",
    fatherPria: "",
    motherPria: "",
    fatherWanita: "",
    motherWanita: "",
    themeKey: "classic",
    akadDate: "",
    akadStart: "",
    akadEnd: "",
    akadVenue: "",
    akadMapsUrl: "",
    resepsiDate: "",
    resepsiStart: "",
    resepsiEnd: "",
    resepsiVenue: "",
    resepsiMapsUrl: "",
    location: "",
    mapsUrl: "",
    message: "",
    quote: "",
    quoteSource: "",
    heroImage: "",
    quoteImage: "",
    photoPria: "",
    photoWanita: "",
    photos: [],
    musicUrl: "",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
    qrisImage: "",
    bankAccounts: [],
    story: [],
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { showToast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);
  // Satu input file dipakai bersama oleh keempat uploader gambar tunggal;
  // field tujuan disimpan sementara di `singleImageTarget`.
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const [singleImageTarget, setSingleImageTarget] = useState<SingleImageField | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [weddingRes, templatesRes] = await Promise.all([
          fetch("/api/wedding", { credentials: "same-origin" }),
          fetch("/api/templates", { credentials: "same-origin" }),
        ]);

        if (!weddingRes.ok) {
          const err = await weddingRes.json().catch(() => null);
          console.error("Wedding fetch failed:", weddingRes.status, err);
          throw new Error(err?.error || "Gagal mengambil data acara");
        }

        if (!templatesRes.ok) {
          const err = await templatesRes.json().catch(() => null);
          console.error("Templates fetch failed:", templatesRes.status, err);
          throw new Error(err?.error || "Gagal mengambil template");
        }

        const weddingData = await weddingRes.json();
        const bankAccounts = typeof weddingData.bankAccounts === "string"
          ? JSON.parse(weddingData.bankAccounts || "[]")
          : weddingData.bankAccounts || [];
        const photos = typeof weddingData.photos === "string"
          ? JSON.parse(weddingData.photos || "[]")
          : weddingData.photos || [];
        const rawStory = typeof weddingData.story === "string"
          ? JSON.parse(weddingData.story || "[]")
          : weddingData.story || [];
        // Item cerita versi lama hanya punya `date`; petakan ke month/year agar
        // tetap bisa diedit lewat form baru tanpa kehilangan isi cerita.
        const story: StoryItem[] = (rawStory as any[]).map((item) => ({
          month: item.month || "",
          year: item.year || "",
          title: item.title || "",
          description: item.description || "",
        }));

        setWeddingData({
          partner1: weddingData.partner1 || "",
          partner2: weddingData.partner2 || "",
          nickname1: weddingData.nickname1 || "",
          nickname2: weddingData.nickname2 || "",
          parent1: weddingData.parent1 || "",
          parent2: weddingData.parent2 || "",
          fatherPria: weddingData.fatherPria || "",
          motherPria: weddingData.motherPria || "",
          fatherWanita: weddingData.fatherWanita || "",
          motherWanita: weddingData.motherWanita || "",
          themeKey: weddingData.themeKey || "classic",
          akadDate: toDateInput(weddingData.akadDate),
          // Jam acara kini berdiri sendiri. Untuk data lama yang jamnya masih
          // menempel di `akadDate`/`resepsiDate`, jam tersebut dipakai sebagai
          // nilai awal jam mulai supaya tidak hilang.
          akadStart: weddingData.akadStart || toTimeInput(weddingData.akadDate),
          akadEnd: weddingData.akadEnd || "",
          akadVenue: weddingData.akadVenue || "",
          akadMapsUrl: weddingData.akadMapsUrl || "",
          resepsiDate: toDateInput(weddingData.resepsiDate),
          resepsiStart: weddingData.resepsiStart || toTimeInput(weddingData.resepsiDate),
          resepsiEnd: weddingData.resepsiEnd || "",
          resepsiVenue: weddingData.resepsiVenue || "",
          resepsiMapsUrl: weddingData.resepsiMapsUrl || "",
          location: weddingData.location || "",
          mapsUrl: weddingData.mapsUrl || "",
          message: weddingData.message || "",
          quote: weddingData.quote || "",
          quoteSource: weddingData.quoteSource || "",
          heroImage: weddingData.heroImage || "",
          quoteImage: weddingData.quoteImage || "",
          photoPria: weddingData.photoPria || "",
          photoWanita: weddingData.photoWanita || "",
          photos,
          musicUrl: weddingData.musicUrl || "",
          bankName: weddingData.bankName || "",
          bankAccount: weddingData.bankAccount || "",
          bankHolder: weddingData.bankHolder || "",
          qrisImage: weddingData.qrisImage || "",
          bankAccounts,
          story,
        });

        const templatesData = await templatesRes.json();
        setTemplates(templatesData.filter((t: Template) => t.status === "active"));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
    { id: "template", label: "Template", icon: ImagePlus },
    { id: "acara", label: "Data Acara", icon: Heart },
    { id: "media", label: "Media", icon: Music },
    { id: "cerita", label: "Cerita Cinta", icon: Sparkles },
    { id: "amplop", label: "Amplop Digital", icon: QrCode },
  ];

  const handleSelectTemplate = async (template: Template) => {
    const updated = { ...weddingData, themeKey: template.themeKey };
    setWeddingData(updated);
    // Simpan pilihan template langsung agar tersimpan tanpa perlu klik Simpan di tab lain
    try {
      const res = await fetch("/api/wedding", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showToast("success", `Template "${template.name}" dipilih & disimpan!`);
      } else {
        showToast("error", `Template "${template.name}" dipilih, tapi gagal disimpan. Klik Simpan.`);
      }
    } catch (error) {
      console.error("Save template error:", error);
      showToast("error", `Template "${template.name}" dipilih, tapi gagal disimpan. Klik Simpan.`);
    }
    setActiveTab("acara");
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/wedding", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weddingData),
      });
      if (res.ok) {
        showToast("success", "Data berhasil disimpan!");
      } else {
        const err = await res.json();
        showToast("error", err.error || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("error", "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  // Upload file handler
  const handleUpload = async (file: File, type: "photo" | "music" | "qris") => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        if (type === "photo") {
          setWeddingData({ ...weddingData, photos: [...weddingData.photos, result.url] });
          showToast("success", "Foto berhasil diupload");
        } else if (type === "music") {
          setWeddingData({ ...weddingData, musicUrl: result.url });
          showToast("success", "Musik berhasil diupload");
        } else if (type === "qris") {
          setWeddingData({ ...weddingData, qrisImage: result.url });
          showToast("success", "QRIS berhasil diupload");
        }
      } else {
        const err = await res.json();
        showToast("error", err.error || "Gagal upload file");
      }
    } catch (error) {
      showToast("error", "Gagal upload file");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, "photo");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleMusicInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, "music");
    if (musicInputRef.current) musicInputRef.current.value = "";
  };

  const handleQrisInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, "qris");
    if (qrisInputRef.current) qrisInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const newPhotos = weddingData.photos.filter((_, i) => i !== index);
    setWeddingData({ ...weddingData, photos: newPhotos });
  };

  // === Gambar tunggal (hero, latar kutipan, foto mempelai) ===
  const pickSingleImage = (field: SingleImageField) => {
    setSingleImageTarget(field);
    singleImageInputRef.current?.click();
  };

  const handleSingleImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = singleImageTarget;
    if (singleImageInputRef.current) singleImageInputRef.current.value = "";
    if (!file || !field) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast("error", err?.error || "Gagal upload gambar");
        return;
      }
      const result = await res.json();
      setWeddingData((prev) => ({ ...prev, [field]: result.url }));
      showToast("success", "Gambar berhasil diupload");
    } catch (error) {
      console.error("Upload image error:", error);
      showToast("error", "Gagal upload gambar");
    } finally {
      setUploading(false);
      setSingleImageTarget(null);
    }
  };

  // === Cerita cinta ===
  const addStoryItem = () => {
    setWeddingData({
      ...weddingData,
      story: [...weddingData.story, { month: "", year: "", title: "", description: "" }],
    });
  };

  const updateStoryItem = (index: number, field: keyof StoryItem, value: string) => {
    const story = [...weddingData.story];
    story[index] = { ...story[index], [field]: value };
    setWeddingData({ ...weddingData, story });
  };

  const removeStoryItem = (index: number) => {
    setWeddingData({ ...weddingData, story: weddingData.story.filter((_, i) => i !== index) });
  };

  // Multi rekening
  const addBankAccount = () => {
    setWeddingData({
      ...weddingData,
      bankAccounts: [...weddingData.bankAccounts, { bank: "", account: "", holder: "" }],
    });
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    const newAccounts = [...weddingData.bankAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setWeddingData({ ...weddingData, bankAccounts: newAccounts });
  };

  const removeBankAccount = (index: number) => {
    setWeddingData({
      ...weddingData,
      bankAccounts: weddingData.bankAccounts.filter((_, i) => i !== index),
    });
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Kustomisasi Undangan</h1>
        <p className="mt-1 text-muted-foreground">Lengkapi data undangan pernikahan Anda.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground hover:bg-muted border border-border"}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB TEMPLATE ===== */}
      {activeTab === "template" && (
        <div className="card-custom">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><ImagePlus className="h-5 w-5 text-primary" /> Pilih Template Undangan</h2>
          <p className="mb-6 text-sm text-muted-foreground">Pilih template yang sesuai dengan gaya pernikahan Anda.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className={`group relative overflow-hidden rounded-xl border-2 transition-all ${weddingData.themeKey === template.themeKey ? "border-primary shadow-lg" : "border-border hover:border-primary/50"}`}>
                <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                  <Image src={template.image} alt={template.name} fill className="object-cover transition group-hover:scale-105" />
                  {weddingData.themeKey === template.themeKey && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">✓ Terpilih</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{template.category}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setPreviewTemplate(template)} className="btn-secondary flex-1 text-xs">
                      <Eye className="h-3 w-3" /> Preview
                    </button>
                    <button onClick={() => handleSelectTemplate(template)} className={`flex-1 text-xs ${weddingData.themeKey === template.themeKey ? "btn-primary" : "btn-secondary"}`}>
                      {weddingData.themeKey === template.themeKey ? "✓ Dipilih" : "Pilih"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB ACARA ===== */}
      {activeTab === "acara" && (
        <div className="card-custom">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Heart className="h-5 w-5 text-primary" /> Data Mempelai & Acara</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Mempelai Pria *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.partner1} onChange={(e) => setWeddingData({ ...weddingData, partner1: e.target.value })} className="input-custom pl-10" placeholder="Nama lengkap" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Mempelai Wanita *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.partner2} onChange={(e) => setWeddingData({ ...weddingData, partner2: e.target.value })} className="input-custom pl-10" placeholder="Nama lengkap" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Panggilan Pria</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.nickname1} onChange={(e) => setWeddingData({ ...weddingData, nickname1: e.target.value })} className="input-custom pl-10" placeholder="Nama panggilan (untuk cover & link)" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Panggilan Wanita</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.nickname2} onChange={(e) => setWeddingData({ ...weddingData, nickname2: e.target.value })} className="input-custom pl-10" placeholder="Nama panggilan (untuk cover & link)" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ayah Mempelai Pria</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={weddingData.fatherPria.startsWith("Alm. ")} onChange={(e) => {
                    const checked = e.target.checked;
                    const name = weddingData.fatherPria.replace(/^Alm\.\s*/, "");
                    setWeddingData({ ...weddingData, fatherPria: checked ? (name ? `Alm. ${name}` : "Alm. ") : name });
                  }} className="rounded border-border" />
                  Alm.
                </label>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={weddingData.fatherPria.replace(/^Alm\.\s*/, "")} onChange={(e) => setWeddingData({ ...weddingData, fatherPria: weddingData.fatherPria.startsWith("Alm. ") ? `Alm. ${e.target.value}` : e.target.value })} className="input-custom pl-10" placeholder="Nama ayah mempelai pria" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ayah Mempelai Wanita</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={weddingData.fatherWanita.startsWith("Alm. ")} onChange={(e) => {
                    const checked = e.target.checked;
                    const name = weddingData.fatherWanita.replace(/^Alm\.\s*/, "");
                    setWeddingData({ ...weddingData, fatherWanita: checked ? (name ? `Alm. ${name}` : "Alm. ") : name });
                  }} className="rounded border-border" />
                  Alm.
                </label>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={weddingData.fatherWanita.replace(/^Alm\.\s*/, "")} onChange={(e) => setWeddingData({ ...weddingData, fatherWanita: weddingData.fatherWanita.startsWith("Alm. ") ? `Alm. ${e.target.value}` : e.target.value })} className="input-custom pl-10" placeholder="Nama ayah mempelai wanita" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ibu Mempelai Pria</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={weddingData.motherPria.startsWith("Almh. ")} onChange={(e) => {
                    const checked = e.target.checked;
                    const name = weddingData.motherPria.replace(/^Almh\.\s*/, "");
                    setWeddingData({ ...weddingData, motherPria: checked ? (name ? `Almh. ${name}` : "Almh. ") : name });
                  }} className="rounded border-border" />
                  Almh.
                </label>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={weddingData.motherPria.replace(/^Almh\.\s*/, "")} onChange={(e) => setWeddingData({ ...weddingData, motherPria: weddingData.motherPria.startsWith("Almh. ") ? `Almh. ${e.target.value}` : e.target.value })} className="input-custom pl-10" placeholder="Nama ibu mempelai pria" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ibu Mempelai Wanita</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={weddingData.motherWanita.startsWith("Almh. ")} onChange={(e) => {
                    const checked = e.target.checked;
                    const name = weddingData.motherWanita.replace(/^Almh\.\s*/, "");
                    setWeddingData({ ...weddingData, motherWanita: checked ? (name ? `Almh. ${name}` : "Almh. ") : name });
                  }} className="rounded border-border" />
                  Almh.
                </label>
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={weddingData.motherWanita.replace(/^Almh\.\s*/, "")} onChange={(e) => setWeddingData({ ...weddingData, motherWanita: weddingData.motherWanita.startsWith("Almh. ") ? `Almh. ${e.target.value}` : e.target.value })} className="input-custom pl-10" placeholder="Nama ibu mempelai wanita" />
                </div>
              </div>
            </div>
            {/* --- Akad Nikah --- */}
            <div className="md:col-span-2 mt-2 border-t border-border pt-4">
              <h3 className="font-medium">Akad Nikah</h3>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tanggal Akad</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={weddingData.akadDate} onChange={(e) => setWeddingData({ ...weddingData, akadDate: e.target.value })} className="input-custom pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="time" value={weddingData.akadStart} onChange={(e) => setWeddingData({ ...weddingData, akadStart: e.target.value })} className="input-custom pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="time" value={weddingData.akadEnd} onChange={(e) => setWeddingData({ ...weddingData, akadEnd: e.target.value })} className="input-custom pl-10" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tempat Akad</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.akadVenue} onChange={(e) => setWeddingData({ ...weddingData, akadVenue: e.target.value })} className="input-custom pl-10" placeholder="Nama gedung / alamat akad" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Peta Akad (Google Maps URL)</label>
              <input type="url" value={weddingData.akadMapsUrl} onChange={(e) => setWeddingData({ ...weddingData, akadMapsUrl: e.target.value })} className="input-custom" placeholder="https://maps.google.com/..." />
            </div>

            {/* --- Resepsi --- */}
            <div className="md:col-span-2 mt-2 border-t border-border pt-4">
              <h3 className="font-medium">Resepsi</h3>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tanggal Resepsi</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" value={weddingData.resepsiDate} onChange={(e) => setWeddingData({ ...weddingData, resepsiDate: e.target.value })} className="input-custom pl-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="time" value={weddingData.resepsiStart} onChange={(e) => setWeddingData({ ...weddingData, resepsiStart: e.target.value })} className="input-custom pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="time" value={weddingData.resepsiEnd} onChange={(e) => setWeddingData({ ...weddingData, resepsiEnd: e.target.value })} className="input-custom pl-10" />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tempat Resepsi</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.resepsiVenue} onChange={(e) => setWeddingData({ ...weddingData, resepsiVenue: e.target.value })} className="input-custom pl-10" placeholder="Nama gedung / alamat resepsi" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Peta Resepsi (Google Maps URL)</label>
              <input type="url" value={weddingData.resepsiMapsUrl} onChange={(e) => setWeddingData({ ...weddingData, resepsiMapsUrl: e.target.value })} className="input-custom" placeholder="https://maps.google.com/..." />
            </div>

            <div className="md:col-span-2 mt-2 border-t border-border pt-4">
              <label className="mb-1.5 block text-sm font-medium">Lokasi Umum (opsional)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={weddingData.location} onChange={(e) => setWeddingData({ ...weddingData, location: e.target.value })} className="input-custom pl-10" placeholder="Dipakai bila tempat akad/resepsi dikosongkan" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Peta Umum (Google Maps URL)</label>
              <input type="url" value={weddingData.mapsUrl} onChange={(e) => setWeddingData({ ...weddingData, mapsUrl: e.target.value })} className="input-custom" placeholder="https://maps.google.com/..." />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Pesan Pembuka</label>
              <textarea rows={3} value={weddingData.message} onChange={(e) => setWeddingData({ ...weddingData, message: e.target.value })} className="input-custom" placeholder="Tulis kata sambutan untuk tamu..." />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {/* ===== TAB MEDIA ===== */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Gambar Utama */}
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><ImagePlus className="h-5 w-5 text-primary" /> Gambar Utama</h2>
            <p className="mb-4 text-sm text-muted-foreground">Gambar ini dipakai pada bagian cover, latar kutipan, dan profil kedua mempelai.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { field: "heroImage", label: "Foto Cover (Hero)", hint: "Disarankan potret 9:16" },
                { field: "quoteImage", label: "Latar Kutipan / Ayat", hint: "Disarankan lanskap" },
                { field: "photoPria", label: "Foto Mempelai Pria", hint: "Disarankan potret" },
                { field: "photoWanita", label: "Foto Mempelai Wanita", hint: "Disarankan potret" },
              ] as { field: SingleImageField; label: string; hint: string }[]).map(({ field, label, hint }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-sm font-medium">{label}</label>
                  {weddingData[field] ? (
                    <div className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border">
                      <Image src={weddingData[field]} alt={label} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                      <button
                        onClick={() => setWeddingData({ ...weddingData, [field]: "" })}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                        aria-label={`Hapus ${label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => pickSingleImage(field)}
                      disabled={uploading}
                      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-2 text-center text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">{uploading ? "Uploading..." : "Upload Gambar"}</span>
                      <span className="text-[11px] opacity-70">{hint}</span>
                    </button>
                  )}
                  {weddingData[field] && (
                    <button onClick={() => pickSingleImage(field)} disabled={uploading} className="btn-secondary mt-2 w-full text-xs">
                      {uploading ? "Uploading..." : "Ganti Gambar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input ref={singleImageInputRef} type="file" accept="image/*" onChange={handleSingleImageInput} className="hidden" />
          </div>

          {/* Kutipan / Ayat */}
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Quote className="h-5 w-5 text-primary" /> Kutipan / Ayat</h2>
            <div className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Isi Kutipan</label>
                <textarea rows={4} value={weddingData.quote} onChange={(e) => setWeddingData({ ...weddingData, quote: e.target.value })} className="input-custom" placeholder="Tulis ayat atau kutipan favorit Anda..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Sumber Kutipan</label>
                <input type="text" value={weddingData.quoteSource} onChange={(e) => setWeddingData({ ...weddingData, quoteSource: e.target.value })} className="input-custom" placeholder="Mis. QS. Ar-Rum: 21" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>

          {/* Galeri Foto */}
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><ImagePlus className="h-5 w-5 text-primary" /> Galeri Foto</h2>
            <p className="mb-4 text-sm text-muted-foreground">Unggah foto prewedding Anda (maks. 20 foto).</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {weddingData.photos.map((photoUrl, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <Image src={photoUrl} alt={`Foto ${i + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading || weddingData.photos.length >= 20}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">Uploading...</span>
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Upload Foto</span>
                  </>
                )}
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoInput} className="hidden" />
            </div>
          </div>

          {/* Musik Background */}
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Music className="h-5 w-5 text-primary" /> Musik Background</h2>
            {weddingData.musicUrl ? (
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{getFileNameFromUrl(weddingData.musicUrl)}</p>
                    <audio src={weddingData.musicUrl} controls className="mt-1 h-8 max-w-[200px]" />
                  </div>
                </div>
                <button onClick={() => setWeddingData({ ...weddingData, musicUrl: "" })} className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground">
                <p className="text-sm">Belum ada musik</p>
              </div>
            )}
            <button
              onClick={() => musicInputRef.current?.click()}
              disabled={uploading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Upload className="h-5 w-5" /> {uploading ? "Uploading..." : "Upload Musik Baru (MP3, max 10MB)"}
            </button>
            <input ref={musicInputRef} type="file" accept="audio/mpeg,audio/mp3" onChange={handleMusicInput} className="hidden" />
          </div>
        </div>
      )}

      {/* ===== TAB CERITA CINTA ===== */}
      {activeTab === "cerita" && (
        <div className="card-custom">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Cerita Cinta</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Ceritakan perjalanan Anda dalam beberapa momen. Bila daftar dibiarkan kosong, bagian ini tidak akan tampil di undangan.
          </p>

          <div className="space-y-4">
            {weddingData.story.map((item, i) => (
              <div key={i} className="relative rounded-lg border border-border p-4">
                <button onClick={() => removeStoryItem(i)} className="absolute right-2 top-2 text-muted-foreground hover:text-red-500" aria-label={`Hapus momen ${i + 1}`}>
                  <X className="h-4 w-4" />
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Bulan</label>
                    <select value={item.month} onChange={(e) => updateStoryItem(i, "month", e.target.value)} className="input-custom text-sm">
                      <option value="">Pilih Bulan</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Tahun</label>
                    <input type="number" min="1900" max="2100" value={item.year} onChange={(e) => updateStoryItem(i, "year", e.target.value)} className="input-custom text-sm" placeholder="2024" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium">Judul Momen</label>
                    <input type="text" value={item.title} onChange={(e) => updateStoryItem(i, "title", e.target.value)} className="input-custom text-sm" placeholder="Mis. Pertama Bertemu" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium">Cerita</label>
                    <textarea rows={3} value={item.description} onChange={(e) => updateStoryItem(i, "description", e.target.value)} className="input-custom text-sm" placeholder="Tuliskan ceritanya..." />
                  </div>
                </div>
              </div>
            ))}

            {weddingData.story.length === 0 && (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground">
                <p className="text-sm">Belum ada momen cerita</p>
              </div>
            )}

            <button onClick={addStoryItem} className="btn-secondary text-sm">
              <Plus className="h-4 w-4" /> Tambah Momen
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {/* ===== TAB AMPLOP ===== */}
      {activeTab === "amplop" && (
        <div className="card-custom">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><QrCode className="h-5 w-5 text-primary" /> Amplop Digital</h2>
          <p className="mb-6 text-sm text-muted-foreground">Tambahkan nomor rekening atau QRIS untuk memudahkan tamu mengirim hadiah.</p>

          {/* Multi Rekening */}
          <h3 className="mb-3 font-medium">Nomor Rekening</h3>
          <div className="space-y-4">
            {weddingData.bankAccounts.map((acc, i) => (
              <div key={i} className="relative rounded-lg border border-border p-4">
                {weddingData.bankAccounts.length > 1 && (
                  <button onClick={() => removeBankAccount(i)} className="absolute right-2 top-2 text-muted-foreground hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Bank</label>
                    <select value={acc.bank} onChange={(e) => updateBankAccount(i, "bank", e.target.value)} className="input-custom text-sm">
                      <option value="">Pilih Bank</option>
                      <option>BCA</option>
                      <option>BNI</option>
                      <option>Mandiri</option>
                      <option>BRI</option>
                      <option>BSI</option>
                      <option>BTN</option>
                      <option>CIMB Niaga</option>
                      <option>Danamon</option>
                      <option>Maybank</option>
                      <option>Permata</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Nomor Rekening</label>
                    <input type="text" value={acc.account} onChange={(e) => updateBankAccount(i, "account", e.target.value)} className="input-custom text-sm" placeholder="Nomor rekening" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Atas Nama</label>
                    <input type="text" value={acc.holder} onChange={(e) => updateBankAccount(i, "holder", e.target.value)} className="input-custom text-sm" placeholder="Nama pemilik" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addBankAccount} className="btn-secondary text-sm">
              + Tambah Rekening
            </button>
          </div>

          {/* QRIS */}
          <h3 className="mb-3 mt-8 font-medium">QRIS</h3>
          {weddingData.qrisImage ? (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-6 sm:flex-row">
              <div className="relative h-40 w-40 overflow-hidden rounded-lg">
                <Image src={weddingData.qrisImage} alt="QRIS" fill className="object-contain" />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-medium text-green-700">✓ QRIS Terupload</p>
                <p className="mt-1 text-sm text-muted-foreground">Scan QRIS untuk menerima pembayaran dari semua e-wallet dan bank.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => qrisInputRef.current?.click()} disabled={uploading} className="btn-secondary text-sm">
                    {uploading ? "Uploading..." : "Ganti QRIS"}
                  </button>
                  <button onClick={() => setWeddingData({ ...weddingData, qrisImage: "" })} className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-200">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border p-6 sm:flex-row sm:items-start">
              <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-medium">Upload Gambar QRIS</p>
                <p className="mt-1 text-sm text-muted-foreground">Scan QRIS untuk menerima pembayaran dari semua e-wallet dan bank.</p>
                <button onClick={() => qrisInputRef.current?.click()} disabled={uploading} className="btn-primary mt-3">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload QRIS"}
                </button>
              </div>
            </div>
          )}
          <input ref={qrisInputRef} type="file" accept="image/*" onChange={handleQrisInput} className="hidden" />

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview Template */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewTemplate(null)}>
          <div className="relative max-h-[90vh] w-full max-w-sm overflow-hidden rounded-xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[9/16]">
              <Image src={previewTemplate.image} alt={previewTemplate.name} fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{previewTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">{previewTemplate.category}</p>
              <button onClick={() => setPreviewTemplate(null)} className="mt-4 w-full btn-primary">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}