import express from "express";
import {
  getPreferences,
  updatePreferences,
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  getOrders,
} from "../controllers/internalController.js";
import { requireInternalSecret } from "../middleware/internalAuth.js";

const router = express.Router();

router.use(requireInternalSecret);

router.get("/users/:userId/preferences", getPreferences);
router.put("/users/:userId/preferences", updatePreferences);

router.get("/users/:userId/wishlist", getWishlist);
router.post("/users/:userId/wishlist", addWishlistItem);
router.delete("/users/:userId/wishlist", removeWishlistItem);

router.get("/users/:userId/orders", getOrders);

export default router;
