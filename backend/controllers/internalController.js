import Preference from "../models/Preference.js";
import Wishlist from "../models/Wishlist.js";
import Order from "../models/Order.js";

export async function getPreferences(req, res) {
  const pref = await Preference.findOneAndUpdate(
    { user: req.params.userId },
    { $setOnInsert: { values: {} } },
    { upsert: true, new: true }
  );
  res.json({ preferences: Object.fromEntries(pref.values) });
}

export async function updatePreferences(req, res) {
  const { updates } = req.body;
  const pref = await Preference.findOneAndUpdate(
    { user: req.params.userId },
    { $setOnInsert: { values: {} } },
    { upsert: true, new: true }
  );
  for (const [key, value] of Object.entries(updates || {})) {
    pref.values.set(key, String(value));
  }
  await pref.save();
  res.json({ preferences: Object.fromEntries(pref.values) });
}

export async function getWishlist(req, res) {
  const list = await Wishlist.findOneAndUpdate(
    { user: req.params.userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true }
  );
  res.json({ items: list.items });
}

export async function addWishlistItem(req, res) {
  const { productName, price, url } = req.body;
  if (!productName) return res.status(400).json({ error: "productName is required." });
  const list = await Wishlist.findOneAndUpdate(
    { user: req.params.userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true }
  );
  list.items.push({ productName, price: price ?? null, url: url ?? null });
  await list.save();
  res.status(201).json({ items: list.items });
}

export async function removeWishlistItem(req, res) {
  const { productName } = req.body;
  const list = await Wishlist.findOneAndUpdate(
    { user: req.params.userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true }
  );
  list.items = list.items.filter((i) => i.productName.toLowerCase() !== (productName || "").toLowerCase());
  await list.save();
  res.json({ items: list.items });
}

export async function getOrders(req, res) {
  const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
}
