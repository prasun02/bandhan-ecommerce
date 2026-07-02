import { Buffer } from "node:buffer";
import { PublicationStatus } from "@prisma/client";
import { strToU8, zipSync } from "fflate";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  createProductImportTemplateCsv,
  normalizeProductStatus,
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_REQUIRED_HEADERS,
  PRODUCT_IMPORT_SAMPLE_ROW,
  PRODUCT_STATUS_VALUES
} from "@/lib/product-import-config";

vi.mock("server-only", () => ({}));

type ImportModule = typeof import("@/lib/services/admin-product-import");

let importer: ImportModule;

beforeAll(async () => {
  importer = await import("@/lib/services/admin-product-import");
});

const headers = [...PRODUCT_IMPORT_HEADERS];

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function row(overrides: Record<string, string | number> = {}) {
  const values: Record<string, string | number> = {
    product_key: "MEN-TSHIRT-001",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-t-shirt",
    category: "Men",
    subcategory: "T-Shirts",
    brand: "Bandhan",
    gender: "Men",
    short_description: "Soft, breathable cotton",
    description: "A comfortable, everyday cotton t-shirt.",
    base_price_bdt: "900.00",
    compare_at_price_bdt: "1200.00",
    featured: "TRUE",
    active: "yes",
    tags: "Men|Cotton",
    image_1: "/demo-products/men-tshirt-front.svg",
    image_2: "/demo-products/men-tshirt-back.svg",
    variant_sku: "BDN-MTS-BLK-M",
    color: "Black",
    size: "M",
    variant_price_bdt: "950.00",
    stock_qty: 3,
    low_stock_threshold: 2,
    weight_grams: 250,
    ...overrides
  };
  return headers.map((header) => csvCell(values[header] ?? "")).join(",");
}

function validCsv() {
  return [
    headers.join(","),
    row(),
    row({ variant_sku: "BDN-MTS-BLK-L", size: "L", stock_qty: 4 }),
    row({ variant_sku: "BDN-MTS-NVY-XL", color: "Navy", size: "XL", stock_qty: 2 })
  ].join("\n");
}

function xmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function worksheetXml(rows: string[][]) {
  const sheetData = rows.map((values, rowIndex) => {
    const cells = values.map((value, columnIndex) => {
      const reference = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;
      return `<c r="${reference}" t="inlineStr"><is><t>${xmlText(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
}

function xlsxFixture(importRows: string[][]) {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Ignored" sheetId="1" r:id="rId1"/><sheet name="Import_Data" sheetId="2" r:id="rId2"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`,
    "xl/worksheets/sheet1.xml": worksheetXml([["wrong"]]),
    "xl/worksheets/sheet2.xml": worksheetXml(importRows)
  };
  return Buffer.from(zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, content]) => [name, strToU8(content)])
    )
  ));
}

function databaseMock(options: {
  products?: Array<{ id: string; slug: string; sku: string }>;
  variants?: Array<{ id: string; productId: string; sku: string; stockQuantity: number }>;
  categories?: Array<{ slug: string }>;
  transaction?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    product: {
      findMany: vi.fn().mockResolvedValue(options.products ?? [])
    },
    productVariant: {
      findMany: vi.fn().mockResolvedValue(options.variants ?? [])
    },
    category: {
      findMany: vi.fn().mockResolvedValue(options.categories ?? [])
    },
    $transaction: options.transaction ?? vi.fn()
  };
}

describe("shared product import configuration", () => {
  it("matches the actual Prisma PublicationStatus enum", () => {
    expect([...PRODUCT_STATUS_VALUES].sort()).toEqual(
      Object.values(PublicationStatus).sort()
    );
  });

  it.each([
    ["ACTIVE", "PUBLISHED"],
    ["active", "PUBLISHED"],
    [" published ", "PUBLISHED"],
    ["\uFEFFLIVE", "PUBLISHED"],
    ["INACTIVE", "DRAFT"],
    ["inactive", "DRAFT"],
    ["draft", "DRAFT"],
    ["ARCHIVED", "ARCHIVED"],
    [" archived ", "ARCHIVED"]
  ])("normalizes status alias %s to %s", (input, expected) => {
    expect(normalizeProductStatus(input)).toBe(expected);
  });

  it("generates template headers from the validator's shared constant", () => {
    const [header, sample] = createProductImportTemplateCsv()
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/);
    expect(header?.split(",")).toEqual(PRODUCT_IMPORT_HEADERS);
    expect(sample).toContain(",ACTIVE,");
  });
});

