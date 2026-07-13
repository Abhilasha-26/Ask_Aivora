import express from "express";
import { getMyPreferences, updateMyPreferences } from "../controllers/preferenceController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", getMyPreferences);
router.put("/", updateMyPreferences);

export default router;
