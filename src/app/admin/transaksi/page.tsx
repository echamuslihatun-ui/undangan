"use client";

import { useState, useEffect } from "react";
import { Search, CreditCard, Download, Filter } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Status = "success" | "pending" | "failed";

type Transaction = {
  id: string;
  user: { name: string; email: string };
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};

export default function AdminTransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/admin/transactions");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.user.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = transactions.filter((t) => t.status === "success").reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions.filter((t) => t.status === "pending").length;
  const totalSuccess = transactions.filter((t) => t.status === "success").length;

  const exportCsv = () => {
    const headers = ["ID", "User", "Email", "Tanggal", "Metode", "Jumlah", "Status"];
    const rows = transactions.map((trx) => [
      trx.id,
      trx.user.name,
      trx.user.email,
      trx.createdAt,
      trx.method,
      trx.amount,
      trx.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Monitoring Transaksi</h1>
          <p className="mt-1 text-muted-foreground">Pantau semua transaksi pada platform.</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary"><Download className="h-4 w-4" /> Export</button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-custom"><p className="text-sm text-muted-foreground">Total Pendapatan</p><p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Transaksi Berhasil</p><p className="mt-1 text-2xl font-bold text-blue-600">{totalSuccess}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Transaksi Pending</p><p className="mt-1 text-2xl font-bold text-yellow-600">{totalPending}</p></div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau ID transaksi..." className="input-custom pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | Status)} className="input-custom">
            <option value="all">Semua Status</option>
            <option value="success">Berhasil</option>
            <option value="pending">Pending</option>
            <option value="failed">Gagal</option>
          </select>
        </div>
      </div>

      <div className="card-custom overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID Transaksi</th>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold">Metode</th>
              <th className="px-4 py-3 text-left font-semibold">Jumlah</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trx) => (
              <tr key={trx.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{trx.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{trx.user.name}</p>
                  <p className="text-xs text-muted-foreground">{trx.user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(trx.createdAt)}</td>
                <td className="px-4 py-3"><span className="badge-muted"><CreditCard className="mr-1 inline h-3 w-3" /> {trx.method}</span></td>
                <td className="px-4 py-3 font-medium">{formatCurrency(trx.amount)}</td>
                <td className="px-4 py-3">
                  {trx.status === "success" && <span className="badge-success">Berhasil</span>}
                  {trx.status === "pending" && <span className="badge-warning">Pending</span>}
                  {trx.status === "failed" && <span className="badge-danger">Gagal</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}