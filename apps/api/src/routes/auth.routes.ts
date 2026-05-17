import { Router } from "express";
import { login, refresh, logout, getMe, changePassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, changePassword);

export default router;
