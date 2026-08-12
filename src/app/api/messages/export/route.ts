import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { userId },
      select: { id: true, partner1: true, partner2: true },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: "desc" },
      select: {
        guestName: true,
        message: true,
        isApproved: true,
        createdAt: true,
      },
    });

    const rows = messages.map((m) => ({
      Nama: m.guestName,
      Pesan: m.message,
      Status: m.isApproved ? "Disetujui" : "Menunggu Moderasi",
      Tanggal: m.createdAt.toISOString().split("T")[0],
    }));

    const csv = createCsv(rows);
    const filename = `messages-${wedding.partner1}-${wedding.partner2}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Messages export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}
