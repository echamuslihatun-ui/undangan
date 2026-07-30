import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransNotification } from "@/lib/midtrans";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verifikasi signature Midtrans untuk keamanan
    const isValid = verifyMidtransNotification(body);
    if (!isValid) {
      console.error("Midtrans webhook signature tidak valid:", body);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { order_id, transaction_status, payment_type } = body;

    if (transaction_status === "capture" || transaction_status === "settlement") {
      await prisma.order.updateMany({
        where: { id: order_id },
        data: {
          status: "success",
          method: payment_type || "qris",
        },
      });

      const order = await prisma.order.findUnique({
        where: { id: order_id },
        include: { user: { include: { wedding: true } } },
      });

      if (order?.user?.wedding) {
        const activeUntil = new Date();
        activeUntil.setMonth(activeUntil.getMonth() + 6);

        await prisma.wedding.update({
          where: { id: order.user.wedding.id },
          data: {
            status: "active",
            activeUntil,
          },
        });
      }

      return NextResponse.json({ message: "Webhook processed: order activated" });
    }

    if (transaction_status === "deny" || transaction_status === "expire") {
      await prisma.order.updateMany({
        where: { id: order_id },
        data: { status: "failed" },
      });
      return NextResponse.json({ message: "Webhook processed: order failed" });
    }

    return NextResponse.json({ message: "Webhook received" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
