import Wishlist from "../models/Wishlist.js";

async function getOrCreate(userId) {
  return Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true }
  );
}

export async function getMyWishlist(req, res) {
  const list = await getOrCreate(req.user._id);
  res.json({ items: list.items });
}

export async function addToMyWishlist(req, res) {
  const { productName, price, url } = req.body;
  if (!productName) return res.status(400).json({ error: "productName is required." });

  const list = await getOrCreate(req.user._id);
  list.items.push({ productName, price: price ?? null, url: url ?? null });
  await list.save();
  res.status(201).json({ items: list.items });
}

export async function removeFromMyWishlist(req, res) {
  const { productName } = req.body;
  if (!productName) return res.status(400).json({ error: "productName is required." });

  const list = await getOrCreate(req.user._id);
  list.items = list.items.filter((i) => i.productName.toLowerCase() !== productName.toLowerCase());
  await list.save();
  res.json({ items: list.items });
}
