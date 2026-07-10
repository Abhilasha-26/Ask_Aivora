import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Preference from "../models/Preference.js";
import Wishlist from "../models/Wishlist.js";
import { generateToken } from "../utils/generateToken.js";
import { AUTH_COOKIE_NAME, authCookieOptions } from "../utils/cookieOptions.js";

export async function register(req, res) {
  try {
    const { name, email, password, country } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });

    // Country is optional at signup; fall back to India if not provided
    const resolvedCountry = (country && country.trim()) || "India";

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      country: resolvedCountry,
    });

    await Promise.all([
      Preference.create({ user: user._id, values: { country: resolvedCountry } }),
      Wishlist.create({ user: user._id, items: [] }),
    ]);

    const token = generateToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, country: user.country },
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed.", detail: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password." });

    const token = generateToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email, country: user.country } });
  } catch (error) {
    res.status(500).json({ error: "Login failed.", detail: error.message });
  }
}

export async function me(req, res) {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, country: req.user.country } });
}

export async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, { ...authCookieOptions, maxAge: undefined });
  res.json({ message: "Logged out." });
}