import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { activeWeddingWhere, normalizeText } from "@/lib/public-wedding";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Rate limit: 10 pesan per menit per IP
    const identifier = getRateLimitIdentifier(req, "messages");
    const rateLimit = checkRateLimit(identifier, { windowMs: 60 * 1000, max: 10 });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const guestSlug = normalizeText(body.guestSlug, 160);
    const message = normalizeText(body.message, 500);

    if (!guestSlug || !message) {
      return NextResponse.json({ error: "Tautan tamu dan ucapan harus valid" }, { status: 400 });
    }

    const wedding = await prisma.wedding.findFirst({
      where: activeWeddingWhere(params.id),
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    const guest = await prisma.guest.findFirst({
      where: { slug: guestSlug, weddingId: wedding.id },
      select: { name: true },
    });
    if (!guest) {
      return NextResponse.json({ error: "Tautan undangan tidak valid" }, { status: 403 });
    }

    const newMessage = await prisma.message.create({
      data: {
        weddingId: wedding.id,
        guestName: guest.name,
        message,
      },
      select: { id: true, isApproved: true },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Public message create error:", error);
    return NextResponse.json({ error: "Gagal mengirim ucapan" }, { status: 500 });
  }
}