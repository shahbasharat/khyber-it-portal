import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, notificationController.getNotifications);
router.patch("/:id/read", requireAuth, notificationController.markAsRead);

export default router;
