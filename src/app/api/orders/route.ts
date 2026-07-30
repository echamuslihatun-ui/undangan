import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
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

    const userId = (session.user as any).id;
    const { templateId, packageName, amount, method } = await req.json();
    const template = templateId
      ? await prisma.template.findUnique({ where: { id: templateId } })
      : await prisma.template.findFirst({ where: { status: "active" }, orderBy: { createdAt: "desc" } });

    if (!template) {
      return NextResponse.json({ error: "Template aktif belum tersedia" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        templateId: template.id,
        packageName: packageName || "Premium",
        amount: parseInt(String(amount)),
        method,
      },
      include: { template: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
