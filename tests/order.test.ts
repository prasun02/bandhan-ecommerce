import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { applyCoupon } from "@/lib/services/coupon";
import { calculateDelivery } from "@/lib/services/delivery";
import { calculateCart, createOrderNumber, prepareOrder } from "@/lib/services/order";

describe("commerce workflows", () => {
  it("generates human-readable order numbers", () => {
    expect(createOrderNumber(7, new Date("2026-06-20"))).toBe("ORD-2026-000007");
  });

  it("calculates delivery charge by zone and COD fee", () => {
    const delivery = calculateDelivery("outside", 100000, "cod");
    expect(delivery.charge).toBe(15000);
    expect(delivery.estimatedDays).toBe("2-4 business days");
  });

  it("validates coupon minimums and maximum discounts", () => {
    expect(applyCoupon("WELCOME10", 1000000, 7000).discount).toBe(50000);
    expect(applyCoupon("WELCOME10", 100000, 7000).discount).toBe(0);
    expect(applyCoupon("PUJA500", 600000, 7000).discount).toBe(50000);
  });

  it("prevents ordering more stock than available", () => {
    const product = products[0];
    expect(() => calculateCart([{ productId: product.id, variantId: product.variants[0].id, quantity: 999 }], undefined, "dhaka", "cod")).toThrow(/available/);
  });

  it("creates a COD order with server-calculated totals", () => {
    const product = products[0];
    const order = prepareOrder(
      {
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
      },
      [{ productId: product.id, variantId: product.variants[0].id, quantity: 1 }]
    );
    expect(order.paymentStatus).toBe("Cash on Delivery Pending");
    expect(order.total).toBeGreaterThan(0);
  });
});
