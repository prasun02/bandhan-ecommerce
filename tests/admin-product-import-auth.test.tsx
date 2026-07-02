import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  parseProductImportFile: vi.fn(),
  prepareProductImport: vi.fn(),
  importProducts: vi.fn(),
  recordFailedProductImport: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: mocks.requireAdmin
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {}
}));

vi.mock("@/components/admin-product-import-form", () => ({
  AdminProductImportForm: () => null
}));

vi.mock("@/lib/services/admin-product-import", () => {
  class ProductImportValidationError extends Error {
    dryRun = {};
  }
  return {
    ProductImportValidationError,
    parseProductImportFile: mocks.parseProductImportFile,
    prepareProductImport: mocks.prepareProductImport,
    importProducts: mocks.importProducts,
    recordFailedProductImport: mocks.recordFailedProductImport
  };
});

type PageModule = typeof import("@/app/admin/products/import/page");
type RouteModule = typeof import("@/app/api/admin/products/import/route");

let pageModule: PageModule;
let routeModule: RouteModule;

beforeAll(async () => {
  [pageModule, routeModule] = await Promise.all([
    import("@/app/admin/products/import/page"),
    import("@/app/api/admin/products/import/route")
  ]);
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("administrator product import authorization", () => {
  it("allows an active administrator to render the import page", async () => {
    mocks.requireAdmin.mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      isActive: true
    });
    const page = await pageModule.default();
    expect(page.type).toBe("main");
    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("does not render the page for a normal customer", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin authorization required."));
    await expect(pageModule.default()).rejects.toThrow("Admin authorization required.");
  });

  it("returns 403 from the endpoint for a logged-out request", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin authorization required."));
    const response = await routeModule.POST(
      new Request("http://localhost/api/admin/products/import", { method: "POST" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 from the endpoint for a customer request", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Admin authorization required."));
    const response = await routeModule.POST(
      new Request("http://localhost/api/admin/products/import", { method: "POST" })
    );
    expect(response.status).toBe(403);
  });
});
