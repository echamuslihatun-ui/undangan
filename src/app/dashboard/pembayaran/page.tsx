"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CreditCard, QrCode, Wallet, Landmark, CheckCircle, Clock, RefreshCw, ExternalLink, XCircle, Package } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PACKAGE_LIST, DEFAULT_PACKAGE, type PackageName } from "@/lib/packages";

type Method = "qris" | "transfer" | "ewallet";

type Transaction = {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  snapRedirectUrl?: string | null;
  snapExpiresAt?: string | null;
};

const METHOD_LABELS: Record<string, string> = {
  qris: "QRIS",
  transfer: "Bank Transfer",
  ewallet: "E-Wallet",
};

export default function PembayaranPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<Method>("qris");
  const [selectedPackage, setSelectedPackage] = useState<PackageName>(DEFAULT_PACKAGE);
  const [paying, setPaying] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const autoSyncedRef = useRef(false);

  const fetchOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sinkronisasi otomatis satu kali saat kembali dari halaman pembayaran Midtrans.
  // Menutup kasus status masih "pending" karena webhook belum masuk (mis. dev lokal).
  useEffect(() => {
    if (loading || autoSyncedRef.current) return;
    const pending = transactions.find((trx) => trx.status === "pending");
    if (!pending) return;
    autoSyncedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${pending.id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.order?.status === "success") {
          setNotice("Pembayaran terkonfirmasi. Undangan Anda sudah aktif.");
        }
        await fetchOrders();
      } catch {
        // Diamkan; user tetap bisa menekan "Cek Status" secara manual.
      }
    })();
  }, [loading, transactions, fetchOrders]);

  const handleBayar = async () => {
    setPaying(true);
    setNotice(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: selectedPackage, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Gagal membuat pesanan");
        return;
      }
      if (!data.redirectUrl) {
        setNotice("Pesanan dibuat, tetapi halaman pembayaran tidak tersedia.");
        return;
      }
      // Arahkan ke halaman pembayaran Midtrans Snap.
      window.location.href = data.redirectUrl;
    } catch (error) {
      setNotice("Gagal membuat pesanan");
    } finally {
      setPaying(false);
    }
  };

  /** Tanya status ke Midtrans; berguna bila notifikasi webhook belum masuk. */
  const handleCekStatus = async (id: string) => {
    setCheckingId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${id}/status`);
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Gagal memeriksa status pembayaran");
        return;
      }

      const status = data.order?.status;
      if (status === "success") {
        setNotice("Pembayaran terkonfirmasi. Undangan Anda sudah aktif.");
      } else if (status === "failed") {
        setNotice("Pembayaran dibatalkan atau kedaluwarsa. Silakan buat pesanan baru.");
      } else if (!data.midtrans?.transactionStatus) {
        setNotice("Belum ada pembayaran yang tercatat untuk pesanan ini.");
      } else {
        setNotice(`Status di Midtrans masih "${data.midtrans.transactionStatus}". Selesaikan pembayaran lalu cek kembali.`);
      }

      await fetchOrders();
    } catch (error) {
      setNotice("Gagal memeriksa status pembayaran");
    } finally {
      setCheckingId(null);
    }
  };

  /**
   * Batalkan pesanan pending agar user bisa memilih metode lain.
   * Nomor VA terikat pada satu order di Midtrans, jadi metode tidak bisa
   * ditukar pada pesanan yang sama.
   */
  const handleGantiMetode = async (id: string) => {
    if (!confirm("Batalkan pesanan ini dan pilih metode pembayaran lain?")) return;
    setCancelingId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error || "Gagal membatalkan pesanan");
        return;
      }
      setNotice("Pesanan dibatalkan. Pilih metode pembayaran lalu tekan Bayar Sekarang.");
      await fetchOrders();
    } catch (error) {
      setNotice("Gagal membatalkan pesanan");
    } finally {
      setCancelingId(null);
    }
  };

  const methods = [
    { id: "qris" as Method, label: "QRIS", icon: QrCode, desc: "Scan untuk bayar dari semua e-wallet & bank" },
    { id: "transfer" as Method, label: "Bank Transfer", icon: Landmark, desc: "BCA, BNI, Mandiri, BRI" },
    { id: "ewallet" as Method, label: "E-Wallet", icon: Wallet, desc: "GoPay, OVO, DANA, ShopeePay" },
  ];

  const activeOrder = transactions.find((trx) => trx.status === "success");
  const pendingOrder = transactions.find((trx) => trx.status === "pending");
  const currentPackage =
    PACKAGE_LIST.find((pkg) => pkg.name === selectedPackage) ?? PACKAGE_LIST[0];

  const isSnapExpired = (trx: Transaction) =>
    !trx.snapRedirectUrl || (trx.snapExpiresAt ? new Date(trx.snapExpiresAt) < new Date() : false);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Pembayaran</h1>
        <p className="mt-1 text-muted-foreground">Pilih metode pembayaran untuk mengaktifkan undangan.</p>
      </div>

      {notice && (
        <div role="status" aria-live="polite" className="mb-6 card-custom border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{notice}</p>
            <button onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan" className="text-muted-foreground hover:text-foreground">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {activeOrder && (
        <div className="mb-6 card-custom border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Pembayaran Terverifikasi</p>
              <p className="text-sm text-green-700">
                Pembayaran {formatCurrency(activeOrder.amount)} pada {formatDateTime(activeOrder.createdAt)} telah dikonfirmasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {!activeOrder && pendingOrder && (
        <div className="mb-6 card-custom border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">Menunggu Pembayaran</p>
                <p className="text-sm text-amber-700">
                  Pesanan {formatCurrency(pendingOrder.amount)} via {METHOD_LABELS[pendingOrder.method] || pendingOrder.method} dibuat {formatDateTime(pendingOrder.createdAt)}.
                  {isSnapExpired(pendingOrder)
                    ? " Halaman pembayaran sudah kedaluwarsa."
                    : " Lanjutkan untuk melihat kembali nomor VA / QR Anda."}
                </p>
              </div>
            </div>
            {!isSnapExpired(pendingOrder) && (
              <a href={pendingOrder.snapRedirectUrl!} className="btn-primary shrink-0 text-center">
                <ExternalLink className="mr-1 inline h-4 w-4" /> Lanjutkan Pembayaran
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-primary" /> Pilih Paket</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {PACKAGE_LIST.map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg.name)}
                  aria-pressed={selectedPackage === pkg.name}
                  className={`rounded-lg border p-4 text-left transition ${selectedPackage === pkg.name ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                >
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(pkg.price)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Aktif {pkg.activeMonths} bulan</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card-custom">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-primary" /> Pilih Metode Pembayaran</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id} className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
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

            <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              {method === "qris" && (
                <p>QRIS akan ditampilkan di halaman pembayaran setelah Anda menekan Bayar Sekarang. Scan dengan e-wallet atau mobile banking.</p>
              )}
              {method === "transfer" && (
                <p>Nomor Virtual Account akan diterbitkan otomatis di halaman pembayaran setelah Anda menekan Bayar Sekarang.</p>
              )}
              {method === "ewallet" && (
                <p>Anda akan diarahkan ke aplikasi e-wallet pilihan setelah menekan Bayar Sekarang.</p>
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
                <span className="font-medium">{currentPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-medium">{METHOD_LABELS[method]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masa Aktif</span>
                <span className="font-medium">{currentPackage.activeMonths} bulan</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(currentPackage.price)}</span>
                </div>
              </div>
            </div>
            <button onClick={handleBayar} disabled={paying} className="btn-primary mt-4 w-full">{paying ? "Mengalihkan ke pembayaran..." : "Bayar Sekarang"}</button>
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
                  <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr key={trx.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{trx.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(trx.createdAt)}</td>
                    <td className="px-4 py-3">{METHOD_LABELS[trx.method] || trx.method}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(trx.amount)}</td>
                    <td className="px-4 py-3">
                      {trx.status === "success" ? <span className="badge-success">Berhasil</span> : trx.status === "pending" ? <span className="badge-warning"><Clock className="mr-1 inline h-3 w-3" /> Pending</span> : <span className="badge-danger">Gagal</span>}
                    </td>
                    <td className="px-4 py-3">
                      {trx.status === "pending" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {isSnapExpired(trx) ? (
                            <span className="text-xs text-muted-foreground">Halaman pembayaran kedaluwarsa</span>
                          ) : (
                            <a
                              href={trx.snapRedirectUrl!}
                              className="inline-flex items-center gap-1 rounded-md border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                            >
                              <ExternalLink className="h-3 w-3" /> Lanjutkan
                            </a>
                          )}
                          <button
                            onClick={() => handleCekStatus(trx.id)}
                            disabled={checkingId === trx.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${checkingId === trx.id ? "animate-spin" : ""}`} />
                            {checkingId === trx.id ? "Memeriksa..." : "Cek Status"}
                          </button>
                          <button
                            onClick={() => handleGantiMetode(trx.id)}
                            disabled={cancelingId === trx.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                          >
                            {cancelingId === trx.id ? "Membatalkan..." : "Ganti Metode"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
