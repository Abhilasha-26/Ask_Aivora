import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ["placed", "shipped", "delivered", "cancelled"], default: "placed" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
