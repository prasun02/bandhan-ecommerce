import type { PrismaClient } from "@prisma/client";
import { createDemoProductsCsv } from "@/lib/demo-products-data";
import {
  importProducts,
  parseProductImportCsv,
  type ProductImportSummary
} from "@/lib/services/admin-product-import";

export async function seedDemoProducts(
  prisma: PrismaClient,
  options: { adminUserId?: string | null } = {}
): Promise<ProductImportSummary> {
  const parsed = parseProductImportCsv(createDemoProductsCsv());
  return importProducts(prisma, {
    adminUserId: options.adminUserId ?? null,
    fileName: "bandhan_demo_products_upload.csv",
    parsed,
    auditAction: "DEMO_PRODUCTS_SEEDED",
    auditEntityType: "DemoProductSeed",
    auditDescription: "Demo products and variants were created or updated idempotently."
  });
}
