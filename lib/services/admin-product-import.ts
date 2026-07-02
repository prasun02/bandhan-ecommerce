import path from "node:path";
import { Buffer } from "node:buffer";
import { parse } from "csv-parse/sync";
import readExcelFile from "read-excel-file/node";
import type { Prisma, PrismaClient, PublicationStatus } from "@prisma/client";
import {
  normalizeImportBoolean,
  normalizeProductStatus,
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_MAX_BYTES,
  PRODUCT_IMPORT_MAX_ROWS,
  PRODUCT_IMPORT_REQUIRED_HEADERS,
  PRODUCT_STATUS_ALIASES,
  PRODUCT_STATUS_VALUES
} from "@/lib/product-import-config";

export { PRODUCT_IMPORT_HEADERS as productImportHeaders };

const allowedRemoteImageHosts = new Set([
  "images.unsplash.com",
  "placehold.co"
]);

type Header = (typeof PRODUCT_IMPORT_HEADERS)[number];
type RawRow = Record<Header, string>;

export type ProductImportIssue = {
  rowNumber: number;
  productKey?: string;
  sku?: string;
  field: string;
  value?: string;
  message: string;
};

export type ProductImportRow = {
  rowNumber: number;
  productKey: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  gender: string | null;
  shortDescription: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  featured: boolean;
  status: PublicationStatus;
  tags: string[];
  image1: string | null;
  image2: string | null;
  variantSku: string;
  color: string | null;
  size: string | null;
  variantPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  weightGrams: number | null;
};

export type ParsedProductImport = {
  rowsRead: number;
  rows: ProductImportRow[];
  errors: ProductImportIssue[];
  warnings: ProductImportIssue[];
};

export type ProductImportDryRun = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  productsDetected: number;
  variantsDetected: number;
  newProducts: number;
  existingProductsToUpdate: number;
  newVariants: number;
  existingVariantsToUpdate: number;
  categoriesToCreate: number;
  rowsSkipped: number;
  errors: ProductImportIssue[];
  warnings: ProductImportIssue[];
  canImport: boolean;
};

export type ProductImportSummary = {
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  categoriesCreated: number;
  rowsSkipped: number;
  warningCount: number;
  durationMs: number;
};

type ProductGroup = {
  productKey: string;
  product: ProductImportRow;
  variants: ProductImportRow[];
};

type ExistingProduct = {
  id: string;
  slug: string;
  sku: string;
};

type ExistingVariant = {
  id: string;
  productId: string;
  sku: string;
  stockQuantity: number;
};

type ProductImportPlan = {
  parsed: ParsedProductImport;
  groups: ProductGroup[];
  existingProductsBySlug: Map<string, ExistingProduct>;
  existingProductsByKey: Map<string, ExistingProduct>;
  existingVariantsBySku: Map<string, ExistingVariant>;
  dryRun: ProductImportDryRun;
};

export class ProductImportValidationError extends Error {
  constructor(public readonly dryRun: ProductImportDryRun) {
    super("Product import validation failed.");
    this.name = "ProductImportValidationError";
  }
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
}

function safeIssueValue(value: string): string {
  const cleaned = Array.from(value)
    .map((character) => isControlCharacter(character) ? " " : character)
    .join("")
    .slice(0, 80);
  return /^[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned;
}

function issue(
  errors: ProductImportIssue[],
  rowNumber: number,
  field: string,
  message: string,
  context?: { productKey?: string; sku?: string; value?: string }
) {
  errors.push({
    rowNumber,
    productKey: context?.productKey,
    sku: context?.sku,
    field,
    value: context?.value ? safeIssueValue(context.value) : undefined,
    message
  });
}

function containsFormulaPrefix(value: string): boolean {
  return /^[=+\-@]/.test(value);
}

function parseFeatured(
  value: string,
  field: string,
  rowNumber: number,
  errors: ProductImportIssue[],
  context: { productKey?: string; sku?: string }
): boolean | null {
  const normalized = normalizeImportBoolean(value);
  if (normalized !== null) return normalized;
  issue(errors, rowNumber, field, "Use TRUE/FALSE, 1/0, or yes/no.", {
    ...context,
    value
  });
  return null;
}

export function parseBdtToPaisa(
  value: string,
  field: string,
  rowNumber: number,
  errors: ProductImportIssue[],
  options: { optional?: boolean } = {}
): number | null {
  if (!value && options.optional) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    issue(errors, rowNumber, field, "Must be a zero or positive BDT amount with at most two decimal places.", {
      value
    });
    return null;
  }
  const [whole, fraction = ""] = value.split(".");
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paisa)) {
    issue(errors, rowNumber, field, "Amount is too large.", { value });
    return null;
  }
  return paisa;
}

