import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Rate limit: 10 RSVP per menit per IP
    const identifier = getRateLimitIdentifier(req, "rsvp");
    const rateLimit = checkRateLimit(identifier, { windowMs: 60 * 1000, max: 10 });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const { name, email, phone, attendanceStatus, numberOfGuests, message, guestSlug } =
      await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan nomor WhatsApp harus diisi" }, { status: 400 });
    }

    // Batasi jumlah tamu 1–10 agar konsisten dengan UI dan mencegah nilai
    // negatif / sangat besar yang bisa merusak rekap kehadiran.
    const parsedGuests = Number(numberOfGuests);
    const safeNumberOfGuests =
      Number.isFinite(parsedGuests) && parsedGuests >= 1
        ? Math.min(Math.floor(parsedGuests), 10)
        : 1;


    // RSVP hanya boleh lewat tautan pribadi tamu (?to=<guestSlug>).
    if (!guestSlug) {
      return NextResponse.json(
        { error: "RSVP hanya dapat diisi melalui tautan undangan pribadi Anda." },
        { status: 403 }
      );
    }

    let wedding = await prisma.wedding.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });

    // If not found by ID, try to find by slug
    if (!wedding) {
      const weddingBySlug = await prisma.wedding.findFirst({
        where: { slug: params.id },
        select: { id: true, userId: true },
      });
      if (weddingBySlug) wedding = weddingBySlug;
    }

    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    // Pastikan tamu valid DAN milik undangan ini.
    const guest = await prisma.guest.findFirst({
      where: { slug: guestSlug, weddingId: wedding.id },
      select: { id: true },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Tautan undangan tidak valid untuk undangan ini." },
        { status: 403 }
      );
    }

    // Satu tamu hanya boleh mengisi RSVP satu kali.
    const existingRsvp = await prisma.rSVP.findFirst({
      where: { guestId: guest.id },
      select: { id: true },
    });


    if (existingRsvp) {
      return NextResponse.json(
        { error: "Anda sudah mengisi RSVP sebelumnya. Terima kasih!" },
        { status: 409 }
      );
    }

    const rsvp = await prisma.rSVP.create({
      data: {
        weddingId: wedding.id,
        userId: wedding.userId,
        guestId: guest.id,
        name,
        email: email || null,
        phone,
        attendanceStatus: attendanceStatus || "pending",
        numberOfGuests: safeNumberOfGuests,
        message: message || null,
      },
    });

    // Tandai tamu telah konfirmasi.
    await prisma.guest.update({
      where: { id: guest.id },
      data: { status: "confirmed" },
    });

    return NextResponse.json(rsvp, { status: 201 });

  } catch (error) {
    console.error("Public RSVP create error:", error);
    return NextResponse.json({ error: "Gagal mengirim RSVP" }, { status: 500 });
  }
}