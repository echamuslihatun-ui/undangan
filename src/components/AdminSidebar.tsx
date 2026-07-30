"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Shield, LayoutDashboard, Palette, CreditCard, Users, LogOut, Menu, X } from "lucide-react";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/template", label: "Template & Harga", icon: Palette },
  { href: "/admin/transaksi", label: "Transaksi", icon: CreditCard },
  { href: "/admin/user", label: "User Aktif", icon: Users },
  { href: "/admin/messages", label: "Moderasi Pesan", icon: Shield },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-white p-2 shadow-sm md:hidden">
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-border bg-white transition-transform md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold">Admin Panel</span>
            <p className="text-xs text-muted-foreground">Undanganku</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-3">
            <Image src="https://ui-avatars.com/api/?name=Admin&background=e91e63&color=fff" alt="Admin" width={32} height={32} className="h-8 w-8 rounded-full" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Admin</p>
              <p className="truncate text-xs text-muted-foreground">admin@undanganku.id</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}