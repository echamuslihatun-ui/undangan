"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Heart, Send } from "lucide-react";

type Message = {
  id: string;
  guestName: string;
  message: string;
  isApproved: boolean;
  createdAt: string;
};

function UcapanContent() {
  const searchParams = useSearchParams();
  const weddingId = searchParams.get("weddingId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ guestName: "", message: "" });

  useEffect(() => {
    async function fetchMessages() {
      try {
        if (!weddingId) return;
        const res = await fetch(`/api/public/weddings/${weddingId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [weddingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!weddingId) {
        alert("Undangan tidak valid.");
        return;
      }
      const res = await fetch(`/api/public/weddings/${weddingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Gagal mengirim ucapan. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Message submit error:", error);
      alert("Gagal mengirim ucapan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 p-4">
        <div className="max-w-md w-full card-custom text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold">Terima Kasih!</h1>
          <p className="mt-2 text-muted-foreground">
            Ucapan Anda telah berhasil dikirim. Kami sangat menghargainya.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold">Ucapan & Doa</h1>
          <p className="mt-2 text-muted-foreground">
            Kirim ucapan dan doa untuk mempelai
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="card-custom">
              <h2 className="mb-4 font-semibold">Kirim Ucapan</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Nama Anda *</label>
                  <input
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="input-custom"
                    placeholder="Nama lengkap Anda"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Ucapan & Doa *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-custom"
                    placeholder="Tulis ucapan dan doa untuk mempelai..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Mengirim..." : "Kirim Ucapan"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 font-semibold">Ucapan dari Tamu</h2>
            {messages.length === 0 ? (
              <div className="card-custom text-center text-muted-foreground py-12">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Belum ada ucapan. Jadilah yang pertama!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="card-custom">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Heart className="h-5 w-5 text-primary" fill="currentColor" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{msg.guestName}</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UcapanPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <UcapanContent />
    </Suspense>
  );
}