describe("administrator product upload parsing", () => {
  it("rejects a file missing a required template header", () => {
    const incompleteHeaders = headers.filter((header) => header !== "active");
    const parsed = importer.parseProductImportCsv(incompleteHeaders.join(","));
    expect(parsed.errors.some((error) =>
      error.field === "active" && error.message.includes("missing")
    )).toBe(true);
  });

  it("parses quoted CSV values, UTF-8 BOM, and groups variants by product key", () => {
    const csv = `\uFEFF${validCsv()}`;
    const parsed = importer.parseProductImportCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(3);
    expect(new Set(parsed.rows.map((item) => item.productKey))).toEqual(
      new Set(["MEN-TSHIRT-001"])
    );
  });

  it("converts BDT to poisha without floating-point arithmetic", () => {
    const errors: Array<{
      rowNumber: number;
      field: string;
      message: string;
    }> = [];
    expect(importer.parseBdtToPaisa("1250.75", "price", 2, errors)).toBe(125075);
    expect(importer.parseBdtToPaisa("0", "price", 2, errors)).toBe(0);
    expect(errors).toEqual([]);
  });

  it("accepts supported boolean spellings", () => {
    for (const [value, expected] of [
      ["TRUE", true],
      ["1", true],
      ["yes", true],
      ["false", false],
      ["0", false],
      ["no", false]
    ] as const) {
      const parsed = importer.parseProductImportCsv(
        `${headers.join(",")}\n${row({ featured: value })}`
      );
      expect(parsed.errors).toEqual([]);
      expect(parsed.rows[0]?.featured).toBe(expected);
    }
  });

  it.each([
    ["ACTIVE", "PUBLISHED"],
    [" active ", "PUBLISHED"],
    ["PUBLISHED", "PUBLISHED"],
    ["published", "PUBLISHED"],
    ["INACTIVE", "DRAFT"],
    ["draft", "DRAFT"],
    ["ARCHIVED", "ARCHIVED"],
    ["\uFEFFACTIVE", "PUBLISHED"]
  ])("accepts active/status value %s as %s", (active, expected) => {
    const parsed = importer.parseProductImportCsv(
      `${headers.join(",")}\n${row({ active })}`
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.status).toBe(expected);
  });

  it("accepts a complete 22-row upload using the ACTIVE alias", () => {
    const rows = Array.from({ length: 22 }, (_, index) => row({
      active: "ACTIVE",
      variant_sku: `BDN-MTS-VAR-${String(index + 1).padStart(2, "0")}`,
      size: `Size ${index + 1}`
    }));
    const parsed = importer.parseProductImportCsv(
      [headers.join(","), ...rows].join("\n")
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(22);
    expect(parsed.rows.every((item) => item.status === "PUBLISHED")).toBe(true);
  });

  it("reports actual accepted enum values for an invalid status", () => {
    const parsed = importer.parseProductImportCsv(
      `${headers.join(",")}\n${row({ active: "UNKNOWN" })}`
    );
    const statusError = parsed.errors.find((error) => error.field === "active");
    expect(statusError?.message).toContain("PUBLISHED, DRAFT, ARCHIVED");
    expect(statusError?.message).toContain("ACTIVE");
    expect(statusError?.message).toContain("INACTIVE");
  });

  it("accepts empty optional fields", () => {
    const parsed = importer.parseProductImportCsv(
      `${headers.join(",")}\n${row({
        subcategory: "",
        brand: "",
        gender: "",
        compare_at_price_bdt: "",
        image_2: "",
        color: "",
        size: "",
        weight_grams: ""
      })}`
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.compareAtPrice).toBeNull();
    expect(parsed.rows[0]?.weightGrams).toBeNull();
  });

  it("allows optional columns to be omitted", () => {
    const optionalColumnsOmitted = [...PRODUCT_IMPORT_REQUIRED_HEADERS];
    const data = optionalColumnsOmitted
      .map((header) => csvCell(PRODUCT_IMPORT_SAMPLE_ROW[header]))
      .join(",");
    const parsed = importer.parseProductImportCsv(
      `${optionalColumnsOmitted.join(",")}\n${data}`
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      productKey: "MEN-TSHIRT-001",
      status: "PUBLISHED"
    });
  });

  it("reports required fields and duplicate SKUs", () => {
    const parsed = importer.parseProductImportCsv([
      headers.join(","),
      row(),
      row({ product_key: "", variant_sku: "BDN-MTS-BLK-M", size: "L" })
    ].join("\n"));
    expect(parsed.errors.some((error) => error.field === "product_key")).toBe(true);
    expect(parsed.errors.some((error) => error.field === "variant_sku")).toBe(true);
  });

  it("rejects unsafe image URLs and accepts safe local paths", () => {
    expect(importer.isSafeProductImage("/demo-products/men-tshirt-front.svg")).toBe(true);
    expect(importer.isSafeProductImage("/demo-products/../secret.svg")).toBe(false);
    expect(importer.isSafeProductImage("javascript:alert(1)")).toBe(false);
    expect(importer.isSafeProductImage("https://evil.example/product.png")).toBe(false);
  });

  it("detects conflicting product-level data", () => {
    const parsed = importer.parseProductImportCsv([
      headers.join(","),
      row(),
      row({ variant_sku: "BDN-MTS-BLK-L", size: "L", name: "Conflicting Name" })
    ].join("\n"));
    expect(parsed.errors.some((error) => error.message.includes("Conflicts with row 2"))).toBe(true);
  });

  it("reads Import_Data from XLSX without evaluating formulas", async () => {
    const xlsxRow = row({
      short_description: "Soft cotton",
      description: "Comfortable cotton shirt"
    }).split(",");
    const dataRow = headers.map((header) => {
      return xlsxRow[headers.indexOf(header)] ?? "";
    });
    const parsed = await importer.parseProductImportXlsx(
      xlsxFixture([headers, dataRow])
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.variantSku).toBe("BDN-MTS-BLK-M");
  });
});

