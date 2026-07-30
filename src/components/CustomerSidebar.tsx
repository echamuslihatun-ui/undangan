"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Heart, LayoutDashboard, Palette, Eye, CreditCard, Users, LogOut, Menu, X, ImageIcon, User } from "lucide-react";

interface CustomerSidebarProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/kustomisasi", label: "Kustomisasi", icon: Palette },
  { href: "/dashboard/preview", label: "Preview", icon: Eye },
  { href: "/dashboard/pembayaran", label: "Pembayaran", icon: CreditCard },
  { href: "/dashboard/tamu", label: "Kelola Tamu", icon: Users },
  { href: "/dashboard/rsvp", label: "RSVP", icon: Users },
  { href: "/dashboard/foto", label: "Galeri Foto", icon: ImageIcon },
];

export default function CustomerSidebar({ user }: CustomerSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e91e63&color=fff`;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-white p-2 shadow-sm md:hidden">
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-border bg-white transition-transform md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-serif text-lg font-bold">Undanganku</span>
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
          <Link href="/dashboard/profil" onClick={() => setIsOpen(false)} className="mb-3 flex items-center gap-3 rounded-lg bg-muted p-3 transition hover:bg-muted/80">
            <Image src={avatarUrl} alt={user.name} width={32} height={32} className="h-8 w-8 rounded-full" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
