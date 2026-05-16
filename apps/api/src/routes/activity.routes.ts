import { Router } from "express";
import * as activityController from "../controllers/activity.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, activityController.getActivityFeed);

export default router;
