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

    const users = await prisma.user.findMany({
      where: {
        role: {
          not: "admin",
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        orders: {
          select: {
            packageName: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      } as any,
    }) as any[];

    const usersWithStatus = users.map((user) => {
      const orders = user.orders as any[];
      const latestOrder = orders[0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        status: user.status ?? "active",
        orderSummary: {
          totalOrders: orders.length,
          latestPackage: latestOrder?.packageName ?? null,
          latestOrderStatus: latestOrder?.status ?? null,
          totalAmount: orders.reduce((sum: number, order: any) => sum + order.amount, 0),
        },
      };
    });

    return NextResponse.json(usersWithStatus);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, status } = await req.json();

    if (!userId || !["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Data status akun tidak valid" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Akun admin tidak dapat diubah statusnya" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status } as any,
    });

    return NextResponse.json({ message: "Status user berhasil diubah" });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Gagal update user" }, { status: 500 });
  }
}
