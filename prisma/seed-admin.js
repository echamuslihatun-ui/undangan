const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const adminUser = {
  name: "Admin Undanganku",
  email: "admin@undanganku.id",
  // PENTING: Ganti password ini segera setelah login pertama!
  password: "Und4ng4nku_Admin!2026",
};

async function main() {
  const hashedPassword = await bcrypt.hash(adminUser.password, 12);

  const user = await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {
      name: adminUser.name,
      password: hashedPassword,
      role: "admin",
    },
    create: {
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: "admin",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("=== ADMIN DEFAULT SIAP DIGUNAKAN ===");
  console.log(`- ID: ${user.id}`);
  console.log(`- Nama: ${user.name}`);
  console.log(`- Email: ${user.email}`);
  console.log(`- Role: ${user.role}`);
  console.log(`- Password: ${adminUser.password}`);
  console.log(`⚠️  SEGERA GANTI PASSWORD SETELAH LOGIN PERTAMA!`);
}

main()
  .catch((error) => {
    console.error("Gagal membuat admin default:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });