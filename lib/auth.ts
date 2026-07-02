import "server-only";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordSiteEvent } from "@/lib/events";
import { normalizeEmail } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import {
  AUTH_COOKIE_SECURE,
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_COOKIE_OPTIONS,
  AUTH_SESSION_MAX_AGE
} from "@/lib/auth-cookie";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  purpose: z.enum(["customer", "admin"]).optional()
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION_MAX_AGE
  },
  jwt: {
    maxAge: AUTH_SESSION_MAX_AGE
  },
  useSecureCookies: AUTH_COOKIE_SECURE,
  cookies: {
    sessionToken: {
      name: AUTH_SESSION_COOKIE_NAME,
      options: AUTH_SESSION_COOKIE_OPTIONS
    }
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        purpose: { label: "Purpose", type: "text" }
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const headers = request.headers as Record<string, string | string[] | undefined>;
        const forwarded = headers["x-forwarded-for"];
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ?? "local";
        const key = parsed.data.purpose === "admin" ? "admin-login" : "login";
        if (!rateLimit(`${key}:${ip}`, parsed.data.purpose === "admin" ? 5 : 10, 15 * 60_000).allowed) return null;

        const user = await prisma.user.findUnique({ where: { email: normalizeEmail(parsed.data.email) } });
        if (!user?.passwordHash || user.deletedAt || !user.isActive) return null;
        if (parsed.data.purpose === "admin" && user.role !== "ADMIN") return null;
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "CUSTOMER";
        token.sessionVersion = user.sessionVersion ?? 0;
        token.active = true;
      } else if (token.sub) {
        const current = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, isActive: true, sessionVersion: true }
        });
        token.active = Boolean(
          current?.isActive && current.sessionVersion === token.sessionVersion
        );
        if (current) token.role = current.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = String(token.role ?? "CUSTOMER");
        session.user.active = token.active !== false;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      await recordSiteEvent("CUSTOMER_LOGGED_IN", { userId: user.id });
    },
    async signOut({ token }) {
      await recordSiteEvent("CUSTOMER_LOGGED_OUT", { userId: token.sub });
    }
  },
  pages: {
    signIn: "/login"
  }
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.active === false) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true, isActive: true }
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isActive || user.role !== "ADMIN") {
    throw new Error("Admin authorization required.");
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || !user.isActive) throw new Error("Authentication required.");
  return user;
}
