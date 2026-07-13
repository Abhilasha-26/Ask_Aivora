import Order from "../models/Order.js";

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
}

// No real payment processing here - this is a portfolio project, so
// "placing an order" just records the intent, which is enough for the
// agent to reference real order history later.
export async function createOrder(req, res) {
  const { productName, price, quantity } = req.body;
  if (!productName || price == null) {
    return res.status(400).json({ error: "productName and price are required." });
  }
  const order = await Order.create({
    user: req.user._id,
    productName,
    price,
    quantity: quantity || 1,
  });
  res.status(201).json({ order });
}
