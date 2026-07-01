import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env.local and other Next.js environment files.
loadEnvConfig(process.cwd());

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function validatePassword(password: string): void {
  const isValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!isValid) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD must contain at least 8 characters, " +
        "including uppercase, lowercase, number, and symbol.",
    );
  }
}

async function main(): Promise<void> {
  const connectionString = requireEnvironmentVariable("DATABASE_URL");

  const email = requireEnvironmentVariable(
    "ADMIN_BOOTSTRAP_EMAIL",
  ).toLowerCase();

  const name = requireEnvironmentVariable("ADMIN_BOOTSTRAP_NAME");
  const password = requireEnvironmentVariable(
    "ADMIN_BOOTSTRAP_PASSWORD",
  );

  validatePassword(password);

  const adapter = new PrismaPg({
    connectionString,
    max: 1,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        role: true,
      },
    });

    const admin = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        email,
        name,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (existingUser) {
      console.log("Existing account updated successfully.");
      console.log("Administrator password was replaced.");
    } else {
      console.log("Administrator account created successfully.");
    }

    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name ?? "Administrator"}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.isActive}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Administrator creation failed.";

  console.error(`Error: ${message}`);
  process.exitCode = 1;
});