import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activeWeddingWhere } from "@/lib/public-wedding";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const idOrSlug = params.id;
    const session = await getServerSession(authOptions);

    if (session) {
      const userId = session.user.id;
      const guest = await prisma.guest.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          wedding: { userId },
        },
      });

      if (!guest) {
        return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
      }

      return NextResponse.json(guest);
    }

    const rateLimit = checkRateLimit(getRateLimitIdentifier(req, "guest-lookup"), {
      windowMs: 60_000,
      max: 30,
    });
    if (rateLimit.limited) {
      return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
    }

    const url = new URL(req.url);
    const weddingId = url.searchParams.get("weddingId");
    const weddingSlug = url.searchParams.get("weddingSlug");

    if (!weddingId && !weddingSlug) {
      return NextResponse.json({ error: "Konteks undangan wajib disertakan" }, { status: 400 });
    }

    const guest = await prisma.guest.findFirst({
      where: {
        slug: idOrSlug,
        wedding: activeWeddingWhere(weddingId || weddingSlug || ""),
      },
      select: { id: true, name: true, phone: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(guest, { headers: { "Cache-Control": "no-store" } });

  } catch (error) {
    console.error("Guest fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tamu" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => null);
    const status = body?.status;

    // Hanya izinkan status yang dikenal.
    if (!["pending", "sent", "confirmed"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const guest = await prisma.guest.findFirst({
      where: { id: params.id, wedding: { userId } },
    });

    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Guest update error:", error);
    return NextResponse.json({ error: "Gagal mengubah status tamu" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const wedding = await prisma.wedding.findUnique({
      where: { userId },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Data pernikahan tidak ditemukan" }, { status: 404 });
    }

    const guest = await prisma.guest.findFirst({
      where: { id: params.id, wedding: { userId } },
    });

    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    await prisma.guest.delete({
      where: { id: guest.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus tamu" }, { status: 500 });
  }
}
