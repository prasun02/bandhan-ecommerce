import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    // Prisma 7 CLI operations use this URL; runtime PrismaPg continues to use DATABASE_URL.
    url: process.env.DIRECT_URL || env("DATABASE_URL")
  }
});
