import { Router } from "express";
import * as issueController from "../controllers/issue.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, issueController.getIssues);
router.get("/carry-over", requireAuth, issueController.getCarryOverIssues);
router.post("/", requireAuth, issueController.createIssue);
router.get("/:id", requireAuth, issueController.getIssueById);
router.patch("/:id", requireAuth, issueController.updateIssue);
router.post("/:id/notes", requireAuth, issueController.addIssueNote);
router.post("/:id/escalate", requireAuth, issueController.escalateIssue);

export default router;
