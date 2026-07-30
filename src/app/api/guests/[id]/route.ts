import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const idOrSlug = params.id;
    const session = await getServerSession(authOptions);

    if (session) {
      const userId = (session.user as any).id;
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

    const guest = await prisma.guest.findFirst({
      where: { slug: idOrSlug },
    });

    if (!guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ name: guest.name, phone: guest.phone });
  } catch (error) {
    console.error("Guest fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tamu" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
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
