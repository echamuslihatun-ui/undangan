"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Lock, Save, Eye, EyeOff, Crown, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Subscription {
  packageName: string; // Free | Basic | Premium | Exclusive
  activeUntil: string | null;
  daysRemaining: number | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  subscription?: Subscription;
}

// Warna badge per paket.
const PACKAGE_STYLES: Record<string, string> = {
  Free: "bg-gray-100 text-gray-700 border-gray-200",
  Basic: "bg-blue-100 text-blue-700 border-blue-200",
  Premium: "bg-purple-100 text-purple-700 border-purple-200",
  Exclusive: "bg-amber-100 text-amber-700 border-amber-200",
};


export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      showToast("error", "Untuk ganti password, isi Password Saat Ini dan Password Baru");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, unknown> = { name };
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("success", "Profil berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        // Refresh profile
        const refreshRes = await fetch("/api/profile");
        if (refreshRes.ok) setProfile(await refreshRes.json());
      } else {
        const err = await res.json();
        showToast("error", err.error || "Gagal update profil");
      }
    } catch (error) {
      showToast("error", "Gagal update profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Profil Saya</h1>
        <p className="mt-1 text-muted-foreground">Kelola informasi akun Anda.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="card-custom text-center">
            {profile?.image ? (
              <Image
                src={profile.image}
                alt={profile.name || "Foto profil"}
                width={80}
                height={80}
                className="mx-auto h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}
            <h2 className="mt-4 font-serif text-xl font-bold">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="badge-muted">{profile?.role === "admin" ? "Admin" : "Pelanggan"}</span>
              {profile?.createdAt && (
                <span className="badge-muted">Bergabung {new Date(profile.createdAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</span>
              )}
            </div>
          </div>

          {/* Status Paket Langganan */}
          <div className="card-custom">
            <h2 className="flex items-center gap-2 font-semibold">
              <Crown className="h-5 w-5 text-primary" /> Paket Langganan
            </h2>

            {(() => {
              const sub = profile?.subscription;
              const pkg = sub?.packageName ?? "Free";
              const badgeStyle = PACKAGE_STYLES[pkg] ?? PACKAGE_STYLES.Free;
              const isFree = pkg === "Free";

              return (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paket saat ini</span>
                    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${badgeStyle}`}>
                      {pkg}
                    </span>
                  </div>

                  {isFree ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Anda menggunakan paket gratis. Tingkatkan ke paket berbayar untuk
                        mengaktifkan undangan Anda.
                      </p>
                      <Link href="/dashboard/pembayaran" className="btn-primary w-full justify-center">
                        Upgrade Paket
                      </Link>
                    </>
                  ) : (
                    <>
                      {sub?.activeUntil && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Aktif hingga</span>
                          <span className="text-sm font-medium">
                            {new Date(sub.activeUntil).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {typeof sub?.daysRemaining === "number" && (
                        <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            Berakhir dalam{" "}
                            <span className="font-semibold text-primary">
                              {sub.daysRemaining} hari
                            </span>{" "}
                            lagi
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>


        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="card-custom space-y-6">
            <h2 className="flex items-center gap-2 font-semibold"><User className="h-5 w-5 text-primary" /> Informasi Akun</h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-custom pl-10" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={profile?.email || ""} disabled className="input-custom pl-10 bg-muted/50 cursor-not-allowed" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>

            <hr className="border-border" />

            <h2 className="flex items-center gap-2 font-semibold"><Lock className="h-5 w-5 text-primary" /> Ganti Password</h2>
            <p className="text-sm text-muted-foreground">Kosongkan jika tidak ingin mengganti password.</p>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-custom pl-10" placeholder="Masukkan password saat ini" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-custom pl-10 pr-10" placeholder="Minimal 8 karakter" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}