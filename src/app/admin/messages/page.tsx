"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquare, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type MessageRecord = {
  id: string;
  weddingId: string;
  wedding: {
    partner1: string;
    partner2: string;
  } | null;
  guestName: string;
  message: string;
  isApproved: boolean;
  createdAt: string;
};

type MessageFilter = "all" | "approved" | "pending";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MessageFilter>("all");

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/admin/messages");
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          console.error("Failed to fetch admin messages", await res.text());
        }
      } catch (error) {
        console.error("Failed to fetch admin messages:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  const updateApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      });

      if (res.ok) {
        setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, isApproved } : msg)));
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || "Gagal memperbarui status pesan");
      }
    } catch (error) {
      console.error("Approval update error:", error);
      alert("Gagal memperbarui status pesan");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Hapus pesan ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || "Gagal menghapus pesan");
      }
    } catch (error) {
      console.error("Delete message error:", error);
      alert("Gagal menghapus pesan");
    }
  };

  const filtered = messages.filter((message) => {
    const query = search.toLowerCase();
    const matchesSearch =
      message.guestName.toLowerCase().includes(query) ||
      message.message.toLowerCase().includes(query) ||
      message.wedding?.partner1.toLowerCase().includes(query) ||
      message.wedding?.partner2.toLowerCase().includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "approved" && message.isApproved) ||
      (filter === "pending" && !message.isApproved);
    return matchesSearch && matchesFilter;
  });

  const totalApproved = messages.filter((msg) => msg.isApproved).length;
  const totalPending = messages.filter((msg) => !msg.isApproved).length;

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Moderasi Pesan</h1>
          <p className="mt-1 text-muted-foreground">Kelola dan setujui ucapan tamu sebelum ditampilkan.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Total Pesan</p>
          <p className="mt-1 text-2xl font-bold">{messages.length}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Disetujui</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{totalApproved}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Menunggu Persetujuan</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{totalPending}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tamu, pesan, atau nama wedding..."
            className="input-custom pl-10"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as MessageFilter)} className="input-custom sm:w-48">
          <option value="all">Semua Pesan</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu</option>
        </select>
      </div>

      <div className="card-custom overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tamu</th>
              <th className="px-4 py-3 text-left font-semibold">Wedding</th>
              <th className="px-4 py-3 text-left font-semibold">Pesan</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Dibuat</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((message) => (
              <tr key={message.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{message.guestName}</td>
                <td className="px-4 py-3">{message.wedding ? `${message.wedding.partner1} & ${message.wedding.partner2}` : "Wedding tidak diketahui"}</td>
                <td className="px-4 py-3 max-w-xl whitespace-pre-wrap break-words">{message.message}</td>
                <td className="px-4 py-3">
                  {message.isApproved ? (
                    <span className="badge-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Disetujui</span>
                  ) : (
                    <span className="badge-warning flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Menunggu</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(message.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {!message.isApproved && (
                      <button
                        onClick={() => updateApproval(message.id, true)}
                        className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-200"
                      >
                        Setujui
                      </button>
                    )}
                    {message.isApproved && (
                      <button
                        onClick={() => updateApproval(message.id, false)}
                        className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-600 hover:bg-yellow-200"
                      >
                        Batalkan
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada pesan yang cocok dengan kriteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
