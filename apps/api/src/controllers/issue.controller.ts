import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CreateIssueSchema, UpdateIssueSchema } from "@khyber/schemas";
import { createNotification } from "./notification.controller";
import logger from "../lib/logger";

export const getIssues = async (req: Request, res: Response) => {
  try {
    const issues = await prisma.issue.findMany({
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
    logger.error({ error }, "Failed to fetch issues");
    res.status(500).json({ error: "Failed to fetch issues" });
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

    res.status(201).json(issue);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    logger.error({ error }, "Failed to create issue");
    res.status(500).json({ error: "Failed to create issue" });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const validatedData = UpdateIssueSchema.parse(req.body);

    const issue = await prisma.issue.update({
      where: { id: id as string },
      data: validatedData,
    });
    res.json(issue);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    logger.error({ error, issueId: id }, "Failed to update issue");
    res.status(500).json({ error: "Failed to update issue" });
  }
};
