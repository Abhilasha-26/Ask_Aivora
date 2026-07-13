import express from "express";
import { getMyOrders, createOrder } from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getMyOrders);
router.post("/", createOrder);

export default router;
