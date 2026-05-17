import { Router } from "express";
import * as assetActivityController from "../controllers/assetActivity.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", assetActivityController.getActivities);
router.post("/", assetActivityController.createActivity);

export default router;
