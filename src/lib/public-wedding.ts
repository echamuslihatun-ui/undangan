import type { Prisma } from "@prisma/client";

/** Rules shared by every unauthenticated wedding endpoint. */
export function activeWeddingWhere(identifier: string, now = new Date()): Prisma.WeddingWhereInput {
  return {
    OR: [{ id: identifier }, { slug: identifier }],
    status: "active",
    AND: [{ OR: [{ activeUntil: null }, { activeUntil: { gt: now } }] }],
  };
}

export function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export const RSVP_STATUSES = ["pending", "confirmed", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export function isRsvpStatus(value: unknown): value is RsvpStatus {
  return typeof value === "string" && RSVP_STATUSES.includes(value as RsvpStatus);
}
