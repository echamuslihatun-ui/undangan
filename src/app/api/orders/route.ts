import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSnapTransaction, SNAP_TOKEN_TTL_HOURS } from "@/lib/midtrans";
import { getPackage } from "@/lib/packages";
import { checkRateLimit } from "@/lib/rate-limit";


export const dynamic = "force-dynamic";
const PAYMENT_METHODS = ["qris", "transfer", "ewallet"] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { templateId, packageName, method } = await req.json();
    if (!PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ error: "Metode pembayaran tidak valid" }, { status: 400 });
    }
    const rateLimit = checkRateLimit(`order-create:${userId}`, { windowMs: 60_000, max: 3 });
    if (rateLimit.limited) {
      return NextResponse.json({ error: "Terlalu banyak percobaan pembayaran" }, { status: 429 });
    }

    // Harga TIDAK diambil dari client. Nilai `amount` dari body diabaikan
    // supaya tidak bisa dimanipulasi (mis. mengirim amount: 1). Harga dan masa
    // aktif ditentukan server berdasarkan paket yang dipilih.
    const selectedPackage = getPackage(packageName);
    const grossAmount = selectedPackage.price;

    const template = templateId
      ? await prisma.template.findFirst({ where: { id: templateId, status: "active" } })
      : await prisma.template.findFirst({ where: { status: "active" }, orderBy: { createdAt: "desc" } });

    if (!template) {
      return NextResponse.json({ error: "Template aktif belum tersedia" }, { status: 400 });
    }

    const recentPending = await prisma.order.findFirst({
      where: {
        userId,
        templateId: template.id,
        packageName: selectedPackage.name,
        method,
        status: "pending",
        createdAt: { gt: new Date(Date.now() - 5 * 60_000) },
        snapRedirectUrl: { not: null },
      },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });
    if (recentPending?.snapRedirectUrl) {
      return NextResponse.json({ ...recentPending, redirectUrl: recentPending.snapRedirectUrl });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        templateId: template.id,
        packageName: selectedPackage.name,
        amount: grossAmount,
        method,
      },
      include: { template: true },
    });

    // Buat transaksi Snap. order.id dipakai sebagai order_id agar cocok
    // dengan webhook yang mencari order via `where: { id: order_id }`.
    try {
      const snap = await createSnapTransaction({
        orderId: order.id,
        grossAmount: order.amount,
        itemName: `${order.packageName} - ${template.name}`,
        method,
        customerName: session.user?.name ?? null,
        customerEmail: session.user?.email ?? null,
      });

      // Simpan token & redirect URL supaya order pending bisa dilanjutkan nanti
      // (user dapat melihat kembali nomor VA / QR tanpa membuat pesanan baru).
      const snapExpiresAt = new Date(Date.now() + SNAP_TOKEN_TTL_HOURS * 60 * 60 * 1000);
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          snapToken: snap.token,
          snapRedirectUrl: snap.redirectUrl,
          snapExpiresAt,
        },
        include: { template: true },
      });

      return NextResponse.json({ ...updated, redirectUrl: snap.redirectUrl }, { status: 201 });

    } catch (snapError) {
      // Order tetap tersimpan sebagai pending agar bisa dilanjutkan/ditelusuri.
      console.error("Snap transaction error:", snapError);
      return NextResponse.json(
        {
          error: "Pesanan dibuat, tetapi gagal memulai pembayaran. Coba lagi beberapa saat.",
          orderId: order.id,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
