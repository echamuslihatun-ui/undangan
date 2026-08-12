import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPackage } from "@/lib/packages";
import {
  createRandomCode,
  normalizeString,
  optionalHttpUrl,
  optionalInstagram,
  optionalString,
  parseOptionalDate,
} from "@/lib/input";

const THEME_KEYS = ["classic", "modern", "elegant"] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function optionalTime(value: unknown): string | null {
  const time = optionalString(value, 5);
  if (time && !TIME_PATTERN.test(time)) throw new Error("Format jam tidak valid");
  return time;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      console.error("Wedding fetch error: missing userId in session", session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { userId },
      include: { guests: true },
    });

    return NextResponse.json(wedding);
  } catch (error) {
    console.error("Wedding fetch error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      console.error("Wedding update error: missing userId in session", session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }
    const partner1 = normalizeString(body.partner1, 100);
    const partner2 = normalizeString(body.partner2, 100);
    if (!partner1 || !partner2) {
      return NextResponse.json({ error: "Nama kedua mempelai wajib diisi" }, { status: 400 });
    }
    if (body.themeKey && !THEME_KEYS.includes(body.themeKey)) {
      return NextResponse.json({ error: "Tema tidak valid" }, { status: 400 });
    }
    const story = Array.isArray(body.story) ? body.story.slice(0, 20) : [];
    const photos = Array.isArray(body.photos) ? body.photos.slice(0, 30) : [];
    const bankAccounts = Array.isArray(body.bankAccounts) ? body.bankAccounts.slice(0, 10) : [];
    const allowedData: Record<string, unknown> = {
      partner1,
      partner2,
      nickname1: optionalString(body.nickname1, 100),
      nickname2: optionalString(body.nickname2, 100),
      parent1: optionalString(body.parent1, 200),
      parent2: optionalString(body.parent2, 200),
      fatherPria: optionalString(body.fatherPria, 100),
      motherPria: optionalString(body.motherPria, 100),
      fatherWanita: optionalString(body.fatherWanita, 100),
      motherWanita: optionalString(body.motherWanita, 100),
      themeKey: body.themeKey || "classic",
      // Akad
      akadDate: parseOptionalDate(body.akadDate),
      akadStart: optionalTime(body.akadStart),
      akadEnd: optionalTime(body.akadEnd),
      akadVenue: optionalString(body.akadVenue, 300),
      akadMapsUrl: optionalHttpUrl(body.akadMapsUrl),
      // Resepsi
      resepsiDate: parseOptionalDate(body.resepsiDate),
      resepsiStart: optionalTime(body.resepsiStart),
      resepsiEnd: optionalTime(body.resepsiEnd),
      resepsiVenue: optionalString(body.resepsiVenue, 300),
      resepsiMapsUrl: optionalHttpUrl(body.resepsiMapsUrl),
      location: optionalString(body.location, 300),
      mapsUrl: optionalHttpUrl(body.mapsUrl),
      message: optionalString(body.message, 2000),
      quote: optionalString(body.quote, 1000),
      quoteSource: optionalString(body.quoteSource, 200),
      // Media
      heroImage: body.heroImage,
      quoteImage: body.quoteImage,
      photoPria: body.photoPria,
      photoWanita: body.photoWanita,
      // Validasi & normalisasi URL Instagram: hanya username yang disimpan
      // (bukan URL penuh), dan URL asing ditolak demi keamanan render.
      instagram1: optionalInstagram(body.instagram1),
      instagram2: optionalInstagram(body.instagram2),
      // Section cerita cinta ditentukan murni oleh ada/tidaknya item cerita:
      // bila daftar dikosongkan, section otomatis tidak tampil di undangan.
      storyEnabled: story.length > 0,
      // JSONB: simpan array langsung (bukan string JSON) agar bisa di-query
      // dengan operator PostgreSQL dan tidak perlu di-parse manual.
      story: story,
      photos: photos,
      musicUrl: optionalHttpUrl(body.musicUrl),
      bankName: optionalString(body.bankName, 100),
      bankAccount: optionalString(body.bankAccount, 100),
      bankHolder: optionalString(body.bankHolder, 100),
      bankAccounts: bankAccounts,
      qrisImage: optionalHttpUrl(body.qrisImage),
      liveStreamUrl: optionalHttpUrl(body.liveStreamUrl),
      customDomain: optionalString(body.customDomain, 253)?.toLowerCase() ?? null,
    };

    // Slug dibuat SEKALI saja dan tidak pernah diubah pada update biasa,
    // supaya link tamu yang sudah disebar tidak putus. Slug diambil dari
    // nama panggilan (fallback ke nama lengkap) dengan pemisah "-" dan
    // hanya mengandung [a-z0-9-] (TIDAK boleh ada "&" karena akan memecah
    // query string pada link tamu: /rsvp?wedding=<slug>&to=<guestSlug>).
    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const buildSlug = () => {
      const first = (body.nickname1 || body.partner1 || "").trim();
      const second = (body.nickname2 || body.partner2 || "").trim();
      const base = slugify([first, second].filter(Boolean).join("-")) || "undangan";
      const randomCode = createRandomCode(6);
      // Sanitasi akhir agar slug DIJAMIN hanya mengandung [a-z0-9-] sejak awal,
      // bukan hanya diperbaiki belakangan lewat healing.
      const slug = slugify(`${base}-${randomCode}`);
      return slug || `undangan-${randomCode}`;
    };


    // Cek apakah record sudah punya slug valid. Jika belum (record baru atau
    // slug lama kosong/rusak), barulah generate slug baru.
    const existing = await prisma.wedding.findUnique({
      where: { userId },
      select: { slug: true },
    });

    // Slug dianggap valid hanya jika ada DAN hanya mengandung [a-z0-9-].
    // Slug lama yang mengandung karakter ilegal (mis. "&") akan memecah query
    // string pada link tamu, jadi harus di-"heal" tanpa mengubah kode acaknya
    // agar link yang sudah tersebar tetap semirip mungkin.
    const isValidSlug = (value: string | null | undefined) =>
      !!value && /^[a-z0-9-]+$/.test(value);

    if (!existing || !existing.slug) {
      (allowedData as any).slug = buildSlug();
    } else if (!isValidSlug(existing.slug)) {
      // Bersihkan karakter ilegal dari slug lama (mis. "imam&wanda-e9vk" ->
      // "imam-wanda-e9vk") sambil mempertahankan struktur/kode acaknya.
      const healedSlug =
        slugify(existing.slug) || buildSlug();
      (allowedData as any).slug = healedSlug;
    }


    // Aktivasi tertunda: bila user sudah membayar SEBELUM mengisi data
    // pernikahan, `markOrderPaid` melewati aktivasi karena wedding belum ada.
    // Saat wedding pertama kali dibuat, aktifkan undangan berdasarkan order
    // sukses terbaru agar masa aktif tetap diberikan. (Hanya saat create,
    // supaya update biasa tidak menggeser/menimpa masa aktif yang berjalan.)
    let activation: { status: string; activeUntil: Date } | null = null;
    if (!existing) {
      const paidOrder = await prisma.order.findFirst({
        where: { userId, status: "success" },
        orderBy: { createdAt: "desc" },
        select: { packageName: true },
      });

      if (paidOrder) {
        const activeMonths = getPackage(paidOrder.packageName).activeMonths;
        const activeUntil = new Date();
        activeUntil.setMonth(activeUntil.getMonth() + activeMonths);
        activation = { status: "active", activeUntil };
      }
    }

    const createData = {
      userId,
      partner1,
      partner2,
      slug: (allowedData as any).slug ?? buildSlug(),
      ...allowedData,
      ...(activation ?? {}),
    };

    const wedding = await prisma.wedding.upsert({
      where: { userId },
      update: allowedData,
      create: createData,
    });

    return NextResponse.json(wedding);
  } catch (error) {
    console.error("Wedding update error:", error);
    if (error instanceof Error && ["Tanggal tidak valid", "URL tidak valid", "Format jam tidak valid"].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}