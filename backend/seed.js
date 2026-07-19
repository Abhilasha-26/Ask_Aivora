// Optional: creates one demo user with a couple of past orders and wishlist
// items, so the agent has something to reference on a fresh demo run.
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Preference from "./models/Preference.js";
import Wishlist from "./models/Wishlist.js";
import Order from "./models/Order.js";

dotenv.config();

async function seed() {
  await connectDB();

  const email = "demo@example.com";
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    user = await User.create({ name: "Demo User", email, passwordHash });
    console.log(`Created demo user: ${email} / demo1234`);
  }

  await Preference.findOneAndUpdate(
    { user: user._id },
    { $set: { values: { max_budget: "80000", preferred_brands: "Samsung, Sony", currency: "INR" } } },
    { upsert: true }
  );

  await Wishlist.findOneAndUpdate(
    { user: user._id },
    { $set: { items: [{ productName: "Sony WH-1000XM5", price: 29990, url: null }] } },
    { upsert: true }
  );

  const existingOrders = await Order.countDocuments({ user: user._id });
  if (existingOrders === 0) {
    await Order.create({ user: user._id, productName: "boAt Airdopes 141", price: 1299, quantity: 1, status: "delivered" });
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
