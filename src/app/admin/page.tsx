"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Users, Palette, TrendingUp, DollarSign, Activity, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Stat = {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  bg: string;
};

type RecentTransaction = {
  id: string;
  user: { name: string };
  amount: number;
  status: string;
  createdAt: string;
};

type TopTemplate = {
  name: string;
  sales: number;
  revenue: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topTemplates, setTopTemplates] = useState<TopTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, transactionsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/transactions"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats([
            { label: "Total Pendapatan", value: formatCurrency(statsData.totalRevenue || 0), change: "+12.5%", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
            { label: "Transaksi Bulan Ini", value: String(statsData.totalOrders || 0), change: "+8.2%", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "User Aktif", value: String(statsData.totalUsers || 0), change: "+15.3%", icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
            { label: "Template Aktif", value: String(statsData.totalTemplates || 0), change: "+2", icon: Palette, color: "text-primary", bg: "bg-primary/10" },
          ]);
          setTopTemplates(statsData.topTemplates || []);
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setRecentTransactions(transactionsData.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Dashboard Admin</h1>
        <p className="mt-1 text-muted-foreground">Ringkasan aktivitas platform Undanganku.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-custom">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" /> {stat.change}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-custom p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold">Transaksi Terbaru</h2>
              <Link href="/admin/transaksi" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Lihat Semua <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                    <th className="px-4 py-3 text-left font-semibold">Jumlah</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((trx) => (
              <tr key={trx.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{trx.id}</td>
                <td className="px-4 py-3">{trx.user?.name || "Unknown"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(trx.createdAt)}</td>
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
        </div>

        <div className="card-custom">
          <h2 className="mb-4 font-semibold">Template Terlaris</h2>
          <div className="space-y-4">
            {topTemplates.map((tpl, i) => (
              <div key={tpl.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">{tpl.sales} terjual</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(tpl.revenue)}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/template" className="btn-secondary mt-4 w-full">Kelola Template</Link>
        </div>
      </div>

      <div className="mt-6 card-custom">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Aktivitas Mingguan</h2>
        </div>
        <div className="flex h-48 items-end justify-between gap-2">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, i) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-lg bg-primary/20" style={{ height: `${30 + i * 12}%` }}>
                <div className="w-full rounded-t-lg bg-primary" style={{ height: `${40 + i * 10}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}