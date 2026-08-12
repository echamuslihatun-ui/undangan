import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware proteksi route dengan NextAuth.
 *
 * Lapisan pertahanan tambahan DI LUAR proteksi yang sudah ada di layout
 * (`src/app/dashboard/layout.tsx` dan `src/app/admin/layout.tsx`).
 *
 * Manfaat:
 * - Mencegah render halaman dashboard/admin bagi pengguna yang tidak login
 *   (layout hanya berjalan setelah halaman mulai di-render).
 * - Redirect pengguna `admin` yang mencoba akses `/dashboard` ke `/admin`, dan
 *   sebaliknya.
 * - Setiap perubahan role/status langsung berlaku tanpa menunggu session
 *   callback (JWT) berjalan.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;
    const status = token?.status;

    // Akun disuspend: arahkan ke login dan minta sign out. JWT lama yang
    // berstatus suspended tidak diberi akses oleh `authorized` callback pada
    // request berikutnya karena token tetap membawa status lama; untuk
    // memastikan logout penuh, kita redirect ke endpoint signout.
    if (status === "suspended") {
      const loginUrl = new URL("/api/auth/signin?error=suspended", req.url);
      loginUrl.searchParams.set("callbackUrl", "/login?error=suspended");
      return NextResponse.redirect(loginUrl);
    }

    // Admin tidak seharusnya mengakses halaman customer.
    if (pathname.startsWith("/dashboard") && role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Customer tidak seharusnya mengakses halaman admin.
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Hanya aktifkan middleware untuk route yang dilindungi.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
