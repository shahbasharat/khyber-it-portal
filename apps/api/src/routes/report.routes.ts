import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/summary", requireAuth, reportController.getShiftSummary);
router.post("/test-weekly", requireAuth, reportController.sendTestWeeklyReport);
router.get("/:id/pdf", requireAuth, reportController.downloadReportPDF);
router.post("/", requireAuth, reportController.createShiftReport);

export default router;
