
const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "token";

export const authCookieOptions = {
  httpOnly: true, // not readable from JS - the main defense against XSS token theft
  secure: isProd, // HTTPS only in production; allow http on localhost while developing
  sameSite: isProd ? "none" : "lax", // "none" lets the cookie survive a cross-site deploy (e.g. Vercel + Render)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_EXPIRES_IN default
  path: "/",
};