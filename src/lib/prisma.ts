import { PrismaClient } from "@prisma/client";

// Cache instance di globalThis SUPAYA tidak membuat koneksi baru tiap
// hot-reload (dev) maupun tiap invocation serverless yang me-reuse instance
// (production). Tanpa ini, kuota koneksi Supabase cepat habis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Log error & warning saja di production; query log hanya di dev.
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["error", "warn"],
  });

globalForPrisma.prisma = prisma;


