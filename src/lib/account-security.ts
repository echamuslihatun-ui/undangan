import { createHash, randomBytes } from "crypto";

export const AUTH_TOKEN_TYPES = {
  VERIFY_EMAIL: "verify_email",
  RESET_PASSWORD: "reset_password",
} as const;

export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Password wajib diisi";
  if (password.length < 8) return "Password minimal 8 karakter";
  if (password.length > 128) return "Password maksimal 128 karakter";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password harus mengandung huruf dan angka";
  }
  return null;
}

export function createAuthToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashAuthToken(rawToken) };
}

export function hashAuthToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}