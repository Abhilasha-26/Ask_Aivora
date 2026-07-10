import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AUTH_COOKIE_NAME } from "../utils/cookieOptions.js";

export async function requireAuth(req, res, next) {
  // Primary path: httpOnly cookie, set by /auth/login and /auth/register.
  // Fallback: Authorization: Bearer <token> header, kept for any non-browser
  // client (mobile app, curl, Postman) that can't rely on cookies.
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = req.cookies?.[AUTH_COOKIE_NAME] || bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated - missing token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "User no longer exists." });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}