import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CreateIssueSchema } from "@khyber/schemas";
import { createNotification } from "./notification.controller";

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
    res.status(500).json({ error: "Failed to create issue" });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, priority, assigneeId } = req.body;

  try {
    const issue = await prisma.issue.update({
      where: { id: id as string },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId && { assigneeId: assigneeId as string }),
      },
    });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: "Failed to update issue" });
  }
};
