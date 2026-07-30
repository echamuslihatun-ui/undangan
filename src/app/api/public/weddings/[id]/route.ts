import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Try to find by ID first, then by slug
    let wedding = await prisma.wedding.findFirst({
      where: {
        id: params.id,
      },
      include: {
        photoAlbum: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
        messages: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // If not found by ID, try to find by slug
    if (!wedding) {
      const slugWedding = await prisma.wedding.findFirst({
        where: {
          slug: params.id,
        },
        include: {
          photoAlbum: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] },
          messages: {
            where: { isApproved: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (slugWedding) wedding = slugWedding as any;
    }

    if (!wedding) {
      return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(wedding);
  } catch (error) {
    console.error("Public wedding fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil undangan" }, { status: 500 });
  }
}
