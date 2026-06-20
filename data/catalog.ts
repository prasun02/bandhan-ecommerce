export type ProductVariant = {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  stock: number;
  priceAdjustment: number;
  image?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: string;
  collection: string;
  brand: string;
  fabric: string;
  occasion: string;
  stitching: "Stitched" | "Unstitched" | "Semi-stitched" | "Accessory";
  regularPrice: number;
  salePrice?: number;
  costPrice: number;
  images: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  stock: number;
  variants: ProductVariant[];
  care: string;
  packageContents: string;
  deliveryEstimate: string;
  seoTitle: string;
  seoDescription: string;
};

export const categories = [
  "Sarees",
  "Salwar Kameez",
  "Lehengas",
  "Kurtis",
  "Gowns",
  "Unstitched Fabric",
  "Bridal Collection",
  "Accessories"
];

export const collections = ["New Arrivals", "Puja Collection", "Bridal Collection", "Party Wear", "Casual Collection", "Summer Collection", "Sale Collection"];
export const brands = ["Bandhan Studio", "Ruposhi", "Jamuna Looms"];

export const categoryImages: Record<string, string> = Object.fromEntries(categories.map((category, index) => [category, `/images/categories/category-${index + 1}.svg`]));

const productSpecs = [
  ["Royal Maroon Banarasi Saree", "Sarees", "Puja Collection", "Silk", "Wedding", "Semi-stitched", 750000, 645000, 15, "Maroon"],
  ["Pastel Pink Embroidered Salwar Kameez", "Salwar Kameez", "New Arrivals", "Georgette", "Party", "Stitched", 420000, 375000, 24, "Pink"],
  ["Emerald Green Bridal Lehenga", "Lehengas", "Bridal Collection", "Velvet", "Wedding", "Semi-stitched", 1850000, 1690000, 7, "Emerald"],
  ["Navy Blue Georgette Saree", "Sarees", "Party Wear", "Georgette", "Party", "Semi-stitched", 520000, 465000, 18, "Navy"],
  ["Mustard Cotton Three-Piece", "Salwar Kameez", "Casual Collection", "Cotton", "Casual", "Stitched", 320000, 285000, 30, "Gold"],
  ["Ivory Embroidered Party Gown", "Gowns", "Party Wear", "Net", "Party", "Stitched", 890000, 795000, 10, "White"],
  ["Black and Gold Party Saree", "Sarees", "Sale Collection", "Chiffon", "Party", "Semi-stitched", 680000, 599000, 12, "Black"],
  ["Sky Blue Printed Kurti", "Kurtis", "Summer Collection", "Cotton", "Casual", "Stitched", 185000, 159000, 35, "Blue"],
  ["Red Bridal Jamdani Saree", "Bridal Collection", "Bridal Collection", "Jamdani", "Wedding", "Semi-stitched", 1250000, 1125000, 6, "Red"],
  ["Lavender Organza Saree", "Sarees", "New Arrivals", "Organza", "Party", "Semi-stitched", 590000, 525000, 14, "Purple"],
  ["Olive Green Linen Kurti", "Kurtis", "Casual Collection", "Linen", "Casual", "Stitched", 220000, 195000, 28, "Green"],
  ["Beige Unstitched Lawn Three-Piece", "Unstitched Fabric", "Summer Collection", "Lawn", "Casual", "Unstitched", 275000, 245000, 32, "Beige"],
  ["Rose Gold Wedding Lehenga", "Lehengas", "Bridal Collection", "Silk", "Wedding", "Semi-stitched", 2200000, 1950000, 5, "Gold"],
  ["White and Red Traditional Saree", "Sarees", "Puja Collection", "Cotton Silk", "Festival", "Semi-stitched", 490000, 435000, 20, "White"],
  ["Teal Embroidered Salwar Suit", "Salwar Kameez", "Party Wear", "Lawn", "Party", "Stitched", 475000, 415000, 17, "Green"],
  ["Peach Chiffon Party Dress", "Gowns", "Party Wear", "Chiffon", "Party", "Stitched", 620000, 549000, 11, "Pink"],
  ["Floral Printed Summer Kurti", "Kurtis", "Summer Collection", "Cotton", "Casual", "Stitched", 165000, 145000, 40, "Pink"],
  ["Premium Katan Silk Saree", "Sarees", "New Arrivals", "Katan Silk", "Wedding", "Semi-stitched", 980000, 875000, 9, "Maroon"],
  ["Wine Velvet Bridal Gown", "Gowns", "Bridal Collection", "Velvet", "Wedding", "Stitched", 1450000, 1299000, 6, "Maroon"],
  ["Mint Green Festive Three-Piece", "Salwar Kameez", "Puja Collection", "Muslin", "Festival", "Stitched", 395000, 355000, 22, "Green"],
  ["Golden Embroidered Dupatta", "Accessories", "Sale Collection", "Net", "Party", "Accessory", 180000, 155000, 25, "Gold"],
  ["Pink Muslin Jamdani Saree", "Sarees", "Puja Collection", "Muslin Jamdani", "Festival", "Semi-stitched", 850000, 765000, 13, "Pink"],
  ["Chocolate Brown Casual Kurti", "Kurtis", "Casual Collection", "Cotton", "Casual", "Stitched", 210000, 185000, 26, "Beige"],
  ["Deep Purple Party Lehenga", "Lehengas", "Party Wear", "Georgette", "Party", "Semi-stitched", 1380000, 1230000, 8, "Purple"]
] as const;

