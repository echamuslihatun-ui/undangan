"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

export type PublicMessage = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

export default function GuestBookSection({
  weddingId,
  guestSlug,
  messages,
}: {
  weddingId: string;
  guestSlug: string;
  messages: PublicMessage[];
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/public/weddings/${encodeURIComponent(weddingId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestSlug, message }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Gagal mengirim ucapan");

      setMessage("");
      setFeedback({
        type: "success",
        text: "Ucapan terkirim dan akan tampil setelah disetujui pemilik undangan.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal mengirim ucapan",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 pb-16 pt-4" aria-labelledby="guest-book-title">
      <div className="mb-6 text-center">
        <MessageCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
        <h2 id="guest-book-title" className="font-serif text-2xl font-bold">Buku Ucapan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tinggalkan doa dan ucapan terbaik Anda.</p>
      </div>

      <div className="card-custom mb-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="guest-message" className="block text-sm font-medium">Ucapan Anda</label>
          <textarea
            id="guest-message"
            required
            maxLength={500}
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="input-custom"
            placeholder="Semoga menjadi keluarga yang sakinah, mawaddah, warahmah..."
          />
          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>{message.length}/500</span>
            <button type="submit" disabled={submitting || !message.trim()} className="btn-primary flex items-center gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Mengirim..." : "Kirim Ucapan"}
            </button>
          </div>
          {feedback && (
            <p className={`rounded-lg p-3 text-sm ${feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} role="status">
              {feedback.text}
            </p>
          )}
        </form>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Belum ada ucapan yang ditampilkan.</p>
        ) : messages.map((item) => (
          <article key={item.id} className="card-custom">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{item.guestName}</h3>
              <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>
                {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.createdAt))}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
