import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalTemplates, totalOrders, totalRevenue] = await Promise.all([
      prisma.user.count({ where: { role: "customer" } }),
      prisma.template.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: "success" },
        _sum: { amount: true },
      }),
    ]);

    const recentTransactions = await prisma.order.findMany({
      where: { status: "success" },
      include: { user: { select: { name: true } }, template: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const topTemplates = await prisma.template.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          where: { status: "success" },
          select: { amount: true },
        },
      },
    });

    return NextResponse.json({
      totalUsers,
      totalTemplates,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentTransactions,
      topTemplates: topTemplates.map((tpl) => ({
        name: tpl.name,
        sales: tpl.orders.length,
        revenue: tpl.orders.reduce((sum, order) => sum + order.amount, 0),
      })),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil statistik" }, { status: 500 });
  }
}
