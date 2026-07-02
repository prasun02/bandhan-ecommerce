export const AUTH_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const AUTH_COOKIE_SECURE = process.env.NODE_ENV === "production";

// These are NextAuth v4's standard session cookie names. Keeping them explicit
// prevents the login handler and proxy from making different secure-cookie
// decisions in production.
export const AUTH_SESSION_COOKIE_NAME = `${
  AUTH_COOKIE_SECURE ? "__Secure-" : ""
}next-auth.session-token`;

export const AUTH_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: AUTH_COOKIE_SECURE,
  maxAge: AUTH_SESSION_MAX_AGE
};
