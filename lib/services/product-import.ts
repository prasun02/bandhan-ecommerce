import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient, PublicationStatus } from "@prisma/client";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const localImageFallback = "/images/products/product-1.svg";
const maxUploadBytes = 1024 * 1024;

export const detailedProductImportHeaders = [
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
] as const;

const basicProductImportHeaders = [
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
  "status"
] as const;

type ProductImportHeader = (typeof detailedProductImportHeaders)[number];
type BasicProductImportHeader = (typeof basicProductImportHeaders)[number];
type CsvHeaders = readonly string[];

export type ProductImportRow = {
  rowNumber: number;
  name: string;
  slug: string;
  sku: string;
  category: string;
  collection: string;
  brand: string;
  fabric: string;
  occasion: string;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  size: string;
  color: string;
  imageUrl: string;
  status: PublicationStatus;
  shortDescription: string;
  description: string;
  stitchingType: string;
  costPrice: number | null;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  careInstructions: string;
  packageContents: string;
  estimatedDeliveryTime: string;
  seoTitle: string;
  seoDescription: string;
};

export type ProductImportValidationError = {
  rowNumber: number;
  field: string;
  message: string;
};

export type ProductImportSummary = {
  rowsRead: number;
  validRows: number;
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  categoriesCreated: string[];
  collectionsCreated: string[];
  brandsCreated: string[];
  variantsCreated: number;
  variantsUpdated: number;
  imagesCreated: number;
  imagesSkipped: number;
  inventoryMovementsCreated: number;
  deliveryZonesUpserted: number;
  couponsUpserted: number;
  validationErrors: ProductImportValidationError[];
  warnings: ProductImportValidationError[];
};

export type ProductImportParseResult = {
  rows: ProductImportRow[];
  rowsRead: number;
  validationErrors: ProductImportValidationError[];
  warnings: ProductImportValidationError[];
};

export type ProductImportOptions = {
  csvPath?: string;
  csvText?: string;
  projectRoot?: string;
};

type CsvRowObject = Partial<Record<ProductImportHeader | BasicProductImportHeader, string>>;

type VariantPlan = {
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  priceAdjustment: number;
  imageUrl: string;
};

const csvStringSchema = z.string().trim().min(1);
const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

function hasFormulaPrefix(value: string) {
  return /^[=+\-@]/.test(value.trim());
}

function recordError(errors: ProductImportValidationError[], rowNumber: number, field: string, message: string) {
  errors.push({ rowNumber, field, message });
}

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" && !inQuotes) {
      row.push(cell);
      if (row.some((item) => item.trim().length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => item.trim().length > 0)) rows.push(row);
  return rows;
}

export function validateProductImportHeaders(headers: CsvHeaders) {
  const normalized = headers.map((header, index) => (index === 0 ? stripBom(header) : header).trim());
  const detailedMissing = detailedProductImportHeaders.filter((header) => !normalized.includes(header));
  if (detailedMissing.length === 0) return { headers: normalized, detailed: true, missing: [] };

  const basicMissing = basicProductImportHeaders.filter((header) => !normalized.includes(header));
  return { headers: normalized, detailed: false, missing: basicMissing };
}

function parseRequiredText(value: string | undefined, field: string, rowNumber: number, errors: ProductImportValidationError[]) {
  const parsed = csvStringSchema.safeParse(value ?? "");
  if (!parsed.success) {
    recordError(errors, rowNumber, field, "Value is required.");
    return "";
  }
  if (hasFormulaPrefix(parsed.data)) {
    recordError(errors, rowNumber, field, "Formula-like CSV values are not allowed.");
    return "";
  }
  return parsed.data;
}

function parseOptionalText(value: string | undefined, fallback: string) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function parseInteger(value: string | undefined, field: string, rowNumber: number, errors: ProductImportValidationError[], allowNull = false) {
  const trimmed = (value ?? "").trim();
  if (allowNull && trimmed.length === 0) return null;
  if (!/^\d+$/.test(trimmed)) {
    recordError(errors, rowNumber, field, "Expected a non-negative integer.");
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    recordError(errors, rowNumber, field, "Number is too large.");
    return null;
  }
  return parsed;
}

