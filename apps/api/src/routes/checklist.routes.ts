import { Router } from "express";
import * as checklistController from "../controllers/checklist.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/today", requireAuth, checklistController.getDailyChecklist);
router.post("/update/:itemId", requireAuth, checklistController.updateChecklistItem);
router.post("/bulk-update", requireAuth, checklistController.bulkUpdateChecklistItems);

export default router;
