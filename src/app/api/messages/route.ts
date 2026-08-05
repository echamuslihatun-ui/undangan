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

    const messages = await prisma.message.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pesan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { error: "Endpoint ini sudah tidak digunakan. Kirim ucapan melalui tautan undangan tamu." },
    { status: 410 }
  );
}