export function parseBooleanText(value: string | undefined, field: string, rowNumber: number, errors: ProductImportValidationError[]) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  recordError(errors, rowNumber, field, "Expected true, false, 1, or 0.");
  return false;
}

export function parseTags(value: string | undefined) {
  return Array.from(
    new Set(
      (value ?? "")
        .split("|")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && !hasFormulaPrefix(tag))
    )
  );
}

function normalizeSku(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function normalizeStatus(value: string, rowNumber: number, errors: ProductImportValidationError[]) {
  const parsed = statusSchema.safeParse(value.trim().toUpperCase());
  if (!parsed.success) {
    recordError(errors, rowNumber, "status", "Invalid product status.");
    return PublicationStatus.DRAFT;
  }
  return PublicationStatus[parsed.data];
}

function objectFromRow(headers: string[], row: string[]) {
  return headers.reduce<CsvRowObject>((record, header, index) => {
    return { ...record, [header]: row[index]?.trim() ?? "" };
  }, {});
}

export function parseProductImportCsv(text: string): ProductImportParseResult {
  const rows = parseCsv(text);
  const headerValidation = validateProductImportHeaders(rows[0] ?? []);
  const validationErrors: ProductImportValidationError[] = [];
  const warnings: ProductImportValidationError[] = [];
  const parsedRows: ProductImportRow[] = [];

  if (rows.length === 0) {
    return { rows: [], rowsRead: 0, validationErrors: [{ rowNumber: 1, field: "file", message: "CSV is empty." }], warnings };
  }

  if (headerValidation.missing.length > 0) {
    return {
      rows: [],
      rowsRead: Math.max(0, rows.length - 1),
      validationErrors: headerValidation.missing.map((header) => ({ rowNumber: 1, field: header, message: "Missing required CSV header." })),
      warnings
    };
  }

  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const [index, rawRow] of rows.slice(1).entries()) {
    const rowNumber = index + 2;
    const rowErrors: ProductImportValidationError[] = [];
    const row = objectFromRow(headerValidation.headers, rawRow);
    const name = parseRequiredText(row.name, "name", rowNumber, rowErrors);
    const slug = slugify(parseOptionalText(row.slug, name));
    const sku = normalizeSku(parseRequiredText(row.sku, "sku", rowNumber, rowErrors));
    const category = parseRequiredText(row.category, "category", rowNumber, rowErrors);
    const collection = parseRequiredText(row.collection, "collection", rowNumber, rowErrors);
    const brand = parseRequiredText(row.brand, "brand", rowNumber, rowErrors);
    const fabric = parseRequiredText(row.fabric, "fabric", rowNumber, rowErrors);
    const occasion = parseRequiredText(row.occasion, "occasion", rowNumber, rowErrors);
    const regularPrice = parseInteger(row.regularPricePaisa, "regularPricePaisa", rowNumber, rowErrors);
    const salePrice = parseInteger(row.salePricePaisa, "salePricePaisa", rowNumber, rowErrors, true);
    const stock = parseInteger(row.stock, "stock", rowNumber, rowErrors);
    const imageUrl = parseRequiredText(row.imageUrl, "imageUrl", rowNumber, rowErrors);
    const status = normalizeStatus(row.status ?? "", rowNumber, rowErrors);
    const shortDescription = parseOptionalText(row.shortDescription, `${name} from Bandhan.`);
    const description = parseOptionalText(row.description, shortDescription);
    const stitchingType = parseOptionalText(row.stitchingType, "Stitched");
    const costPrice = parseInteger(row.costPricePaisa, "costPricePaisa", rowNumber, rowErrors, true);
    const tags = parseTags(row.tags);
    const featured = parseBooleanText(row.featured, "featured", rowNumber, rowErrors);
    const newArrival = parseBooleanText(row.newArrival, "newArrival", rowNumber, rowErrors);
    const bestSeller = parseBooleanText(row.bestSeller, "bestSeller", rowNumber, rowErrors);

    if (!slug) recordError(rowErrors, rowNumber, "slug", "Slug could not be normalized.");
    if (seenSkus.has(sku)) recordError(rowErrors, rowNumber, "sku", "Duplicate SKU in CSV.");
    if (seenSlugs.has(slug)) recordError(rowErrors, rowNumber, "slug", "Duplicate slug in CSV.");
    if (salePrice !== null && regularPrice !== null && salePrice > regularPrice) {
      recordError(rowErrors, rowNumber, "salePricePaisa", "Sale price cannot exceed regular price.");
    }

    if (rowErrors.length > 0 || regularPrice === null || stock === null) {
      validationErrors.push(...rowErrors);
      continue;
    }

    seenSkus.add(sku);
    seenSlugs.add(slug);
    parsedRows.push({
      rowNumber,
      name,
      slug,
      sku,
      category,
      collection,
      brand,
      fabric,
      occasion,
      regularPrice,
      salePrice,
      stock,
      size: parseOptionalText(row.size, "Free Size"),
      color: parseOptionalText(row.color, "Default"),
      imageUrl,
      status,
      shortDescription,
      description,
      stitchingType,
      costPrice,
      tags,
      featured,
      newArrival,
      bestSeller,
      careInstructions: parseOptionalText(row.careInstructions, "Dry clean recommended."),
      packageContents: parseOptionalText(row.packageContents, "1 item"),
      estimatedDeliveryTime: parseOptionalText(row.estimatedDeliveryTime, "1-6 business days based on delivery zone"),
      seoTitle: parseOptionalText(row.seoTitle, `${name} | Bandhan`),
      seoDescription: parseOptionalText(row.seoDescription, shortDescription)
    });
  }

  return { rows: parsedRows, rowsRead: Math.max(0, rows.length - 1), validationErrors, warnings };
}

