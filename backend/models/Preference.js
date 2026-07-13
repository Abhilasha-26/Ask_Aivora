import mongoose from "mongoose";

// Flexible Map so the agent can remember arbitrary preferences
// (max_budget, preferred_brands, organic_only, ...) without a schema migration
// every time a new preference type shows up.
const preferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    values: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Preference", preferenceSchema);
