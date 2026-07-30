import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data template" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, price, image, features, themeKey } = await req.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: "Nama dan harga harus diisi" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        category: category || "Classic",
        price: parseInt(price),
        image: image || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400",
        features: JSON.stringify(features || []),
        themeKey: themeKey || "classic",
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Template create error:", error);
    return NextResponse.json(
      { error: "Gagal membuat template" },
      { status: 500 }
    );
  }
}