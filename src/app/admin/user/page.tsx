"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle, Ban } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type UserStatus = "active" | "suspended";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  role: string;
  status: UserStatus;
  orderSummary: {
    totalOrders: number;
    latestPackage: string | null;
    latestOrderStatus: string | null;
    totalAmount: number;
  };
};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  customer: "Customer",
};

const orderStatusLabel: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  success: "Berhasil",
  failed: "Gagal",
};

const orderStatusClass: Record<string, string> = {
  pending: "badge-warning",
  success: "badge-success",
  failed: "badge-danger",
};

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UserStatus>("all");

  const exportCsv = () => {
    const headers = ["Name", "Email", "Role", "Status", "Joined At", "Total Orders", "Total Amount", "Latest Package", "Latest Order Status"];
    const rows = users.map((u) => [
      u.name || "",
      u.email || "",
      u.role,
      u.status,
      u.createdAt,
      u.orderSummary.totalOrders,
      u.orderSummary.totalAmount,
      u.orderSummary.latestPackage || "",
      u.orderSummary.latestOrderStatus || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const query = search.toLowerCase();
    const name = u.name ?? "";
    const email = u.email ?? "";
    const latestPackage = u.orderSummary.latestPackage ?? "";
    const matchSearch = name.toLowerCase().includes(query) || email.toLowerCase().includes(query) || latestPackage.toLowerCase().includes(query);
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleStatus = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      const nextStatus = user.status === "active" ? "suspended" : "active";
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers(users.map((u) => u.id === id ? { ...u, status: nextStatus } : u));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Gagal mengubah status user");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      alert("Gagal mengubah status user");
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;
  const totalOrders = users.reduce((sum, user) => sum + user.orderSummary.totalOrders, 0);
  const totalRevenue = users.reduce((sum, user) => sum + user.orderSummary.totalAmount, 0);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Data Akun Pelanggan</h1>
          <p className="mt-1 text-muted-foreground">Kelola data akun beserta ringkasan pesanan pelanggan Undanganku.</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-custom"><p className="text-sm text-muted-foreground">Total Akun Pelanggan</p><p className="mt-1 text-2xl font-bold">{users.length}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Akun Aktif</p><p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p><p className="mt-1 text-xs text-muted-foreground">{suspendedCount} akun suspended</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Total Order</p><p className="mt-1 text-2xl font-bold text-primary">{totalOrders}</p></div>
        <div className="card-custom"><p className="text-sm text-muted-foreground">Total Nominal Order</p><p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p></div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, atau paket terakhir..." className="input-custom pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | UserStatus)} className="input-custom sm:w-48">
          <option value="all">Semua Status Akun</option>
          <option value="active">Akun Aktif</option>
          <option value="suspended">Akun Suspended</option>
        </select>
      </div>

      <div className="card-custom overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Data Akun</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status Akun</th>
              <th className="px-4 py-3 text-left font-semibold">Bergabung</th>
              <th className="px-4 py-3 text-left font-semibold">Ringkasan Pesanan</th>
              <th className="px-4 py-3 text-left font-semibold">Total Nominal</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(user.name || user.email || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || "Tanpa Nama"}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "Email belum tersedia"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="badge-muted">{roleLabel[user.role] ?? user.role}</span></td>
                <td className="px-4 py-3">
                  {user.status === "active" ? <span className="badge-success"><CheckCircle className="mr-1 inline h-3 w-3" /> Aktif</span> : <span className="badge-danger"><Ban className="mr-1 inline h-3 w-3" /> Suspended</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-medium">{user.orderSummary.totalOrders} order</p>
                    <p className="text-xs text-muted-foreground">Paket terakhir: {user.orderSummary.latestPackage || "Belum ada order"}</p>
                    {user.orderSummary.latestOrderStatus ? (
                      <span className={orderStatusClass[user.orderSummary.latestOrderStatus] ?? "badge-muted"}>
                        {orderStatusLabel[user.orderSummary.latestOrderStatus] ?? user.orderSummary.latestOrderStatus}
                      </span>
                    ) : (
                      <span className="badge-muted">Belum ada status order</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(user.orderSummary.totalAmount)}</td>
                <td className="px-4 py-3 text-right">
                  {user.role === "admin" ? (
                    <span className="text-xs text-muted-foreground">Tidak tersedia</span>
                  ) : (
                    <button onClick={() => toggleStatus(user.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${user.status === "active" ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}>
                      {user.status === "active" ? "Suspend" : "Aktifkan"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada akun yang cocok dengan pencarian atau filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}