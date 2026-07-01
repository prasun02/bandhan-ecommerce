import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    sessionVersion?: number;
  }

  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      id?: string;
      active?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sessionVersion?: number;
    active?: boolean;
  }
}
