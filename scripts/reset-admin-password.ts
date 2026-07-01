import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const email = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_NEW_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !password) throw new Error("ADMIN_RESET_EMAIL and ADMIN_NEW_PASSWORD are required.");
if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
  throw new Error("ADMIN_NEW_PASSWORD must be 8+ characters and include uppercase, lowercase, number, and symbol.");
}
const adminEmail = email;
const newPassword = password;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 1 }) });

async function main() {
  try {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) throw new Error("Administrator account not found.");
    if (admin.role !== "ADMIN") throw new Error("Refusing to reset a non-admin account.");
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: admin.id }, data: { passwordHash, sessionVersion: { increment: 1 }, isActive: true } }),
      prisma.session.deleteMany({ where: { userId: admin.id } }),
      prisma.adminAuditLog.create({ data: { adminUserId: admin.id, action: "ADMIN_PASSWORD_RESET_CLI", entityType: "User", entityId: admin.id, description: "Administrator password reset through the recovery command." } })
    ]);
    console.log("Administrator password reset successfully. Existing sessions were revoked.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Administrator password reset failed.");
  process.exitCode = 1;
});
