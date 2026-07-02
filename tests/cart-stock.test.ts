import { beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction
  }
}));

type CartModule = typeof import("@/lib/services/cart");
let cartModule: CartModule;

beforeAll(async () => {
  cartModule = await import("@/lib/services/cart");
});

describe("cart stock enforcement", () => {
  it("rejects a zero-stock demo variant", async () => {
    mocks.transaction.mockImplementation(async (callback) => callback({
      cart: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "cart-1" })
      },
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: "product-1",
          status: "PUBLISHED",
          deletedAt: null,
          stockQuantity: 10,
          variants: [{
            id: "variant-zero",
            sku: "DEMO-MTS-BLK-XL",
            stockQuantity: 0,
            isAvailable: false
          }]
        })
      }
    }));

    await expect(cartModule.upsertCartItem({
      productId: "product-1",
      variantId: "variant-zero",
      quantity: 1,
      mode: "set"
    }, { guestKey: "guest-1" })).rejects.toThrow("unavailable");
  });
});
