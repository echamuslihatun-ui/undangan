import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPackage } from "@/lib/packages";

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
    const allowedData: Record<string, unknown> = {
      partner1: body.partner1,
      partner2: body.partner2,
      nickname1: body.nickname1,
      nickname2: body.nickname2,
      parent1: body.parent1,
      parent2: body.parent2,
      fatherPria: body.fatherPria,
      motherPria: body.motherPria,
      fatherWanita: body.fatherWanita,
      motherWanita: body.motherWanita,
      themeKey: body.themeKey,
      // Akad
      akadDate: body.akadDate ? new Date(body.akadDate) : null,
      akadStart: body.akadStart,
      akadEnd: body.akadEnd,
      akadVenue: body.akadVenue,
      akadMapsUrl: body.akadMapsUrl,
      // Resepsi
      resepsiDate: body.resepsiDate ? new Date(body.resepsiDate) : null,
      resepsiStart: body.resepsiStart,
      resepsiEnd: body.resepsiEnd,
      resepsiVenue: body.resepsiVenue,
      resepsiMapsUrl: body.resepsiMapsUrl,
      location: body.location,
      mapsUrl: body.mapsUrl,
      message: body.message,
      quote: body.quote,
      quoteSource: body.quoteSource,
      // Media
      heroImage: body.heroImage,
      quoteImage: body.quoteImage,
      photoPria: body.photoPria,
      photoWanita: body.photoWanita,
      instagram1: body.instagram1,
      instagram2: body.instagram2,
      // Section cerita cinta ditentukan murni oleh ada/tidaknya item cerita:
      // bila daftar dikosongkan, section otomatis tidak tampil di undangan.
      storyEnabled: Array.isArray(body.story) ? body.story.length > 0 : undefined,
      story: Array.isArray(body.story) ? JSON.stringify(body.story) : undefined,
      photos: JSON.stringify(body.photos || []),
      musicUrl: body.musicUrl,
      bankName: body.bankName,
      bankAccount: body.bankAccount,
      bankHolder: body.bankHolder,
      bankAccounts: body.bankAccounts ? JSON.stringify(body.bankAccounts) : undefined,
      qrisImage: body.qrisImage,
      customDomain: body.customDomain,
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
      const randomCode = Math.random().toString(36).replace(/[^a-z0-9]/g, "").substring(0, 4) || "0000";
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
      partner1: body.partner1 || "Pasangan",
      partner2: body.partner2 || "Undangan",
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
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}