const slugifyLocal = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
const sizes = ["S", "M", "L", "XL", "XXL"];

export const products: Product[] = productSpecs.map((spec, index) => {
  const [name, category, collection, fabric, occasion, stitching, regularPrice, salePrice, stock, baseColor] = spec;
  const id = `prod_${index + 1}`;
  const image = `/images/products/product-${index + 1}.svg`;
  const hasSizes = category !== "Accessories" && category !== "Sarees";
  const variantSizes = hasSizes ? sizes : ["Free Size"];
  const colors = [baseColor, baseColor === "Gold" ? "Maroon" : "Gold"];
  return {
    id,
    name,
    slug: slugifyLocal(name),
    sku: `NB-${String(index + 1).padStart(4, "0")}`,
    shortDescription: `Premium ${fabric.toLowerCase()} ${category.toLowerCase()} designed for ${occasion.toLowerCase()} moments.`,
    description: `${name} brings Bandhan's feminine, premium styling into a practical Bangladesh-ready shopping experience with verified stock, variant selection, clear pricing, and reliable delivery estimates.`,
    category,
    collection,
    brand: brands[index % brands.length],
    fabric,
    occasion,
    stitching,
    regularPrice,
    salePrice,
    costPrice: Math.round(regularPrice * 0.62),
    images: [image, image, image],
    rating: Number((4.3 + (index % 6) / 10).toFixed(1)),
    reviewCount: 12 + index * 4,
    tags: [category, collection, fabric, occasion],
    featured: index < 12,
    newArrival: collection === "New Arrivals" || index < 6,
    bestSeller: [0, 2, 6, 8, 13, 17, 21, 23].includes(index),
    stock,
    variants: colors.flatMap((color, colorIndex) =>
      variantSizes.map((size, sizeIndex) => ({
        id: `var_${index + 1}_${slugifyLocal(color)}_${slugifyLocal(size)}`,
        sku: `NB-${String(index + 1).padStart(4, "0")}-${color.slice(0, 3).toUpperCase()}-${size.replace(" ", "").toUpperCase()}`,
        color,
        size,
        stock: Math.max(1, Math.floor(stock / variantSizes.length) - colorIndex + (sizeIndex % 2)),
        priceAdjustment: size === "XL" ? 15000 : size === "XXL" ? 25000 : 0,
        image
      }))
    ),
    care: "Dry clean recommended. Store folded in a cool, dry place away from direct sunlight.",
    packageContents: category === "Accessories" ? "1 accessory piece" : "1 main piece with matching components where applicable.",
    deliveryEstimate: "1-6 business days based on delivery zone",
    seoTitle: `${name} | Bandhan Bangladesh`,
    seoDescription: `Shop ${name} from Bandhan with secure checkout, COD, bKash, card options, and Bangladesh delivery.`
  };
});

export const deliveryZones = [
  { id: "dhaka", name: "Inside Dhaka", division: "Dhaka", charge: 8000, codCharge: 0, minDays: 1, maxDays: 2, freeThreshold: 500000 },
  { id: "outside", name: "Outside Dhaka", division: "All", charge: 15000, codCharge: 0, minDays: 2, maxDays: 4, freeThreshold: 800000 },
  { id: "remote", name: "Remote Area", division: "All", charge: 20000, codCharge: 0, minDays: 3, maxDays: 6, freeThreshold: 999999999 }
];

export const coupons = [
  { code: "WELCOME10", type: "percentage" as const, value: 10, minSubtotal: 150000, maxDiscount: 50000, active: true },
  { code: "PUJA500", type: "fixed" as const, value: 50000, minSubtotal: 500000, active: true },
  { code: "FREEDHAKA", type: "free-delivery" as const, value: 0, minSubtotal: 300000, active: true }
];
