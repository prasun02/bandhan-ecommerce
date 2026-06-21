import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type ProductImportModule = typeof import("@/lib/services/product-import");

let productImport: ProductImportModule;

beforeAll(async () => {
  productImport = await import("@/lib/services/product-import");
});

const headerLine = [
  "name",
  "slug",
  "sku",
  "category",
  "collection",
  "brand",
  "fabric",
  "occasion",
  "regularPricePaisa",
  "salePricePaisa",
  "stock",
  "size",
  "color",
  "imageUrl",
  "status",
  "shortDescription",
  "description",
  "stitchingType",
  "costPricePaisa",
  "tags",
  "featured",
  "newArrival",
  "bestSeller",
  "careInstructions",
  "packageContents",
  "estimatedDeliveryTime",
  "seoTitle",
  "seoDescription"
].join(",");

const validCsv = `${headerLine}
Royal Maroon Banarasi Saree,royal-maroon-banarasi-saree,BD-CSV-001,Sarees,Puja Collection,Bandhan Studio,Silk,Wedding,750000,645000,15,Free Size,Maroon,/images/products/product-1.svg,PUBLISHED,Premium saree,Full product description,Semi-stitched,465000,Saree|Silk|Puja,TRUE,1,false,Dry clean,1 saree,1-6 business days,SEO title,SEO description
Pastel Pink Embroidered Salwar Kameez,pastel-pink-embroidered-salwar-kameez,BD-CSV-002,Salwar Kameez,New Arrivals,Ruposhi,Georgette,Party,420000,375000,24,M,Pink,/images/products/product-2.svg,PUBLISHED,Premium salwar,Full product description,Stitched,260000,Salwar Kameez|Pink,FALSE,true,0,Dry clean,3 pieces,1-6 business days,SEO title,SEO description`;

describe("product CSV import parsing", () => {
  it("validates detailed headers", () => {
    const result = productImport.validateProductImportHeaders([...productImport.detailedProductImportHeaders]);
    expect(result.missing).toEqual([]);
    expect(result.detailed).toBe(true);
  });

  it("handles UTF-8 BOM headers", () => {
    const result = productImport.parseProductImportCsv(`\uFEFF${validCsv}`);
    expect(result.validationErrors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.sku).toBe("BD-CSV-001");
  });

  it("parses valid rows without changing paisa values", () => {
    const result = productImport.parseProductImportCsv(validCsv);
    expect(result.rows[0]?.regularPrice).toBe(750000);
    expect(result.rows[0]?.salePrice).toBe(645000);
    expect(result.rows[0]?.tags).toEqual(["Saree", "Silk", "Puja"]);
    expect(result.rows[0]?.featured).toBe(true);
    expect(result.rows[0]?.newArrival).toBe(true);
    expect(result.rows[0]?.bestSeller).toBe(false);
  });

  it("rejects invalid rows", () => {
    const csv = `${headerLine}
Bad Product,bad-product,BD-CSV-001,Sarees,Puja Collection,Bandhan Studio,Silk,Wedding,abc,645000,15,Free Size,Maroon,/images/products/product-1.svg,PUBLISHED,Premium saree,Full product description,Semi-stitched,465000,Saree,false,false,false,Dry clean,1 saree,1-6 business days,SEO title,SEO description`;
    const result = productImport.parseProductImportCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.validationErrors.some((error) => error.field === "regularPricePaisa")).toBe(true);
  });

  it("rejects duplicate SKUs and slugs", () => {
    const csv = `${headerLine}
First Product,first-product,BD-CSV-001,Sarees,Puja Collection,Bandhan Studio,Silk,Wedding,750000,645000,15,Free Size,Maroon,/images/products/product-1.svg,PUBLISHED,Premium saree,Full product description,Semi-stitched,465000,Saree,false,false,false,Dry clean,1 saree,1-6 business days,SEO title,SEO description
Second Product,first-product,BD-CSV-001,Sarees,Puja Collection,Bandhan Studio,Silk,Wedding,750000,645000,15,Free Size,Maroon,/images/products/product-1.svg,PUBLISHED,Premium saree,Full product description,Semi-stitched,465000,Saree,false,false,false,Dry clean,1 saree,1-6 business days,SEO title,SEO description`;
    const result = productImport.parseProductImportCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.validationErrors.some((error) => error.field === "sku")).toBe(true);
    expect(result.validationErrors.some((error) => error.field === "slug")).toBe(true);
  });

  it("parses boolean and tag values", () => {
    const errors: { rowNumber: number; field: string; message: string }[] = [];
    expect(productImport.parseBooleanText("TRUE", "featured", 2, errors)).toBe(true);
    expect(productImport.parseBooleanText("0", "featured", 2, errors)).toBe(false);
    expect(productImport.parseTags("Saree|Banarasi|Saree| Silk ")).toEqual(["Saree", "Banarasi", "Silk"]);
    expect(errors).toEqual([]);
  });
});

describe("product import variant planning", () => {
  it("distributes stock across buckets without exceeding total", () => {
    expect(productImport.distributeStock(24, 3)).toEqual([8, 8, 8]);
    expect(productImport.distributeStock(17, 3)).toEqual([6, 6, 5]);
  });

  it("creates one Free Size variant for sarees", () => {
    const row = productImport.parseProductImportCsv(validCsv).rows[0];
    expect(row).toBeDefined();
    const variants = row ? productImport.buildVariantPlan(row) : [];
    expect(variants).toHaveLength(1);
    expect(variants[0]?.stockQuantity).toBe(15);
    expect(variants[0]?.sku).toBe("BD-CSV-001-FREE-SIZE-MAROON");
  });

  it("creates three stocked variants for stitched products", () => {
    const row = productImport.parseProductImportCsv(validCsv).rows[1];
    expect(row).toBeDefined();
    const variants = row ? productImport.buildVariantPlan(row) : [];
    expect(variants).toHaveLength(3);
    expect(variants.reduce((sum, variant) => sum + variant.stockQuantity, 0)).toBe(24);
    expect(variants.map((variant) => variant.size)).toEqual(["M", "L", "XL"]);
  });
});
