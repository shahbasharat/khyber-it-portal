import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/summary", requireAuth, reportController.getShiftSummary);
router.get("/history", requireAuth, reportController.getReportHistory);
router.post("/test-weekly", requireAuth, requireRole(["MANAGER"]), reportController.sendTestWeeklyReport);
router.get("/:id/pdf", requireAuth, reportController.downloadReportPDF);
router.post("/", requireAuth, reportController.createShiftReport);

export default router;
