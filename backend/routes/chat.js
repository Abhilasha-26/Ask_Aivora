import express from "express";
import { sendMessage, getHistory, clearHistory } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", sendMessage);
router.get("/history", getHistory);
router.delete("/history", clearHistory);

export default router;
