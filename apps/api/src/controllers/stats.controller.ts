import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const getStats = async (req: Request, res: Response) => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    // Generate dates for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const [openIssues, criticalIssues, dailyTasks, completedTasks, escalations, weeklyTrends] = await Promise.all([
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
      Promise.all(
        last7Days.map(async (day) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const count = await prisma.issue.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } }
          });
          return {
            dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
            count
          };
        })
      )
    ]);

    res.json({
      openIssues,
      criticalIssues,
      dailyTasks,
      completedTasks,
      escalations,
      weeklyTrends
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
