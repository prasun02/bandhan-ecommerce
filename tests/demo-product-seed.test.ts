import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createDemoProductsCsv,
  DEMO_PRODUCT_ROWS,
  DEMO_PRODUCTS
} from "@/lib/demo-products-data";
import { PRODUCT_IMPORT_HEADERS } from "@/lib/product-import-config";
import {
  parseProductImportCsv,
  parseProductImportXlsx,
  prepareProductImport
} from "@/lib/services/admin-product-import";
import { inventoryState } from "@/lib/inventory-state";

describe("demo product catalog", () => {
  it("contains eight products and exactly 22 unique variant SKUs", () => {
    expect(DEMO_PRODUCTS).toHaveLength(8);
    expect(DEMO_PRODUCT_ROWS).toHaveLength(22);
    expect(new Set(DEMO_PRODUCT_ROWS.map((row) => row.variant_sku)).size).toBe(22);
    expect(new Set(DEMO_PRODUCT_ROWS.map((row) => row.slug)).size).toBe(8);
  });

  it("parses through the production importer and converts BDT to poisha", () => {
    const parsed = parseProductImportCsv(createDemoProductsCsv());
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(22);
    expect(parsed.rows.find((row) => row.variantSku === "DEMO-MTS-BLK-M"))
      .toMatchObject({ basePrice: 79000, variantPrice: 79000 });
    expect(parsed.rows.find((row) => row.variantSku === "DEMO-OFS-WHT-M"))
      .toMatchObject({ basePrice: 149000, variantPrice: 149000 });
  });

  it("includes out-of-stock and low-stock variants for cart and admin testing", () => {
    const parsed = parseProductImportCsv(createDemoProductsCsv());
    const zeroStock = parsed.rows.filter((row) => row.stockQuantity === 0);
    const lowStock = parsed.rows.filter((row) =>
      row.stockQuantity > 0 && row.stockQuantity <= row.lowStockThreshold
    );
    expect(zeroStock.map((row) => row.variantSku)).toEqual([
      "DEMO-MTS-BLK-XL",
      "DEMO-GPD-PNK-8Y"
    ]);
    expect(lowStock.length).toBeGreaterThanOrEqual(3);
    expect(lowStock.every((row) =>
      inventoryState(row.stockQuantity, row.lowStockThreshold) === "LOW_STOCK"
    )).toBe(true);
  });

  it("references two distinct safe local images per product", () => {
    for (const product of DEMO_PRODUCTS) {
      expect(product.image1).toMatch(/^\/demo-products\/[a-z-]+\.svg$/);
      expect(product.image2).toMatch(/^\/demo-products\/[a-z-]+\.svg$/);
      expect(product.image1).not.toBe(product.image2);
    }
  });

  it("keeps the checked-in CSV aligned with the canonical headers and rows", async () => {
    const csv = await readFile(
      path.join(process.cwd(), "docs", "bandhan_demo_products_upload.csv"),
      "utf8"
    );
    const parsed = parseProductImportCsv(csv);
    expect(csv.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0]?.split(","))
      .toEqual(PRODUCT_IMPORT_HEADERS);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(DEMO_PRODUCT_ROWS.length);
  });

  it("keeps the editable XLSX aligned with the same canonical rows", async () => {
    const xlsx = await readFile(
      path.join(process.cwd(), "docs", "bandhan_demo_products_upload.xlsx")
    );
    const parsed = await parseProductImportXlsx(xlsx);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(DEMO_PRODUCT_ROWS.length);
  });

  it("plans a second run as updates with no product or variant duplicates", async () => {
    const parsed = parseProductImportCsv(createDemoProductsCsv());
    const products = DEMO_PRODUCTS.map((product, index) => ({
      id: `product-${index}`,
      slug: product.slug,
      sku: product.productKey
    }));
    const productIdByKey = new Map(products.map((product) => [product.sku, product.id]));
    const variants = DEMO_PRODUCT_ROWS.map((row, index) => ({
      id: `variant-${index}`,
      productId: productIdByKey.get(row.product_key)!,
      sku: row.variant_sku,
      stockQuantity: Number(row.stock_qty)
    }));
    const categorySlugs = [
      "men", "men-t-shirts", "men-shirts", "men-panjabi",
      "women", "women-sarees", "women-kurtis", "women-accessories",
      "kids", "accessories"
    ];
    const database = {
      product: { findMany: vi.fn().mockResolvedValue(products) },
      productVariant: { findMany: vi.fn().mockResolvedValue(variants) },
      category: {
        findMany: vi.fn().mockResolvedValue(
          categorySlugs.map((slug) => ({ slug }))
        )
      }
    };

    const plan = await prepareProductImport(database as never, parsed);
    expect(plan.dryRun).toMatchObject({
      productsDetected: 8,
      variantsDetected: 22,
      newProducts: 0,
      existingProductsToUpdate: 8,
      newVariants: 0,
      existingVariantsToUpdate: 22,
      categoriesToCreate: 0,
      canImport: true
    });
  });
});
