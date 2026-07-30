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

    const userId = (session.user as any).id;
    const wedding = await prisma.wedding.findUnique({
      where: { userId },
      include: { guests: true },
    });

    return NextResponse.json(wedding);
  } catch (error) {
    console.error("Wedding fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const allowedData: Record<string, unknown> = {
      partner1: body.partner1,
      partner2: body.partner2,
      parent1: body.parent1,
      parent2: body.parent2,
      fatherPria: body.fatherPria,
      motherPria: body.motherPria,
      fatherWanita: body.fatherWanita,
      motherWanita: body.motherWanita,
      themeKey: body.themeKey,
      akadDate: body.akadDate ? new Date(body.akadDate) : null,
      resepsiDate: body.resepsiDate ? new Date(body.resepsiDate) : null,
      location: body.location,
      mapsUrl: body.mapsUrl,
      message: body.message,
      photos: JSON.stringify(body.photos || []),
      musicUrl: body.musicUrl,
      bankName: body.bankName,
      bankAccount: body.bankAccount,
      bankHolder: body.bankHolder,
      bankAccounts: body.bankAccounts ? JSON.stringify(body.bankAccounts) : undefined,
      qrisImage: body.qrisImage,
      customDomain: body.customDomain,
    };

    // Generate/update slug when partner1 and partner2 are provided
    if (body.partner1 && body.partner2) {
      const baseSlug = `${body.partner1}&${body.partner2}`.toLowerCase().replace(/[^a-z0-9&]+/g, "-").replace(/^-+|-+$/g, "").replace(/&+/g, "&");
      const randomCode = Math.random().toString(36).substring(2, 6);
      (allowedData as any).slug = `${baseSlug}-${randomCode}`;
    }

    const wedding = await prisma.wedding.update({
      where: { userId },
      data: allowedData,
    });

    return NextResponse.json(wedding);
  } catch (error) {
    console.error("Wedding update error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}