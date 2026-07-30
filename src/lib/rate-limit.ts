/**
 * Rate limiting sederhana menggunakan Map in-memory.
 * Untuk production dengan banyak pengguna, gunakan Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Bersihkan entry yang expired setiap 5 menit
setInterval(() => {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs: number; // Jendela waktu dalam milidetik
  max: number; // Maksimal request dalam jendela waktu
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 menit
  max: 20, // 20 request per menit
};

/**
 * Cek apakah request terbatas oleh rate limit.
 * Returns: { limited: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { limited: boolean; remaining: number; resetIn: number } {
  const { windowMs, max } = { ...defaultConfig, ...config };
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    // Buat entry baru
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: max - 1, resetIn: windowMs };
  }

  entry.count += 1;

  if (entry.count > max) {
    return {
      limited: true,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  return {
    limited: false,
    remaining: max - entry.count,
    resetIn: entry.resetAt - now,
  };
}

/**
 * Buat identifier dari IP address atau user ID
 */
export function getRateLimitIdentifier(req: Request, suffix?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${ip}:${suffix || "default"}`;
}