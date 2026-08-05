"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Verification() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [message, setMessage] = useState(token ? "Memverifikasi email..." : "Periksa inbox dan folder spam Anda untuk tautan verifikasi.");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!token) return; fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async r => ({ ok: r.ok, data: await r.json() })).then(({ ok, data }) => { setOk(ok); setMessage(data.message || data.error); }).catch(() => setMessage("Gagal memverifikasi email")); }, [token]);
  async function resend() { setLoading(true); try { const r = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const d = await r.json(); setMessage(d.message || d.error); } finally { setLoading(false); } }
  return <div className="card-custom w-full max-w-md text-center"><h1 className="font-serif text-2xl font-bold">Verifikasi Email</h1><p className={`mt-4 rounded-lg p-3 text-sm ${ok ? "bg-green-50 text-green-700" : "bg-primary/10"}`}>{message}</p>
    {ok ? <Link href="/login" className="btn-primary mt-6 w-full">Masuk ke Akun</Link> : email && <button onClick={resend} disabled={loading} className="btn-secondary mt-6 w-full">{loading ? "Mengirim..." : "Kirim Ulang Email"}</button>}
    <Link href="/login" className="mt-4 block text-sm font-medium text-primary hover:underline">Kembali ke halaman masuk</Link></div>;
}

export default function VerifyEmailPage() { return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 px-4"><Suspense fallback={<p>Memuat...</p>}><Verification /></Suspense></main>; }