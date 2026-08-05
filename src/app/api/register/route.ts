import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { AUTH_TOKEN_TYPES, createAuthToken, getAppUrl, isValidEmail, normalizeEmail, validatePassword } from "@/lib/account-security";
import { createRandomCode, normalizeString } from "@/lib/input";
import { sendAccountEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 registrasi per menit per IP
    const identifier = getRateLimitIdentifier(req, "register");
    const rateLimit = checkRateLimit(identifier, { windowMs: 60 * 1000, max: 5 });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const name = normalizeString(body?.name, 100);
    const email = normalizeEmail(body?.email);
    const password = body?.password;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rawToken, tokenHash } = createAuthToken();

    const baseSlug = `${name}-pasangan`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword,
        wedding: { create: { partner1: name, partner2: "Pasangan", slug: `${baseSlug || "undangan"}-${createRandomCode(4)}` } },
        authTokens: { create: { type: AUTH_TOKEN_TYPES.VERIFY_EMAIL, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } },
      },
    });

    try {
      await sendAccountEmail(email, `${getAppUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`, "verify");
    } catch (error) {
      logger.error("Registrasi berhasil tetapi email verifikasi gagal dikirim", error, { userId: user.id });
    }

    return NextResponse.json(
      { message: "Registrasi berhasil. Periksa email untuk verifikasi akun.", userId: user.id, requiresVerification: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}