"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Heart, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      setMessage(data.message || data.error || "Silakan coba lagi nanti.");
    } catch { setMessage("Tidak dapat mengirim permintaan. Silakan coba lagi."); }
    finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 px-4">
    <div className="card-custom w-full max-w-md">
      <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-2xl font-bold"><Heart className="h-6 w-6 text-primary" fill="currentColor" />Undanganku</Link>
      <h1 className="text-center font-serif text-2xl font-bold">Lupa Password</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Masukkan email akun Anda. Kami akan mengirim tautan reset jika akun tersedia.</p>
      {message && <p className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">{message}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Email</label>
        <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input className="input-custom pl-10" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></div>
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Mengirim..." : "Kirim Tautan Reset"}</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link className="font-medium text-primary hover:underline" href="/login">Kembali ke halaman masuk</Link></p>
    </div>
  </main>;
}