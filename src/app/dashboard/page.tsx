"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Palette, Eye, CreditCard, Users, CheckCircle, Clock, Calendar, Heart } from "lucide-react";
import { formatDate } from "@/lib/utils";

const steps = [
  { href: "/dashboard/kustomisasi", icon: Palette, title: "Kustomisasi Undangan", desc: "Isi data acara, foto, musik & amplop digital", status: "done" },
  { href: "/dashboard/preview", icon: Eye, title: "Preview Undangan", desc: "Lihat hasil undangan sebelum dibagikan", status: "done" },
  { href: "/dashboard/pembayaran", icon: CreditCard, title: "Pembayaran", desc: "Pilih metode pembayaran & selesaikan transaksi", status: "done" },
  { href: "/dashboard/tamu", icon: Users, title: "Kelola Tamu", desc: "Input tamu & sebar undangan via WhatsApp", status: "active" },
];

interface Wedding {
  id: string;
  partner1: string;
  partner2: string;
  akadDate: string | null;
  resepsiDate: string | null;
  location: string | null;
  status: string;
  guests: { id: string }[];
}

interface RSVPItem {
  id: string;
  attendanceStatus: string;
}

export default function DashboardPage() {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [weddingRes, rsvpRes] = await Promise.all([
          fetch("/api/wedding"),
          fetch("/api/rsvp"),
        ]);
        if (weddingRes.ok) {
          const data = await weddingRes.json();
          setWedding(data);
        }
        if (rsvpRes.ok) {
          const rsvps: RSVPItem[] = await rsvpRes.json();
          setRsvpCount(rsvps.filter((r) => r.attendanceStatus === "confirmed").length);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = wedding
    ? [
        { label: "Status Undangan", value: wedding.status === "active" ? "Aktif" : wedding.status === "draft" ? "Draft" : "Kedaluwarsa", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
        { label: "Total Tamu", value: String(wedding.guests.length), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Tamu Konfirmasi", value: String(rsvpCount), icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Hari Menuju Acara", value: wedding.resepsiDate ? String(Math.max(0, Math.ceil((new Date(wedding.resepsiDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))) : "-", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
      ]
    : [
        { label: "Status Undangan", value: "Belum Disesuaikan", icon: CheckCircle, color: "text-gray-600", bg: "bg-gray-100" },
        { label: "Total Tamu", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Tamu Konfirmasi", value: "0", icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Hari Menuju Acara", value: "-", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
      ];

  const eventDate = wedding?.resepsiDate || wedding?.akadDate || null;
  const partnerText = wedding ? `${wedding.partner1} & ${wedding.partner2}` : "Mempelai";

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Selamat Datang! 👋</h1>
        <p className="mt-1 text-muted-foreground">Kelola undangan pernikahan Anda dari sini.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card-custom bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-bold">{partnerText}</h2>
            <p className="text-sm text-muted-foreground">{eventDate ? formatDate(eventDate) : "Tanggal acara belum diatur"} {wedding?.location ? `• ${wedding.location}` : ""}</p>
          </div>
          <Link href="/dashboard/preview" className="btn-primary">Lihat Undangan</Link>
        </div>
      </div>

      <h2 className="mt-8 mb-4 font-serif text-xl font-bold">Langkah Persiapan</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, i) => (
          <Link key={i} href={step.href} className="card-custom flex items-start gap-4 transition hover:shadow-md">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${step.status === "done" ? "bg-green-100" : step.status === "active" ? "bg-primary/10" : "bg-muted"}`}>
              {step.status === "done" ? <CheckCircle className="h-6 w-6 text-green-600" /> : <step.icon className={`h-6 w-6 ${step.status === "active" ? "text-primary" : "text-muted-foreground"}`} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{step.title}</h3>
                {step.status === "done" && <span className="badge-success">Selesai</span>}
                {step.status === "active" && <span className="badge-warning">Aktif</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 card-custom border-primary/20 bg-primary/5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Sebar Undangan ke Tamu</p>
              <p className="text-sm text-muted-foreground">Bagikan link undangan via WhatsApp ke semua tamu Anda.</p>
            </div>
          </div>
          <Link href="/dashboard/tamu" className="btn-primary">Sebar Sekarang</Link>
        </div>
      </div>
    </div>
  );
}
