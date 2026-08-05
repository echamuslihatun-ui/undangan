import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRandomCode, normalizeString } from "@/lib/input";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BULK_GUESTS = 200;
const PHONE_PATTERN = /^[+0-9][0-9\s()-]{7,24}$/;

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

    const userId = session.user.id;
    const body = await req.json();

    const rateLimit = checkRateLimit(`guest-create:${userId}`, { windowMs: 60_000, max: 5 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }

    // Support bulk import (array of guests) dan single guest
    const guestsInput = Array.isArray(body) ? body : [body];

    if (guestsInput.length === 0) {
      return NextResponse.json({ error: "Data tamu tidak boleh kosong" }, { status: 400 });
    }
    if (guestsInput.length > MAX_BULK_GUESTS) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_BULK_GUESTS} tamu per sekali impor` },
        { status: 413 }
      );
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
      const name = normalizeString(guestsInput[i]?.name, 100);
      const phone = normalizeString(guestsInput[i]?.phone, 25);
      if (!name || !phone) {
        errors.push({ index: i, error: "Nama dan nomor WhatsApp harus diisi" });
        continue;
      }
      if (!PHONE_PATTERN.test(phone)) {
        errors.push({ index: i, error: "Format nomor WhatsApp tidak valid" });
        continue;
      }
      try {
        // Generate unique slug for guest: kode-random-nama
        const baseSlug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const randomCode = createRandomCode(6);
        const guestSlug = `${randomCode}-${baseSlug}`;
        
        const guest = await prisma.guest.create({
          data: {
            weddingId: wedding.id,
            name,
            phone,
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
