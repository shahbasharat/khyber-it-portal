import { Router } from "express";
import * as serverRoomController from "../controllers/serverRoom.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, serverRoomController.getServerRoomLogs);
router.get("/heartbeat", requireAuth, serverRoomController.getServerHeartbeats);
router.post("/", requireAuth, serverRoomController.createServerRoomLog);
router.post("/devices", requireAuth, serverRoomController.createNetworkDevice);
router.delete("/devices/:id", requireAuth, serverRoomController.deleteNetworkDevice);

export default router;
