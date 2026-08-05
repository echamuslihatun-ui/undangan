import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidPackage } from "@/lib/packages";
import { reconcileWeddingActivation } from "@/lib/orders";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/account-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Jaring pengaman: bila ada order sukses tetapi undangan belum pernah
    // diaktifkan (mis. webhook Midtrans tidak sampai), aktifkan di sini sebelum
    // membaca status langganan agar data yang dikembalikan selalu konsisten.
    await reconcileWeddingActivation(userId);

    // Tentukan paket langganan aktif.
    // Sumber kebenaran: order sukses terbaru + `wedding.activeUntil`.
    // Aturan: paket berbayar yang masa aktifnya sudah lewat dianggap kembali ke "Free".
    const [latestPaidOrder, wedding] = await Promise.all([
      prisma.order.findFirst({
        where: { userId, status: "success" },
        orderBy: { createdAt: "desc" },
        select: { packageName: true },
      }),
      prisma.wedding.findUnique({
        where: { userId },
        select: { activeUntil: true },
      }),
    ]);

    const now = new Date();
    const activeUntil = wedding?.activeUntil ?? null;
    const isActive =
      !!latestPaidOrder &&
      isValidPackage(latestPaidOrder.packageName) &&
      !!activeUntil &&
      activeUntil.getTime() > now.getTime();

    let subscription: {
      packageName: string;
      activeUntil: string | null;
      daysRemaining: number | null;
    };

    if (isActive && activeUntil) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((activeUntil.getTime() - now.getTime()) / msPerDay);
      subscription = {
        packageName: latestPaidOrder!.packageName,
        activeUntil: activeUntil.toISOString(),
        daysRemaining,
      };
    } else {
      // Belum pernah beli, atau paket berbayar sudah kadaluarsa → kembali ke Free.
      subscription = {
        packageName: "Free",
        activeUntil: null,
        daysRemaining: null,
      };
    }

    return NextResponse.json({ ...user, subscription });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil data profil" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, currentPassword, newPassword } = await req.json();

    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      return NextResponse.json({ error: "Untuk mengganti password, isi password saat ini dan password baru" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    // Update name
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // Update password
    if (currentPassword && newPassword) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json({ error: "Akun ini menggunakan login Google, tidak bisa ganti password" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
      updateData.authVersion = { increment: 1 };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ message: "Profil berhasil diupdate", user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Gagal update profil" }, { status: 500 });
  }
}