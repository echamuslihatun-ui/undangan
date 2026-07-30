import CustomerSidebar from "@/components/CustomerSidebar";
import { ToastProvider } from "@/components/Toast";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if ((session.user as any)?.role === "admin") redirect("/admin");
  if ((session.user as any)?.status === "suspended") redirect("/login?error=suspended");

  const user = {
    name: (session.user as any)?.name || "User",
    email: (session.user as any)?.email || "",
    image: (session.user as any)?.image || null,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ToastProvider>
        <CustomerSidebar user={user} />
        <main className="md:pl-64">
          <div className="container-custom py-8 pt-20 md:pt-8">{children}</div>
        </main>
      </ToastProvider>
    </div>
  );
}
