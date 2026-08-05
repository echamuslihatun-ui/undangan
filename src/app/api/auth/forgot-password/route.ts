import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { AUTH_TOKEN_TYPES, createAuthToken, getAppUrl, isValidEmail, normalizeEmail } from "@/lib/account-security";
import { sendAccountEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const GENERIC_MESSAGE = "Jika email terdaftar, tautan reset password akan dikirim.";

export async function POST(req: Request) {
  const identifier = getRateLimitIdentifier(req, "forgot-password");
  const rateLimit = checkRateLimit(identifier, { windowMs: 15 * 60_000, max: 5 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) },
    });
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
    if (!isValidEmail(email)) return NextResponse.json({ message: GENERIC_MESSAGE });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, password: true } });
    if (!user?.email || !user.password) return NextResponse.json({ message: GENERIC_MESSAGE });

    const { rawToken, tokenHash } = createAuthToken();
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await prisma.$transaction([
      prisma.authToken.deleteMany({ where: { userId: user.id, type: AUTH_TOKEN_TYPES.RESET_PASSWORD } }),
      prisma.authToken.create({ data: { userId: user.id, type: AUTH_TOKEN_TYPES.RESET_PASSWORD, tokenHash, expiresAt } }),
    ]);

    try {
      await sendAccountEmail(user.email, `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`, "reset");
    } catch (error) {
      await prisma.authToken.deleteMany({ where: { tokenHash } });
      logger.error("Gagal mengirim email reset password", error, { userId: user.id });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    logger.error("Forgot password error", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}