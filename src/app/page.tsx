"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  Palette,
  Music,
  Image as ImageIcon,
  QrCode,
  CreditCard,
  Users,
  MessageCircle,
  Check,
  ChevronDown,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  image: string;
}

const pricing = [
  {
    name: "Basic",
    price: 150000,
    description: "Untuk pernikahan sederhana",
    features: ["1 Template pilihan", "Maksimal 100 tamu", "Galeri foto (5 foto)", "Musik background", "Amplop digital", "Link undangan aktif 3 bulan"],
    popular: false,
  },
  {
    name: "Premium",
    price: 250000,
    description: "Paling populer untuk acara istimewa",
    features: ["Semua template", "Tamu tak terbatas", "Galeri foto (20 foto)", "Musik background", "Amplop digital + QRIS", "Hitung mundur acara", "RSVP tamu", "Link aktif 6 bulan"],
    popular: true,
  },
  {
    name: "Exclusive",
    price: 500000,
    description: "Fitur lengkap & prioritas",
    features: ["Semua fitur Premium", "Galeri foto tak terbatas", "Video streaming", "Custom domain", "Prioritas support", "Link aktif 12 bulan"],
    popular: false,
  },
];

const features = [
  { icon: Palette, title: "Kustomisasi Penuh", desc: "Sesuaikan warna, font, dan layout sesuai tema pernikahan Anda." },
  { icon: ImageIcon, title: "Galeri Foto", desc: "Bagikan momen indah dengan galeri foto prewedding." },
  { icon: Music, title: "Musik Background", desc: "Pilih lagu favorit untuk menemani undangan digital." },
  { icon: QrCode, title: "Amplop Digital", desc: "Terima hadiah dengan QRIS dan nomor rekening." },
  { icon: CreditCard, title: "Pembayaran Mudah", desc: "Bayar via QRIS, Bank Transfer, atau E-Wallet." },
  { icon: Users, title: "Kelola Tamu", desc: "Input tamu manual atau import dari Excel." },
  { icon: MessageCircle, title: "Sebar via WhatsApp", desc: "Kirim undangan ke tamu langsung lewat WhatsApp." },
  { icon: ShieldCheck, title: "Aman & Terpercaya", desc: "Data Anda terlindungi dengan enkripsi penuh." },
];

const steps = [
  { icon: Palette, title: "Pilih Template", desc: "Pilih dari koleksi template elegan kami." },
  { icon: Sparkles, title: "Kustomisasi", desc: "Isi data acara, unggah foto & musik." },
  { icon: CreditCard, title: "Bayar", desc: "Pilih metode pembayaran yang tersedia." },
  { icon: MessageCircle, title: "Sebar Undangan", desc: "Bagikan link undangan via WhatsApp." },
];

