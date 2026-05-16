import { Router } from "express";
import * as issueController from "../controllers/issue.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, issueController.getIssues);
router.post("/", requireAuth, issueController.createIssue);
router.patch("/:id", requireAuth, issueController.updateIssue);

export default router;
