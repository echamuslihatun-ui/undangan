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

    const rsvps = await prisma.rSVP.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        email: true,
        phone: true,
        attendanceStatus: true,
        numberOfGuests: true,
        message: true,
        createdAt: true,
      },
    });

    const rows = rsvps.map((r) => ({
      Nama: r.name,
      Email: r.email || "",
      Telepon: r.phone,
      Status: r.attendanceStatus === "confirmed" ? "Hadir" : r.attendanceStatus === "declined" ? "Tidak Hadir" : "Menunggu",
      "Jumlah Tamu": String(r.numberOfGuests),
      Pesan: r.message || "",
      Tanggal: r.createdAt.toISOString().split("T")[0],
    }));

    const csv = createCsv(rows);
    const filename = `rsvp-${wedding.partner1}-${wedding.partner2}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("RSVP export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}
