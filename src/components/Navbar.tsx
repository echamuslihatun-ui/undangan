"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/#template", label: "Template" },
    { href: "/#harga", label: "Harga" },
    { href: "/#fitur", label: "Fitur" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <nav className="container-custom flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-serif text-xl font-bold">Undanganku</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">Masuk</Link>
            <Link href="/register" className="btn-primary">Daftar</Link>
          </div>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-border bg-white md:hidden">
          <div className="container-custom flex flex-col gap-4 py-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2">
              <Link href="/login" className="btn-secondary w-full">Masuk</Link>
              <Link href="/register" className="btn-primary w-full">Daftar</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
