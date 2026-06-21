import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { importDemoProducts } from "@/lib/services/product-import";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to import demo products.");
}

const projectRoot = process.cwd();
const defaultCsvPath = path.join(projectRoot, "data", "bandhan_demo_products_full_details.csv");
const csvPath = process.argv[2] ? path.resolve(projectRoot, process.argv[2]) : defaultCsvPath;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function printList(label: string, values: string[]) {
  console.log(`${label}: ${values.length ? values.join(", ") : "none"}`);
}

async function main() {
  console.log(`Importing demo products from ${path.relative(projectRoot, csvPath)}`);
  const summary = await importDemoProducts(prisma, { csvPath, projectRoot });

  console.log("Import summary");
  console.log(`Rows read: ${summary.rowsRead}`);
  console.log(`Valid rows: ${summary.validRows}`);
  console.log(`Products created: ${summary.productsCreated}`);
  console.log(`Products updated: ${summary.productsUpdated}`);
  console.log(`Products skipped: ${summary.productsSkipped}`);
  console.log(`Variants created: ${summary.variantsCreated}`);
  console.log(`Variants updated: ${summary.variantsUpdated}`);
  console.log(`Images created: ${summary.imagesCreated}`);
  console.log(`Images skipped: ${summary.imagesSkipped}`);
  console.log(`Inventory movements created: ${summary.inventoryMovementsCreated}`);
  console.log(`Delivery zones upserted: ${summary.deliveryZonesUpserted}`);
  console.log(`Coupons upserted: ${summary.couponsUpserted}`);
  printList("Categories created", summary.categoriesCreated);
  printList("Collections created", summary.collectionsCreated);
  printList("Brands created", summary.brandsCreated);

  if (summary.warnings.length > 0) {
    console.log("Warnings");
    for (const warning of summary.warnings) {
      console.log(`Row ${warning.rowNumber} ${warning.field}: ${warning.message}`);
    }
  }

  if (summary.validationErrors.length > 0) {
    console.log("Validation errors");
    for (const error of summary.validationErrors) {
      console.log(`Row ${error.rowNumber} ${error.field}: ${error.message}`);
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo product import failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