describe("administrator product import planning", () => {
  it("performs a dry run without starting a transaction", async () => {
    const transaction = vi.fn();
    const database = databaseMock({ transaction });
    const parsed = importer.parseProductImportCsv(validCsv());
    const plan = await importer.prepareProductImport(database as never, parsed);
    expect(plan.dryRun).toMatchObject({
      totalRows: 3,
      validRows: 3,
      productsDetected: 1,
      variantsDetected: 3,
      newProducts: 1,
      newVariants: 3,
      categoriesToCreate: 2,
      canImport: true
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("recognizes a second upload as updates instead of duplicates", async () => {
    const variants = [
      { id: "v1", productId: "p1", sku: "BDN-MTS-BLK-M", stockQuantity: 3 },
      { id: "v2", productId: "p1", sku: "BDN-MTS-BLK-L", stockQuantity: 4 },
      { id: "v3", productId: "p1", sku: "BDN-MTS-NVY-XL", stockQuantity: 2 }
    ];
    const database = databaseMock({
      products: [{ id: "p1", slug: "premium-cotton-t-shirt", sku: "MEN-TSHIRT-001" }],
      variants,
      categories: [{ slug: "men" }, { slug: "men-t-shirts" }]
    });
    const plan = await importer.prepareProductImport(
      database as never,
      importer.parseProductImportCsv(validCsv())
    );
    expect(plan.dryRun).toMatchObject({
      newProducts: 0,
      existingProductsToUpdate: 1,
      newVariants: 0,
      existingVariantsToUpdate: 3,
      categoriesToCreate: 0,
      canImport: true
    });
  });

  it("prevents import when validation errors remain", async () => {
    const database = databaseMock();
    const parsed = importer.parseProductImportCsv(
      `${headers.join(",")}\n${row({ stock_qty: "-1" })}`
    );
    const plan = await importer.prepareProductImport(database as never, parsed);
    expect(plan.dryRun.canImport).toBe(false);
    await expect(
      importer.importProducts(database as never, {
        adminUserId: "admin-1",
        fileName: "products.csv",
        parsed
      })
    ).rejects.toBeInstanceOf(importer.ProductImportValidationError);
  });

  it("uses one transaction and creates an audit record", async () => {
    const auditCreate = vi.fn().mockResolvedValue({});
    const productCreate = vi.fn().mockResolvedValue({ id: "p1" });
    const tx = {
      category: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.slug }))
      },
      brand: {
        upsert: vi.fn().mockResolvedValue({ id: "brand-1" })
      },
      product: {
        create: productCreate,
        update: vi.fn().mockResolvedValue({ id: "p1" })
      },
      productImage: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({})
      },
      productVariant: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.sku })),
        update: vi.fn(),
        aggregate: vi.fn().mockResolvedValue({ _sum: { stockQuantity: 9 } })
      },
      inventoryMovement: {
        create: vi.fn().mockResolvedValue({})
      },
      adminAuditLog: {
        create: auditCreate
      }
    };
    const transaction = vi.fn().mockImplementation((callback) => callback(tx));
    const database = databaseMock({ transaction });
    const result = await importer.importProducts(database as never, {
      adminUserId: "admin-1",
      fileName: "bandhan_demo_products_upload.csv",
      parsed: importer.parseProductImportCsv(validCsv())
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      productsCreated: 1,
      variantsCreated: 3,
      categoriesCreated: 2
    });
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(productCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PUBLISHED" })
    }));
  });

  it("updates matching product and variant SKUs on a second import", async () => {
    const existingVariants = [
      { id: "v1", productId: "p1", sku: "BDN-MTS-BLK-M", stockQuantity: 3 },
      { id: "v2", productId: "p1", sku: "BDN-MTS-BLK-L", stockQuantity: 4 },
      { id: "v3", productId: "p1", sku: "BDN-MTS-NVY-XL", stockQuantity: 2 }
    ];
    const variantUpdate = vi.fn().mockResolvedValue({});
    const productCreate = vi.fn();
    const variantCreate = vi.fn();
    const tx = {
      category: {
        findUnique: vi.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: where.slug, slug: where.slug })
        ),
        create: vi.fn()
      },
      brand: {
        upsert: vi.fn().mockResolvedValue({ id: "brand-1" })
      },
      product: {
        create: productCreate,
        update: vi.fn().mockResolvedValue({ id: "p1" })
      },
      productImage: {
        findMany: vi.fn().mockResolvedValue([
          { url: "/demo-products/men-tshirt-front.svg" },
          { url: "/demo-products/men-tshirt-back.svg" }
        ]),
        create: vi.fn()
      },
      productVariant: {
        create: variantCreate,
        update: variantUpdate,
        aggregate: vi.fn().mockResolvedValue({ _sum: { stockQuantity: 9 } })
      },
      inventoryMovement: {
        create: vi.fn()
      },
      adminAuditLog: {
        create: vi.fn().mockResolvedValue({})
      }
    };
    const database = databaseMock({
      products: [{ id: "p1", slug: "premium-cotton-t-shirt", sku: "MEN-TSHIRT-001" }],
      variants: existingVariants,
      categories: [{ slug: "men" }, { slug: "men-t-shirts" }],
      transaction: vi.fn().mockImplementation((callback) => callback(tx))
    });
    const result = await importer.importProducts(database as never, {
      adminUserId: "admin-1",
      fileName: "products.xlsx",
      parsed: importer.parseProductImportCsv(validCsv())
    });
    expect(result).toMatchObject({
      productsCreated: 0,
      productsUpdated: 1,
      variantsCreated: 0,
      variantsUpdated: 3,
      categoriesCreated: 0
    });
    expect(productCreate).not.toHaveBeenCalled();
    expect(variantCreate).not.toHaveBeenCalled();
    expect(variantUpdate).toHaveBeenCalledTimes(3);
  });

  it("propagates transaction failure so partial writes can roll back", async () => {
    const transaction = vi.fn().mockRejectedValue(new Error("transaction rolled back"));
    const database = databaseMock({ transaction });
    await expect(
      importer.importProducts(database as never, {
        adminUserId: "admin-1",
        fileName: "products.csv",
        parsed: importer.parseProductImportCsv(validCsv())
      })
    ).rejects.toThrow("transaction rolled back");
  });
});
