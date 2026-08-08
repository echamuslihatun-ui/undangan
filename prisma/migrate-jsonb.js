/**
 * Script migrasi data: konversi kolom String JSON → JSONB.
 *
 * LATAR BELAKANG:
 * Sebelumnya `story`, `photos`, dan `bankAccounts` pada tabel `Wedding`
 * disimpan sebagai `String` berisi JSON (mis. `"[]"` atau `'[{"bank":"BCA"}]'`).
 * Sekarang schema diubah menjadi `Json` (JSONB PostgreSQL) agar bisa di-query
 * dengan operator JSON dan tidak perlu di-parse manual.
 *
 * CARA PAKAI:
 *   1. Pastikan `.env.local` berisi `DATABASE_URL` & `DIRECT_URL` yang menunjuk
 *      ke database target.
 *   2. Jalankan: `node prisma/migrate-jsonb.js`
 *
 * CATATAN PENTING:
 * Script ini HARUS dijalankan SEBELUM `prisma db push` yang mengubah tipe
 * kolom, karena `db push` akan drop & recreate kolom (data hilang).
 * Jika sudah terlanjur dijalankan, data lama tidak bisa dipulihkan.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Parse string JSON dengan aman; fallback ke [] bila gagal. */
function safeParse(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("Memulai migrasi JSONB...");

  // Ambil semua wedding beserta kolom JSON lama.
  const weddings = await prisma.wedding.findMany({
    select: {
      id: true,
      story: true,
      photos: true,
      bankAccounts: true,
    },
  });

  console.log(`Ditemukan ${weddings.length} undangan.`);

  let updated = 0;
  let skipped = 0;

  for (const wedding of weddings) {
    // Nilai lama bisa berupa string JSON atau sudah array (jika sebagian
    // sudah dimigrasi). Normalisasi ke array.
    const story = safeParse(wedding.story);
    const photos = safeParse(wedding.photos);
    const bankAccounts = safeParse(wedding.bankAccounts);

    // Hanya update bila ada perubahan (hindari update tidak perlu).
    const isStoryChanged = JSON.stringify(story) !== JSON.stringify(wedding.story);
    const isPhotosChanged = JSON.stringify(photos) !== JSON.stringify(wedding.photos);
    const isBankChanged = JSON.stringify(bankAccounts) !== JSON.stringify(wedding.bankAccounts);

    if (isStoryChanged || isPhotosChanged || isBankChanged) {
      await prisma.wedding.update({
        where: { id: wedding.id },
        data: {
          story,
          photos,
          bankAccounts,
        },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Selesai: ${updated} undangan dimigrasi, ${skipped} sudah sesuai.`);
}

main()
  .catch((error) => {
    console.error("Migrasi gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });