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

    const body = await req.json();
    const template = await prisma.template.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Template update error:", error);
    return NextResponse.json({ error: "Gagal update template" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.template.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Template berhasil dihapus" });
  } catch (error) {
    console.error("Template delete error:", error);
    return NextResponse.json({ error: "Gagal hapus template" }, { status: 500 });
  }
}