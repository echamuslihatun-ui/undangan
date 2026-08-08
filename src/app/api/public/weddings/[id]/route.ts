import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activeWeddingWhere } from "@/lib/public-wedding";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const rateLimit = checkRateLimit(getRateLimitIdentifier(req, "public-wedding"), {
      windowMs: 60_000,
      max: 30,
    });
    if (rateLimit.limited) {
      return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    }

    const guestSlug = new URL(req.url).searchParams.get("to")?.trim();
    if (!guestSlug) {
      return NextResponse.json({ error: "Tautan undangan tidak valid" }, { status: 403 });
    }

    const wedding = await prisma.wedding.findFirst({
      where: activeWeddingWhere(params.id),
      include: {
        photoAlbum: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
        messages: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, guestName: true, message: true, createdAt: true },
        },
      },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    const guest = await prisma.guest.findFirst({
      where: { slug: guestSlug, weddingId: wedding.id },
      select: { name: true, phone: true },
    });
    if (!guest) {
      return NextResponse.json({ error: "Tautan undangan tidak valid" }, { status: 403 });
    }

    // Never expose ownership and other internal lifecycle data publicly.
    const { userId, customDomain, ...publicWedding } = wedding;
    void userId;
    void customDomain;

    // `private` (bukan `public`) karena response berisi data tamu spesifik
    // (nama & telepon) — cache hanya boleh disimpan di browser pengguna,
    // tidak di CDN bersama. `max-age=60` meredam beban database untuk tamu
    // yang membuka ulang undangan beberapa kali tanpa data basi yang nyata.
    return NextResponse.json({ wedding: publicWedding, guest }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.error("Public wedding fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil undangan" }, { status: 500 });
  }
}
