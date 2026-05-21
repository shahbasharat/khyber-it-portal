import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { startShift, getActiveShift } from "../controllers/shift.controller";

const router = Router();

router.post("/start", requireAuth, startShift);
router.get("/active", requireAuth, getActiveShift);

export default router;
