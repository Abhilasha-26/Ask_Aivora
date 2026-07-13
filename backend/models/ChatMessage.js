import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    // Tool-call trace attached to assistant messages, for UI transparency
    trace: { type: Array, default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
