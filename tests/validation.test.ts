import { describe, expect, it } from "vitest";
import { categoryCreateSchema, checkoutRequestSchema, productCreateSchema, registrationSchema } from "@/lib/validations";
import { safeCallback } from "@/lib/security";

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

describe("registration and redirects", () => {
  const valid = {
    name: "Ayesha Rahman",
    email: " AYESHA@example.com ",
    phone: "01711111111",
    password: "Strong#Pass1",
    confirmPassword: "Strong#Pass1",
    termsAccepted: true
  };

  it("accepts and normalizes a valid customer registration", () => {
    expect(registrationSchema.parse(valid).email).toBe("ayesha@example.com");
  });

  it.each(["weak", "alllowercase1!", "ALLUPPERCASE1!", "NoNumber!", "NoSymbol1"])(
    "rejects weak password %s",
    (password) => {
      expect(registrationSchema.safeParse({ ...valid, password, confirmPassword: password }).success).toBe(false);
    }
  );

  it("rejects mismatched password confirmation", () => {
    expect(registrationSchema.safeParse({ ...valid, confirmPassword: "Different#Pass1" }).success).toBe(false);
  });

  it("prevents open callback redirects", () => {
    expect(safeCallback("//evil.example")).toBe("/account");
    expect(safeCallback("/account/orders")).toBe("/account/orders");
  });
});
