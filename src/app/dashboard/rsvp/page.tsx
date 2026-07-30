"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, XCircle, Mail, Phone, MessageSquare } from "lucide-react";

type RSVP = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  attendanceStatus: string;
  numberOfGuests: number;
  message: string | null;
  createdAt: string;
};

export default function RSVPPage() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all");

  useEffect(() => {
    async function fetchRSVPs() {
      try {
        const res = await fetch("/api/rsvp");
        if (res.ok) {
          const data = await res.json();
          setRsvps(data);
        }
      } catch (error) {
        console.error("Failed to fetch RSVPs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRSVPs();
  }, []);

  const filtered = rsvps.filter((r) => filter === "all" || r.attendanceStatus === filter);

  const stats = {
    total: rsvps.length,
    confirmed: rsvps.filter((r) => r.attendanceStatus === "confirmed").length,
    pending: rsvps.filter((r) => r.attendanceStatus === "pending").length,
    declined: rsvps.filter((r) => r.attendanceStatus === "declined").length,
    totalGuests: rsvps.reduce((sum, r) => sum + r.numberOfGuests, 0),
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">RSVP Tamu</h1>
        <p className="mt-1 text-muted-foreground">Kelola konfirmasi kehadiran tamu undangan.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Total RSVP</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Konfirmasi</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Tolak</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.declined}</p>
        </div>
        <div className="card-custom">
          <p className="text-sm text-muted-foreground">Total Tamu</p>
          <p className="mt-1 text-2xl font-bold text-primary">{stats.totalGuests}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter("all")} className={`btn-secondary ${filter === "all" ? "bg-primary text-primary-foreground" : ""}`}>Semua</button>
        <button onClick={() => setFilter("confirmed")} className={`btn-secondary ${filter === "confirmed" ? "bg-green-500 text-white" : ""}`}>Konfirmasi</button>
        <button onClick={() => setFilter("pending")} className={`btn-secondary ${filter === "pending" ? "bg-yellow-500 text-white" : ""}`}>Pending</button>
        <button onClick={() => setFilter("declined")} className={`btn-secondary ${filter === "declined" ? "bg-red-500 text-white" : ""}`}>Tolak</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card-custom text-center text-muted-foreground">Belum ada RSVP.</div>
      ) : (
        <div className="card-custom overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Kontak</th>
                <th className="px-4 py-3 text-left font-semibold">Jumlah Tamu</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Pesan</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rsvp) => (
                <tr key={rsvp.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{rsvp.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        {rsvp.email || "-"}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" />
                        {rsvp.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{rsvp.numberOfGuests}</td>
                  <td className="px-4 py-3">
                    {rsvp.attendanceStatus === "confirmed" && <span className="badge-success"><CheckCircle className="mr-1 inline h-3 w-3" /> Hadir</span>}
                    {rsvp.attendanceStatus === "pending" && <span className="badge-warning"><Clock className="mr-1 inline h-3 w-3" /> Pending</span>}
                    {rsvp.attendanceStatus === "declined" && <span className="badge-danger"><XCircle className="mr-1 inline h-3 w-3" /> Tidak Hadir</span>}
                  </td>
                  <td className="px-4 py-3">
                    {rsvp.message && (
                      <div className="flex items-start gap-1 text-xs">
                        <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-2">{rsvp.message}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(rsvp.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}