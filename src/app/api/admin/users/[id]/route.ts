import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Data status akun tidak valid" }, { status: 400 });
    }

    if ((session.user as any)?.id === id) {
      return NextResponse.json({ error: "Tidak dapat mengubah status akun sendiri" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Akun admin tidak dapat diubah statusnya" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id },
      data: { status } as any,
    });

    return NextResponse.json({ message: "Status user berhasil diubah" });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Gagal update user" }, { status: 500 });
  }
}
