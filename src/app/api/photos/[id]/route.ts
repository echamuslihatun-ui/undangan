import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const photo = await prisma.photo.findFirst({
      where: { id, wedding: { userId } },
    });

    if (!photo) {
      return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 });
    }

    await prisma.photo.delete({
      where: { id: photo.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus foto" }, { status: 500 });
  }
}