import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getMidtransTransactionStatus, mapMidtransStatusToOrderStatus } from "@/lib/midtrans";
import { markOrderPaid, markOrderFailed } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Sinkronisasi status order dengan Midtrans atas permintaan user.
 * Berguna sebagai jaring pengaman bila notifikasi webhook tidak sampai,
 * termasuk saat pengembangan lokal tanpa tunnel publik.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Wajib: pastikan order milik user yang login, supaya ID order milik
    // orang lain tidak bisa diintip hanya dengan menebak-nebak.
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const midtrans = await getMidtransTransactionStatus(order.id);
    const mapped = mapMidtransStatusToOrderStatus(
      midtrans.transactionStatus,
      midtrans.fraudStatus
    );

    if (mapped === "success") {
      await markOrderPaid(order.id, midtrans.paymentType);
    } else if (mapped === "failed") {
      await markOrderFailed(order.id);
    }

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { template: true },
    });

    return NextResponse.json({
      order: updated,
      midtrans: {
        transactionStatus: midtrans.transactionStatus,
        paymentType: midtrans.paymentType,
        vaNumbers: midtrans.vaNumbers,
        billerCode: midtrans.billerCode,
        billKey: midtrans.billKey,
        statusMessage: midtrans.statusMessage,
      },
      changed: mapped !== null && mapped !== order.status,
    });
  } catch (error) {
    console.error("Order status check error:", error);
    return NextResponse.json({ error: "Gagal memeriksa status pembayaran" }, { status: 502 });
  }
}
