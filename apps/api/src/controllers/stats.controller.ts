import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const getStats = async (req: Request, res: Response) => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const [openIssues, criticalIssues, dailyTasks, completedTasks, escalations] = await Promise.all([
      prisma.issue.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.issue.count({ where: { priority: "CRITICAL", status: { not: "RESOLVED" } } }),
      prisma.checklistItem.count(),
      prisma.checklistResponse.count({
        where: {
          completed: true,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.issue.count({ where: { status: "ESCALATED" } }),
    ]);

    res.json({
      openIssues,
      criticalIssues,
      dailyTasks,
      completedTasks,
      escalations,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
