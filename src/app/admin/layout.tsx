import AdminSidebar from "@/components/AdminSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="md:pl-64">
        <div className="container-custom py-8 pt-20 md:pt-8">{children}</div>
      </main>
    </div>
  );
}