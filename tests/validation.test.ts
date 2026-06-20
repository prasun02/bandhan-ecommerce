import { describe, expect, it } from "vitest";
import { categoryCreateSchema, checkoutRequestSchema, productCreateSchema } from "@/lib/validations";

describe("admin and checkout validation", () => {
  it("accepts a category creation payload", () => {
    const category = categoryCreateSchema.parse({ name: "Saree", slug: "saree", isActive: true, sortOrder: 0 });
    expect(category.slug).toBe("saree");
  });

  it("rejects product sale prices greater than regular prices", () => {
    expect(() =>
      productCreateSchema.parse({
        name: "Premium Saree",
        sku: "SKU-1",
        shortDescription: "Premium festive saree",
        description: "A premium festive saree with a complete image and stock payload.",
        categoryId: "cat_1",
        regularPrice: 10000,
        salePrice: 12000,
        stockQuantity: 4,
        images: [{ url: "https://placehold.co/900x1200", altText: "Premium Saree" }],
        variants: [],
        status: "PUBLISHED",
        tags: []
      })
    ).toThrow();
  });

  it("requires confirmed checkout details and cart lines", () => {
    const request = checkoutRequestSchema.parse({
      guestKey: "guest_12345678",
      lines: [{ productId: "prod_1", variantId: "var_1_Red_M", quantity: 1 }],
      checkout: {
        fullName: "Ayesha Rahman",
        phone: "01711111111",
        email: "ayesha@example.com",
        division: "Dhaka",
        district: "Dhaka",
        upazila: "Dhanmondi",
        area: "Dhanmondi",
        street: "Road 12",
        deliveryZoneId: "dhaka",
        paymentMethod: "cod",
        termsAccepted: true,
        idempotencyKey: "idem_123456789"
      }
    });
    expect(request.checkout.paymentMethod).toBe("cod");
  });
});
