import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Daftar template harus selalu fresh dari database. Tanpa ini, App Router
// men-cache respons GET secara statis saat build, sehingga template baru yang
// ditambahkan admin tidak muncul di sisi pelanggan sampai deploy ulang.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const { name, category, image, features, themeKey } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nama template harus diisi" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        category: category || "Classic",
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