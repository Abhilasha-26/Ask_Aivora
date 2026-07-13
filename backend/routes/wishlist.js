import express from "express";
import { getMyWishlist, addToMyWishlist, removeFromMyWishlist } from "../controllers/wishlistController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getMyWishlist);
router.post("/", addToMyWishlist);
router.delete("/", removeFromMyWishlist);

export default router;
