import { Router } from "express";
import * as escalationController from "../controllers/escalation.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", escalationController.getEscalations);
router.put("/:id/status", escalationController.updateEscalationStatus);

export default router;
