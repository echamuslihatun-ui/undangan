"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Search, MessageCircle, Copy, Trash2, FileSpreadsheet, Send, CheckCircle, Clock, Download, Filter, ArrowUpDown } from "lucide-react";
import { useToast } from "@/components/Toast";
import { createCsv, parseCsv } from "@/lib/csv";

type Guest = {
  id: string;
  name: string;
  phone: string;
  slug: string;
  status: "pending" | "sent" | "confirmed";
  createdAt?: string;
};

type Wedding = { id: string; partner1: string; partner2: string; slug: string; resepsiDate: string | null; location: string | null; status: string };

type FilterStatus = "all" | "pending" | "sent" | "confirmed";
type SortField = "name" | "createdAt";

export default function TamuPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const canManageGuests = wedding?.status === "active";

  useEffect(() => {
    async function fetchGuests() {
      try {
        const [guestsRes, weddingRes] = await Promise.all([fetch("/api/guests"), fetch("/api/wedding")]);
        if (guestsRes.ok) setGuests(await guestsRes.json());
        if (weddingRes.ok) setWedding(await weddingRes.json());
      } catch (error) {
        console.error("Failed to fetch guests:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGuests();
  }, []);

  // Filter & Sort
  let filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
  );

  if (filterStatus !== "all") {
    filtered = filtered.filter((g) => g.status === filterStatus);
  }

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
    }
    return sortAsc ? cmp : -cmp;
  });

  const stats = {
    total: guests.length,
    sent: guests.filter((g) => g.status === "sent").length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    pending: guests.filter((g) => g.status === "pending").length,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    if (!canManageGuests) {
      showToast("error", "Tamu belum bisa ditambahkan sebelum pembayaran berhasil.");
      return;
    }
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        const guest = Array.isArray(data) ? data[0] : data.guests?.[0] || data;
        setGuests([guest, ...guests]);
        setNewName("");
        setNewPhone("");
        setShowAdd(false);
        showToast("success", "Tamu berhasil ditambahkan");
      } else {
        showToast("error", "Gagal menambah tamu");
      }
    } catch (error) {
      showToast("error", "Gagal menambah tamu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tamu ini?")) return;
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGuests(guests.filter((g) => g.id !== id));
        showToast("success", "Tamu berhasil dihapus");
      } else {
        showToast("error", "Gagal menghapus tamu");
      }
    } catch (error) {
      showToast("error", "Gagal menghapus tamu");
    }
  };

    // Format link tamu: /public/weddings/<slug>?to=<guestSlug>
  const buildGuestLink = (guest: Guest) => {
    const weddingSlug = wedding?.slug || "";
    return `${window.location.origin}/public/weddings/${encodeURIComponent(weddingSlug)}?to=${encodeURIComponent(guest.slug)}`;
  };


  const handleCopyLink = (guest: Guest) => {
    const link = buildGuestLink(guest);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSendWA = (guest: Guest) => {
    if (!canManageGuests) {
      showToast("error", "Kirim undangan akan aktif setelah pembayaran berhasil.");
      return;
    }
    const link = buildGuestLink(guest);
    const dateText = wedding?.resepsiDate ? new Date(wedding.resepsiDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Tanggal menyusul";
    const text = `Kepada Yth.\n${guest.name}\n\nDengan memohon rahmat Allah SWT, kami mengundang untuk menghadiri acara pernikahan kami:\n\n${wedding?.partner1 || "Mempelai"} & ${wedding?.partner2 || "Pasangan"}\n${dateText}\n${wedding?.location || "Lokasi menyusul"}\n\nLink undangan: ${link}\n\nMerupakan suatu kehormatan bagi kami atas kehadiran dan doa restu Anda.`;
    window.open(`https://wa.me/${guest.phone}?text=${encodeURIComponent(text)}`, "_blank");
    setGuests(guests.map((g) => g.id === guest.id ? { ...g, status: "sent" as const } : g));
  };

  const handleSendAll = () => {
    if (!canManageGuests) {
      showToast("error", "Kiriman undangan akan aktif setelah pembayaran berhasil.");
      return;
    }
    const pending = guests.filter((g) => g.status === "pending");
    if (pending.length === 0) {
      showToast("info", "Semua tamu sudah dikirim undangan");
      return;
    }
    pending.forEach((g) => handleSendWA(g));
    showToast("success", `${pending.length} undangan sedang dikirim`);
  };

  // Import CSV tanpa parser spreadsheet pihak ketiga yang rentan.
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      if (file.size > 2 * 1024 * 1024) {
        showToast("error", "Ukuran file CSV maksimal 2 MB");
        return;
      }
      const data = parseCsv(await file.text());

      const guestsData = data.map((row) => ({
        name: String(row.Nama || row.nama || row.Name || row.name || "").trim(),
        phone: String(row.No || row.Phone || row.phone || row.WhatsApp || row.wa || row.Telepon || row.telepon || "").trim(),
      }));

      const valid = guestsData.filter((g) => g.name && g.phone);
      if (valid.length === 0) {
        showToast("error", "Tidak ada data valid. Pastikan CSV memiliki kolom Nama dan WhatsApp");
        return;
      }

      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid),
      });

      if (res.ok) {
        const result = await res.json();
        // Refresh guests
        const guestsRes = await fetch("/api/guests");
        if (guestsRes.ok) setGuests(await guestsRes.json());
        showToast("success", `Berhasil import ${result.created} tamu${result.failed > 0 ? `, ${result.failed} gagal` : ""}`);
      } else {
        showToast("error", "Gagal import data");
      }
    } catch (error) {
      showToast("error", "Gagal membaca file CSV");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Export CSV dapat dibuka langsung di Excel/Google Sheets.
  const handleExport = () => {
    const exportData = guests.map((g) => ({
      Nama: g.name,
      "No. WhatsApp": g.phone,
      Status: g.status === "confirmed" ? "Konfirmasi" : g.status === "sent" ? "Terkirim" : "Pending",
      Link: buildGuestLink(g),
    }));

    const blob = new Blob(["\uFEFF", createCsv(exportData)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `daftar-tamu-${wedding?.partner1 || "undangan"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("success", "Data tamu berhasil di-download");
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Kelola Tamu</h1>
          <p className="mt-1 text-muted-foreground">Input tamu & sebar undangan via WhatsApp.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAdd(!showAdd)} disabled={!canManageGuests} className={`btn-secondary ${!canManageGuests ? "opacity-60 cursor-not-allowed" : ""}`}><UserPlus className="h-4 w-4" /> Tambah Tamu</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={!canManageGuests || importing} className={`btn-secondary ${!canManageGuests ? "opacity-60 cursor-not-allowed" : ""}`}>
            <FileSpreadsheet className="h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileImport} className="hidden" />
          <button onClick={handleExport} className="btn-secondary"><Download className="h-4 w-4" /> Export CSV</button>
          <button onClick={handleSendAll} disabled={!canManageGuests} className={`btn-primary ${!canManageGuests ? "opacity-60 cursor-not-allowed" : ""}`}><Send className="h-4 w-4" /> Kirim Semua</button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card-custom"><p className="text-sm text-muted-foreground">Total Tamu</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Terkirim</p><p className="mt-1 text-2xl font-bold text-blue-600">{stats.sent}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Konfirmasi</p><p className="mt-1 text-2xl font-bold text-green-600">{stats.confirmed}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Pending</p><p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
      </div>

      {wedding && !canManageGuests && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-700">
          Tambah tamu dan kirim undangan WhatsApp akan aktif setelah pembayaran berhasil dan status undangan aktif.
        </div>
      )}
      {showAdd && canManageGuests && (
        <div className="mb-6 card-custom">
          <h2 className="mb-4 font-semibold">Tambah Tamu Baru</h2>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Tamu</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama lengkap" className="input-custom" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">No. WhatsApp</label>
              <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="628xxxxxxxxxx" className="input-custom" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full"><UserPlus className="h-4 w-4" /> Tambah</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tamu..." className="input-custom pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border bg-white">
            {(["all", "pending", "sent", "confirmed"] as FilterStatus[]).map((f) => (
              <button key={f} onClick={() => setFilterStatus(f)} className={`px-3 py-2 text-xs font-medium ${filterStatus === f ? "bg-primary text-primary-foreground rounded-md" : "text-muted-foreground"}`}>
                {f === "all" ? "Semua" : f === "pending" ? "Pending" : f === "sent" ? "Terkirim" : "Konfirmasi"}
              </button>
            ))}
          </div>
          <button onClick={() => { setSortField(sortField === "name" ? "createdAt" : "name"); setSortAsc(!sortAsc); }} className="btn-secondary text-xs">
            <ArrowUpDown className="h-3 w-3" /> {sortField === "name" ? "Nama" : "Tanggal"} {sortAsc ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="card-custom overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nama</th>
              <th className="px-4 py-3 text-left font-semibold">No. WhatsApp</th>
              <th className="px-4 py-3 text-left font-semibold">Link Undangan</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Belum ada tamu.</td></tr>
            ) : (
              filtered.map((guest) => (
                <tr key={guest.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{guest.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{guest.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-primary">/public/weddings/{wedding?.slug}?to={guest.slug}</span>

                      <button onClick={() => handleCopyLink(guest)} className="text-muted-foreground hover:text-primary" title="Salin link">
                        {copiedId === guest.id ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {guest.status === "sent" && <span className="badge-success"><CheckCircle className="mr-1 inline h-3 w-3" /> Terkirim</span>}
                    {guest.status === "confirmed" && <span className="badge-success"><CheckCircle className="mr-1 inline h-3 w-3" /> Konfirmasi</span>}
                    {guest.status === "pending" && <span className="badge-warning"><Clock className="mr-1 inline h-3 w-3" /> Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleSendWA(guest)} className="rounded-lg bg-green-100 p-2 text-green-600 hover:bg-green-200" title="Kirim via WA">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(guest.id)} className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}