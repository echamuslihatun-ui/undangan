import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransNotification, mapMidtransStatusToOrderStatus } from "@/lib/midtrans";
import { markOrderPaid, markOrderFailed } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verifikasi signature Midtrans untuk keamanan
    const isValid = verifyMidtransNotification(body);
    if (!isValid) {
      console.error("Midtrans webhook signature tidak valid:", body?.order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { order_id, transaction_status, payment_type, fraud_status, gross_amount } = body;
    if (
      typeof order_id !== "string" ||
      typeof transaction_status !== "string" ||
      typeof gross_amount !== "string"
    ) {
      return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
    }

    const mapped = mapMidtransStatusToOrderStatus(transaction_status, fraud_status);

    if (mapped === "success") {
      // Lapisan pertahanan tambahan: cocokkan jumlah pembayaran dengan order di DB
      // agar order tidak diaktifkan bila nominalnya tidak sesuai.
      const order = await prisma.order.findUnique({ where: { id: order_id } });
      if (!order) {
        console.error("Webhook: order tidak ditemukan:", order_id);
        return NextResponse.json({ message: "Order not found" });
      }

      // Midtrans mengirim gross_amount sebagai string desimal, mis. "250000.00".
      const paidAmount = Math.round(parseFloat(String(gross_amount)));
      if (!Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount !== order.amount) {
        console.error(
          `Webhook: gross_amount (${paidAmount}) tidak sama dengan order.amount (${order.amount}) untuk ${order_id}`
        );
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      await markOrderPaid(order_id, payment_type);
      return NextResponse.json({ message: "Webhook processed: order activated" });
    }

    if (mapped === "failed") {
      await markOrderFailed(order_id);
      return NextResponse.json({ message: "Webhook processed: order failed" });
    }

    // pending / challenge: belum ada perubahan status yang perlu disimpan
    return NextResponse.json({ message: "Webhook received" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
