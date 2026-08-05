"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type GuestInfo = { name: string; phone: string } | null;

type RSVPForm = {
  name: string;
  email: string;
  phone: string;
  attendanceStatus: "confirmed" | "declined" | "pending";
  numberOfGuests: number;
  message: string;
};

export default function RSVPSection({
  weddingId,
  guest,
  guestSlug,
}: {
  weddingId: string;
  guest?: GuestInfo;
  guestSlug?: string | null;
}) {

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<RSVPForm["attendanceStatus"]>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<RSVPForm>({

    name: guest?.name || "",
    email: "",
    phone: guest?.phone || "",
    attendanceStatus: "pending",
    numberOfGuests: 1,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await fetch(`/api/public/weddings/${weddingId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, guestSlug }),
      });


      if (res.ok) {
        setSubmittedStatus(formData.attendanceStatus);
        setSubmitted(true);
      } else {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(errorData?.error || "Gagal mengirim RSVP. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("RSVP submit error:", error);
      setErrorMessage("Gagal mengirim RSVP. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }

  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card-custom text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold">Terima Kasih!</h2>
          <p className="mt-2 text-muted-foreground">
            {submittedStatus === "confirmed"
              ? "Konfirmasi berhasil dikirim. Kami tunggu kehadiran Anda."
              : submittedStatus === "declined"
                ? "Konfirmasi berhasil dikirim. Terima kasih telah memberi kabar."
                : "Konfirmasi berhasil dikirim. Anda dapat menghubungi pemilik undangan bila sudah menentukan pilihan."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold">Konfirmasi Kehadiran</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mohon konfirmasi kehadiran Anda dengan mengisi form di bawah ini.
        </p>
      </div>
      <div className="card-custom">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nama Lengkap *</label>
            <input
              type="text"
              required
              readOnly={!!guest?.name}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input-custom ${guest?.name ? "cursor-not-allowed bg-gray-100" : ""}`}
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
              readOnly={!!guest?.phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`input-custom ${guest?.phone ? "cursor-not-allowed bg-gray-100" : ""}`}
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

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Mengirim..." : "Kirim RSVP"}
          </button>

        </form>
      </div>
    </div>
  );
}
