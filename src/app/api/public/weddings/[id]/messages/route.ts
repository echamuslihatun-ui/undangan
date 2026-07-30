import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

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

    const { guestName, message } = await req.json();

    if (!guestName || !message) {
      return NextResponse.json({ error: "Nama dan ucapan harus diisi" }, { status: 400 });
    }

    const wedding = await prisma.wedding.findUnique({ where: { id: params.id } });
    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    const newMessage = await prisma.message.create({
      data: {
        weddingId: wedding.id,
        guestName,
        message,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Public message create error:", error);
    return NextResponse.json({ error: "Gagal mengirim ucapan" }, { status: 500 });
  }
}