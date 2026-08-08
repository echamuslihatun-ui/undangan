import type { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter
 * Note: In production, consider using a distributed store like Redis
 */

type RateLimitEntry = { count: number; resetTime: number };
const store = new Map<string, RateLimitEntry>();
let checksSinceCleanup = 0;

/**
 * Ekstrak alamat IP klien dengan aman dari header proxy.
 *
 * Prioritas:
 *   1. `x-vercel-forwarded-for` — ditulis oleh Vercel sendiri dan tidak bisa
 *      dipalsukan oleh klien (paling akurat untuk deployment Vercel).
 *   2. `x-real-ip` — di-set oleh Nginx/edge setelah memverifikasi koneksi.
 *   3. `x-forwarded-for` (IP PALING KANAN) — posisi terakhir adalah IP asli
 *      yang di-APPEND oleh proxy tepercaya. IP paling kiri bisa dipalsukan
 *      klien dengan header `X-Forwarded-For: 1.2.3.4` sehingga TIDAK dipakai.
 *
 * Mengambil IP dari `x-forwarded-for` bagian kiri (implementasi sebelumnya)
 * memungkinkan attacker memalsukan identitas dan melewati rate limit.
 */
export function getClientIp(req: NextRequest | Request): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost) return rightmost;
  }

  return "unknown";
}

/**
 * Get identifier for rate limiting based on request
 */
export function getRateLimitIdentifier(req: NextRequest | Request, type = "default"): string {
  return `${type}:${getClientIp(req)}`;
}

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  identifier: string,
  options: { windowMs: number; max: number }
): { limited: boolean; count: number; resetIn: number } {
  const now = Date.now();
  const windowMs = options.windowMs;
  const max = options.max;

  // Lazy cleanup works in serverless runtimes and does not keep Node alive with a timer.
  checksSinceCleanup += 1;
  if (checksSinceCleanup >= 100) {
    cleanupRateLimitStore(now);
    checksSinceCleanup = 0;
  }

  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New entry or window has expired
    store.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { limited: false, count: 1, resetIn: windowMs };
  }

  if (entry.count >= max) {
    // Rate limited
    return {
      limited: true,
      count: entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count += 1;
  return { limited: false, count: entry.count, resetIn: entry.resetTime - now };
}

/**
 * Clear expired entries from the store
 * Call periodically in production to prevent memory leak
 */
export function cleanupRateLimitStore(now = Date.now()): void {
  store.forEach((entry, key) => {
    if (entry.resetTime <= now) store.delete(key);
  });
}