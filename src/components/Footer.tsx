import Link from "next/link";
import { Heart, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-serif text-xl font-bold">Undanganku</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Platform undangan pernikahan digital yang elegan, praktis, dan terjangkau.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Menu</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#template" className="hover:text-primary">Template</Link></li>
              <li><Link href="/#harga" className="hover:text-primary">Harga</Link></li>
              <li><Link href="/#fitur" className="hover:text-primary">Fitur</Link></li>
              <li><Link href="/#faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Akun</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-primary">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-primary">Daftar</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Kontak</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@undanganku.id</li>
              <li>+62 812-3456-7890</li>
              <li>Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Undanganku. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
