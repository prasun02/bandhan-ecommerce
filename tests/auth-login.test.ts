import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  compare: vi.fn(),
  recordSiteEvent: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique }
  }
}));
vi.mock("bcryptjs", () => ({
  default: { compare: mocks.compare }
}));
vi.mock("@/lib/events", () => ({
  recordSiteEvent: mocks.recordSiteEvent
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true })
}));

type AuthModule = typeof import("@/lib/auth");
let authModule: AuthModule;

beforeAll(async () => {
  authModule = await import("@/lib/auth");
});

beforeEach(() => {
  vi.clearAllMocks();
});

function credentialsAuthorize() {
  const provider = authModule.authOptions.providers[0] as unknown as {
    options: {
      authorize: (
        credentials: Record<string, string>,
        request: { headers: Record<string, string> }
      ) => Promise<unknown>;
    };
  };
  return provider.options.authorize;
}

const activeAdmin = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  passwordHash: "stored-hash",
  role: "ADMIN",
  isActive: true,
  sessionVersion: 3,
  deletedAt: null
};

describe("credential authorization", () => {
  it("accepts a valid active administrator login", async () => {
    mocks.findUnique.mockResolvedValue(activeAdmin);
    mocks.compare.mockResolvedValue(true);

    await expect(credentialsAuthorize()({
      email: "ADMIN@example.com",
      password: "Correct1!",
      purpose: "admin"
    }, { headers: {} })).resolves.toMatchObject({
      id: "admin-1",
      role: "ADMIN",
      sessionVersion: 3
    });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: "admin@example.com" }
    });
    expect(mocks.compare).toHaveBeenCalledWith("Correct1!", "stored-hash");
  });

  it("rejects an invalid password", async () => {
    mocks.findUnique.mockResolvedValue(activeAdmin);
    mocks.compare.mockResolvedValue(false);

    await expect(credentialsAuthorize()({
      email: "admin@example.com",
      password: "Incorrect1!",
      purpose: "admin"
    }, { headers: {} })).resolves.toBeNull();
  });

  it("rejects an inactive administrator", async () => {
    mocks.findUnique.mockResolvedValue({ ...activeAdmin, isActive: false });

    await expect(credentialsAuthorize()({
      email: "admin@example.com",
      password: "Correct1!",
      purpose: "admin"
    }, { headers: {} })).resolves.toBeNull();
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it("rejects a customer from administrator login", async () => {
    mocks.findUnique.mockResolvedValue({ ...activeAdmin, role: "CUSTOMER" });

    await expect(credentialsAuthorize()({
      email: "customer@example.com",
      password: "Correct1!",
      purpose: "admin"
    }, { headers: {} })).resolves.toBeNull();
    expect(mocks.compare).not.toHaveBeenCalled();
  });
});

describe("session cookie configuration", () => {
  it("uses a JWT session and returns the shared HttpOnly cookie at path /", async () => {
    const { AUTH_SESSION_COOKIE_NAME, AUTH_SESSION_COOKIE_OPTIONS } =
      await import("@/lib/auth-cookie");
    expect(authModule.authOptions.session?.strategy).toBe("jwt");
    expect(authModule.authOptions.cookies?.sessionToken?.name)
      .toBe(AUTH_SESSION_COOKIE_NAME);
    expect(authModule.authOptions.cookies?.sessionToken?.options)
      .toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      });
    expect(AUTH_SESSION_COOKIE_OPTIONS.maxAge).toBeGreaterThan(0);
  });

  it("uses the same cookie constant in middleware/proxy", async () => {
    const [{ AUTH_SESSION_COOKIE_NAME }, { PROXY_AUTH_COOKIE_NAME }] =
      await Promise.all([
        import("@/lib/auth-cookie"),
        import("@/proxy")
      ]);
    expect(PROXY_AUTH_COOKIE_NAME).toBe(AUTH_SESSION_COOKIE_NAME);
  });
});

describe("fresh authenticated navigation", () => {
  it("opens the administrator dashboard with a document replacement", async () => {
    const { replaceWithAuthenticatedPage } = await import("@/components/login-form");
    const replace = vi.fn();
    replaceWithAuthenticatedPage("/admin", replace);
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("returns to login immediately after logout cookie clearing", async () => {
    const { replaceWithAnonymousPage } = await import("@/components/logout-button");
    const replace = vi.fn();
    replaceWithAnonymousPage("/admin/login", replace);
    expect(replace).toHaveBeenCalledWith("/admin/login");
  });
});
