import { PRODUCT_IMPORT_HEADERS } from "@/lib/product-import-config";

type DemoHeader = (typeof PRODUCT_IMPORT_HEADERS)[number];
export type DemoProductRow = Record<DemoHeader, string>;

type DemoVariant = {
  sku: string;
  color: string;
  size: string;
  priceBdt: string;
  stock: string;
};

type DemoProduct = {
  productKey: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  gender: string;
  shortDescription: string;
  description: string;
  basePriceBdt: string;
  compareAtPriceBdt: string;
  featured: boolean;
  tags: string;
  image1: string;
  image2: string;
  lowStockThreshold: string;
  weightGrams: string;
  variants: DemoVariant[];
};

export const DEMO_PRODUCTS: readonly DemoProduct[] = [
  {
    productKey: "DEMO-MEN-TSHIRT-001",
    name: "Premium Cotton Crew Neck T-Shirt",
    slug: "demo-premium-cotton-crew-neck-t-shirt",
    category: "Men",
    subcategory: "T-Shirts",
    gender: "Men",
    shortDescription: "Breathable premium cotton with a clean everyday fit.",
    description: "A soft crew-neck t-shirt made for daily comfort, easy layering, and year-round wear.",
    basePriceBdt: "790",
    compareAtPriceBdt: "990",
    featured: true,
    tags: "Demo|Men|Cotton|T-Shirt",
    image1: "/demo-products/men-tshirt-front.svg",
    image2: "/demo-products/men-tshirt-back.svg",
    lowStockThreshold: "3",
    weightGrams: "250",
    variants: [
      { sku: "DEMO-MTS-BLK-M", color: "Black", size: "M", priceBdt: "790", stock: "14" },
      { sku: "DEMO-MTS-NVY-L", color: "Navy", size: "L", priceBdt: "810", stock: "8" },
      { sku: "DEMO-MTS-BLK-XL", color: "Black", size: "XL", priceBdt: "820", stock: "0" }
    ]
  },
  {
    productKey: "DEMO-MEN-SHIRT-001",
    name: "Oxford Full Sleeve Shirt",
    slug: "demo-oxford-full-sleeve-shirt",
    category: "Men",
    subcategory: "Shirts",
    gender: "Men",
    shortDescription: "Crisp Oxford weave with a polished full-sleeve silhouette.",
    description: "A versatile button-down shirt tailored for office days, dinners, and smart casual dressing.",
    basePriceBdt: "1490",
    compareAtPriceBdt: "1790",
    featured: false,
    tags: "Demo|Men|Oxford|Shirt",
    image1: "/demo-products/men-shirt-front.svg",
    image2: "/demo-products/men-shirt-detail.svg",
    lowStockThreshold: "3",
    weightGrams: "340",
    variants: [
      { sku: "DEMO-OFS-WHT-M", color: "White", size: "M", priceBdt: "1490", stock: "10" },
      { sku: "DEMO-OFS-SKY-L", color: "Sky Blue", size: "L", priceBdt: "1520", stock: "2" },
      { sku: "DEMO-OFS-WHT-XL", color: "White", size: "XL", priceBdt: "1540", stock: "6" }
    ]
  },
  {
    productKey: "DEMO-MEN-PANJABI-001",
    name: "Festive Embroidered Panjabi",
    slug: "demo-festive-embroidered-panjabi",
    category: "Men",
    subcategory: "Panjabi",
    gender: "Men",
    shortDescription: "Refined embroidery and festive colour in a comfortable cut.",
    description: "An occasion-ready Panjabi with detailed embroidery, a graceful collar, and an easy celebratory fit.",
    basePriceBdt: "2290",
    compareAtPriceBdt: "2690",
    featured: true,
    tags: "Demo|Men|Festive|Panjabi|Embroidered",
    image1: "/demo-products/men-panjabi-front.svg",
    image2: "/demo-products/men-panjabi-detail.svg",
    lowStockThreshold: "3",
    weightGrams: "480",
    variants: [
      { sku: "DEMO-PNJ-MRN-M", color: "Maroon", size: "M", priceBdt: "2290", stock: "7" },
      { sku: "DEMO-PNJ-OLV-L", color: "Olive", size: "L", priceBdt: "2340", stock: "6" },
      { sku: "DEMO-PNJ-MRN-XL", color: "Maroon", size: "XL", priceBdt: "2390", stock: "5" }
    ]
  },
  {
    productKey: "DEMO-WOMEN-SAREE-001",
    name: "Soft Silk Festive Saree",
    slug: "demo-soft-silk-festive-saree",
    category: "Women",
    subcategory: "Sarees",
    gender: "Women",
    shortDescription: "Lustrous soft silk drape with an elegant festive border.",
    description: "A fluid soft-silk saree designed for celebrations, with a rich border and graceful fall.",
    basePriceBdt: "3290",
    compareAtPriceBdt: "3890",
    featured: true,
    tags: "Demo|Women|Silk|Saree|Festive",
    image1: "/demo-products/women-saree-front.svg",
    image2: "/demo-products/women-saree-detail.svg",
    lowStockThreshold: "2",
    weightGrams: "720",
    variants: [
      { sku: "DEMO-SAR-MGT-FS", color: "Magenta", size: "Free Size", priceBdt: "3290", stock: "5" },
      { sku: "DEMO-SAR-TEAL-FS", color: "Teal", size: "Free Size", priceBdt: "3390", stock: "4" }
    ]
  },
  {
    productKey: "DEMO-WOMEN-KURTI-001",
    name: "Printed Cotton Kurti",
    slug: "demo-printed-cotton-kurti",
    category: "Women",
    subcategory: "Kurtis",
    gender: "Women",
    shortDescription: "Light cotton comfort with a lively all-over print.",
    description: "A breathable printed kurti with a relaxed line that works beautifully from errands to casual gatherings.",
    basePriceBdt: "1190",
    compareAtPriceBdt: "1490",
    featured: false,
    tags: "Demo|Women|Cotton|Kurti|Printed",
    image1: "/demo-products/women-kurti-front.svg",
    image2: "/demo-products/women-kurti-detail.svg",
    lowStockThreshold: "3",
    weightGrams: "310",
    variants: [
      { sku: "DEMO-KRT-MST-S", color: "Mustard", size: "S", priceBdt: "1190", stock: "9" },
      { sku: "DEMO-KRT-BLU-M", color: "Blue", size: "M", priceBdt: "1220", stock: "1" },
      { sku: "DEMO-KRT-MST-L", color: "Mustard", size: "L", priceBdt: "1240", stock: "7" }
    ]
  },
  {
    productKey: "DEMO-WOMEN-HANDBAG-001",
    name: "Structured Everyday Handbag",
    slug: "demo-structured-everyday-handbag",
    category: "Women",
    subcategory: "Accessories",
    gender: "Women",
    shortDescription: "A structured carryall with practical everyday organisation.",
    description: "A polished handbag with a sturdy silhouette, comfortable handles, and room for daily essentials.",
    basePriceBdt: "1690",
    compareAtPriceBdt: "1990",
    featured: false,
    tags: "Demo|Women|Accessories|Handbag",
    image1: "/demo-products/women-handbag-front.svg",
    image2: "/demo-products/women-handbag-detail.svg",
    lowStockThreshold: "2",
    weightGrams: "650",
    variants: [
      { sku: "DEMO-HBG-BLK-STD", color: "Black", size: "Standard", priceBdt: "1690", stock: "8" },
      { sku: "DEMO-HBG-TAN-STD", color: "Tan", size: "Standard", priceBdt: "1740", stock: "6" }
    ]
  },
  {
    productKey: "DEMO-KIDS-DRESS-001",
    name: "Girls Party Dress",
    slug: "demo-girls-party-dress",
    category: "Kids",
    subcategory: "",
    gender: "Girls",
    shortDescription: "A twirl-ready party dress with playful colour and soft lining.",
    description: "A comfortable celebration dress with a full skirt, delicate detail, and child-friendly finish.",
    basePriceBdt: "1390",
    compareAtPriceBdt: "1690",
    featured: true,
    tags: "Demo|Kids|Girls|Party Dress",
    image1: "/demo-products/kids-girls-dress-front.svg",
    image2: "/demo-products/kids-girls-dress-detail.svg",
    lowStockThreshold: "2",
    weightGrams: "360",
    variants: [
      { sku: "DEMO-GPD-PNK-4Y", color: "Pink", size: "4Y", priceBdt: "1390", stock: "7" },
      { sku: "DEMO-GPD-PUR-6Y", color: "Purple", size: "6Y", priceBdt: "1420", stock: "4" },
      { sku: "DEMO-GPD-PNK-8Y", color: "Pink", size: "8Y", priceBdt: "1440", stock: "0" }
    ]
  },
  {
    productKey: "DEMO-ACCESSORY-BELT-001",
    name: "Classic Faux Leather Belt",
    slug: "demo-classic-faux-leather-belt",
    category: "Accessories",
    subcategory: "",
    gender: "Unisex",
    shortDescription: "A clean everyday belt with a classic metal buckle.",
    description: "A dependable faux-leather belt with an understated finish for denim, chinos, and formal trousers.",
    basePriceBdt: "650",
    compareAtPriceBdt: "790",
    featured: false,
    tags: "Demo|Accessories|Belt|Unisex",
    image1: "/demo-products/belt-front.svg",
    image2: "/demo-products/belt-detail.svg",
    lowStockThreshold: "3",
    weightGrams: "180",
    variants: [
      { sku: "DEMO-BLT-BLK-M", color: "Black", size: "M", priceBdt: "650", stock: "10" },
      { sku: "DEMO-BLT-BRN-L", color: "Brown", size: "L", priceBdt: "670", stock: "2" },
      { sku: "DEMO-BLT-BLK-XL", color: "Black", size: "XL", priceBdt: "690", stock: "6" }
    ]
  }
] as const;

