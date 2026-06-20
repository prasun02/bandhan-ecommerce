import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^(\+?88)?01[3-9]\d{8}$/),
  alternativePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  division: z.string().min(2),
  district: z.string().min(2),
  upazila: z.string().min(2),
  area: z.string().min(2),
  street: z.string().min(2),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  deliveryZoneId: z.string().min(1),
  paymentMethod: z.enum(["cod", "bkash", "card"]),
  termsAccepted: z.literal(true),
  couponCode: z.string().optional(),
  idempotencyKey: z.string().min(12)
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(99)
});

export const categoryCreateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

export const productVariantCreateSchema = z.object({
  sku: z.string().min(2).max(80),
  size: z.string().min(1).max(30).optional(),
  color: z.string().min(1).max(40).optional(),
  priceAdjustment: z.number().int().min(-100000000).default(0),
  stockQuantity: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  sku: z.string().min(2).max(80),
  shortDescription: z.string().min(5).max(280),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  collectionId: z.string().optional(),
  brandId: z.string().optional(),
  fabricType: z.string().optional(),
  occasion: z.string().optional(),
  regularPrice: z.number().int().positive(),
  salePrice: z.number().int().positive().optional(),
  costPrice: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0),
  lowStockLimit: z.number().int().min(0).default(5),
  featuredImageUrl: z.string().url().optional().or(z.literal("")),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).min(1),
  variants: z.array(productVariantCreateSchema).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  tags: z.array(z.string().min(1)).default([])
}).refine((data) => !data.salePrice || data.salePrice <= data.regularPrice, {
  message: "Sale price cannot be greater than regular price.",
  path: ["salePrice"]
});

export const productUpdateSchema = z.object({
  productId: z.string().min(1),
  regularPrice: z.number().int().positive().optional(),
  salePrice: z.number().int().positive().nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional()
});

export const cartUpsertSchema = z.object({
  guestKey: z.string().min(8).optional(),
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().positive().max(99),
  mode: z.enum(["increment", "set"]).default("increment")
});

export const checkoutRequestSchema = z.object({
  guestKey: z.string().min(8).optional(),
  lines: z.array(cartItemSchema).optional(),
  checkout: checkoutSchema
});

export const adminOrderUpdateSchema = z.object({
  orderNumber: z.string().regex(/^ORD-\d{4}-\d{6}$/),
  status: z.enum([
    "ORDER_PLACED",
    "AWAITING_PAYMENT",
    "PAYMENT_CONFIRMED",
    "PROCESSING",
    "CONFIRMED",
    "PACKED",
    "READY_FOR_SHIPMENT",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUND_PROCESSING",
    "REFUNDED",
    "FAILED_DELIVERY"
  ]),
  paymentStatus: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "COD_PENDING"]).optional(),
  courierName: z.string().max(100).optional(),
  consignmentNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
  customerVisible: z.boolean().default(true)
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().regex(/^ORD-\d{4}-\d{6}$/),
  phone: z.string().regex(/^(\+?88)?01[3-9]\d{8}$/)
});
