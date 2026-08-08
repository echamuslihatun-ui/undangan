import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";
import { activeWeddingWhere, isRsvpStatus, normalizeText } from "@/lib/public-wedding";
import { sendTransactionalEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

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

    const body = await req.json();
    const guestSlug = normalizeText(body.guestSlug, 160);
    const email = normalizeText(body.email, 254);
    const message = normalizeText(body.message, 1000);

    if (!isRsvpStatus(body.attendanceStatus)) {
      return NextResponse.json({ error: "Status kehadiran tidak valid" }, { status: 400 });
    }
    const attendanceStatus = body.attendanceStatus;

    // Batasi jumlah tamu 1–10 agar konsisten dengan UI dan mencegah nilai
    // negatif / sangat besar yang bisa merusak rekap kehadiran.
    const parsedGuests = Number(body.numberOfGuests);
    const safeNumberOfGuests =
      attendanceStatus === "confirmed" && Number.isFinite(parsedGuests) && parsedGuests >= 1
        ? Math.min(Math.floor(parsedGuests), 10)
        : 1;


    // RSVP hanya boleh lewat tautan pribadi tamu (?to=<guestSlug>).
    if (!guestSlug) {
      return NextResponse.json(
        { error: "RSVP hanya dapat diisi melalui tautan undangan pribadi Anda." },
        { status: 403 }
      );
    }

    const wedding = await prisma.wedding.findFirst({
      where: activeWeddingWhere(params.id),
      select: { id: true, userId: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    // Pastikan tamu valid DAN milik undangan ini.
    const guest = await prisma.guest.findFirst({
      where: { slug: guestSlug, weddingId: wedding.id },
      select: { id: true, name: true, phone: true },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Tautan undangan tidak valid untuk undangan ini." },
        { status: 403 }
      );
    }

    const rsvp = await prisma.$transaction(async (tx) => {
      const created = await tx.rSVP.create({
        data: {
          weddingId: wedding.id,
          userId: wedding.userId,
          guestId: guest.id,
          name: guest.name,
          email: email || null,
          phone: guest.phone,
          attendanceStatus,
          numberOfGuests: safeNumberOfGuests,
          message: message || null,
        },
      });

      await tx.guest.update({
        where: { id: guest.id },
        data: { status: attendanceStatus === "confirmed" ? "confirmed" : "sent" },
      });
      return created;
    });

    // Kirim notifikasi email ke pemilik undangan bahwa ada RSVP baru.
    // Gagal mengirim email TIDAK menggagalkan RSVP — hanya dicatat di log.
    try {
      const owner = await prisma.user.findUnique({
        where: { id: wedding.userId },
        select: { email: true, name: true },
      });
      if (owner?.email) {
        await sendTransactionalEmail(owner.email, "new_rsvp", {
          name: guest.name,
          detail: `${attendanceStatus === "confirmed" ? "Hadir" : "Tidak hadir"} — ${safeNumberOfGuests} tamu`,
        });
      }
    } catch (emailError) {
      logger.error("Gagal mengirim email notifikasi RSVP", emailError, { weddingId: wedding.id });
    }

    return NextResponse.json(rsvp, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Anda sudah mengisi RSVP sebelumnya. Terima kasih!" },
        { status: 409 }
      );
    }
    console.error("Public RSVP create error:", error);
    return NextResponse.json({ error: "Gagal mengirim RSVP" }, { status: 500 });
  }
}