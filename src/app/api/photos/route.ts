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

    const photos = await prisma.photo.findMany({
      where: { weddingId: wedding.id },
      orderBy: { order: "asc", createdAt: "desc" },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Photos fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data foto" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { url, caption, category, order } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL foto harus diisi" }, { status: 400 });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { userId },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Data pernikahan tidak ditemukan" }, { status: 404 });
    }

    const photo = await prisma.photo.create({
      data: {
        weddingId: wedding.id,
        url,
        caption,
        category,
        order: order || 0,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Photo create error:", error);
    return NextResponse.json({ error: "Gagal menambah foto" }, { status: 500 });
  }
}