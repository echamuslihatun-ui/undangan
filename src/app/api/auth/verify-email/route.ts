import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_TOKEN_TYPES, hashAuthToken } from "@/lib/account-security";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawToken = typeof body?.token === "string" ? body.token : "";
    if (!rawToken) return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });

    const record = await prisma.authToken.findUnique({ where: { tokenHash: hashAuthToken(rawToken) } });
    if (!record || record.type !== AUTH_TOKEN_TYPES.VERIFY_EMAIL || record.expiresAt <= new Date()) {
      if (record) await prisma.authToken.delete({ where: { id: record.id } });
      return NextResponse.json({ error: "Tautan verifikasi tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
      prisma.authToken.deleteMany({ where: { userId: record.userId, type: AUTH_TOKEN_TYPES.VERIFY_EMAIL } }),
    ]);
    return NextResponse.json({ message: "Email berhasil diverifikasi. Anda sekarang dapat masuk." });
  } catch {
    return NextResponse.json({ error: "Gagal memverifikasi email" }, { status: 500 });
  }
}