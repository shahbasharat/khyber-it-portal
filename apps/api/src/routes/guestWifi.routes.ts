import { Router } from "express";
import * as guestWifiController from "../controllers/guestWifi.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, guestWifiController.getWifiCodes);
router.post("/", requireAuth, guestWifiController.createWifiCode);

export default router;
