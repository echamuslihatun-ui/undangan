import { randomBytes } from "crypto";

export function normalizeString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function optionalString(value: unknown, maxLength: number): string | null {
  const normalized = normalizeString(value, maxLength);
  return normalized || null;
}

export function parseOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("Tanggal tidak valid");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Tanggal tidak valid");
  return parsed;
}

export function optionalHttpUrl(value: unknown, maxLength = 2048): string | null {
  const normalized = optionalString(value, maxLength);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error("URL tidak valid");
  }
}

/**
 * Validasi URL profil Instagram. Menerima:
 * - https://instagram.com/username
 * - https://www.instagram.com/username
 * - https://instagr.am/username
 * - username saja (mis. "johndoe") — disimpan tanpa awalan, di-render sebagai
 *   profil instagram.com/username oleh theme.
 */
const INSTAGRAM_PATTERN = /^(?:@)?([A-Za-z0-9._]{1,30})$/;

export function optionalInstagram(value: unknown, maxLength = 100): string | null {
  const normalized = optionalString(value, maxLength);
  if (!normalized) return null;

  // Jika sudah berupa URL penuh, ambil username dari path-nya.
  if (normalized.includes("://") || normalized.startsWith("www.")) {
    try {
      const url = new URL(
        normalized.startsWith("www.") ? `https://${normalized}` : normalized
      );
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      const hostname = url.hostname.toLowerCase();
      const validHosts = ["instagram.com", "www.instagram.com", "instagr.am"];
      if (!validHosts.includes(hostname)) return null;
      const username = url.pathname.split("/").filter(Boolean)[0];
      return username && INSTAGRAM_PATTERN.test(username) ? username : null;
    } catch {
      return null;
    }
  }

  // Jika hanya username, kembalikan apa adanya (tanpa @).
  const match = normalized.match(INSTAGRAM_PATTERN);
  return match ? match[1] : null;
}

export function safeJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function createRandomCode(bytes = 6): string {
  return randomBytes(bytes).toString("hex");
}