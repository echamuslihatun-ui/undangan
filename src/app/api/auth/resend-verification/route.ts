import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { AUTH_TOKEN_TYPES, createAuthToken, getAppUrl, isValidEmail, normalizeEmail } from "@/lib/account-security";
import { sendAccountEmail } from "@/lib/email";

const MESSAGE = "Jika akun memerlukan verifikasi, email baru akan dikirim.";

export async function POST(req: Request) {
  const limit = checkRateLimit(getRateLimitIdentifier(req, "resend-verification"), { windowMs: 15 * 60_000, max: 3 });
  if (limit.limited) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
    if (!isValidEmail(email)) return NextResponse.json({ message: MESSAGE });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, emailVerified: true, password: true } });
    if (!user?.email || !user.password || user.emailVerified) return NextResponse.json({ message: MESSAGE });

    const { rawToken, tokenHash } = createAuthToken();
    await prisma.$transaction([
      prisma.authToken.deleteMany({ where: { userId: user.id, type: AUTH_TOKEN_TYPES.VERIFY_EMAIL } }),
      prisma.authToken.create({ data: { userId: user.id, type: AUTH_TOKEN_TYPES.VERIFY_EMAIL, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } }),
    ]);
    await sendAccountEmail(user.email, `${getAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`, "verify");
    return NextResponse.json({ message: MESSAGE });
  } catch {
    return NextResponse.json({ message: MESSAGE });
  }
}