function parseNonNegativeInteger(
  value: string,
  field: string,
  rowNumber: number,
  errors: ProductImportIssue[],
  options: { optional?: boolean } = {}
): number | null {
  if (!value && options.optional) return null;
  if (!/^\d+$/.test(value)) {
    issue(errors, rowNumber, field, "Must be a non-negative integer.", { value });
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    issue(errors, rowNumber, field, "Value is too large.", { value });
    return null;
  }
  return parsed;
}

function normalizeTags(value: string, gender: string | null): string[] {
  const values = value
    .split(/[|,]/)
    .map(normalizeText)
    .filter(Boolean);
  if (gender) values.push(`Gender: ${gender}`);
  return Array.from(new Set(values));
}

export function isSafeProductImage(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/")) {
    if (
      value.includes("..") ||
      value.includes("\\") ||
      Array.from(value).some(isControlCharacter)
    ) {
      return false;
    }
    return /^\/[A-Za-z0-9/_-]+\.(?:svg|png|jpe?g|webp|avif)$/i.test(value);
  }
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      allowedRemoteImageHosts.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

function validateHeaders(headers: string[], errors: ProductImportIssue[]) {
  const normalized = headers.map((header, index) =>
    normalizeText(index === 0 ? header.replace(/^\uFEFF/, "") : header).toLowerCase()
  );
  const missing = PRODUCT_IMPORT_REQUIRED_HEADERS.filter(
    (header) => !normalized.includes(header)
  );
  const unsupported = normalized.filter(
    (header) => header && !PRODUCT_IMPORT_HEADERS.includes(header as Header)
  );
  for (const header of missing) {
    issue(errors, 1, header, `Required column ${header} is missing.`);
  }
  for (const header of unsupported) {
    issue(errors, 1, header, `Unsupported column ${header}.`);
  }
  return normalized;
}

