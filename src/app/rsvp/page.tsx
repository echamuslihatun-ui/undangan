"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Users, CheckCircle, XCircle, Clock, Heart } from "lucide-react";

type Wedding = {
  id: string;
  partner1: string;
  partner2: string;
  resepsiDate: string | null;
  location: string | null;
};

type RSVPForm = {
  name: string;
  email: string;
  phone: string;
  attendanceStatus: "confirmed" | "declined" | "pending";
  numberOfGuests: number;
  message: string;
};

function RSVPFormContent() {
  const searchParams = useSearchParams();

  // Support both old format (?weddingId=xxx&to=xxx) and new format (?wedding-slug=guest-slug)
  const entries = Array.from(searchParams.entries());
  let weddingId = searchParams.get("weddingId");
  let guestSlug: string | null = null;

  if (!weddingId && entries.length > 0) {
    weddingId = entries[0][0];
    guestSlug = entries[0][1] || null;
  } else if (weddingId) {
    guestSlug = searchParams.get("to");
  }

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RSVPForm>({
    name: "",
    email: "",
    phone: "",
    attendanceStatus: "pending",
    numberOfGuests: 1,
    message: "",
  });

  useEffect(() => {
    async function fetchWedding() {
      try {
        if (!weddingId) {
          console.log("No weddingId found in URL params");
          setError("Link undangan tidak valid. Parameter wedding tidak ditemukan.");
          setLoading(false);
          return;
        }
        
        console.log("Fetching wedding with ID/slug:", weddingId);
        const res = await fetch(`/api/public/weddings/${encodeURIComponent(weddingId)}`);
        console.log("API response status:", res.status, res.statusText);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Wedding data received:", data);
          setWedding(data);

          if (guestSlug) {
            const guestRes = await fetch(`/api/guests/${encodeURIComponent(guestSlug)}`);
            if (guestRes.ok) {
              const guestData = await guestRes.json();
              setGuestInfo({ name: guestData.name, phone: guestData.phone });
              setFormData((prev) => ({ ...prev, name: guestData.name, phone: guestData.phone }));
            }
          }
        } else {
          const errorData = await res.json();
          console.error("API error response:", errorData);
          setError(errorData.error || `Undangan dengan kode "${weddingId}" tidak ditemukan`);
        }
      } catch (error) {
        console.error("Network/fetch error:", error);
        setError("Gagal memuat data undangan. Periksa koneksi internet Anda.");
      } finally {
        setLoading(false);
      }
    }
    fetchWedding();
  }, [weddingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) {
      alert("Data undangan tidak ditemukan");
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await fetch(`/api/public/weddings/${wedding.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errorData = await res.json();
        console.error("RSVP submit failed:", errorData);
        alert(errorData.error || "Gagal mengirim RSVP. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("RSVP submit error:", error);
      alert("Gagal mengirim RSVP. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading undangan...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">Undangan Tidak Ditemukan</h1>
          <p className="mt-2 text-muted-foreground">{error || "Maaf, undangan yang Anda cari tidak tersedia."}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Pastikan link undangan yang Anda buka sudah benar.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4">
        <div className="max-w-md w-full card-custom text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">Terima Kasih!</h1>
          <p className="mt-2 text-muted-foreground">
            RSVP Anda telah berhasil dikirim. Kami tunggu kehadiran Anda di acara pernikahan {wedding.partner1} & {wedding.partner2}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Wedding Invitation Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold">Wedding Invitation</h1>
          <p className="mt-2 text-muted-foreground">
            You are invited to the wedding of
          </p>
          <div className="mt-4">
            <h2 className="font-serif text-2xl font-bold text-primary">
              {wedding.partner1} & {wedding.partner2}
            </h2>
            {wedding.resepsiDate && (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(wedding.resepsiDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {wedding.location && (
              <p className="text-sm text-muted-foreground">{wedding.location}</p>
            )}
          </div>
        </div>

        {/* RSVP Form */}
        <div className="card-custom">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-custom"
                placeholder="Nama lengkap Anda"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-custom"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Nomor WhatsApp *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-custom"
                placeholder="628123456789"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Konfirmasi Kehadiran *</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, attendanceStatus: "confirmed" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition ${
                    formData.attendanceStatus === "confirmed"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border hover:border-green-300"
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Hadir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, attendanceStatus: "pending" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition ${
                    formData.attendanceStatus === "pending"
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                      : "border-border hover:border-yellow-300"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Belum Pasti</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, attendanceStatus: "declined" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition ${
                    formData.attendanceStatus === "declined"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-border hover:border-red-300"
                  }`}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Tidak Hadir</span>
                </button>
              </div>
            </div>

            {formData.attendanceStatus === "confirmed" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jumlah Tamu</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfGuests}
                  onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) || 1 })}
                  className="input-custom"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Pesan (Opsional)</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="input-custom"
                placeholder="Tulis ucapan atau pesan Anda..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Mengirim..." : "Kirim RSVP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RSVPFormPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <RSVPFormContent />
    </Suspense>
  );
}