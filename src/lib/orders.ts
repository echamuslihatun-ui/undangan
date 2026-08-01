import { prisma } from "@/lib/prisma";
import { getPackage } from "@/lib/packages";

/** Masa aktif default (fallback) bila paket order tidak dikenali. */
export const ACTIVE_PERIOD_MONTHS = 6;

/**
 * Menandai order lunas dan mengaktifkan undangan milik user tersebut.
 * Dipakai bersama oleh webhook Midtrans dan endpoint cek status manual,
 * agar keduanya tidak pernah berbeda perilaku.
 *
 * Idempoten: memanggil ulang untuk order yang sudah success tidak menggeser
 * masa aktif, sehingga notifikasi ganda dari Midtrans tidak memperpanjang undangan.
 */
export async function markOrderPaid(orderId: string, paymentType?: string | null) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { include: { wedding: true } } },
  });

  if (!existing) return null;

  const alreadyPaid = existing.status === "success";

  if (!alreadyPaid) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "success",
        method: paymentType || existing.method,
      },
    });
  }

  // Aktifkan undangan hanya bila user sudah punya data pernikahan.
  // User yang belum mengisi data akan teraktivasi saat wedding dibuat.
  if (existing.user?.wedding && !alreadyPaid) {
    // Masa aktif mengikuti paket yang dibeli (Basic 3, Premium 6, Exclusive 12).
    const activeMonths = getPackage(existing.packageName).activeMonths;
    const activeUntil = new Date();
    activeUntil.setMonth(activeUntil.getMonth() + activeMonths);

    await prisma.wedding.update({
      where: { id: existing.user.wedding.id },
      data: { status: "active", activeUntil },
    });
  }

  return prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { include: { wedding: true } } },
  });
}

/** Menandai order gagal (deny / expire / cancel dari Midtrans, atau dibatalkan user) */
export async function markOrderFailed(orderId: string) {
  return prisma.order.updateMany({
    where: { id: orderId, status: "pending" },
    data: { status: "failed" },
  });
}

/**
 * Jaring pengaman terakhir: aktifkan undangan bila user punya order sukses
 * tetapi undangan belum pernah diaktifkan (`activeUntil` masih null).
 *
 * Ini menutup kasus di mana webhook Midtrans tidak pernah sampai DAN user
 * tidak menekan tombol "cek status", sehingga order sudah `success` namun
 * undangan tak kunjung aktif. Dipanggil saat membaca profil/dashboard.
 *
 * HANYA mengaktifkan bila `activeUntil` masih null, jadi undangan yang masa
 * aktifnya sudah lewat TIDAK diperpanjang otomatis, dan yang sedang aktif
 * tidak tergeser.
 */
export async function reconcileWeddingActivation(userId: string) {
  const wedding = await prisma.wedding.findUnique({
    where: { userId },
    select: { id: true, activeUntil: true },
  });

  // Belum ada undangan, atau sudah pernah aktif → tidak ada yang perlu dilakukan.
  if (!wedding || wedding.activeUntil) return;

  const paidOrder = await prisma.order.findFirst({
    where: { userId, status: "success" },
    orderBy: { createdAt: "desc" },
    select: { packageName: true },
  });

  if (!paidOrder) return;

  const activeMonths = getPackage(paidOrder.packageName).activeMonths;
  const activeUntil = new Date();
  activeUntil.setMonth(activeUntil.getMonth() + activeMonths);

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { status: "active", activeUntil },
  });
}