function parseRawRows(headers: string[], dataRows: string[][]): ParsedProductImport {
  const errors: ProductImportIssue[] = [];
  const warnings: ProductImportIssue[] = [];
  const normalizedHeaders = validateHeaders(headers, errors);
  if (errors.length > 0) {
    return { rowsRead: dataRows.length, rows: [], errors, warnings };
  }

  const rows: ProductImportRow[] = [];
  const seenSkus = new Map<string, number>();
  const seenSlugs = new Map<string, string>();

  for (const [index, values] of dataRows.entries()) {
    const rowNumber = index + 2;
    if (values.every((value) => !normalizeText(value))) continue;
    const raw = Object.fromEntries(
      PRODUCT_IMPORT_HEADERS.map((header) => {
        const columnIndex = normalizedHeaders.indexOf(header);
        return [header, normalizeText(values[columnIndex] ?? "")];
      })
    ) as RawRow;
    const rowErrors: ProductImportIssue[] = [];
    const context = {
      productKey: raw.product_key || undefined,
      sku: raw.variant_sku || undefined
    };

    for (const field of PRODUCT_IMPORT_REQUIRED_HEADERS) {
      if (!raw[field]) {
        issue(rowErrors, rowNumber, field, "This field is required.", context);
      }
    }

    for (const field of [
      "product_key",
      "name",
      "slug",
      "category",
      "subcategory",
      "brand",
      "gender",
      "short_description",
      "description",
      "tags",
      "variant_sku",
      "color",
      "size"
    ] satisfies Header[]) {
      if (raw[field] && containsFormulaPrefix(raw[field])) {
        issue(rowErrors, rowNumber, field, "Spreadsheet formula-like text is not allowed.", {
          ...context,
          value: raw[field]
        });
      }
    }

    if (raw.product_key && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(raw.product_key)) {
      issue(rowErrors, rowNumber, "product_key", "Use letters, numbers, dots, underscores, or hyphens.", context);
    }
    if (raw.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.slug)) {
      issue(rowErrors, rowNumber, "slug", "Use a lowercase URL-safe slug.", {
        ...context,
        value: raw.slug
      });
    }
    if (raw.variant_sku && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(raw.variant_sku)) {
      issue(rowErrors, rowNumber, "variant_sku", "Use letters, numbers, dots, underscores, or hyphens.", context);
    }

    const basePrice = parseBdtToPaisa(raw.base_price_bdt, "base_price_bdt", rowNumber, rowErrors);
    const compareAtPrice = parseBdtToPaisa(
      raw.compare_at_price_bdt,
      "compare_at_price_bdt",
      rowNumber,
      rowErrors,
      { optional: true }
    );
    const variantPrice = parseBdtToPaisa(raw.variant_price_bdt, "variant_price_bdt", rowNumber, rowErrors);
    const stockQuantity = parseNonNegativeInteger(raw.stock_qty, "stock_qty", rowNumber, rowErrors);
    const lowStockThreshold = parseNonNegativeInteger(
      raw.low_stock_threshold,
      "low_stock_threshold",
      rowNumber,
      rowErrors
    );
    const weightGrams = parseNonNegativeInteger(
      raw.weight_grams,
      "weight_grams",
      rowNumber,
      rowErrors,
      { optional: true }
    );
    const featured = parseFeatured(raw.featured, "featured", rowNumber, rowErrors, context);
    const status = normalizeProductStatus(raw.active);
    if (status === null) {
      const aliases = Array.from(new Set(Object.values(PRODUCT_STATUS_ALIASES).flat()));
      issue(
        rowErrors,
        rowNumber,
        "active",
        `Invalid product status "${safeIssueValue(raw.active)}". Accepted database values: ${PRODUCT_STATUS_VALUES.join(", ")}. Supported aliases: ${aliases.join(", ")}.`,
        { ...context, value: raw.active }
      );
    }

    if (
      compareAtPrice !== null &&
      variantPrice !== null &&
      compareAtPrice < variantPrice
    ) {
      issue(rowErrors, rowNumber, "compare_at_price_bdt", "Compare-at price cannot be lower than the variant selling price.", context);
    }
    if (raw.image_1 && !isSafeProductImage(raw.image_1)) {
      issue(rowErrors, rowNumber, "image_1", "Use a safe local image path or an approved HTTP/HTTPS image URL.", context);
    }
    if (raw.image_2 && !isSafeProductImage(raw.image_2)) {
      issue(rowErrors, rowNumber, "image_2", "Use a safe local image path or an approved HTTP/HTTPS image URL.", context);
    }

    const normalizedSku = raw.variant_sku.toLowerCase();
    if (raw.variant_sku && seenSkus.has(normalizedSku)) {
      issue(
        rowErrors,
        rowNumber,
        "variant_sku",
        `Duplicate SKU ${raw.variant_sku}; first used on row ${seenSkus.get(normalizedSku)}.`,
        context
      );
    } else if (raw.variant_sku) {
      seenSkus.set(normalizedSku, rowNumber);
    }
    if (raw.slug) {
      const existingKey = seenSlugs.get(raw.slug);
      if (existingKey && existingKey !== raw.product_key) {
        issue(rowErrors, rowNumber, "slug", `Slug ${raw.slug} is already assigned to product_key ${existingKey}.`, context);
      } else {
        seenSlugs.set(raw.slug, raw.product_key);
      }
    }

    if (
      rowErrors.length > 0 ||
      basePrice === null ||
      variantPrice === null ||
      stockQuantity === null ||
      lowStockThreshold === null ||
      featured === null ||
      status === null
    ) {
      errors.push(...rowErrors);
      continue;
    }

    const gender = raw.gender || null;
    rows.push({
      rowNumber,
      productKey: raw.product_key,
      name: raw.name,
      slug: raw.slug,
      category: raw.category,
      subcategory: raw.subcategory || null,
      brand: raw.brand || null,
      gender,
      shortDescription: raw.short_description || raw.name,
      description: raw.description || raw.short_description || raw.name,
      basePrice,
      compareAtPrice,
      featured,
      status,
      tags: normalizeTags(raw.tags, gender),
      image1: raw.image_1 || null,
      image2: raw.image_2 || null,
      variantSku: raw.variant_sku,
      color: raw.color || null,
      size: raw.size || null,
      variantPrice,
      stockQuantity,
      lowStockThreshold,
      weightGrams
    });
  }

  validateProductConsistency(rows, errors);
  return {
    rowsRead: dataRows.filter((row) => row.some((value) => normalizeText(value))).length,
    rows,
    errors,
    warnings
  };
}

