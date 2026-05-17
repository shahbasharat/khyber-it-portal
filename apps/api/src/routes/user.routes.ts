import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Only managers can access these routes
router.use(requireAuth);
router.use(requireRole(["MANAGER"]));

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
