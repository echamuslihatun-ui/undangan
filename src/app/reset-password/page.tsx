"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setResult({ ok: false, text: "Konfirmasi password tidak cocok" });
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json(); setResult({ ok: response.ok, text: data.message || data.error });
    } catch { setResult({ ok: false, text: "Gagal memperbarui password" }); }
    finally { setLoading(false); }
  }
  return <div className="card-custom w-full max-w-md"><h1 className="text-center font-serif text-2xl font-bold">Buat Password Baru</h1>
    {!token ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">Tautan reset tidak valid.</p> : result?.ok ? <><p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{result.text}</p><Link href="/login" className="btn-primary mt-6 w-full">Masuk</Link></> : <form onSubmit={submit} className="mt-6 space-y-4">
      {result && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{result.text}</p>}
      <p className="text-sm text-muted-foreground">Gunakan minimal 8 karakter yang mengandung huruf dan angka.</p>
      <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/><input className="input-custom pl-10" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password baru" /></div>
      <input className="input-custom" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password baru" />
      <button className="btn-primary w-full" disabled={loading}>{loading ? "Menyimpan..." : "Simpan Password"}</button>
    </form>}
  </div>;
}

export default function ResetPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/5 px-4"><Suspense fallback={<p>Memuat...</p>}><ResetForm /></Suspense></main>; }