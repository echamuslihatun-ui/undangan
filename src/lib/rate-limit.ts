import type { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter
 * Note: In production, consider using a distributed store like Redis
 */

type RateLimitEntry = { count: number; resetTime: number };
const store = new Map<string, RateLimitEntry>();
let checksSinceCleanup = 0;

/**
 * Get identifier for rate limiting based on request
 */
export function getRateLimitIdentifier(req: NextRequest | Request, type = "default"): string {
  // Try to get IP address from headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return `${type}:${ip}`;
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