export function distributeStock(totalStock: number, buckets: number) {
  if (buckets < 1) return [];
  const base = Math.floor(totalStock / buckets);
  const remainder = totalStock % buckets;
  return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0));
}

function supportsSizedVariants(row: ProductImportRow) {
  return row.stitchingType.toLowerCase() === "stitched" && ["kurtis", "salwar kameez", "gowns", "lehengas"].includes(row.category.toLowerCase());
}

function variantSku(productSku: string, size: string, color: string) {
  const suffix = `${size}-${color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  return `${productSku}-${suffix}`;
}

export function buildVariantPlan(row: ProductImportRow): VariantPlan[] {
  const sizes = supportsSizedVariants(row) ? ["M", "L", "XL"] : ["Free Size"];
  const stocks = distributeStock(row.stock, sizes.length);
  return sizes.map((size, index) => ({
    sku: variantSku(row.sku, size, row.color),
    size,
    color: row.color,
    stockQuantity: stocks[index] ?? 0,
    priceAdjustment: 0,
    imageUrl: row.imageUrl
  }));
}

async function localImageExists(projectRoot: string, imageUrl: string) {
  if (!imageUrl.startsWith("/images/products/")) return true;
  if (imageUrl.includes("..")) return false;
  const normalized = path.normalize(imageUrl.replace(/^\/+/, ""));
  const filePath = path.join(projectRoot, "public", normalized.replace(/^public[\\/]/, ""));
  const publicRoot = path.join(projectRoot, "public");
  if (!filePath.startsWith(publicRoot)) return false;
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImageUrl(row: ProductImportRow, projectRoot: string, summary: ProductImportSummary) {
  const exists = await localImageExists(projectRoot, row.imageUrl);
  if (exists) return row.imageUrl;
  summary.warnings.push({ rowNumber: row.rowNumber, field: "imageUrl", message: `Missing image ${row.imageUrl}; using ${localImageFallback}.` });
  return localImageFallback;
}

async function findOrCreateCategory(tx: Prisma.TransactionClient, name: string, summary: ProductImportSummary) {
  const slug = slugify(name);
  const existing = await tx.category.findUnique({ where: { slug } });
  if (existing) return existing;
  const created = await tx.category.create({ data: { name, slug, isActive: true } });
  summary.categoriesCreated.push(name);
  return created;
}

async function findOrCreateCollection(tx: Prisma.TransactionClient, name: string, summary: ProductImportSummary) {
  const slug = slugify(name);
  const existing = await tx.collection.findUnique({ where: { slug } });
  if (existing) return existing;
  const created = await tx.collection.create({ data: { name, slug, isActive: true } });
  summary.collectionsCreated.push(name);
  return created;
}

async function findOrCreateBrand(tx: Prisma.TransactionClient, name: string, summary: ProductImportSummary) {
  const slug = slugify(name);
  const existing = await tx.brand.findUnique({ where: { slug } });
  if (existing) return existing;
  const created = await tx.brand.create({ data: { name, slug } });
  summary.brandsCreated.push(name);
  return created;
}

async function upsertDemoSupportData(tx: Prisma.TransactionClient, summary: ProductImportSummary) {
  const zones = [
    { id: "dhaka", name: "Inside Dhaka", division: "Dhaka", deliveryCharge: 8000, codCharge: 0, minDeliveryDays: 1, maxDeliveryDays: 2, freeDeliveryThreshold: 500000 },
    { id: "outside", name: "Outside Dhaka", division: "All", deliveryCharge: 15000, codCharge: 0, minDeliveryDays: 2, maxDeliveryDays: 4, freeDeliveryThreshold: 800000 },
    { id: "remote", name: "Remote Area", division: "All", deliveryCharge: 20000, codCharge: 0, minDeliveryDays: 3, maxDeliveryDays: 6, freeDeliveryThreshold: null }
  ];

  for (const zone of zones) {
    await tx.deliveryZone.upsert({
      where: { id: zone.id },
      update: { ...zone, active: true },
      create: { ...zone, active: true }
    });
    summary.deliveryZonesUpserted += 1;
  }

  const coupons = [
    { code: "WELCOME10", description: "Puja welcome offer", percentage: 10, fixedAmount: null, freeDelivery: false, minimumOrder: 150000, maximumDiscount: 50000 },
    { code: "PUJA500", description: "Puja fixed discount", percentage: null, fixedAmount: 50000, freeDelivery: false, minimumOrder: 500000, maximumDiscount: null },
    { code: "FREEDHAKA", description: "Free delivery inside Dhaka", percentage: null, fixedAmount: null, freeDelivery: true, minimumOrder: 300000, maximumDiscount: null }
  ];

  for (const coupon of coupons) {
    await tx.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon, active: true },
      create: { ...coupon, active: true }
    });
    summary.couponsUpserted += 1;
  }
}

function createEmptySummary(rowsRead: number, validationErrors: ProductImportValidationError[], warnings: ProductImportValidationError[]): ProductImportSummary {
  return {
    rowsRead,
    validRows: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsSkipped: 0,
    categoriesCreated: [],
    collectionsCreated: [],
    brandsCreated: [],
    variantsCreated: 0,
    variantsUpdated: 0,
    imagesCreated: 0,
    imagesSkipped: 0,
    inventoryMovementsCreated: 0,
    deliveryZonesUpserted: 0,
    couponsUpserted: 0,
    validationErrors,
    warnings
  };
}

async function readImportText(options: ProductImportOptions) {
  if (options.csvText !== undefined) return options.csvText;
  if (!options.csvPath) throw new Error("A CSV path or CSV text is required.");
  return readFile(options.csvPath, "utf8");
}

export async function importDemoProducts(prisma: PrismaClient, options: ProductImportOptions) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const csvText = await readImportText(options);
  const parsed = parseProductImportCsv(csvText);
  const summary = createEmptySummary(parsed.rowsRead, [...parsed.validationErrors], [...parsed.warnings]);
  summary.validRows = parsed.rows.length;

  await prisma.$transaction(async (tx) => {
    await upsertDemoSupportData(tx, summary);
  });

  for (const row of parsed.rows) {
    try {
      await prisma.$transaction(async (tx) => {
        const category = await findOrCreateCategory(tx, row.category, summary);
        const collection = await findOrCreateCollection(tx, row.collection, summary);
        const brand = await findOrCreateBrand(tx, row.brand, summary);
        const imageUrl = await resolveImageUrl(row, projectRoot, summary);
        const existing = await tx.product.findFirst({ where: { OR: [{ sku: row.sku }, { slug: row.slug }] }, include: { images: true, variants: true } });
        const productData = {
          name: row.name,
          slug: row.slug,
          sku: row.sku,
          shortDescription: row.shortDescription,
          description: row.description,
          categoryId: category.id,
          collectionId: collection.id,
          brandId: brand.id,
          fabricType: row.fabric,
          occasion: row.occasion,
          regularPrice: row.regularPrice,
          salePrice: row.salePrice,
          costPrice: row.costPrice,
          featuredImageUrl: imageUrl,
          stitchingType: row.stitchingType,
          stockQuantity: row.stock,
          tags: row.tags,
          featured: row.featured,
          newArrival: row.newArrival,
          bestSeller: row.bestSeller,
          status: row.status,
          careInstructions: row.careInstructions,
          packageContents: row.packageContents,
          estimatedDeliveryTime: row.estimatedDeliveryTime,
          seoTitle: row.seoTitle,
          seoDescription: row.seoDescription,
          deletedAt: null
        };
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data: productData, include: { images: true, variants: true } })
          : await tx.product.create({ data: productData, include: { images: true, variants: true } });

        if (existing) {
          summary.productsUpdated += 1;
        } else {
          summary.productsCreated += 1;
          await tx.inventoryMovement.create({ data: { productId: product.id, quantity: row.stock, reason: "CSV_IMPORT", note: "Initial product stock from demo CSV import." } });
          summary.inventoryMovementsCreated += 1;
        }

        const imageUrls = Array.from(new Set([imageUrl]));
        for (const [sortOrder, url] of imageUrls.entries()) {
          const existingImage = product.images.find((image) => image.url === url);
          if (existingImage) {
            summary.imagesSkipped += 1;
          } else {
            await tx.productImage.create({ data: { productId: product.id, url, altText: row.name, sortOrder } });
            summary.imagesCreated += 1;
          }
        }

        for (const variant of buildVariantPlan({ ...row, imageUrl })) {
          const existingVariant = await tx.productVariant.findUnique({ where: { sku: variant.sku } });
          if (existingVariant) {
            await tx.productVariant.update({
              where: { sku: variant.sku },
              data: { productId: product.id, size: variant.size, color: variant.color, stockQuantity: variant.stockQuantity, priceAdjustment: variant.priceAdjustment, imageUrl: variant.imageUrl, isAvailable: true }
            });
            summary.variantsUpdated += 1;
          } else {
            const created = await tx.productVariant.create({ data: { productId: product.id, ...variant, isAvailable: true } });
            await tx.inventoryMovement.create({ data: { productId: product.id, variantId: created.id, quantity: variant.stockQuantity, reason: "CSV_IMPORT", note: "Initial variant stock from demo CSV import." } });
            summary.variantsCreated += 1;
            summary.inventoryMovementsCreated += 1;
          }
        }
      });
    } catch (error) {
      summary.productsSkipped += 1;
      summary.validationErrors.push({ rowNumber: row.rowNumber, field: "row", message: error instanceof Error ? error.message : "Import failed for this row." });
    }
  }

  return summary;
}

export function validateUploadFile(file: File) {
  const allowedTypes = new Set(["text/csv", "application/vnd.ms-excel", "application/octet-stream", ""]);
  if (file.size > maxUploadBytes) throw new Error("CSV file must be 1 MB or smaller.");
  if (!allowedTypes.has(file.type)) throw new Error("Only CSV uploads are allowed.");
}