function comparableProductData(row: ProductImportRow) {
  return {
    name: row.name,
    slug: row.slug,
    category: row.category.toLowerCase(),
    subcategory: row.subcategory?.toLowerCase() ?? null,
    brand: row.brand?.toLowerCase() ?? null,
    gender: row.gender?.toLowerCase() ?? null,
    shortDescription: row.shortDescription,
    description: row.description,
    basePrice: row.basePrice,
    compareAtPrice: row.compareAtPrice,
    featured: row.featured,
    status: row.status,
    tags: [...row.tags].sort(),
    image1: row.image1,
    image2: row.image2,
    lowStockThreshold: row.lowStockThreshold,
    weightGrams: row.weightGrams
  };
}

function validateProductConsistency(rows: ProductImportRow[], errors: ProductImportIssue[]) {
  const firstByKey = new Map<string, ProductImportRow>();
  for (const row of rows) {
    const first = firstByKey.get(row.productKey);
    if (!first) {
      firstByKey.set(row.productKey, row);
      continue;
    }
    const expected = comparableProductData(first);
    const actual = comparableProductData(row);
    for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        issue(
          errors,
          row.rowNumber,
          String(key),
          `Conflicts with row ${first.rowNumber} for product_key ${row.productKey}.`,
          { productKey: row.productKey, sku: row.variantSku }
        );
      }
    }
  }
}

export function parseProductImportCsv(input: Buffer | string): ParsedProductImport {
  try {
    const records = parse(Buffer.isBuffer(input) ? input.toString("utf8") : input, {
      bom: true,
      relax_column_count: false,
      skip_empty_lines: true
    }) as string[][];
    if (records.length === 0) {
      return {
        rowsRead: 0,
        rows: [],
        warnings: [],
        errors: [{ rowNumber: 1, field: "file", message: "The CSV file is empty." }]
      };
    }
    const [headers, ...dataRows] = records;
    return parseRawRows(headers ?? [], dataRows);
  } catch {
    return {
      rowsRead: 0,
      rows: [],
      warnings: [],
      errors: [{ rowNumber: 1, field: "file", message: "The CSV file could not be parsed." }]
    };
  }
}

export async function parseProductImportXlsx(input: Buffer): Promise<ParsedProductImport> {
  try {
    const sheets = await readExcelFile(input);
    const worksheet =
      sheets.find((sheet) => sheet.sheet === "Import_Data") ?? sheets[0];
    if (!worksheet?.data.length) {
      return {
        rowsRead: 0,
        rows: [],
        warnings: [],
        errors: [{ rowNumber: 1, field: "file", message: "The workbook has no worksheets." }]
      };
    }
    const [headerCells, ...worksheetRows] = worksheet.data;
    const headers = (headerCells ?? []).map(normalizeText);
    const dataRows = worksheetRows.map((row) => row.map(normalizeText));
    return parseRawRows(headers, dataRows);
  } catch {
    return {
      rowsRead: 0,
      rows: [],
      warnings: [],
      errors: [{
        rowNumber: 1,
        field: "file",
        message: "The XLSX workbook is password-protected, damaged, or unsupported."
      }]
    };
  }
}

export function validateProductImportFile(file: File) {
  if (file.size <= 0) throw new Error("The selected file is empty.");
  if (file.size > PRODUCT_IMPORT_MAX_BYTES) throw new Error("The upload must be 10 MB or smaller.");
  const extension = path.extname(file.name).toLowerCase();
  if (![".csv", ".xlsx"].includes(extension)) {
    throw new Error("Only CSV and XLSX files are supported.");
  }
}

