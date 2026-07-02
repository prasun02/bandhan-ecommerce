export const PRODUCT_IMPORT_HEADERS = [
  "product_key",
  "name",
  "slug",
  "category",
  "subcategory",
  "brand",
  "gender",
  "short_description",
  "description",
  "base_price_bdt",
  "compare_at_price_bdt",
  "featured",
  "active",
  "tags",
  "image_1",
  "image_2",
  "variant_sku",
  "color",
  "size",
  "variant_price_bdt",
  "stock_qty",
  "low_stock_threshold",
  "weight_grams"
] as const;

export const PRODUCT_IMPORT_REQUIRED_HEADERS = [
  "product_key",
  "name",
  "slug",
  "category",
  "base_price_bdt",
  "featured",
  "active",
  "variant_sku",
  "variant_price_bdt",
  "stock_qty",
  "low_stock_threshold"
] as const;

// This list mirrors the Prisma PublicationStatus enum. A test compares them.
export const PRODUCT_STATUS_VALUES = [
  "PUBLISHED",
  "DRAFT",
  "ARCHIVED"
] as const;

export type ProductImportStatus = (typeof PRODUCT_STATUS_VALUES)[number];

export const PRODUCT_STATUS_ALIASES: Readonly<
  Record<ProductImportStatus, readonly string[]>
> = {
  PUBLISHED: ["PUBLISHED", "ACTIVE", "LIVE", "ENABLED", "TRUE", "1", "YES"],
  DRAFT: ["DRAFT", "INACTIVE", "DISABLED", "FALSE", "0", "NO"],
  ARCHIVED: ["ARCHIVED"]
};

export const PRODUCT_IMPORT_PRICE_UNIT = "Bangladeshi Taka (BDT)";
export const PRODUCT_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const PRODUCT_IMPORT_MAX_ROWS = 5_000;

export const PRODUCT_IMPORT_SAMPLE_ROW = {
  product_key: "MEN-TSHIRT-001",
  name: "Premium Cotton T-Shirt",
  slug: "premium-cotton-t-shirt",
  category: "Men",
  subcategory: "T-Shirts",
  brand: "Bandhan",
  gender: "Men",
  short_description: "Soft breathable cotton t-shirt",
  description: "A comfortable everyday cotton t-shirt.",
  base_price_bdt: "790.00",
  compare_at_price_bdt: "990.00",
  featured: "TRUE",
  active: "ACTIVE",
  tags: "Men|Cotton|T-Shirt",
  image_1: "/demo-products/men-tshirt-front.svg",
  image_2: "/demo-products/men-tshirt-back.svg",
  variant_sku: "BDN-MTS-BLK-M",
  color: "Black",
  size: "M",
  variant_price_bdt: "790.00",
  stock_qty: "10",
  low_stock_threshold: "2",
  weight_grams: "250"
} satisfies Record<(typeof PRODUCT_IMPORT_HEADERS)[number], string>;

function normalizedValue(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toUpperCase();
}

export function normalizeProductStatus(value: unknown): ProductImportStatus | null {
  const normalized = normalizedValue(value);
  for (const status of PRODUCT_STATUS_VALUES) {
    if (PRODUCT_STATUS_ALIASES[status].includes(normalized)) return status;
  }
  return null;
}

export function normalizeImportBoolean(value: unknown): boolean | null {
  const normalized = normalizedValue(value);
  if (["TRUE", "1", "YES"].includes(normalized)) return true;
  if (["FALSE", "0", "NO"].includes(normalized)) return false;
  return null;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll("\"", "\"\"")}"`
    : value;
}

export function createProductImportTemplateCsv(): string {
  const header = PRODUCT_IMPORT_HEADERS.join(",");
  const sample = PRODUCT_IMPORT_HEADERS
    .map((key) => csvCell(PRODUCT_IMPORT_SAMPLE_ROW[key]))
    .join(",");
  return `\uFEFF${header}\r\n${sample}\r\n`;
}
