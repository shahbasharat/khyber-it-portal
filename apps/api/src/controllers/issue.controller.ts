import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CreateIssueSchema, UpdateIssueSchema } from "@khyber/schemas";
import { z } from "zod";
import { createNotification } from "./notification.controller";
import * as notificationService from "../services/notification.service";
import logger from "../lib/logger";

export const CreateIssueNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty"),
});

export const EscalateIssueSchema = z.object({
  escalatedTo: z.string().min(1, "Escalated to is required"),
  contactDetails: z.string().optional(),
  remarks: z.string().optional(),
});

export const getIssues = async (req: Request, res: Response) => {
  const { status, priority, department, assigneeId } = req.query;

  const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"];
  const VALID_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const where: any = {};
  if (status) {
    if (!VALID_STATUSES.includes(status as string)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    where.status = status;
  }
  if (priority) {
    if (!VALID_PRIORITIES.includes(priority as string)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    where.priority = priority;
  }
  if (department) where.department = department;
  if (assigneeId) where.assigneeId = assigneeId;

  try {
    const issues = await prisma.issue.findMany({
      where,
      include: {
        reporter: {
          select: { name: true, email: true },
        },
        assignee: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(issues);
  } catch (error) {
    logger.error({ err: error, query: req.query }, "Failed to fetch issues");
    res.status(500).json({ error: "Failed to fetch issues" });
  }
};

export const getIssueById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: id as string },
      include: {
        reporter: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        notes: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: "asc" }
        },
        escalation: true
      }
    });
    
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json(issue);
  } catch (error) {
    logger.error({ err: error, issueId: id }, "Failed to fetch issue");
    res.status(500).json({ error: "Failed to fetch issue" });
  }
};

export const createIssue = async (req: any, res: Response) => {
  try {
    const validatedData = CreateIssueSchema.parse(req.body);
    const userId = req.user.userId;

    const issue = await prisma.issue.create({
      data: {
        ...validatedData,
        reporterId: userId,
      },
      include: {
        reporter: {
          select: { name: true },
        },
      },
    });

    // Notify Managers
    const managers = await prisma.user.findMany({ where: { role: "MANAGER" } });
    for (const manager of managers) {
      await createNotification(
        manager.id,
        "New Incident Reported",
        `${issue.reporter.name} reported: ${issue.title}`,
        "ISSUE_CREATED",
        `/dashboard/issues`
      );
    }

    // Trigger immediate email notification to manager for Critical priority issues
    if (issue.priority === "CRITICAL") {
      notificationService.sendCriticalIssueEmail(issue).catch(console.error);
    }

    res.status(201).json(issue);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    logger.error(error, "Failed to create issue");
    res.status(500).json({ error: "Failed to create issue" });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const validatedData = UpdateIssueSchema.parse(req.body) as any;
    const { resolutionNote, ...updateData } = validatedData;
    const userId = (req as any).user.userId;

    const issue = await prisma.issue.update({
      where: { id: id as string },
      data: updateData,
    });

    if (updateData.status === "RESOLVED") {
      // Automatically resolve associated active escalations
      await prisma.escalation.updateMany({
        where: { issueId: id as string, status: "ACTIVE" },
        data: { status: "RESOLVED" }
      });

      if (resolutionNote) {
        await prisma.issueNote.create({
          data: {
            content: resolutionNote,
            issueId: id as string,
            authorId: userId
          }
        });
      }
    }
    // Note: re-opening an issue (IN_PROGRESS / OPEN) does NOT auto-resolve escalations —
    // the escalation should remain active until explicitly resolved.

    res.json(issue);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    logger.error({ err: error, issueId: id }, "Failed to update issue");
    res.status(500).json({ error: "Failed to update issue" });
  }
};

export const addIssueNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = CreateIssueNoteSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const note = await prisma.issueNote.create({
      data: {
        content: validatedData.content,
        issueId: id as string,
        authorId: userId
      },
      include: {
        author: { select: { name: true, role: true } }
      }
    });

    res.status(201).json(note);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    logger.error({ err: error, issueId: id }, "Failed to add note to issue");
    res.status(500).json({ error: "Failed to add note" });
  }
};

export const escalateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = EscalateIssueSchema.parse(req.body);
    const userId = (req as any).user.userId;

    // Check for existing escalation and return 409 instead of letting the DB throw
    const existing = await prisma.escalation.findUnique({ where: { issueId: id as string } });
    if (existing) {
      return res.status(409).json({ error: "This issue has already been escalated" });
    }

    // Run all three writes atomically
    const [escalation, updatedIssue] = await prisma.$transaction([
      prisma.escalation.create({
        data: {
          issueId: id as string,
          escalatedTo: validatedData.escalatedTo,
          contactDetails: validatedData.contactDetails,
          remarks: validatedData.remarks,
        }
      }),
      prisma.issue.update({
        where: { id: id as string },
        data: { status: "ESCALATED" }
      }),
      prisma.issueNote.create({
        data: {
          issueId: id as string,
          authorId: userId,
          content: `Issue escalated to ${validatedData.escalatedTo}. Remarks: ${validatedData.remarks || "None"}`
        }
      })
    ]);

    // Trigger immediate email notification to manager for Escalations
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      notificationService.sendEscalationEmail(updatedIssue.title, escalation, user.name).catch(console.error);
    }

    res.status(201).json(escalation);
  } catch (error: any) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    logger.error({ err: error, issueId: id }, "Failed to escalate issue");
    res.status(500).json({ error: "Failed to escalate issue" });
  }
};

export const getCarryOverIssues = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const carryOver = await prisma.issue.findMany({
      where: {
        status: { not: "RESOLVED" },
        createdAt: { lt: todayStart }
      },
      include: {
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
        escalation: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(carryOver);
  } catch (error) {
    logger.error(error, "Failed to fetch carry-over issues");
    res.status(500).json({ error: "Failed to fetch carry-over issues" });
  }
};