export async function parseProductImportFile(file: File): Promise<ParsedProductImport> {
  validateProductImportFile(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase();
  const parsed = extension === ".xlsx"
    ? await parseProductImportXlsx(buffer)
    : parseProductImportCsv(buffer);
  if (parsed.rowsRead > PRODUCT_IMPORT_MAX_ROWS) {
    parsed.errors.push({
      rowNumber: PRODUCT_IMPORT_MAX_ROWS + 2,
      field: "file",
      message: `A maximum of ${PRODUCT_IMPORT_MAX_ROWS} data rows is allowed.`
    });
  }
  return parsed;
}

function groupRows(rows: ProductImportRow[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();
  for (const row of rows) {
    const group = groups.get(row.productKey);
    if (group) {
      group.variants.push(row);
    } else {
      groups.set(row.productKey, {
        productKey: row.productKey,
        product: row,
        variants: [row]
      });
    }
  }
  return Array.from(groups.values());
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

function categorySlug(category: string, subcategory: string | null): string {
  const parent = slugify(category);
  return subcategory ? `${parent}-${slugify(subcategory)}` : parent;
}

export async function prepareProductImport(
  prisma: PrismaClient,
  parsed: ParsedProductImport
): Promise<ProductImportPlan> {
  const groups = groupRows(parsed.rows);
  const productSlugs = groups.map((group) => group.product.slug);
  const productKeys = groups.map((group) => group.productKey);
  const variantSkus = parsed.rows.map((row) => row.variantSku);
  const categorySlugs = Array.from(new Set(groups.flatMap((group) => [
    slugify(group.product.category),
    categorySlug(group.product.category, group.product.subcategory)
  ])));

  const [existingProducts, existingVariants, existingCategories] = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ slug: { in: productSlugs } }, { sku: { in: productKeys } }] },
      select: { id: true, slug: true, sku: true }
    }),
    prisma.productVariant.findMany({
      where: { sku: { in: variantSkus } },
      select: { id: true, productId: true, sku: true, stockQuantity: true }
    }),
    prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { slug: true }
    })
  ]);

  const errors = [...parsed.errors];
  const warnings = [...parsed.warnings];
  const existingProductsBySlug = new Map(
    existingProducts.map((product) => [product.slug, product])
  );
  const existingProductsBySku = new Map(
    existingProducts.map((product) => [product.sku.toLowerCase(), product])
  );
  const existingVariantsBySku = new Map(
    existingVariants.map((variant) => [variant.sku.toLowerCase(), variant])
  );

  for (const group of groups) {
    const slugMatch = existingProductsBySlug.get(group.product.slug);
    const keyMatch = existingProductsBySku.get(group.productKey.toLowerCase());
    if (slugMatch && keyMatch && slugMatch.id !== keyMatch.id) {
      issue(
        errors,
        group.product.rowNumber,
        "slug",
        `Product key ${group.productKey} and slug ${group.product.slug} belong to different products.`,
        { productKey: group.productKey }
      );
    }
    const matchedProduct = keyMatch ?? slugMatch;
    for (const variant of group.variants) {
      const existingVariant = existingVariantsBySku.get(variant.variantSku.toLowerCase());
      if (
        existingVariant &&
        (!matchedProduct || existingVariant.productId !== matchedProduct.id)
      ) {
        issue(
          errors,
          variant.rowNumber,
          "variant_sku",
          `Variant SKU ${variant.variantSku} belongs to a different product.`,
          { productKey: group.productKey, sku: variant.variantSku }
        );
      }
    }
    issue(
      warnings,
      group.product.rowNumber,
      "low_stock_threshold",
      "Stored as Product.lowStockLimit because ProductVariant has no low-stock threshold field.",
      { productKey: group.productKey }
    );
    if (group.product.weightGrams !== null) {
      issue(
        warnings,
        group.product.rowNumber,
        "weight_grams",
        "Stored as Product.weightGrams because ProductVariant has no weight field.",
        { productKey: group.productKey }
      );
    }
    if (group.product.gender) {
      issue(
        warnings,
        group.product.rowNumber,
        "gender",
        "Stored as a product tag because the Product model has no gender field.",
        { productKey: group.productKey }
      );
    }
  }

  const invalidRows = new Set(errors.filter((error) => error.rowNumber > 1).map((error) => error.rowNumber));
  const existingCategorySlugs = new Set(existingCategories.map((category) => category.slug));
  const newProducts = groups.filter((group) =>
    !existingProductsBySku.has(group.productKey.toLowerCase()) &&
    !existingProductsBySlug.has(group.product.slug)
  ).length;
  const existingProductsToUpdate = groups.length - newProducts;
  const newVariants = parsed.rows.filter(
    (row) => !existingVariantsBySku.has(row.variantSku.toLowerCase())
  ).length;
  const dryRun: ProductImportDryRun = {
    totalRows: parsed.rowsRead,
    validRows: Math.max(0, parsed.rowsRead - invalidRows.size),
    invalidRows: invalidRows.size,
    productsDetected: groups.length,
    variantsDetected: parsed.rows.length,
    newProducts,
    existingProductsToUpdate,
    newVariants,
    existingVariantsToUpdate: parsed.rows.length - newVariants,
    categoriesToCreate: categorySlugs.filter((slug) => !existingCategorySlugs.has(slug)).length,
    rowsSkipped: invalidRows.size,
    errors,
    warnings,
    canImport: errors.length === 0 && parsed.rows.length > 0
  };

  return {
    parsed,
    groups,
    existingProductsBySlug,
    existingProductsByKey: existingProductsBySku,
    existingVariantsBySku,
    dryRun
  };
}