export const DEMO_PRODUCT_ROWS: readonly DemoProductRow[] = DEMO_PRODUCTS.flatMap(
  (product) => product.variants.map((variant) => ({
    product_key: product.productKey,
    name: product.name,
    slug: product.slug,
    category: product.category,
    subcategory: product.subcategory,
    brand: "Bandhan",
    gender: product.gender,
    short_description: product.shortDescription,
    description: product.description,
    base_price_bdt: product.basePriceBdt,
    compare_at_price_bdt: product.compareAtPriceBdt,
    featured: product.featured ? "TRUE" : "FALSE",
    active: "TRUE",
    tags: product.tags,
    image_1: product.image1,
    image_2: product.image2,
    variant_sku: variant.sku,
    color: variant.color,
    size: variant.size,
    variant_price_bdt: variant.priceBdt,
    stock_qty: variant.stock,
    low_stock_threshold: product.lowStockThreshold,
    weight_grams: product.weightGrams
  }))
);

function csvCell(value: string): string {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll("\"", "\"\"")}"`
    : value;
}

export function createDemoProductsCsv(): string {
  const lines = [
    PRODUCT_IMPORT_HEADERS.join(","),
    ...DEMO_PRODUCT_ROWS.map((row) =>
      PRODUCT_IMPORT_HEADERS.map((header) => csvCell(row[header])).join(",")
    )
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
