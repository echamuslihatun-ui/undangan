import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { markOrderFailed } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Membatalkan order yang masih pending.
 * Dipakai saat user ingin berganti metode pembayaran: nomor VA di Midtrans
 * terikat pada order_id tertentu dan tidak bisa dipakai untuk channel lain,
 * jadi order lama dibatalkan lalu user membuat pesanan baru.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Pastikan order milik user yang login sebelum diubah.
    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.status === "success") {
      return NextResponse.json(
        { error: "Pesanan yang sudah dibayar tidak dapat dibatalkan" },
        { status: 409 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Pesanan ini sudah tidak aktif" }, { status: 409 });
    }

    await markOrderFailed(order.id);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { template: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json({ error: "Gagal membatalkan pesanan" }, { status: 500 });
  }
}
