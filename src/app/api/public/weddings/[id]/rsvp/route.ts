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

    const { name, email, phone, attendanceStatus, numberOfGuests, message } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan nomor WhatsApp harus diisi" }, { status: 400 });
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

    const rsvp = await prisma.rSVP.create({
      data: {
        weddingId: wedding.id,
        userId: wedding.userId,
        name,
        email: email || null,
        phone,
        attendanceStatus: attendanceStatus || "pending",
        numberOfGuests: Number(numberOfGuests) || 1,
        message: message || null,
      },
    });

    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    console.error("Public RSVP create error:", error);
    return NextResponse.json({ error: "Gagal mengirim RSVP" }, { status: 500 });
  }
}