async function ensureCategory(
  tx: Prisma.TransactionClient,
  product: ProductImportRow
): Promise<{ id: string; created: number }> {
  const parentSlug = slugify(product.category);
  let created = 0;
  let parent = await tx.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) {
    parent = await tx.category.create({
      data: { name: product.category, slug: parentSlug, isActive: true }
    });
    created += 1;
  }
  if (!product.subcategory) return { id: parent.id, created };
  const childSlug = categorySlug(product.category, product.subcategory);
  let child = await tx.category.findUnique({ where: { slug: childSlug } });
  if (!child) {
    child = await tx.category.create({
      data: {
        name: product.subcategory,
        slug: childSlug,
        parentId: parent.id,
        isActive: true
      }
    });
    created += 1;
  }
  return { id: child.id, created };
}

async function ensureBrand(
  tx: Prisma.TransactionClient,
  brandName: string | null
): Promise<string | null> {
  if (!brandName) return null;
  const slug = slugify(brandName);
  const brand = await tx.brand.upsert({
    where: { slug },
    update: { name: brandName },
    create: { name: brandName, slug }
  });
  return brand.id;
}

function productPrices(product: ProductImportRow) {
  if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
    return {
      regularPrice: product.compareAtPrice,
      salePrice: product.basePrice
    };
  }
  return {
    regularPrice: product.basePrice,
    salePrice: null
  };
}

