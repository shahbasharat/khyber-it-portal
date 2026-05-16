import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const getShiftSummary = async (req: Request, res: Response) => {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  try {
    const [
      totalIncidents,
      resolvedIncidents,
      criticalAlerts,
      escalations,
      completedTasks,
      totalTasks
    ] = await Promise.all([
      prisma.issue.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "RESOLVED", updatedAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { priority: "CRITICAL", createdAt: { gte: start, lte: end } } }),
      prisma.issue.count({ where: { status: "ESCALATED", updatedAt: { gte: start, lte: end } } }),
      prisma.checklistResponse.count({ where: { completed: true, createdAt: { gte: start, lte: end } } }),
      prisma.checklistItem.count(),
    ]);

    res.json({
      date: today,
      summary: {
        totalIncidents,
        resolvedIncidents,
        pendingIncidents: totalIncidents - resolvedIncidents,
        criticalAlerts,
        escalations,
        checklistCompletion: `${completedTasks}/${totalTasks}`,
        usersSupported: 142, // Dummy data as per Excel template placeholder
        downtime: 0, // Placeholder
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate shift summary" });
  }
};
