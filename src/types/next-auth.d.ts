import type { DefaultSession } from "next-auth";

/**
 * Augmentasi tipe NextAuth.
 *
 * Secara default `session.user` hanya punya name/email/image, sehingga di
 * seluruh route API kita terpaksa memakai `(session.user as any).id`. Dengan
 * augmentasi ini, `id`, `role`, dan `status` menjadi bagian resmi dari tipe
 * sehingga akses menjadi type-safe tanpa cast.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    status?: string;
    authVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: string;
    status: string;
    authVersion: number;
  }
}