export async function importProducts(
  prisma: PrismaClient,
  options: {
    adminUserId: string | null;
    fileName: string;
    parsed: ParsedProductImport;
    auditAction?: string;
    auditEntityType?: string;
    auditDescription?: string;
  }
): Promise<ProductImportSummary> {
  const startedAt = Date.now();
  const plan = await prepareProductImport(prisma, options.parsed);
  if (!plan.dryRun.canImport) throw new ProductImportValidationError(plan.dryRun);

  const summary = await prisma.$transaction(async (tx) => {
    const result: ProductImportSummary = {
      productsCreated: 0,
      productsUpdated: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      categoriesCreated: 0,
      rowsSkipped: 0,
      warningCount: plan.dryRun.warnings.length,
      durationMs: 0
    };

    for (const group of plan.groups) {
      const category = await ensureCategory(tx, group.product);
      result.categoriesCreated += category.created;
      const brandId = await ensureBrand(tx, group.product.brand);
      const prices = productPrices(group.product);
      const existingProduct =
        plan.existingProductsByKey.get(group.productKey.toLowerCase()) ??
        plan.existingProductsBySlug.get(group.product.slug);
      const productData = {
        name: group.product.name,
        slug: group.product.slug,
        sku: group.productKey,
        shortDescription: group.product.shortDescription,
        description: group.product.description,
        categoryId: category.id,
        brandId,
        regularPrice: prices.regularPrice,
        salePrice: prices.salePrice,
        featuredImageUrl: group.product.image1,
        weightGrams: group.product.weightGrams,
        tags: group.product.tags,
        featured: group.product.featured,
        status: group.product.status,
        lowStockLimit: group.product.lowStockThreshold,
        deletedAt: null
      };
      const product = existingProduct
        ? await tx.product.update({
            where: { id: existingProduct.id },
            data: productData
          })
        : await tx.product.create({
            data: {
              ...productData,
              stockQuantity: group.variants.reduce((sum, row) => sum + row.stockQuantity, 0)
            }
          });
      if (existingProduct) result.productsUpdated += 1;
      else result.productsCreated += 1;

      const existingImages = await tx.productImage.findMany({
        where: { productId: product.id },
        select: { url: true }
      });
      const imageUrls = Array.from(
        new Set([group.product.image1, group.product.image2].filter((value): value is string => Boolean(value)))
      );
      for (const [sortOrder, url] of imageUrls.entries()) {
        if (!existingImages.some((image) => image.url === url)) {
          await tx.productImage.create({
            data: {
              productId: product.id,
              url,
              altText: group.product.name,
              sortOrder
            }
          });
        }
      }

      for (const row of group.variants) {
        const existingVariant = plan.existingVariantsBySku.get(row.variantSku.toLowerCase());
        const variantData = {
          productId: product.id,
          size: row.size,
          color: row.color,
          priceAdjustment: row.variantPrice - group.product.basePrice,
          stockQuantity: row.stockQuantity,
          imageUrl: group.product.image1,
          isAvailable: row.stockQuantity > 0
        };
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: variantData
          });
          result.variantsUpdated += 1;
          const delta = row.stockQuantity - existingVariant.stockQuantity;
          if (delta !== 0) {
            await tx.inventoryMovement.create({
              data: {
                productId: product.id,
                variantId: existingVariant.id,
                quantity: delta,
                reason: "ADMIN_PRODUCT_IMPORT",
                reference: options.fileName,
                note: "Variant stock adjusted by administrator product import."
              }
            });
          }
        } else {
          const variant = await tx.productVariant.create({
            data: {
              ...variantData,
              sku: row.variantSku
            }
          });
          result.variantsCreated += 1;
          if (row.stockQuantity !== 0) {
            await tx.inventoryMovement.create({
              data: {
                productId: product.id,
                variantId: variant.id,
                quantity: row.stockQuantity,
                reason: "ADMIN_PRODUCT_IMPORT",
                reference: options.fileName,
                note: "Initial variant stock from administrator product import."
              }
            });
          }
        }
      }

      const aggregate = await tx.productVariant.aggregate({
        where: { productId: product.id },
        _sum: { stockQuantity: true }
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: aggregate._sum.stockQuantity ?? 0 }
      });
    }

    result.durationMs = Date.now() - startedAt;
    await tx.adminAuditLog.create({
      data: {
        adminUserId: options.adminUserId,
        action: options.auditAction ?? "PRODUCT_IMPORT_COMPLETED",
        entityType: options.auditEntityType ?? "ProductImport",
        description:
          options.auditDescription ??
          `Product import completed for ${path.basename(options.fileName)}.`,
        metadata: {
          status: "SUCCESS",
          fileName: path.basename(options.fileName),
          productsCreated: result.productsCreated,
          productsUpdated: result.productsUpdated,
          variantsCreated: result.variantsCreated,
          variantsUpdated: result.variantsUpdated,
          categoriesCreated: result.categoriesCreated,
          rowsSkipped: result.rowsSkipped,
          warningCount: result.warningCount,
          durationMs: result.durationMs
        } satisfies Prisma.InputJsonObject
      }
    });
    return result;
  }, {
    maxWait: 10_000,
    timeout: 60_000
  });

  return summary;
}

export async function recordFailedProductImport(
  prisma: PrismaClient,
  options: {
    adminUserId: string;
    fileName: string;
    reason: "VALIDATION_FAILED" | "IMPORT_FAILED";
    errorCount?: number;
  }
) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: options.adminUserId,
      action: "PRODUCT_IMPORT_FAILED",
      entityType: "ProductImport",
      description: `Product import failed for ${path.basename(options.fileName)}.`,
      metadata: {
        status: options.reason,
        fileName: path.basename(options.fileName),
        errorCount: options.errorCount ?? 0
      }
    }
  });
}
