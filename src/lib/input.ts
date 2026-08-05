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