const faqs = [
  { q: "Apakah saya perlu install aplikasi?", a: "Tidak. Undanganku berbasis web, cukup buka via browser di HP atau komputer." },
  { q: "Berapa lama undangan aktif?", a: "Tergantung paket: Basic 3 bulan, Premium 6 bulan, Exclusive 12 bulan." },
  { q: "Bagaimana cara sebar undangan ke tamu?", a: "Anda bisa input tamu satu per satu atau import Excel, lalu klik 'Kirim via WA' untuk membuka WhatsApp dengan teks otomatis." },
  { q: "Metode pembayaran apa saja yang didukung?", a: "Kami mendukung QRIS, Bank Transfer (BCA, BNI, Mandiri), dan E-Wallet (GoPay, OVO, DANA)." },
  { q: "Apakah bisa ganti template setelah bayar?", a: "Ya, Anda bisa ganti template selama undangan masih aktif." },
  { q: "Apakah data tamu saya aman?", a: "Ya. Semua data terenkripsi dan hanya Anda yang dapat melihatnya." },
];

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-primary/5" />
          <div className="container-custom relative py-20 md:py-28">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" /> Undangan Digital Pernikahan
                </div>
                <h1 className="mt-6 font-serif text-4xl font-bold leading-tight md:text-6xl">
                  Undangan Pernikahan <span className="text-primary">Elegan</span> & Modern
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Buat undangan pernikahan digital yang memukau dalam hitungan menit. Pilih template, kustomisasi, bayar, dan sebar ke tamu via WhatsApp.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#template" className="btn-primary">Lihat Template</a>
                  <a href="#harga" className="btn-outline">Lihat Harga</a>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Tanpa instalasi</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Sebar via WA</div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                  <Image src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800" alt="Undangan Pernikahan" fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="absolute -bottom-6 -left-6 hidden rounded-xl bg-white p-4 shadow-lg md:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">10,000+</p>
                      <p className="text-xs text-muted-foreground">Tamu terundang</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="container-custom py-16">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Cara Kerja</h2>
              <p className="mt-3 text-muted-foreground">Empat langkah mudah menuju undangan impian</p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="mt-4 text-sm font-bold text-primary">Langkah {i + 1}</div>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="template" className="py-20">
          <div className="container-custom">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Pilihan Template</h2>
              <p className="mt-3 text-muted-foreground">Temukan desain yang sesuai dengan tema pernikahan Anda</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <div key={tpl.id} className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-lg">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={tpl.image} alt={tpl.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition group-hover:scale-105" />
                    <div className="absolute top-3 left-3">
                      <span className="badge-muted bg-white/90">{tpl.category}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{tpl.name}</h3>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <button type="button" onClick={() => setPreviewTemplate(tpl)} className="btn-secondary w-full">Preview</button>
                      <a href={`/register?templateId=${tpl.id}`} className="btn-primary w-full">Pilih Template</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="harga" className="border-y border-border bg-muted/30 py-20">
          <div className="container-custom">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Harga Paket</h2>
              <p className="mt-3 text-muted-foreground">Pilih paket yang sesuai dengan kebutuhan Anda</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricing.map((pkg) => (
                <div key={pkg.name} className={`relative rounded-2xl border bg-white p-6 shadow-sm ${pkg.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge-success bg-primary px-3 py-1 text-primary-foreground">Populer</span>
                    </div>
                  )}
                  <h3 className="font-serif text-2xl font-bold">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{formatCurrency(pkg.price)}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="/register" className={`mt-6 w-full ${pkg.popular ? "btn-primary" : "btn-secondary"}`}>Pilih Paket</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="py-20">
          <div className="container-custom">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Fitur Unggulan</h2>
              <p className="mt-3 text-muted-foreground">Semua yang Anda butuhkan untuk undangan pernikahan digital</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feat, i) => (
                <div key={i} className="card-custom">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feat.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-custom">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
              <div className="relative">
                <Zap className="mx-auto h-12 w-12" />
                <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Siap Membuat Undangan?</h2>
                <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
                  Gabung sekarang dan buat undangan pernikahan digital yang tak terlupakan.
                </p>
                <a href="/register" className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90">Mulai Sekarang</a>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-muted/30 py-20">
          <div className="container-custom">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Pertanyaan Umum</h2>
              <p className="mt-3 text-muted-foreground">Jawaban untuk pertanyaan yang sering diajukan</p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-border bg-white p-4">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    {faq.q}
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold">Preview Template</h2>
                  <p className="text-sm text-muted-foreground">{previewTemplate.category}</p>
                </div>
                <button onClick={() => setPreviewTemplate(null)} className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-3xl bg-border/30 p-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-white">
                    <Image src={previewTemplate.image} alt={previewTemplate.name} fill className="object-cover" />
                  </div>
                </div>
                <div className="space-y-4 rounded-3xl bg-muted p-4">
                  <div>
                    <h3 className="text-xl font-semibold">{previewTemplate.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Template ini dapat dipilih saat mendaftar. Preview yang ditampilkan adalah contoh desain, termasuk tata letak dan gaya teks.</p>
                  <a href={`/register?templateId=${previewTemplate.id}`} className="btn-primary w-full">Pilih Template Ini</a>
                  <button onClick={() => setPreviewTemplate(null)} className="btn-secondary w-full">Tutup Preview</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
