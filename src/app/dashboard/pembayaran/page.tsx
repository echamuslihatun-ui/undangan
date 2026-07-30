"use client";

import { useState, useEffect } from "react";
import { CreditCard, QrCode, Wallet, Landmark, CheckCircle, Clock, Copy } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Method = "qris" | "transfer" | "ewallet";

type Transaction = {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};

export default function PembayaranPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<Method>("qris");
  const [copied, setCopied] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleBayar = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: "Premium", amount: 250000, method }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal membuat pesanan");
        return;
      }
      const order = await res.json();
      setTransactions([order, ...transactions]);
      alert("Pesanan berhasil dibuat. Silakan selesaikan pembayaran melalui metode yang dipilih.");
    } catch (error) {
      alert("Gagal membuat pesanan");
    } finally {
      setPaying(false);
    }
  };

  const methods = [
    { id: "qris" as Method, label: "QRIS", icon: QrCode, desc: "Scan untuk bayar dari semua e-wallet & bank" },
    { id: "transfer" as Method, label: "Bank Transfer", icon: Landmark, desc: "BCA, BNI, Mandiri, BRI" },
    { id: "ewallet" as Method, label: "E-Wallet", icon: Wallet, desc: "GoPay, OVO, DANA, ShopeePay" },
  ];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Pembayaran</h1>
        <p className="mt-1 text-muted-foreground">Pilih metode pembayaran untuk mengaktifkan undangan.</p>
      </div>

      <div className="mb-6 card-custom border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Pembayaran Terverifikasi</p>
            <p className="text-sm text-green-700">Undangan Anda aktif hingga 24 Februari 2027.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" /> Pilih Metode Pembayaran</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${method === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 ${method === m.id ? "border-primary bg-primary" : "border-border"}`}>
                    {method === m.id && <CheckCircle className="h-full w-full text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              {method === "qris" && (
                <div className="text-center">
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4 shadow-sm">
                    <QrCode className="h-32 w-32 text-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Scan QRIS menggunakan e-wallet atau mobile banking</p>
                </div>
              )}
              {method === "transfer" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank BCA</p>
                      <p className="font-bold">1234567890</p>
                      <p className="text-xs text-muted-foreground">a.n. PT Undanganku</p>
                    </div>
                    <button onClick={() => handleCopy("1234567890", "bca")} className="btn-secondary text-xs">
                      {copied === "bca" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === "bca" ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Mandiri</p>
                      <p className="font-bold">9876543210</p>
                      <p className="text-xs text-muted-foreground">a.n. PT Undanganku</p>
                    </div>
                    <button onClick={() => handleCopy("9876543210", "mandiri")} className="btn-secondary text-xs">
                      {copied === "mandiri" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === "mandiri" ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                </div>
              )}
              {method === "ewallet" && (
                <div className="grid grid-cols-2 gap-3">
                  {["GoPay", "OVO", "DANA", "ShopeePay"].map((w) => (
                    <button key={w} onClick={() => alert(`Pembayaran via ${w} akan segera tersedia.`)} className="flex items-center justify-center gap-2 rounded-lg bg-white p-3 font-semibold hover:bg-muted">
                      <Wallet className="h-4 w-4 text-primary" /> {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card-custom sticky top-4">
            <h2 className="mb-4 font-semibold">Ringkasan Pesanan</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium">Premium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium">Elegant Rose</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masa Aktif</span>
                <span className="font-medium">6 bulan</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(250000)}</span>
                </div>
              </div>
            </div>
            <button onClick={handleBayar} disabled={paying} className="btn-primary mt-4 w-full">{paying ? "Memproses..." : "Bayar Sekarang"}</button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Verifikasi otomatis via webhook setelah pembayaran.</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-serif text-xl font-bold">Riwayat Transaksi</h2>
        {transactions.length === 0 ? (
          <div className="card-custom text-center text-muted-foreground">Belum ada transaksi.</div>
        ) : (
          <div className="card-custom overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID Transaksi</th>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold">Metode</th>
                  <th className="px-4 py-3 text-left font-semibold">Jumlah</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr key={trx.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{trx.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(trx.createdAt)}</td>
                    <td className="px-4 py-3">{trx.method}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(trx.amount)}</td>
                    <td className="px-4 py-3">
                      {trx.status === "success" ? <span className="badge-success">Berhasil</span> : trx.status === "pending" ? <span className="badge-warning"><Clock className="mr-1 inline h-3 w-3" /> Pending</span> : <span className="badge-danger">Gagal</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}