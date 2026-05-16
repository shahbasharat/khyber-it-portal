import { Router } from "express";
import * as serverRoomController from "../controllers/serverRoom.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, serverRoomController.getServerRoomLogs);
router.post("/", requireAuth, serverRoomController.createServerRoomLog);

export default router;
