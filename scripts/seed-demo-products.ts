import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { seedDemoProducts } from "../lib/services/demo-product-seed";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 1,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000
    })
  });

  try {
    const result = await seedDemoProducts(prisma);
    console.log("Demo product seed completed.");
    console.log(`Products created: ${result.productsCreated}`);
    console.log(`Products updated: ${result.productsUpdated}`);
    console.log(`Variants created: ${result.variantsCreated}`);
    console.log(`Variants updated: ${result.variantsUpdated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Demo product seed failed.";
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
