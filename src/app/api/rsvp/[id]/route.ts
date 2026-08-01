import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { attendanceStatus } = await req.json();

    const existing = await prisma.rSVP.findFirst({
      where: { id: params.id, wedding: { userId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "RSVP tidak ditemukan" }, { status: 404 });
    }

    const rsvp = await prisma.rSVP.update({
      where: { id: existing.id },
      data: { attendanceStatus },
    });

    return NextResponse.json(rsvp);
  } catch (error) {
    console.error("RSVP update error:", error);
    return NextResponse.json({ error: "Gagal update RSVP" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const existing = await prisma.rSVP.findFirst({
      where: { id: params.id, wedding: { userId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "RSVP tidak ditemukan" }, { status: 404 });
    }

    await prisma.rSVP.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RSVP delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus RSVP" }, { status: 500 });
  }
}