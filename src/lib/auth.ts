import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "@/lib/account-security";

// Pesan generik untuk klien. Alasan kegagalan yang sebenarnya hanya masuk log
// server, supaya tidak membocorkan email mana yang terdaftar.
const GENERIC_AUTH_ERROR = "Email atau password salah";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  // Diambil otomatis dari NEXTAUTH_SECRET; ditulis eksplisit agar jelas.
  secret: process.env.NEXTAUTH_SECRET,
  // Aktifkan log detail NextAuth di luar production supaya penyebab kegagalan
  // OAuth (mis. state mismatch, token exchange gagal) terlihat.
  debug: process.env.NODE_ENV !== "production",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  // Teruskan error internal NextAuth ke logger kita supaya muncul di log Vercel.
  // Tanpa ini, kegagalan OAuth callback sering "diam" (cuma redirect 302 ke
  // halaman error) tanpa jejak penyebab di server.
  logger: {
    error(code, metadata) {
      logger.error("NextAuth error", metadata, { code });
    },
    warn(code) {
      logger.warn("NextAuth warning", { code });
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password diperlukan");
        }

        let user: any;
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizeEmail(credentials.email) },
          });
        } catch (error) {
          // Query gagal (skema belum di-push, pooler bermasalah, kredensial salah).
          // Tanpa log ini, kegagalan database tampak identik dengan password salah.
          logger.error("Login gagal: query database error", error, {
            email: credentials.email,
          });
          throw new Error(GENERIC_AUTH_ERROR);
        }

        if (!user) {
          logger.warn("Login gagal: user tidak ditemukan", {
            email: credentials.email,
          });
          throw new Error(GENERIC_AUTH_ERROR);
        }

        if (!user.password) {
          // Akun dibuat via Google OAuth, jadi tidak punya password.
          logger.warn("Login gagal: akun tanpa password (kemungkinan OAuth)", {
            email: credentials.email,
          });
          throw new Error(GENERIC_AUTH_ERROR);
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          logger.warn("Login gagal: password tidak cocok", {
            email: credentials.email,
          });
          throw new Error(GENERIC_AUTH_ERROR);
        }

        // Periksa verifikasi hanya setelah password benar agar respons login
        // tidak dapat dipakai untuk menebak akun mana yang terdaftar.
        if (!user.emailVerified) {
          const pendingVerification = await prisma.authToken.findFirst({
            where: { userId: user.id, type: "verify_email" },
            select: { id: true },
          });
          if (pendingVerification) {
            logger.warn("Login gagal: email belum diverifikasi", { email: credentials.email });
            throw new Error("EMAIL_NOT_VERIFIED");
          }
        }

        if (user.status === "suspended") {
          logger.warn("Login gagal: akun disuspend", { email: credentials.email });
          throw new Error("Akun Anda sedang disuspend");
        }

        logger.info("Login berhasil", { email: user.email, role: user.role });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info("OAuth signIn berhasil", {
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Jalur credentials sudah divalidasi di authorize(); lolos apa adanya.
      if (account?.provider !== "google") return true;
      // Google kadang mengembalikan email yang belum terverifikasi. Tolak
      // supaya tidak ada akun "nyangkut" tanpa email valid.
      const verified = (profile as any)?.email_verified;
      if (verified === false) {
        logger.warn("OAuth ditolak: email Google belum terverifikasi", {
          email: (profile as any)?.email,
        });
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true, authVersion: true } as any,
        }) as any;
        token.role = dbUser?.role ?? (user as any).role ?? "customer";
        token.status = dbUser?.status ?? (user as any).status ?? "active";
        token.authVersion = dbUser?.authVersion ?? (user as any).authVersion ?? 0;
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true, authVersion: true } as any,
        }) as any;
        if (dbUser && dbUser.authVersion === token.authVersion) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        } else {
          delete token.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      } else if (session.user) {
        // Membuat middleware/getServerSession memperlakukan JWT yang dicabut
        // sebagai sesi tanpa identitas pengguna.
        session.user.id = "";
      }
      return session;
    },
  },
};