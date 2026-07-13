import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    price: { type: Number, default: null },
    url: { type: String, default: null },
  },
  { timestamps: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", wishlistSchema);
