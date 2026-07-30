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
      include: { guests: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json(wedding?.guests || []);
  } catch (error) {
    console.error("Guests fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tamu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Support bulk import (array of guests) dan single guest
    const guestsInput = Array.isArray(body) ? body : [body];

    if (guestsInput.length === 0) {
      return NextResponse.json({ error: "Data tamu tidak boleh kosong" }, { status: 400 });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { userId },
    });

    if (!wedding) {
      return NextResponse.json({ error: "Data pernikahan tidak ditemukan" }, { status: 404 });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < guestsInput.length; i++) {
      const { name, phone } = guestsInput[i];
      if (!name || !phone) {
        errors.push({ index: i, error: "Nama dan nomor WhatsApp harus diisi" });
        continue;
      }
      try {
        // Generate unique slug for guest: kode-random-nama
        const baseSlug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const randomCode = Math.random().toString(36).substring(2, 6);
        const guestSlug = `${randomCode}-${baseSlug}`;
        
        const guest = await prisma.guest.create({
          data: {
            weddingId: wedding.id,
            name: String(name).trim(),
            phone: String(phone).trim(),
            slug: guestSlug,
          },
        });
        created.push(guest);
      } catch (err) {
        errors.push({ index: i, error: "Gagal menyimpan" });
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      guests: created,
    }, { status: 201 });
  } catch (error) {
    console.error("Guest create error:", error);
    return NextResponse.json({ error: "Gagal menambah tamu" }, { status: 500 });
  }
}
