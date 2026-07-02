import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  seedDemoProducts: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: mocks.requireAdmin
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { marker: "database" }
}));
vi.mock("@/lib/services/demo-product-seed", () => ({
  seedDemoProducts: mocks.seedDemoProducts
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath
}));

type RouteModule = typeof import("@/app/api/admin/products/demo-seed/route");
let routeModule: RouteModule;

beforeAll(async () => {
  routeModule = await import("@/app/api/admin/products/demo-seed/route");
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("administrator demo seed authorization", () => {
  it("allows an active administrator and returns created/updated counts", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN", isActive: true });
    mocks.seedDemoProducts.mockResolvedValue({
      productsCreated: 8,
      productsUpdated: 0,
      variantsCreated: 22,
      variantsUpdated: 0
    });

    const response = await routeModule.POST(
      new Request("http://localhost/api/admin/products/demo-seed", {
        method: "POST",
        headers: { origin: "http://localhost" }
      })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      productsCreated: 8,
      variantsCreated: 22
    });
    expect(mocks.seedDemoProducts).toHaveBeenCalledWith(
      { marker: "database" },
      { adminUserId: "admin-1" }
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin", "layout");
  });

  it("returns 403 to a customer or logged-out request", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin authorization required."));
    const response = await routeModule.POST(
      new Request("http://localhost/api/admin/products/demo-seed", { method: "POST" })
    );
    expect(response.status).toBe(403);
    expect(mocks.seedDemoProducts).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin seed request", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN", isActive: true });
    const response = await routeModule.POST(
      new Request("http://localhost/api/admin/products/demo-seed", {
        method: "POST",
        headers: { origin: "https://attacker.example" }
      })
    );
    expect(response.status).toBe(403);
    expect(mocks.seedDemoProducts).not.toHaveBeenCalled();
  });
});
