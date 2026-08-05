import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { AUTH_TOKEN_TYPES, hashAuthToken, validatePassword } from "@/lib/account-security";

export async function POST(req: Request) {
  const identifier = getRateLimitIdentifier(req, "reset-password");
  const rateLimit = checkRateLimit(identifier, { windowMs: 15 * 60_000, max: 10 });
  if (rateLimit.limited) return NextResponse.json({ error: "Terlalu banyak percobaan." }, { status: 429 });

  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const passwordError = validatePassword(body?.password);
    if (!token || passwordError) return NextResponse.json({ error: passwordError || "Token tidak valid" }, { status: 400 });

    const tokenHash = hashAuthToken(token);
    const record = await prisma.authToken.findUnique({ where: { tokenHash } });
    if (!record || record.type !== AUTH_TOKEN_TYPES.RESET_PASSWORD || record.expiresAt <= new Date()) {
      if (record) await prisma.authToken.delete({ where: { id: record.id } });
      return NextResponse.json({ error: "Tautan reset tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    const password = await bcrypt.hash(body.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password, authVersion: { increment: 1 } } }),
      prisma.session.deleteMany({ where: { userId: record.userId } }),
      prisma.authToken.deleteMany({ where: { userId: record.userId } }),
    ]);
    return NextResponse.json({ message: "Password berhasil diperbarui. Silakan masuk kembali." });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui password" }, { status: 500 });
  }
}