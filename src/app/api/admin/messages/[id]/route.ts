import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isApproved } = await req.json();
    if (typeof isApproved !== "boolean") {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const message = await prisma.message.update({
      where: { id: params.id },
      data: { isApproved },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Message update error:", error);
    return NextResponse.json({ error: "Gagal update pesan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.message.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Message delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus pesan" }, { status: 500 });
  }
}
