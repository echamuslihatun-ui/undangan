import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
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
      return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    }

    const rsvps = await prisma.rSVP.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("RSVP fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data RSVP" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, email, phone, attendanceStatus, numberOfGuests, message } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Nama dan nomor WhatsApp harus diisi" }, { status: 400 });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { userId },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Data pernikahan tidak ditemukan" }, { status: 404 });
    }

    const rsvp = await prisma.rSVP.create({
      data: {
        weddingId: wedding.id,
        userId,
        name,
        email,
        phone,
        attendanceStatus: attendanceStatus || "pending",
        numberOfGuests: numberOfGuests || 1,
        message,
      },
    });

    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    console.error("RSVP create error:", error);
    return NextResponse.json({ error: "Gagal membuat RSVP" }, { status: 500 });
  }
}